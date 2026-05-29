import type { AuthProvider } from '../types/auth';

const PROVIDER_LABELS: Record<AuthProvider['key'], string> = {
  naver: '\uB124\uC774\uBC84',
  kakao: '\uCE74\uCE74\uC624',
};

export function getAuthProviderDisplayLabel(provider: Pick<AuthProvider, 'key'>) {
  return PROVIDER_LABELS[provider.key];
}
