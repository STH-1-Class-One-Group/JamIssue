import type { CSSProperties } from 'react';

export function cssPx(value: number) {
  return `${value}px`;
}

export class UiNaverMarkerVisualConfig {
  static readonly activePlaceScale = 'scale(1.08)';
  static readonly activeFestivalScale = 'scale(1.06)';
  static readonly defaultScale = 'scale(1)';
  static readonly columnGapPx = 6;
  static readonly markerSizePx = 30;
  static readonly jamDotSizePx = 10;
  static readonly jamDotEdgePx = 1;
  static readonly placeCoreInsetPx = 7;
  static readonly festivalCoreInsetPx = 8;
  static readonly placeIconFontSizePx = 10;
  static readonly festivalLabelFontSizePx = 8;
  static readonly currentLocationSizePx = 28;
  static readonly currentLocationDotSizePx = 12;
  static readonly routeStepSizePx = 26;
  static readonly routeStepFontSizePx = 11;
  static readonly markerBorderWidthPx = 2;
  static readonly currentLocationBorderWidthPx = 1;
  static readonly activePlaceShadow = '0 14px 28px rgba(255,127,168,0.28)';
  static readonly inactivePlaceShadow = '0 10px 22px rgba(255,156,96,0.18)';
  static readonly festivalShadow = '0 10px 24px rgba(255,93,146,0.18)';
  static readonly currentLocationShadow = '0 6px 18px rgba(95,70,96,0.18)';
  static readonly currentLocationPulseShadow = '0 0 0 6px rgba(79,140,255,0.18)';
  static readonly routeStepShadow = '0 10px 24px rgba(95,70,96,0.22)';
}

export class UiReviewImageFrameConfig {
  static readonly tallImageAspectRatio = 1.12;
  static readonly minimumRotatedDimensionPx = 1;

  static readonly frameStyle = {
    width: '100%',
    height: 'min(220px, 56vw)',
    maxHeight: '220px',
    borderRadius: '20px',
    overflow: 'hidden',
    background: 'rgba(255, 250, 252, 0.96)',
    border: '1px solid rgba(255, 176, 201, 0.16)',
    padding: '0',
    position: 'relative',
  } satisfies CSSProperties;

  static readonly rotatedWrapperStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-90deg)',
    transformOrigin: 'center center',
    overflow: 'hidden',
    borderRadius: '14px',
  } satisfies CSSProperties;

  static readonly imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '14px',
    display: 'block',
    margin: 0,
  } satisfies CSSProperties;
}
