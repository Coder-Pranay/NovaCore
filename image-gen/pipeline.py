"""Local image generator.

NVIDIA CUDA  -> Moss photographic LoRA (original model)
No NVIDIA    -> photorealistic Stable Diffusion on CPU (slower, follows the prompt)
"""

from __future__ import annotations

import hashlib
import inspect
import json
import logging
import os
import threading
import time
from io import BytesIO
from typing import Any, Literal

logger = logging.getLogger("novacore.image-gen")

Mode = Literal["moss-cuda", "sd-cpu"]

_DEFAULT_CPU_MODEL = "SG161222/Realistic_Vision_V5.1_noVAE"
_CPU_NEGATIVE = (
    "cartoon, anime, illustration, painting, drawing, sketch, cgi, 3d render, "
    "plastic skin, doll, airbrushed, deformed, extra limbs, extra fingers, "
    "mutated, watermark, text, logo, blurry, lowres, oversaturated, bad anatomy"
)
_CPU_QUALITY = (
    "RAW photograph, photorealistic, natural skin texture, sharp focus, "
    "soft natural lighting, visible pores, 8k uhd, dslr"
)

_lock = threading.Lock()
_pipe: Any = None
_img2img: Any = None
_mode: Mode | None = None
_load_error: str | None = None
_active_model: str | None = None
_progress: dict[str, Any] = {
    "step": 0,
    "steps": 0,
    "percent": 0,
    "started_at": None,
    "eta_seconds": None,
}


def configured_device() -> str:
    return os.getenv("NOVACORE_DEVICE", "cuda:0").strip() or "cuda:0"


def cpu_fallback_model() -> str:
    return os.getenv("NOVACORE_CPU_MODEL", _DEFAULT_CPU_MODEL).strip()


def has_cuda() -> bool:
    try:
        import torch

        return bool(torch.cuda.is_available())
    except Exception:
        return False


def device_name() -> str:
    try:
        import torch

        if torch.cuda.is_available():
            index = torch.cuda.current_device()
            name = torch.cuda.get_device_name(index)
            return f"cuda:{index} ({name})"
    except Exception:
        pass
    return "cpu"


def is_ready() -> bool:
    return _pipe is not None


def is_busy() -> bool:
    return _lock.locked()


def progress_snapshot() -> dict[str, Any]:
    return {
        "step": int(_progress.get("step") or 0),
        "steps": int(_progress.get("steps") or 0),
        "percent": int(_progress.get("percent") or 0),
        "etaSeconds": _progress.get("eta_seconds"),
    }


def _start_progress(total_steps: int) -> None:
    _progress.update(
        {
            "step": 0,
            "steps": max(total_steps, 0),
            "percent": 0,
            "started_at": time.monotonic(),
            "eta_seconds": None,
        }
    )


def _update_progress(step: int, total_steps: int) -> None:
    total = max(total_steps, 1)
    current = max(0, min(int(step), total))
    started = _progress.get("started_at")
    eta = None
    if started is not None and current > 0 and current < total:
        elapsed = time.monotonic() - float(started)
        eta = int((elapsed / current) * (total - current))
    _progress.update(
        {
            "step": current,
            "steps": total,
            "percent": int(round(100 * current / total)),
            "eta_seconds": eta,
        }
    )


def _finish_progress() -> None:
    total = int(_progress.get("steps") or 0)
    _progress.update(
        {
            "step": total,
            "percent": 100 if total else 0,
            "eta_seconds": 0,
        }
    )


def _attach_progress(kwargs: dict[str, Any], total_steps: int, call_target: Any) -> None:
    _start_progress(total_steps)
    signature = inspect.signature(call_target.__call__)

    def on_end(_pipe: Any, step: int, _timestep: Any, callback_kwargs: Any) -> Any:
        _update_progress(int(step) + 1, total_steps)
        return callback_kwargs

    def on_step(step: int, _timestep: Any, _latents: Any) -> None:
        _update_progress(int(step) + 1, total_steps)

    if "callback_on_step_end" in signature.parameters:
        kwargs["callback_on_step_end"] = on_end
    elif "callback" in signature.parameters:
        kwargs["callback"] = on_step
        if "callback_steps" in signature.parameters:
            kwargs["callback_steps"] = 1


