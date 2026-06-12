import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoadmapBannerPreviewData } from '../../src/components/roadmap-banner/useRoadmapBannerPreviewData';

const apiMocks = vi.hoisted(() => ({
  getPublicEventBanner: vi.fn(),
}));

vi.mock('../../src/api/bootstrapClient', () => ({
  getPublicEventBanner: apiMocks.getPublicEventBanner,
}));

describe('useRoadmapBannerPreviewData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads public event banner data through the bootstrap client', async () => {
    apiMocks.getPublicEventBanner.mockResolvedValue({
      sourceReady: true,
      sourceName: 'events',
      importedAt: '2026-05-14T00:00:00Z',
      items: [{ id: 'event-1', title: 'Event' }],
    });

    const { result } = renderHook(() => useRoadmapBannerPreviewData());

    expect(result.current.status).toBe('loading');
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.data).toMatchObject({
      sourceReady: true,
      sourceName: 'events',
      items: [{ id: 'event-1', title: 'Event' }],
    });
    expect(result.current.errorMessage).toBe('');
  });

  it('reports Error and non-Error failures without updating after unmount', async () => {
    apiMocks.getPublicEventBanner.mockRejectedValueOnce(new Error('network'));
    const { result, unmount } = renderHook(() => useRoadmapBannerPreviewData());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe('network');

    let resolveBanner: (value: unknown) => void = () => undefined;
    apiMocks.getPublicEventBanner.mockImplementationOnce(() => new Promise((resolve) => {
      resolveBanner = resolve;
    }));
    const pending = renderHook(() => useRoadmapBannerPreviewData());
    unmount();
    pending.unmount();
    resolveBanner({ sourceReady: true, sourceName: 'late', importedAt: null, items: [] });

    apiMocks.getPublicEventBanner.mockRejectedValueOnce('plain failure');
    const fallback = renderHook(() => useRoadmapBannerPreviewData());
    await waitFor(() => {
      expect(fallback.result.current.status).toBe('error');
    });
    expect(fallback.result.current.errorMessage).not.toBe('');
  });
});
