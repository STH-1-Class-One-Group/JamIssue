import { describe, expect, it } from 'vitest';
import { cssPx, UiNaverMarkerVisualConfig, UiReviewImageFrameConfig } from '../../src/config/uiTokenConfig';

describe('ui token config boundaries', () => {
  it('keeps review image frame inline layout values in named config', () => {
    expect(UiReviewImageFrameConfig.tallImageAspectRatio).toBe(1.12);
    expect(UiReviewImageFrameConfig.minimumRotatedDimensionPx).toBe(1);
    expect(UiReviewImageFrameConfig.frameStyle).toMatchObject({
      width: '100%',
      height: 'min(220px, 56vw)',
      maxHeight: '220px',
      borderRadius: '20px',
      position: 'relative',
    });
    expect(UiReviewImageFrameConfig.rotatedWrapperStyle).toMatchObject({
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-90deg)',
      borderRadius: '14px',
    });
    expect(UiReviewImageFrameConfig.imageStyle).toMatchObject({
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '14px',
    });
  });

  it('keeps naver marker visual geometry in named config', () => {
    expect(cssPx(UiNaverMarkerVisualConfig.markerSizePx)).toBe('30px');
    expect(UiNaverMarkerVisualConfig.activePlaceScale).toBe('scale(1.08)');
    expect(UiNaverMarkerVisualConfig.activeFestivalScale).toBe('scale(1.06)');
    expect(UiNaverMarkerVisualConfig.jamDotSizePx).toBe(10);
    expect(UiNaverMarkerVisualConfig.placeCoreInsetPx).toBe(7);
    expect(UiNaverMarkerVisualConfig.festivalCoreInsetPx).toBe(8);
    expect(UiNaverMarkerVisualConfig.currentLocationSizePx).toBe(28);
    expect(UiNaverMarkerVisualConfig.routeStepSizePx).toBe(26);
  });
});
