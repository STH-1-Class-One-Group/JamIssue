import { MapViewportConfig } from '../../config/mapConfig';

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

const DEFAULT_MAP_VIEWPORT: MapViewport = {
  lat: MapViewportConfig.daejeonCenter.latitude,
  lng: MapViewportConfig.daejeonCenter.longitude,
  zoom: MapViewportConfig.defaultZoom,
};

export function getInitialMapViewport(): MapViewport {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_MAP_VIEWPORT };
  }

  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get('lat') ?? '');
  const lng = parseFloat(params.get('lng') ?? '');
  const zoom = parseInt(params.get('z') ?? '', MapViewportConfig.urlZoomRadix);

  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_MAP_VIEWPORT.lat,
    lng: Number.isFinite(lng) ? lng : DEFAULT_MAP_VIEWPORT.lng,
    zoom: Number.isFinite(zoom) ? zoom : DEFAULT_MAP_VIEWPORT.zoom,
  };
}

export function updateMapViewportInUrl(lat: number, lng: number, zoom: number) {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  params.set('lat', lat.toFixed(MapViewportConfig.urlCoordinatePrecision));
  params.set('lng', lng.toFixed(MapViewportConfig.urlCoordinatePrecision));
  params.set('z', String(zoom));
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}
