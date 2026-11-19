# Local GPU image worker (separate from NovaCore)

This is **not** inside Java or Next.js.

```
Your NVIDIA GPU
      ↑
image-gen  (Python, port 8090)   ← this folder
      ↑
NovaCore backend  (Java, port 8080)
      ↑
NovaCore frontend (Assets → Generate)
```

It uses **your PC GPU only** (`cuda:0`). No cloud generator.

## Start on this machine

```powershell
cd C:\Users\User\Desktop\NovaCore\image-gen
.\start-local.ps1
```

Leave that window open. Then in NovaCore:

1. Assets
2. Upload / crop a photo
3. Click **Generate**
4. Confirm adult-only → **Generate and save**

Backend already points here:

```
NOVACORE_IMAGE_GEN_URL=http://127.0.0.1:8090
```

## GPU requirement

- **NVIDIA CUDA GPU:** loads Moss LoRA (`OpenMOSS-Team/MOSS-Image-SFT` + uncensored adapter).
- **No NVIDIA (this Intel PC):** automatically uses photorealistic CPU model `SG161222/Realistic_Vision_V5.1_noVAE` (32 steps). Same prompt always produces the same image. First run downloads the model. A detailed photo can take several minutes.
