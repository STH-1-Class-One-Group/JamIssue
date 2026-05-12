/*
 * File: naverMapTypes.ts
 * Purpose: Keep the minimal Naver Maps SDK contract local to the map adapter.
 * Primary Responsibility: Type only the SDK surface used by JamIssue map hooks.
 */

export type NaverLatLng = {
  lat: () => number;
  lng: () => number;
};

export type NaverPoint = unknown;

export type NaverLatLngBounds = {
  extend: (position: NaverLatLng) => void;
};

export type NaverMapInstance = {
  fitBounds?: (bounds: NaverLatLngBounds, padding?: Record<string, number>) => void;
  getCenter: () => NaverLatLng;
  getZoom: () => number;
  panBy?: (x: number, y: number) => void;
  panTo?: (position: NaverLatLng) => void;
  setCenter?: (position: NaverLatLng) => void;
  setZoom?: (zoom: number, effect?: boolean) => void;
};

export type NaverMarkerIcon = {
  content: string;
  anchor: NaverPoint;
};

export type NaverMarkerInstance = {
  setIcon: (icon: NaverMarkerIcon) => void;
  setMap: (map: NaverMapInstance | null) => void;
  setPosition: (position: NaverLatLng) => void;
  setZIndex: (zIndex: number) => void;
};

export type NaverPolylineInstance = {
  setMap: (map: NaverMapInstance | null) => void;
};

export type NaverMapEventListener = unknown;

export type NaverMapsApi = {
  Event: {
    addListener: (
      target: NaverMapInstance | NaverMarkerInstance,
      eventName: string,
      listener: () => void,
    ) => NaverMapEventListener;
    removeListener: (listener: NaverMapEventListener) => void;
  };
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  LatLngBounds: new () => NaverLatLngBounds;
  Map: new (
    element: HTMLElement,
    options: {
      center: NaverLatLng;
      zoom: number;
      minZoom: number;
      scaleControl: boolean;
      logoControl: boolean;
      mapDataControl: boolean;
      zoomControl: boolean;
    },
  ) => NaverMapInstance;
  Marker: new (options: {
    map: NaverMapInstance | null;
    position: NaverLatLng;
    title: string;
    zIndex?: number;
    icon: NaverMarkerIcon;
  }) => NaverMarkerInstance;
  Point: new (x: number, y: number) => NaverPoint;
  Polyline: new (options: {
    map: NaverMapInstance | null;
    path: NaverLatLng[];
    strokeColor: string;
    strokeOpacity: number;
    strokeWeight: number;
    strokeLineCap: string;
    strokeLineJoin: string;
    zIndex: number;
  }) => NaverPolylineInstance;
};

declare global {
  interface Window {
    naver?: {
      maps?: NaverMapsApi;
    };
  }
}
