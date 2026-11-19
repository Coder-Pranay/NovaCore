"""NovaCore Moss photographic image generator (separate GPU service)."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Annotated, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from pipeline import (
    active_mode,
    active_model,
    device_name,
    ensure_loaded,
    generate_png,
    is_busy,
    is_ready,
    load_error,
    progress_snapshot,
)
from safety import PromptRejected, ensure_adult_prompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("novacore.image-gen")

app = FastAPI(
    title="NovaCore Image Gen",
    description="Local GPU worker for axiomofmind/Moss-image-nsfw-uncensored-lora",
    version="0.1.0",
)


@app.on_event("startup")
def preload_on_local_gpu() -> None:
    """Load Moss on NVIDIA, or CPU Turbo fallback on this Intel PC."""
    if os.getenv("NOVACORE_LOAD_ON_START", "true").lower() not in {"1", "true", "yes"}:
        logger.info("Skipping model preload (NOVACORE_LOAD_ON_START=false)")
        return
    try:
        ensure_loaded()
        logger.info("Worker ready: mode=%s device=%s", active_mode(), device_name())
    except Exception as exc:
        logger.warning("Worker started, but model is not loaded yet: %s", exc)


@app.get("/health")
def health() -> dict:
    moss = os.getenv("NOVACORE_MOSS_MODEL", "OpenMOSS-Team/MOSS-Image-SFT")
    cpu_model = os.getenv("NOVACORE_CPU_MODEL", "SG161222/Realistic_Vision_V5.1_noVAE")
    mode = active_mode() or ("moss-cuda" if os.getenv("NOVACORE_DEVICE", "").startswith("cuda") else "sd-cpu")
    progress = progress_snapshot()
    return {
        "ok": True,
        "ready": is_ready(),
        "busy": is_busy(),
        "step": progress["step"],
        "steps": progress["steps"],
        "percent": progress["percent"],
        "etaSeconds": progress["etaSeconds"],
        "device": device_name(),
        "provider": mode,
        "model": active_model() or (moss if mode == "moss-cuda" else cpu_model),
        "lora": os.getenv(
            "NOVACORE_LORA_REPO", "axiomofmind/Moss-image-nsfw-uncensored-lora"
        ),
        "error": load_error(),
    }


@app.post("/v1/generate")
async def generate(
    prompt: Annotated[str, Form()],
    adult_confirmed: Annotated[str, Form()] = "false",
    steps: Annotated[int, Form()] = 30,
    guidance: Annotated[float, Form()] = 3.0,
    width: Annotated[int, Form()] = 1024,
    height: Annotated[int, Form()] = 1024,
    seed: Annotated[Optional[int], Form()] = None,
    image: Annotated[Optional[UploadFile], File()] = None,
) -> Response:
    if adult_confirmed.lower() not in {"true", "1", "yes"}:
        raise HTTPException(
            status_code=400,
            detail="Confirm that all generated subjects are fictional adults.",
        )

    try:
        safe_prompt = ensure_adult_prompt(prompt)
    except PromptRejected as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    steps = max(10, min(steps, 50))
    width = 1024
    height = 1024
    guidance = 3.0

    reference_bytes: bytes | None = None
    if image is not None and image.filename:
        content_type = (image.content_type or "").lower()
        if content_type and not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Reference file must be an image")
        reference_bytes = await image.read()
        if len(reference_bytes) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Reference image is too large")

    try:
        png = await asyncio.to_thread(
            generate_png,
            safe_prompt,
            reference_image_bytes=reference_bytes,
            steps=steps,
            guidance=guidance,
            width=width,
            height=height,
            seed=seed,
        )
    except RuntimeError as exc:
        logger.exception("Generation failed")
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Generation failed")
        raise HTTPException(status_code=500, detail=str(exc) or "Image generation failed") from exc

    return Response(content=png, media_type="image/png")


@app.exception_handler(HTTPException)
async def http_exception_handler(_request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
