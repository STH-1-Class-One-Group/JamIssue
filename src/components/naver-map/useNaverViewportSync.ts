import { useEffect, useRef } from 'react';
import { SelectionMotionConfig } from '../../config/mapConfig';
import type { NaverMapEventListener, NaverMapInstance, NaverMapsApi } from './naverMapTypes';

type ViewportChangeHandler = ((lat: number, lng: number, zoom: number) => void) | undefined;

type NaverViewportSyncArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  onViewportChangeRef: React.MutableRefObject<ViewportChangeHandler>;
};

export function useNaverViewportSync({
  status,
  mapsApi,
  mapRef,
  onViewportChangeRef,
}: NaverViewportSyncArgs) {
  const idleListenerRef = useRef<NaverMapEventListener | null>(null);
  const viewportDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const idleListener = mapsApi.Event.addListener(mapRef.current, 'idle', () => {
      if (!mapRef.current) {
        return;
      }
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      if (viewportDebounceTimerRef.current !== null) {
        clearTimeout(viewportDebounceTimerRef.current);
      }
      viewportDebounceTimerRef.current = setTimeout(() => {
        onViewportChangeRef.current?.(center.lat(), center.lng(), zoom);
        viewportDebounceTimerRef.current = null;
      }, SelectionMotionConfig.viewportIdleDebounceMs);
    });

    idleListenerRef.current = idleListener;

    return () => {
      if (viewportDebounceTimerRef.current !== null) {
        clearTimeout(viewportDebounceTimerRef.current);
        viewportDebounceTimerRef.current = null;
      }
      if (idleListenerRef.current) {
        mapsApi.Event.removeListener(idleListenerRef.current);
        idleListenerRef.current = null;
      }
    };
  }, [mapRef, mapsApi, onViewportChangeRef, status]);
}
