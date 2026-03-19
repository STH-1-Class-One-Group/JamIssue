export interface ClientConfig {
  // Despite the legacy name PUBLIC_APP_BASE_URL, this value is used as the API base URL.
  // build-frontend.mjs에서 런타임에 주입된 환경 설정을 읽음
  apiBaseUrl: string;
  naverMapClientId: string;
}

declare global {
  interface Window {
    // build-frontend.mjs가 <script> 태그에서 @__JAMISSUE_CONFIG__@ 변수를 실제 JSON으로 치환하여 주입
    __JAMISSUE_CONFIG__?: Partial<ClientConfig>;
  }
}

export function getClientConfig(): ClientConfig {
  // 브라우저 window 객체에 주입된 설정을 먼저 확인, 없으면 기본값 사용 (로컬 개발 시)
  const browserConfig = typeof window === 'undefined' ? undefined : window.__JAMISSUE_CONFIG__;
  const apiBaseUrl = (browserConfig?.apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')).replace(/\/$/, '');
  const naverMapClientId = browserConfig?.naverMapClientId?.trim() || '';

  return {
    apiBaseUrl,
    naverMapClientId,
  };
}