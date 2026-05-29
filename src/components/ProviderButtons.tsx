import type { AuthProvider } from '../types/auth';
import { getAuthProviderDisplayLabel } from '../utils/authProviderDisplay';

interface ProviderButtonsProps {
  providers: AuthProvider[];
  onLogin: (provider: AuthProvider) => void;
}

export function ProviderButtons({ providers, onLogin }: ProviderButtonsProps) {
  return (
    <div className="provider-button-list">
      {providers.map((provider) => {
        const canLogin = provider.isEnabled && Boolean(provider.loginUrl);
        const providerLabel = getAuthProviderDisplayLabel(provider);
        return (
          <button
            key={provider.key}
            type="button"
            className={canLogin ? 'primary-button provider-button' : 'secondary-button provider-button is-disabled'}
            disabled={!canLogin}
            onClick={() => onLogin(provider)}
          >
            {canLogin ? `${providerLabel}\uB85C \uB85C\uADF8\uC778` : `${providerLabel} \uC900\uBE44 \uC911`}
          </button>
        );
      })}
    </div>
  );
}
