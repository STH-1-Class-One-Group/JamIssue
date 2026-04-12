import { useEffect, useRef } from 'react';

type ViewportChangeHandler = ((lat: number, lng: number, zoom: number) => void) | undefined;

type NaverViewportSyncArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: typeof window.naver.maps | undefined;
  mapRef: React.MutableRefObject<any>;
  onViewportChangeRef: React.MutableRefObject<ViewportChangeHandler>;
};

export function useNaverViewportSync({
  status,
  mapsApi,
  mapRef,
  onViewportChangeRef,
}: NaverViewportSyncArgs) {
  const idleListenerRef = useRef<any>(null);
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
      }, 300);
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
