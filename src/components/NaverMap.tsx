import { useEffect, useRef, useState } from 'react';
import { getClientConfig } from '../config';
import { categoryInfo } from '../lib/categories';
import type { ApiStatus, FestivalItem, Place } from '../types';

declare global {
  interface Window {
    naver?: any;
  }
}

const DAEJEON_CENTER = { latitude: 36.3504, longitude: 127.3845 };
const DAEJEON_BOUNDS = {
  southWest: { latitude: 36.1907, longitude: 127.2629 },
  northEast: { latitude: 36.4905, longitude: 127.5429 },
};

let naverScriptPromise: Promise<any> | null = null;

function loadNaverMaps(clientId: string) {
  if (window.naver?.maps) {
    return Promise.resolve(window.naver.maps);
  }

  if (naverScriptPromise) {
    return naverScriptPromise;
  }

  naverScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => {
      if (window.naver?.maps) {
        resolve(window.naver.maps);
        return;
      }
      reject(new Error('네이버 지도 SDK를 찾지 못했어요.'));
    };
    script.onerror = () => reject(new Error('네이버 지도 SDK를 불러오지 못했어요.'));
    document.head.appendChild(script);
  });

  return naverScriptPromise;
}

function placeMarkerContent(place: Place, isActive: boolean) {
  const info = categoryInfo[place.category];
  const ring = isActive ? '#5f4660' : 'rgba(95, 70, 96, 0.18)';
  const scale = isActive ? 'scale(1.08)' : 'scale(1)';
  const shadow = isActive ? '0 14px 28px rgba(255,127,168,0.28)' : '0 10px 22px rgba(255,156,96,0.18)';

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="position:relative;width:50px;height:50px;">
        <div style="position:absolute;left:50%;top:3px;width:18px;height:18px;border-radius:999px;background:${info.jamColor};transform:translateX(-50%);"></div>
        <div style="position:absolute;left:50%;bottom:3px;width:18px;height:18px;border-radius:999px;background:${info.jamColor};transform:translateX(-50%);"></div>
        <div style="position:absolute;left:3px;top:50%;width:18px;height:18px;border-radius:999px;background:${info.jamColor};transform:translateY(-50%);"></div>
        <div style="position:absolute;right:3px;top:50%;width:18px;height:18px;border-radius:999px;background:${info.jamColor};transform:translateY(-50%);"></div>
        <div style="position:absolute;inset:11px;border-radius:999px;background:${info.color};border:2px solid ${ring};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;color:#5f4660;font-size:15px;font-weight:900;">${info.icon}</div>
      </div>
      <div style="min-width:92px;max-width:120px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.95);color:#402833;font-size:11px;font-weight:700;text-align:center;box-shadow:0 8px 18px rgba(255,127,168,0.12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${place.name}</div>
    </div>
  `;
}

function festivalMarkerContent(festival: FestivalItem, isActive: boolean) {
  const ring = isActive ? '#ff4f93' : 'rgba(255, 79, 147, 0.22)';
  const scale = isActive ? 'scale(1.06)' : 'scale(1)';
  const statusLabel = festival.isOngoing ? '진행 중' : '예정';

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="position:relative;width:50px;height:50px;">
        <div style="position:absolute;left:50%;top:0;width:20px;height:20px;border-radius:999px;background:#ffd4e6;transform:translateX(-50%);"></div>
        <div style="position:absolute;left:50%;bottom:0;width:20px;height:20px;border-radius:999px;background:#ffd4e6;transform:translateX(-50%);"></div>
        <div style="position:absolute;left:0;top:50%;width:20px;height:20px;border-radius:999px;background:#ffd4e6;transform:translateY(-50%);"></div>
        <div style="position:absolute;right:0;top:50%;width:20px;height:20px;border-radius:999px;background:#ffd4e6;transform:translateY(-50%);"></div>
        <div style="position:absolute;inset:12px;border-radius:999px;background:#fff4fa;border:2px solid ${ring};box-shadow:0 10px 24px rgba(255,93,146,0.18);display:flex;align-items:center;justify-content:center;color:#7b1948;font-size:10px;font-weight:900;">축제</div>
      </div>
      <div style="min-width:98px;max-width:124px;padding:7px 10px;border-radius:16px;background:rgba(255,255,255,0.95);color:#402833;font-size:11px;font-weight:700;text-align:center;box-shadow:0 8px 18px rgba(255,127,168,0.14);">
        <div style="margin-bottom:3px;color:#ff4f93;font-size:10px;">${statusLabel}</div>
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${festival.title}</div>
      </div>
    </div>
  `;
}

