# Start the separate Moss LoRA worker on THIS PC's NVIDIA GPU.
# NovaCore frontend/backend stay as they are; they call http://127.0.0.1:8090

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$env:NOVACORE_DEVICE = "cuda:0"
$env:NOVACORE_LOAD_ON_START = "true"
$env:NOVACORE_LORA_SCALE = "0.8"
$env:NOVACORE_MOSS_MODEL = "OpenMOSS-Team/MOSS-Image-SFT"
$env:NOVACORE_LORA_REPO = "axiomofmind/Moss-image-nsfw-uncensored-lora"
$env:NOVACORE_CPU_MODEL = "SG161222/Realistic_Vision_V5.1_noVAE"
$env:NOVACORE_CPU_STEPS = "32"
$env:NOVACORE_CPU_SIZE = "512"
$env:NOVACORE_CPU_GUIDANCE = "7.5"
$env:HF_HOME = Join-Path $PSScriptRoot "models"

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Host "Creating local Python venv..."
    python -m venv .venv
}

& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host ""
Write-Host "Starting local GPU worker on http://127.0.0.1:8090"
Write-Host "Keep this window open. Use Assets -> Generate in NovaCore."
Write-Host ""

& .\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8090
