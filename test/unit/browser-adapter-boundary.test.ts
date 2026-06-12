import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prepareReviewImageUpload } from '../../src/lib/imageUpload';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseMocks.createClient,
}));

function setClientConfig(config: Partial<Window['__JAMISSUE_CONFIG__']> = {}) {
  window.__JAMISSUE_CONFIG__ = {
    apiBaseUrl: 'https://api.example.test',
    naverMapClientId: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    ...config,
  };
}

beforeEach(() => {
  setClientConfig();
  supabaseMocks.createClient.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('review image upload preparation', () => {
  it('returns non-image files unchanged', async () => {
    const file = new File(['text'], 'note.txt', { type: 'text/plain' });

    await expect(prepareReviewImageUpload(file)).resolves.toEqual({
      file,
      thumbnailFile: null,
    });
  });

  it('optimizes image uploads and produces a thumbnail when browser canvas APIs are available', async () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function toBlob(callback, type) {
      const payloadSize = this.width > 480 ? 512 : 128;
      callback(new Blob(['x'.repeat(payloadSize)], { type }));
    });

    class TestImage {
      width = 2000;
      height = 1000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    vi.stubGlobal('Image', TestImage);

    const file = new File(['image'], 'review.png', { type: 'image/png' });
    const prepared = await prepareReviewImageUpload(file);

    expect(prepared.file).not.toBe(file);
    expect(prepared.file.name).toBe('review.jpg');
    expect(prepared.file.type).toBe('image/jpeg');
    expect(prepared.thumbnailFile?.name).toBe('review.jpg');
    expect(prepared.thumbnailFile?.type).toBe('image/jpeg');
    expect(drawImage).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('shrinks oversized canvas output and preserves extensionless upload names', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function toBlob(callback, type) {
      const size = this.width >= 1600 ? 2_000_000 : 100;
      callback(new Blob(['x'.repeat(size)], { type }));
    });

    class LargeImage {
      width = 4000;
      height = 2000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    vi.stubGlobal('Image', LargeImage);

    const file = new File(['image'], 'review', { type: 'image/png' });
    const prepared = await prepareReviewImageUpload(file);

    expect(prepared.file).not.toBe(file);
    expect(prepared.file.name).toBe('review.jpg');
    expect(prepared.file.lastModified).toBe(1234);
    expect(prepared.file.size).toBe(100);
    expect(prepared.thumbnailFile?.size).toBe(100);
    expect(drawImage).toHaveBeenCalled();
  });

  it('falls back to the original image when canvas cannot produce blobs', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((_callback) => {
      _callback(null);
    });

    class TestImage {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    vi.stubGlobal('Image', TestImage);
    const file = new File(['image'], 'review.png', { type: 'image/png' });

    await expect(prepareReviewImageUpload(file)).resolves.toEqual({
      file,
      thumbnailFile: null,
    });
  });

  it('returns the original image when browser image loading fails', async () => {
    class FailingImage {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onerror?.();
      }
    }

    vi.stubGlobal('Image', FailingImage);
    const file = new File(['image'], 'review.png', { type: 'image/png' });

    await expect(prepareReviewImageUpload(file)).resolves.toEqual({
      file,
      thumbnailFile: null,
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('returns the original image when canvas drawing is unavailable', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    class TestImage {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    vi.stubGlobal('Image', TestImage);
    const file = new File(['image'], 'review.png', { type: 'image/png' });

    await expect(prepareReviewImageUpload(file)).resolves.toEqual({
      file,
      thumbnailFile: null,
    });
  });
});

describe('supabase browser adapter', () => {
  it('returns null when Supabase browser credentials are missing', async () => {
    vi.resetModules();
    const { getSupabaseClient } = await import('../../src/lib/supabase');

    expect(getSupabaseClient()).toBeNull();
    expect(supabaseMocks.createClient).not.toHaveBeenCalled();
  });

  it('creates and reuses a configured Supabase client without browser auth persistence', async () => {
    vi.resetModules();
    const client = { removeChannel: vi.fn() };
    supabaseMocks.createClient.mockReturnValue(client);
    setClientConfig({
      supabaseUrl: 'https://supabase.example.test',
      supabaseAnonKey: 'anon-key',
    });
    const { getSupabaseClient } = await import('../../src/lib/supabase');

    expect(getSupabaseClient()).toBe(client);
    expect(getSupabaseClient()).toBe(client);
    expect(supabaseMocks.createClient).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.createClient).toHaveBeenCalledWith('https://supabase.example.test', 'anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  });

  it('removes realtime channels only when a client is configured', async () => {
    vi.resetModules();
    const removeChannel = vi.fn();
    const channel = { topic: 'notification:user-1' };
    supabaseMocks.createClient.mockReturnValue({ removeChannel });
    setClientConfig({
      supabaseUrl: 'https://supabase.example.test',
      supabaseAnonKey: 'anon-key',
    });
    const { removeRealtimeChannel } = await import('../../src/lib/supabase');

    removeRealtimeChannel(null);
    removeRealtimeChannel(channel as never);

    expect(removeChannel).toHaveBeenCalledTimes(1);
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