function currentLocationMarkerContent() {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,0.92);box-shadow:0 6px 18px rgba(95,70,96,0.18);border:1px solid rgba(95,70,96,0.12);">
      <div style="width:12px;height:12px;border-radius:999px;background:#4f8cff;box-shadow:0 0 0 6px rgba(79,140,255,0.18);"></div>
    </div>
  `;
}

interface NaverMapProps {
  places: Place[];
  festivals: FestivalItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  onSelectPlace: (placeId: string) => void;
  onSelectFestival: (festivalId: string) => void;
  currentPosition: { latitude: number; longitude: number } | null;
  currentLocationStatus: ApiStatus;
  currentLocationMessage: string | null;
  focusCurrentLocationKey: number;
  onLocateCurrentPosition: () => void;
  height?: string;
}

export function NaverMap({
  places,
  festivals,
  selectedPlaceId,
  selectedFestivalId,
  onSelectPlace,
  onSelectFestival,
  currentPosition,
  currentLocationStatus,
  currentLocationMessage,
  focusCurrentLocationKey,
  onLocateCurrentPosition,
  height = '100%',
}: NaverMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const placeMarkersRef = useRef<any[]>([]);
  const festivalMarkersRef = useRef<any[]>([]);
  const currentMarkerRef = useRef<any | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clientId = getClientConfig().naverMapClientId;

  useEffect(() => {
    if (!clientId) {
      setStatus('error');
      setErrorMessage('네이버 지도 Client ID가 비어 있어요.');
      return;
    }

    if (!mapElementRef.current) {
      return;
    }

    let isMounted = true;

    loadNaverMaps(clientId)
      .then((maps) => {
        if (!isMounted || !mapElementRef.current || mapRef.current) {
          return;
        }

        mapRef.current = new maps.Map(mapElementRef.current, {
          center: new maps.LatLng(DAEJEON_CENTER.latitude, DAEJEON_CENTER.longitude),
          zoom: 12,
          minZoom: 10,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: true,
        });

        const bounds = new maps.LatLngBounds(
          new maps.LatLng(DAEJEON_BOUNDS.southWest.latitude, DAEJEON_BOUNDS.southWest.longitude),
          new maps.LatLng(DAEJEON_BOUNDS.northEast.latitude, DAEJEON_BOUNDS.northEast.longitude),
        );

        mapRef.current.fitBounds(bounds, { top: 52, right: 20, bottom: 96, left: 20 });
        setStatus('ready');
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }
        setStatus('error');
        setErrorMessage(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
    placeMarkersRef.current.forEach((marker) => marker.setMap(null));
    placeMarkersRef.current = [];

    places.forEach((place) => {
      const marker = new maps.Marker({
        map: mapRef.current,
        position: new maps.LatLng(place.latitude, place.longitude),
        title: place.name,
        icon: {
          content: placeMarkerContent(place, place.id === selectedPlaceId),
          anchor: new maps.Point(46, 58),
        },
      });
      maps.Event.addListener(marker, 'click', () => onSelectPlace(place.id));
      placeMarkersRef.current.push(marker);
    });
  }, [onSelectPlace, places, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
    festivalMarkersRef.current.forEach((marker) => marker.setMap(null));
    festivalMarkersRef.current = [];

    festivals.forEach((festival) => {
      const marker = new maps.Marker({
        map: mapRef.current,
        position: new maps.LatLng(festival.latitude, festival.longitude),
        title: festival.title,
        zIndex: 120,
        icon: {
          content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
          anchor: new maps.Point(50, 60),
        },
      });
      maps.Event.addListener(marker, 'click', () => onSelectFestival(festival.id));
      festivalMarkersRef.current.push(marker);
    });
  }, [festivals, onSelectFestival, selectedFestivalId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;

    if (!currentPosition) {
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
        currentMarkerRef.current = null;
      }
      return;
    }

    const position = new maps.LatLng(currentPosition.latitude, currentPosition.longitude);
    if (!currentMarkerRef.current) {
      currentMarkerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
        title: '현재 위치',
        zIndex: 200,
        icon: {
          content: currentLocationMarkerContent(),
          anchor: new maps.Point(14, 14),
        },
      });
      return;
    }

    currentMarkerRef.current.setPosition(position);
    currentMarkerRef.current.setMap(mapRef.current);
  }, [currentPosition, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const selectedPlace = selectedPlaceId ? places.find((place) => place.id === selectedPlaceId) : null;
    const selectedFestival = selectedFestivalId ? festivals.find((festival) => festival.id === selectedFestivalId) : null;
    const target = selectedPlace
      ? { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }
      : selectedFestival
        ? { latitude: selectedFestival.latitude, longitude: selectedFestival.longitude }
        : null;

    if (!target) {
      return;
    }

    mapRef.current.panTo(new window.naver.maps.LatLng(target.latitude, target.longitude));
  }, [festivals, places, selectedFestivalId, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current || !currentPosition || focusCurrentLocationKey === 0) {
      return;
    }

    mapRef.current.panTo(new window.naver.maps.LatLng(currentPosition.latitude, currentPosition.longitude));
  }, [currentPosition, focusCurrentLocationKey, status]);

  if (!clientId || status === 'error') {
    return (
      <div className="map-status-card">
        <strong>네이버 지도 연결 대기</strong>
        <p>{errorMessage || '네이버 지도 SDK를 불러오지 못했어요.'}</p>
      </div>
    );
  }

  return (
    <div className="map-surface-frame">
      {status === 'loading' && (
        <div className="map-status-card map-status-card--overlay">
          <strong>대전 지도를 준비하고 있어요</strong>
          <p>잠시만 기다리면 지도와 마커를 바로 보여드릴게요.</p>
        </div>
      )}
      <div className="map-floating-controls">
        <button type="button" className="map-locate-button" onClick={onLocateCurrentPosition} disabled={currentLocationStatus === 'loading'}>
          {currentLocationStatus === 'loading' ? '확인 중' : currentPosition ? '내 위치 보기' : '내 위치 켜기'}
        </button>
      </div>
      <div ref={mapElementRef} style={{ width: '100%', height }} />
      {currentLocationMessage && <div className="map-location-pill">{currentLocationMessage}</div>}
    </div>
  );
}

