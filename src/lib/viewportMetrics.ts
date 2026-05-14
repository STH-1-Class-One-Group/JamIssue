export interface ViewportMetricsSnapshot {
  innerHeight: number;
  innerWidth: number;
  visualViewportHeight?: number;
  visualViewportWidth?: number;
  activeElementTagName?: string;
  activeElementIsContentEditable?: boolean;
}

export interface ViewportMetricsState {
  appHeight: number;
  appWidth: number;
}

export interface ResolvedViewportMetrics extends ViewportMetricsState {
  visualHeight: number;
  visualWidth: number;
  isKeyboardResize: boolean;
}

const editableTagNames = new Set(['input', 'select', 'textarea']);

function hasEditableFocus(snapshot: ViewportMetricsSnapshot) {
  return Boolean(
    snapshot.activeElementIsContentEditable
      || (snapshot.activeElementTagName && editableTagNames.has(snapshot.activeElementTagName.toLowerCase())),
  );
}

export function resolveViewportMetrics(
  snapshot: ViewportMetricsSnapshot,
  previousState?: ViewportMetricsState,
): ResolvedViewportMetrics {
  const layoutHeight = Math.round(snapshot.innerHeight);
  const layoutWidth = Math.round(snapshot.innerWidth);
  const visualHeight = Math.round(snapshot.visualViewportHeight ?? snapshot.innerHeight);
  const visualWidth = Math.round(snapshot.visualViewportWidth ?? snapshot.innerWidth);
  const isKeyboardResize = hasEditableFocus(snapshot) && visualHeight < layoutHeight;

  return {
    appHeight: isKeyboardResize ? (previousState?.appHeight ?? layoutHeight) : Math.max(layoutHeight, visualHeight),
    appWidth: layoutWidth,
    visualHeight,
    visualWidth,
    isKeyboardResize,
  };
}
