import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { RoadmapBannerPreview } from './components/RoadmapBannerPreview';
import { getClientConfig } from './config';
import {
  applySeasonThemeToRoot,
  isSeasonThemeOverrideAllowed,
  readSeasonThemeOverride,
  resolveSeasonTheme,
} from './lib/seasonTheme';
import { resolveViewportMetrics, type ViewportMetricsState } from './lib/viewportMetrics';
import './index.css';
import './styles/refinements.css';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

let viewportMetricsState: ViewportMetricsState | undefined;

function syncViewportMetrics() {
  if (typeof window === 'undefined') {
    return;
  }

  const activeElement = document.activeElement;
  const metrics = resolveViewportMetrics({
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    visualViewportHeight: window.visualViewport?.height,
    visualViewportWidth: window.visualViewport?.width,
    activeElementTagName: activeElement instanceof HTMLElement ? activeElement.tagName : undefined,
    activeElementIsContentEditable: activeElement instanceof HTMLElement ? activeElement.isContentEditable : undefined,
  }, viewportMetricsState);

  viewportMetricsState = metrics;
  document.documentElement.style.setProperty('--app-height', `${metrics.appHeight}px`);
  document.documentElement.style.setProperty('--app-width', `${metrics.appWidth}px`);
}

if (typeof window !== 'undefined') {
  const clientConfig = getClientConfig();

  applySeasonThemeToRoot(
    document.documentElement,
    resolveSeasonTheme(
      new Date(),
      readSeasonThemeOverride(window.location.search, clientConfig.seasonThemeOverride),
      { allowOverride: isSeasonThemeOverrideAllowed(window.location.hostname) },
    ),
  );
  syncViewportMetrics();
  window.addEventListener('resize', syncViewportMetrics, { passive: true });
  window.addEventListener('orientationchange', syncViewportMetrics, { passive: true });
  window.visualViewport?.addEventListener('resize', syncViewportMetrics, { passive: true });
  window.visualViewport?.addEventListener('scroll', syncViewportMetrics, { passive: true });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('루트 노드를 찾을 수 없어요.');
}

function resolveEntry() {
  if (typeof window === 'undefined') {
    return <App />;
  }

  const preview = new URLSearchParams(window.location.search).get('preview');
  if (preview === 'roadmap-banner') {
    return <RoadmapBannerPreview />;
  }

  return <App />;
}

createRoot(rootElement).render(
  <StrictMode>
    {resolveEntry()}
  </StrictMode>,
);
