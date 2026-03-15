import type { AuthProvider, ProviderKey } from '../types';

interface ProviderButtonsProps {
  providers: AuthProvider[];
  onLogin: (provider: ProviderKey) => void;
}

export function ProviderButtons({ providers, onLogin }: ProviderButtonsProps) {
  return (
    <div className="provider-grid">
      {providers.map((provider) => (
        <button
          key={provider.key}
          type="button"
          className={provider.isEnabled ? 'provider-button' : 'provider-button is-disabled'}
          onClick={() => provider.isEnabled && onLogin(provider.key)}
          disabled={!provider.isEnabled}
        >
          <span className="provider-button__label">{provider.label}</span>
          <strong>{provider.isEnabled ? '로그인 연결' : '준비 중'}</strong>
        </button>
      ))}
    </div>
  );
}