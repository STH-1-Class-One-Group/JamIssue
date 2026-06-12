import { beforeEach, describe, expect, it, vi } from 'vitest';

const entryMocks = vi.hoisted(() => ({
  createRoot: vi.fn(),
  render: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: entryMocks.createRoot,
}));

vi.mock('../../src/App', () => ({
  default: function MockApp() {
    return <div data-testid="app-entry" />;
  },
}));

vi.mock('../../src/components/RoadmapBannerPreview', () => ({
  RoadmapBannerPreview: function MockRoadmapBannerPreview() {
    return <div data-testid="roadmap-preview-entry" />;
  },
}));

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState(null, '', '/');
    Object.defineProperty(window.history, 'scrollRestoration', {
      configurable: true,
      value: 'auto',
      writable: true,
    });
    entryMocks.createRoot.mockReturnValue({ render: entryMocks.render });
  });

  it('mounts the default app entry and initializes stable viewport CSS variables', async () => {
    await import('../../src/main');

    expect(window.history.scrollRestoration).toBe('manual');
    expect(document.documentElement.style.getPropertyValue('--app-height')).not.toBe('');
    expect(document.documentElement.style.getPropertyValue('--app-width')).not.toBe('');
    expect(entryMocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(entryMocks.render).toHaveBeenCalledWith(expect.objectContaining({ type: expect.anything() }));
  });

  it('selects the roadmap preview entry from query string without changing the root contract', async () => {
    window.history.replaceState(null, '', '/?preview=roadmap-banner');

    await import('../../src/main');

    expect(entryMocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(entryMocks.render).toHaveBeenCalledTimes(1);
  });

  it('fails fast when the root node is missing', async () => {
    document.body.innerHTML = '';

    await expect(import('../../src/main')).rejects.toThrow('루트 노드를 찾을 수 없어요.');
  });
});
