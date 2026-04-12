import { useEffect, useRef } from 'react';

type ViewportChangeHandler = ((lat: number, lng: number, zoom: number) => void) | undefined;

export function useNaverViewportChangeRef(onViewportChange: ViewportChangeHandler) {
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  return onViewportChangeRef;
}
