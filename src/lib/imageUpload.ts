const MAX_UPLOAD_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 1_000_000;
const INITIAL_JPEG_QUALITY = 0.84;
const MIN_JPEG_QUALITY = 0.58;
const JPEG_QUALITY_STEP = 0.08;
const MIN_DIMENSION_AFTER_RESIZE = 960;

const THUMBNAIL_DIMENSION = 480;
const THUMBNAIL_MAX_BYTES = 120_000;
const THUMBNAIL_MIN_DIMENSION_AFTER_RESIZE = 320;

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
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

async function compressCanvas(canvas: HTMLCanvasElement, maxBytes: number) {
  let quality = INITIAL_JPEG_QUALITY;
  let blob: Blob | null = null;

  while (quality >= MIN_JPEG_QUALITY) {
    blob = await canvasToBlob(canvas, quality);
    if (!blob) {
      return null;
    }
    if (blob.size <= maxBytes) {
      return blob;
    }
    quality -= JPEG_QUALITY_STEP;
  }

  return blob;
}

function shrinkCanvas(canvas: HTMLCanvasElement, minDimension: number) {
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = Math.max(minDimension, Math.round(canvas.width * 0.75));
  resizedCanvas.height = Math.max(minDimension, Math.round(canvas.height * 0.75));
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

  return new File([compressedBlob], replaceExtension(file.name, 'jpg'), {
    type: 'image/jpeg',
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
        maxDimension: MAX_UPLOAD_DIMENSION,
        maxBytes: MAX_UPLOAD_BYTES,
        minDimension: MIN_DIMENSION_AFTER_RESIZE,
      }),
      buildOptimizedFile(file, {
        maxDimension: THUMBNAIL_DIMENSION,
        maxBytes: THUMBNAIL_MAX_BYTES,
        minDimension: THUMBNAIL_MIN_DIMENSION_AFTER_RESIZE,
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
