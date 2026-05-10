import { SelectionMotionConfig } from '../../config/mapConfig';
import type { SelectionTargetType } from '../../config/mapConfig';

function getViewportSizeBucket() {
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= SelectionMotionConfig.mobileBreakpointPx;
  return isMobileViewport ? 'mobile' : 'desktop';
}

export function getSelectionVerticalOffset(mapElement: HTMLDivElement | null, targetType: SelectionTargetType) {
  const mapHeight = mapElement?.clientHeight ?? 0;
  const viewportSize = getViewportSizeBucket();
  if (mapHeight <= 0) {
    return SelectionMotionConfig.fallbackOffsetPx[targetType][viewportSize];
  }

  const ratio = SelectionMotionConfig.offsetRatio[targetType][viewportSize];
  const minOffset = SelectionMotionConfig.minOffsetPx[targetType][viewportSize];
  const maxOffset = SelectionMotionConfig.maxOffsetPx[targetType][viewportSize];
  return Math.min(maxOffset, Math.max(minOffset, Math.round(mapHeight * ratio)));
}