def load_error() -> str | None:
    return _load_error


def active_mode() -> str | None:
    return _mode


def active_model() -> str | None:
    return _active_model


def ensure_loaded() -> Any:
    global _pipe, _load_error
    if _pipe is not None:
        return _pipe
    with _lock:
        if _pipe is not None:
            return _pipe
        try:
            if has_cuda():
                _pipe = _load_moss_cuda()
            else:
                _pipe = _load_sd_cpu()
            _load_error = None
            return _pipe
        except Exception as exc:
            _load_error = str(exc)
            raise


def _load_moss_cuda() -> Any:
    global _mode, _active_model, _img2img
    import torch
    from diffusers import DiffusionPipeline
    from huggingface_hub import hf_hub_download
    from peft import LoraConfig, inject_adapter_in_model, set_peft_model_state_dict
    from peft.tuners.lora.layer import LoraLayer
    from safetensors.torch import load_file

    device = configured_device()
    repo_id = os.getenv(
        "NOVACORE_LORA_REPO", "axiomofmind/Moss-image-nsfw-uncensored-lora"
    )
    base_model = os.getenv("NOVACORE_MOSS_MODEL", "OpenMOSS-Team/MOSS-Image-SFT")
    lora_scale = float(os.getenv("NOVACORE_LORA_SCALE", "0.8"))
    gpu_name = torch.cuda.get_device_name(0)

    logger.info("Using local NVIDIA GPU %s (%s)", device, gpu_name)
    logger.info("Loading Moss base model %s", base_model)
    config_path = hf_hub_download(repo_id, "adapter_config.json")
    weights_path = hf_hub_download(repo_id, "pytorch_lora_weights.safetensors")

    with open(config_path, encoding="utf-8") as file:
        config = json.load(file)

    pipe = DiffusionPipeline.from_pretrained(
        base_model,
        custom_pipeline="pipeline_moss_image",
        trust_remote_code=True,
        torch_dtype={"default": torch.bfloat16, "vae": torch.float32},
    )
    pipe.scheduler = type(pipe.scheduler).from_config(pipe.scheduler.config)

    inject_adapter_in_model(
        LoraConfig(
            r=config["r"],
            lora_alpha=config["lora_alpha"],
            target_modules=config["target_modules"],
        ),
        pipe.transformer,
    )

    state = {
        key.removeprefix("transformer."): value
        for key, value in load_file(weights_path, device="cpu").items()
    }
    _, unexpected = set_peft_model_state_dict(pipe.transformer, state)
    if unexpected:
        raise RuntimeError(f"Unexpected LoRA tensors: {unexpected[:5]}")

    for layer in pipe.transformer.modules():
        if isinstance(layer, LoraLayer):
            layer.set_scale("default", lora_scale)

    pipe.transformer.to(torch.bfloat16)
    pipe.to(device)
    _mode = "moss-cuda"
    _active_model = base_model
    _img2img = None
    logger.info("Moss LoRA ready on %s (scale=%s)", device, lora_scale)
    return pipe


def _load_sd_cpu() -> Any:
    global _mode, _active_model, _img2img
    import torch
    from diffusers import (
        DPMSolverMultistepScheduler,
        StableDiffusionImg2ImgPipeline,
        StableDiffusionPipeline,
    )

    model_id = cpu_fallback_model()
    logger.info(
        "No NVIDIA GPU. Loading photorealistic CPU model %s (slower, follows the prompt).",
        model_id,
    )
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float32,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config,
        algorithm_type="dpmsolver++",
        use_karras_sigmas=True,
    )
    pipe.enable_attention_slicing()
    if hasattr(pipe, "enable_vae_slicing"):
        pipe.enable_vae_slicing()
    pipe.to("cpu")
    try:
        _img2img = StableDiffusionImg2ImgPipeline(**pipe.components)
        _img2img.to("cpu")
        if hasattr(_img2img, "enable_attention_slicing"):
            _img2img.enable_attention_slicing()
    except Exception as exc:
        logger.warning("CPU img2img not available: %s", exc)
        _img2img = None

    _mode = "sd-cpu"
    _active_model = model_id
    logger.info(
        "CPU generator ready (%s). Same prompt produces the same image. "
        "A detailed photo can take several minutes.",
        model_id,
    )
    return pipe


