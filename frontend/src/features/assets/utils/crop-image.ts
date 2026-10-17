import type { Area } from "react-easy-crop";

export function isImageFile(file: File): boolean {
  return file.type.toLowerCase().startsWith("image/");
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (event) => reject(event));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/**
 * Crops an image to the given pixel area and returns a new File.
 * Preserves the original filename and MIME type when possible.
 */
export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  mimeType = "image/jpeg",
  quality = 0.92,
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to crop image in this browser");
  }

  const width = Math.max(1, Math.round(pixelCrop.width));
  const height = Math.max(1, Math.round(pixelCrop.height));

  canvas.width = width;
  canvas.height = height;

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  const outputType =
    mimeType === "image/png" || mimeType === "image/webp"
      ? mimeType
      : "image/jpeg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Unable to create cropped image"));
        }
      },
      outputType,
      quality,
    );
  });

  const extension =
    outputType === "image/png"
      ? "png"
      : outputType === "image/webp"
        ? "webp"
        : "jpg";

  const baseName = fileName.replace(/\.[^.]+$/, "") || "cropped-image";
  const croppedName = `${baseName}-cropped.${extension}`;

  return new File([blob], croppedName, {
    type: outputType,
    lastModified: Date.now(),
  });
}
