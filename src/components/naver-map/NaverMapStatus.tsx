import type { ApiStatus } from '../../types';

type NaverMapStatusProps = {
  clientId: string;
  status: 'loading' | 'ready' | 'error';
  errorMessage: string | null;
  currentLocationStatus: ApiStatus;
  currentLocationMessage: string | null;
  currentPosition: { latitude: number; longitude: number } | null;
  onLocateCurrentPosition: () => void;
};

export function NaverMapStatus({
  clientId,
  status,
  errorMessage,
  currentLocationStatus,
  currentLocationMessage,
  currentPosition,
  onLocateCurrentPosition,
}: NaverMapStatusProps) {
  if (!clientId || status === 'error') {
    return (
      <div className="map-status-card">
        <strong>네이버 지도 연결 대기</strong>
        <p>{errorMessage || '네이버 지도 SDK를 불러오지 못했어요.'}</p>
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <div className="map-status-card map-status-card--overlay">
          <strong>대전 지도를 준비하고 있어요</strong>
          <p>잠시만 기다리면 지도와 마커를 바로 보여드릴게요.</p>
        </div>
      )}
      <div className="map-floating-controls">
        <button type="button" className="map-locate-button" onClick={onLocateCurrentPosition} disabled={currentLocationStatus === 'loading'}>
          {currentLocationStatus === 'loading' ? '확인 중' : currentPosition ? '내 위치 보기' : '내 위치 찾기'}
        </button>
      </div>
      {currentLocationMessage && <div className="map-location-pill">{currentLocationMessage}</div>}
    </>
  );
}
