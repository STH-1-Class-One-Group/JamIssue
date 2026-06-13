import { cssPx, UiNaverMarkerVisualConfig } from '../../config/uiTokenConfig';
import { categoryInfo } from '../../lib/categories';
import type { TourismPlaceItem } from '../../tourismTypes';
import type { FestivalItem, Place } from '../../types/core';

type FestivalWithCoordinates = FestivalItem & {
  latitude: number;
  longitude: number;
};

export function placeMarkerContent(place: Place, isActive: boolean) {
  const info = categoryInfo[place.category];
  const ring = isActive ? '#5f4660' : 'rgba(95, 70, 96, 0.18)';
  const scale = isActive ? UiNaverMarkerVisualConfig.activePlaceScale : UiNaverMarkerVisualConfig.defaultScale;
  const shadow = isActive ? UiNaverMarkerVisualConfig.activePlaceShadow : UiNaverMarkerVisualConfig.inactivePlaceShadow;
  const label = '';

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:${cssPx(UiNaverMarkerVisualConfig.columnGapPx)};">
      <div style="position:relative;width:${cssPx(UiNaverMarkerVisualConfig.markerSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.markerSizePx)};">
        <div style="position:absolute;left:50%;top:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:${info.jamColor};transform:translateX(-50%);"></div>
        <div style="position:absolute;left:50%;bottom:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:${info.jamColor};transform:translateX(-50%);"></div>
        <div style="position:absolute;left:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};top:50%;width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:${info.jamColor};transform:translateY(-50%);"></div>
        <div style="position:absolute;right:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};top:50%;width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:${info.jamColor};transform:translateY(-50%);"></div>
        <div style="position:absolute;inset:${cssPx(UiNaverMarkerVisualConfig.placeCoreInsetPx)};border-radius:999px;background:${info.color};border:${cssPx(UiNaverMarkerVisualConfig.markerBorderWidthPx)} solid ${ring};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;color:#5f4660;font-size:${cssPx(UiNaverMarkerVisualConfig.placeIconFontSizePx)};font-weight:900;">${info.icon}</div>
      </div>
      ${label}
    </div>
  `;
}

export function festivalMarkerContent(_festival: FestivalItem, isActive: boolean) {
  const ring = isActive ? '#ff4f93' : 'rgba(255, 79, 147, 0.22)';
  const scale = isActive ? UiNaverMarkerVisualConfig.activeFestivalScale : UiNaverMarkerVisualConfig.defaultScale;
  const label = '';

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:${cssPx(UiNaverMarkerVisualConfig.columnGapPx)};">
      <div style="position:relative;width:${cssPx(UiNaverMarkerVisualConfig.markerSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.markerSizePx)};">
        <div style="position:absolute;left:50%;top:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:#ffd4e6;transform:translateX(-50%);"></div>
        <div style="position:absolute;left:50%;bottom:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:#ffd4e6;transform:translateX(-50%);"></div>
        <div style="position:absolute;left:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};top:50%;width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:#ffd4e6;transform:translateY(-50%);"></div>
        <div style="position:absolute;right:${cssPx(UiNaverMarkerVisualConfig.jamDotEdgePx)};top:50%;width:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.jamDotSizePx)};border-radius:999px;background:#ffd4e6;transform:translateY(-50%);"></div>
        <div style="position:absolute;inset:${cssPx(UiNaverMarkerVisualConfig.festivalCoreInsetPx)};border-radius:999px;background:#fff4fa;border:${cssPx(UiNaverMarkerVisualConfig.markerBorderWidthPx)} solid ${ring};box-shadow:${UiNaverMarkerVisualConfig.festivalShadow};display:flex;align-items:center;justify-content:center;color:#7b1948;font-size:${cssPx(UiNaverMarkerVisualConfig.festivalLabelFontSizePx)};font-weight:900;">축제</div>
      </div>
      ${label}
    </div>
  `;
}

export function tourismMarkerContent(_place: TourismPlaceItem, isActive: boolean) {
  const ring = isActive ? '#5f7ea8' : 'rgba(95, 126, 168, 0.24)';
  const scale = isActive ? UiNaverMarkerVisualConfig.activeFestivalScale : UiNaverMarkerVisualConfig.defaultScale;

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:${cssPx(UiNaverMarkerVisualConfig.columnGapPx)};">
      <div style="position:relative;width:${cssPx(UiNaverMarkerVisualConfig.markerSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.markerSizePx)};">
        <div style="position:absolute;inset:${cssPx(UiNaverMarkerVisualConfig.festivalCoreInsetPx)};border-radius:999px;background:#f2f7ff;border:${cssPx(UiNaverMarkerVisualConfig.markerBorderWidthPx)} solid ${ring};box-shadow:${UiNaverMarkerVisualConfig.festivalShadow};display:flex;align-items:center;justify-content:center;color:#315b86;font-size:${cssPx(UiNaverMarkerVisualConfig.festivalLabelFontSizePx)};font-weight:900;">i</div>
      </div>
    </div>
  `;
}

export function hasTourismCoordinates(place: TourismPlaceItem): place is TourismPlaceItem & { latitude: number; longitude: number } {
  return typeof place.latitude === 'number'
    && Number.isFinite(place.latitude)
    && typeof place.longitude === 'number'
    && Number.isFinite(place.longitude);
}

export function hasFestivalCoordinates(festival: FestivalItem): festival is FestivalWithCoordinates {
  return typeof festival.latitude === 'number'
    && Number.isFinite(festival.latitude)
    && typeof festival.longitude === 'number'
    && Number.isFinite(festival.longitude);
}

export function currentLocationMarkerContent() {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:${cssPx(UiNaverMarkerVisualConfig.currentLocationSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.currentLocationSizePx)};border-radius:999px;background:rgba(255,255,255,0.92);box-shadow:${UiNaverMarkerVisualConfig.currentLocationShadow};border:${cssPx(UiNaverMarkerVisualConfig.currentLocationBorderWidthPx)} solid rgba(95,70,96,0.12);">
      <div style="width:${cssPx(UiNaverMarkerVisualConfig.currentLocationDotSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.currentLocationDotSizePx)};border-radius:999px;background:#4f8cff;box-shadow:${UiNaverMarkerVisualConfig.currentLocationPulseShadow};"></div>
    </div>
  `;
}

export function routeStepMarkerContent(step: number) {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:${cssPx(UiNaverMarkerVisualConfig.routeStepSizePx)};height:${cssPx(UiNaverMarkerVisualConfig.routeStepSizePx)};border-radius:999px;background:#5f4660;color:#fff;font-size:${cssPx(UiNaverMarkerVisualConfig.routeStepFontSizePx)};font-weight:800;box-shadow:${UiNaverMarkerVisualConfig.routeStepShadow};border:${cssPx(UiNaverMarkerVisualConfig.markerBorderWidthPx)} solid rgba(255,255,255,0.9);">${step}</div>
  `;
}
