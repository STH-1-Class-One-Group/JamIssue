import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCenteredSquareCrop, prepareProfileAvatarUpload, ProfileAvatarUploadConfig } from '../../src/lib/profileAvatarUpload';

const originalCreateElement = document.createElement.bind(document);
const originalImage = globalThis.Image;

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.Image = originalImage;
});

describe('profile avatar preprocessing', () => {
  it('calculates a centered square crop', () => {
    expect(getCenteredSquareCrop(800, 600)).toEqual({
      sourceX: 100,
      sourceY: 0,
      sourceSize: 600,
    });
  });

  it('resizes to 256px and prefers WebP under the 80KB limit', async () => {
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback, type: string) => {
      callback(new Blob([new Uint8Array(1024)], { type }));
    });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas;
      }
      return originalCreateElement(tagName);
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:avatar'),
      revokeObjectURL: vi.fn(),
    });
    globalThis.Image = class {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    } as unknown as typeof Image;

    const result = await prepareProfileAvatarUpload(new File(['raw'], 'avatar.png', { type: 'image/png' }));

    expect(canvas.width).toBe(ProfileAvatarUploadConfig.size);
    expect(canvas.height).toBe(ProfileAvatarUploadConfig.size);
    expect(drawImage).toHaveBeenCalledWith(expect.any(Object), 100, 0, 600, 600, 0, 0, 256, 256);
    expect(result.type).toBe('image/webp');
    expect(result.size).toBeLessThanOrEqual(ProfileAvatarUploadConfig.maxBytes);
  });

  it('rejects raw fallback when compression cannot meet the hard limit', async () => {
    const toBlob = vi.fn((callback: BlobCallback, type: string) => {
      callback(new Blob([new Uint8Array(ProfileAvatarUploadConfig.maxBytes + 1)], { type }));
    });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas;
      }
      return originalCreateElement(tagName);
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:avatar'),
      revokeObjectURL: vi.fn(),
    });
    globalThis.Image = class {
      naturalWidth = 320;
      naturalHeight = 320;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    } as unknown as typeof Image;

    await expect(prepareProfileAvatarUpload(new File(['raw'], 'avatar.png', { type: 'image/png' }))).rejects.toThrow(
      '80KB 이하',
    );
  });
});
