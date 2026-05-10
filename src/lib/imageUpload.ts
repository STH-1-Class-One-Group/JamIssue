import { ImageUploadConfig } from '../config/runtimeLimitConfig';

export interface PreparedReviewImageUpload {
  file: File;
  thumbnailFile: File | null;
}

function replaceExtension(fileName: string, nextExtension: string) {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return `${fileName}.${nextExtension}`;
  }
  return `${fileName.slice(0, dotIndex)}.${nextExtension}`;
}

async function loadImage(file: File) {
  const imageUrl = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('이미지를 읽지 못했어요.'));
      element.src = imageUrl;
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function drawResizedCanvas(image: HTMLImageElement, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지 캔버스를 준비하지 못했어요.');
  }
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality?: number) {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), ImageUploadConfig.jpegMimeType, quality);
  });
}

async function compressCanvas(canvas: HTMLCanvasElement, maxBytes: number) {
  let quality = ImageUploadConfig.jpegQuality.initial;
  let blob: Blob | null = null;

  while (quality >= ImageUploadConfig.jpegQuality.min) {
    blob = await canvasToBlob(canvas, quality);
    if (!blob) {
      return null;
    }
    if (blob.size <= maxBytes) {
      return blob;
    }
    quality -= ImageUploadConfig.jpegQuality.step;
  }

  return blob;
}

function shrinkCanvas(canvas: HTMLCanvasElement, minDimension: number) {
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = Math.max(minDimension, Math.round(canvas.width * ImageUploadConfig.shrinkScale));
  resizedCanvas.height = Math.max(minDimension, Math.round(canvas.height * ImageUploadConfig.shrinkScale));
  const context = resizedCanvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
  return resizedCanvas;
}

async function buildOptimizedFile(file: File, options: { maxDimension: number; maxBytes: number; minDimension: number }) {
  const image = await loadImage(file);
  const canvas = drawResizedCanvas(image, options.maxDimension);
  let compressedBlob = await compressCanvas(canvas, options.maxBytes);

  if (!compressedBlob) {
    return null;
  }

  if (compressedBlob.size > options.maxBytes) {
    const resizedCanvas = shrinkCanvas(canvas, options.minDimension);
    if (resizedCanvas) {
      const resizedBlob = await compressCanvas(resizedCanvas, options.maxBytes);
      if (resizedBlob) {
        compressedBlob = resizedBlob;
      }
    }
  }

  return new File([compressedBlob], replaceExtension(file.name, ImageUploadConfig.jpegExtension), {
    type: ImageUploadConfig.jpegMimeType,
    lastModified: Date.now(),
  });
}

export async function prepareReviewImageUpload(file: File): Promise<PreparedReviewImageUpload> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { file, thumbnailFile: null };
  }
  if (!file.type.startsWith('image/')) {
    return { file, thumbnailFile: null };
  }

  try {
    const [optimizedFile, optimizedThumbnail] = await Promise.all([
      buildOptimizedFile(file, {
        maxDimension: ImageUploadConfig.main.maxDimension,
        maxBytes: ImageUploadConfig.main.maxBytes,
        minDimension: ImageUploadConfig.main.minDimensionAfterResize,
      }),
      buildOptimizedFile(file, {
        maxDimension: ImageUploadConfig.thumbnail.maxDimension,
        maxBytes: ImageUploadConfig.thumbnail.maxBytes,
        minDimension: ImageUploadConfig.thumbnail.minDimensionAfterResize,
      }),
    ]);

    return {
      file: optimizedFile ?? file,
      thumbnailFile: optimizedThumbnail,
    };
  } catch {
    return { file, thumbnailFile: null };
  }
}
