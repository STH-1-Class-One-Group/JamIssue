import type { FormEvent } from 'react';
import type { AuthProvider, SessionUser } from '../../types/auth';
import { getAuthProviderDisplayLabel } from '../../utils/authProviderDisplay';

type MyPageSettingsSectionProps = {
  sessionUser: SessionUser;
  providers: AuthProvider[];
  nickname: string;
  showSettings: boolean;
  profileCompletedAt: string | null | undefined;
  profileSaving: boolean;
  profileError: string | null;
  onLinkProvider: (provider: AuthProvider) => void;
  onNicknameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function MyPageSettingsSection({
  sessionUser,
  providers,
  nickname,
  showSettings,
  profileCompletedAt,
  profileSaving,
  profileError,
  onLinkProvider,
  onNicknameChange,
  onClose,
  onSubmit,
}: MyPageSettingsSectionProps) {
  if (!showSettings && profileCompletedAt) {
    return null;
  }

  const linkedProviders = sessionUser.linkedProviders;
  const providerByKey = new Map(providers.map((provider) => [provider.key, provider]));
  const socialProviderKeys = [
    ...linkedProviders,
    ...providers
      .filter((provider) => !linkedProviders.includes(provider.key) && provider.isEnabled && Boolean(provider.linkUrl))
      .map((provider) => provider.key),
  ];

  return (
    <section className="sheet-card stack-gap settings-card">
      <div className="settings-card__header">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h3>{profileCompletedAt ? '\uD504\uB85C\uD544 \uC124\uC815' : '\uD504\uB85C\uD544\uC744 \uBA3C\uC800 \uC815\uD574 \uC8FC\uC138\uC694'}</h3>
          <p className="section-copy">{'\uD504\uB85C\uD544\uC740 \uC11C\uBE44\uC2A4 \uC804\uCCB4\uC5D0\uC11C \uD558\uB098\uB9CC \uC0AC\uC6A9\uB3FC\uC694.'}</p>
        </div>
        {profileCompletedAt && (
          <button type="button" className="settings-card__close" onClick={onClose} aria-label={'\uC124\uC815 \uB2EB\uAE30'}>
            <span aria-hidden="true">{'\u00D7'}</span>
          </button>
        )}
      </div>
      {socialProviderKeys.length > 0 && (
        <div className="settings-card__links" aria-label={'\uC5F0\uACB0\uB41C \uC18C\uC15C \uACC4\uC815'}>
          <p className="eyebrow">{'\uC18C\uC15C \uACC4\uC815'}</p>
          {socialProviderKeys.map((providerKey) => {
            const provider = providerByKey.get(providerKey);
            const isLinked = linkedProviders.includes(providerKey);
            const providerLabel = getAuthProviderDisplayLabel({ key: providerKey });

            if (isLinked) {
              return (
                <div key={providerKey} className="settings-card__link-button secondary-button is-complete" aria-label={`${providerLabel} \uC5F0\uACB0\uB428`}>
                  <span>{providerLabel}</span>
                  <span className="soft-tag is-complete">{'\uC5F0\uACB0\uB428'}</span>
                </div>
              );
            }

            if (!provider) {
              return null;
            }

            return (
              <button
                key={providerKey}
                type="button"
                className="settings-card__link-button secondary-button"
                onClick={() => onLinkProvider(provider)}
              >
                <span>{providerLabel}</span>
                <span>{'\uACC4\uC815 \uC5F0\uB3D9'}</span>
              </button>
            );
          })}
        </div>
      )}
      <form className="route-builder-form" onSubmit={(event) => void onSubmit(event)}>
        <label className="route-builder-field">
          <span>{'\uD504\uB85C\uD544\uBA85'}</span>
          <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} placeholder={'\uC608: \uB300\uC804\uC0B0\uCC45\uB7EC'} maxLength={40} />
        </label>
        {profileError && <p className="form-error-copy">{profileError}</p>}
        <button type="submit" className="primary-button route-submit-button" disabled={profileSaving || nickname.trim().length < 2}>
          {profileSaving ? '\uC800\uC7A5 \uC911' : '\uD504\uB85C\uD544 \uC800\uC7A5'}
        </button>
      </form>
    </section>
  );
}
