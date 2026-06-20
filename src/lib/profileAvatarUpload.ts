const PROFILE_AVATAR_SIZE = 256;
const PROFILE_AVATAR_MAX_BYTES = 80 * 1024;
const PROFILE_AVATAR_WEBP_QUALITIES = [0.78, 0.68, 0.58, 0.48];
const PROFILE_AVATAR_JPEG_QUALITIES = [0.78, 0.68, 0.58, 0.48, 0.38];

type LoadedImage = HTMLImageElement & {
  naturalWidth: number;
  naturalHeight: number;
};

export const ProfileAvatarUploadConfig = {
  size: PROFILE_AVATAR_SIZE,
  maxBytes: PROFILE_AVATAR_MAX_BYTES,
  outputTypes: ['image/webp', 'image/jpeg'] as const,
};

export function getCenteredSquareCrop(width: number, height: number) {
  const sourceSize = Math.min(width, height);
  return {
    sourceX: Math.round((width - sourceSize) / 2),
    sourceY: Math.round((height - sourceSize) / 2),
    sourceSize,
  };
}

function getFileExtension(mimeType: string) {
  return mimeType === 'image/webp' ? 'webp' : 'jpg';
}

function buildAvatarFileName(fileName: string, mimeType: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'profile-avatar';
  return `${baseName}.${getFileExtension(mimeType)}`;
}

function loadImage(file: File) {
  return new Promise<LoadedImage>((resolve, reject) => {
    const image = new Image() as LoadedImage;
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('프로필 사진을 읽지 못했어요.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function encodeAvatar(canvas: HTMLCanvasElement, fileName: string, mimeType: string, qualities: number[]) {
  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (blob && blob.size <= PROFILE_AVATAR_MAX_BYTES) {
      return new File([blob], buildAvatarFileName(fileName, mimeType), { type: mimeType });
    }
  }
  return null;
}

export async function prepareProfileAvatarUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있어요.');
  }

  if (typeof document === 'undefined') {
    throw new Error('현재 환경에서는 프로필 사진을 처리할 수 없어요.');
  }

  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_AVATAR_SIZE;
  canvas.height = PROFILE_AVATAR_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('프로필 사진을 처리할 수 없어요.');
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const crop = getCenteredSquareCrop(width, height);
  context.drawImage(
    image,
    crop.sourceX,
    crop.sourceY,
    crop.sourceSize,
    crop.sourceSize,
    0,
    0,
    PROFILE_AVATAR_SIZE,
    PROFILE_AVATAR_SIZE,
  );

  const webp = await encodeAvatar(canvas, file.name, 'image/webp', PROFILE_AVATAR_WEBP_QUALITIES);
  if (webp) {
    return webp;
  }

  const jpeg = await encodeAvatar(canvas, file.name, 'image/jpeg', PROFILE_AVATAR_JPEG_QUALITIES);
  if (jpeg) {
    return jpeg;
  }

  throw new Error('프로필 사진을 80KB 이하로 줄이지 못했어요.');
}
