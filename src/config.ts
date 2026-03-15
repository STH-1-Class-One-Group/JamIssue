export interface ClientConfig {
  apiBaseUrl: string;
  naverMapClientId: string;
}

declare global {
  interface Window {
    __JAMISSUE_CONFIG__?: Partial<ClientConfig>;
  }
}

export function getClientConfig(): ClientConfig {
  const browserConfig = typeof window === 'undefined' ? undefined : window.__JAMISSUE_CONFIG__;
  const apiBaseUrl = (browserConfig?.apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')).replace(/\/$/, '');
  const naverMapClientId = browserConfig?.naverMapClientId?.trim() || '';

  return {
    apiBaseUrl,
    naverMapClientId,
  };
}