def _seed_for(prompt: str, reference_image_bytes: bytes | None, seed: int | None) -> int:
    if seed is not None:
        return int(seed) & 0x7FFFFFFF
    hasher = hashlib.sha256()
    hasher.update(prompt.encode("utf-8"))
    if reference_image_bytes:
        hasher.update(reference_image_bytes)
    return int.from_bytes(hasher.digest()[:4], "big") & 0x7FFFFFFF


def _cpu_prompt(prompt: str) -> str:
    text = prompt.strip()
    if _CPU_QUALITY.lower() not in text.lower():
        text = f"{text}, {_CPU_QUALITY}"
    return text


def generate_png(
    prompt: str,
    *,
    reference_image_bytes: bytes | None = None,
    steps: int = 30,
    guidance: float = 7.5,
    width: int = 1024,
    height: int = 1024,
    seed: int | None = None,
) -> bytes:
    import torch
    from PIL import Image

    pipe = ensure_loaded()
    resolved_seed = _seed_for(prompt, reference_image_bytes, seed)
    generator = torch.Generator("cpu").manual_seed(resolved_seed)
    logger.info("Generating with seed=%s mode=%s", resolved_seed, _mode)

    try:
        if _mode == "sd-cpu":
            cpu_steps = max(20, min(int(os.getenv("NOVACORE_CPU_STEPS", "32")), 50))
            size = max(512, min(int(os.getenv("NOVACORE_CPU_SIZE", "512")), 768))
            cpu_guidance = float(os.getenv("NOVACORE_CPU_GUIDANCE", "7.5"))
            kwargs: dict[str, Any] = {
                "prompt": _cpu_prompt(prompt),
                "negative_prompt": os.getenv("NOVACORE_CPU_NEGATIVE", _CPU_NEGATIVE),
                "num_inference_steps": cpu_steps,
                "guidance_scale": cpu_guidance,
                "width": size,
                "height": size,
                "generator": generator,
            }

            if reference_image_bytes and _img2img is not None:
                image = Image.open(BytesIO(reference_image_bytes)).convert("RGB")
                image = image.resize((size, size))
                kwargs["image"] = image
                kwargs["strength"] = 0.55
                kwargs.pop("width", None)
                kwargs.pop("height", None)
                _attach_progress(kwargs, cpu_steps, _img2img)
                with _lock:
                    result = _img2img(**kwargs)
            else:
                _attach_progress(kwargs, cpu_steps, pipe)
                with _lock:
                    result = pipe(**kwargs)
        else:
            kwargs = {
                "prompt": prompt,
                "negative_prompt": "",
                "width": width,
                "height": height,
                "num_inference_steps": steps,
                "guidance_scale": guidance,
                "generator": generator,
            }
            signature = inspect.signature(pipe.__call__)
            if "uncond_skip_layers" in signature.parameters:
                kwargs["uncond_skip_layers"] = [22]
            if reference_image_bytes and "image" in signature.parameters:
                image = Image.open(BytesIO(reference_image_bytes)).convert("RGB")
                kwargs["image"] = image
                kwargs["prompt"] = (
                    prompt.rstrip(".")
                    + ", matching the pose, lighting, and composition of the provided adult photograph."
                )
            _attach_progress(kwargs, steps, pipe)
            with _lock:
                result = pipe(**kwargs)

        _finish_progress()
        pil = result.images[0]
        buffer = BytesIO()
        pil.save(buffer, format="PNG")
        return buffer.getvalue()
    except Exception:
        _start_progress(0)
        raise
