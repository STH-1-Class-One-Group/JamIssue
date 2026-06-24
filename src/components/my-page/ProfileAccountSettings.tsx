import type { ChangeEvent, FormEvent } from 'react';
import type { AuthProvider, SessionUser } from '../../types/auth';
import { getAuthProviderDisplayLabel } from '../../utils/authProviderDisplay';
import { DrawerFormGroup, DrawerSection, DrawerStack } from '../app-shell/drawer-kit';
import { ProfileAvatarEditor } from './ProfileAvatarEditor';

type ProfileAccountSettingsProps = {
  sessionUser: SessionUser;
  providers: AuthProvider[];
  nickname: string;
  profileSaving: boolean;
  profileError: string | null;
  isLoggingOut: boolean;
  onLinkProvider: (provider: AuthProvider) => void;
  onNicknameChange: (value: string) => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteAvatar: () => Promise<void>;
  onLogout: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function ProfileAccountSettings({
  sessionUser,
  providers,
  nickname,
  profileSaving,
  profileError,
  isLoggingOut,
  onLinkProvider,
  onNicknameChange,
  onAvatarChange,
  onDeleteAvatar,
  onLogout,
  onSubmit,
}: ProfileAccountSettingsProps) {
  const linkedProviders = sessionUser.linkedProviders;
  const providerByKey = new Map(providers.map((provider) => [provider.key, provider]));
  const socialProviderKeys = [
    ...linkedProviders,
    ...providers
      .filter((provider) => !linkedProviders.includes(provider.key) && provider.isEnabled && Boolean(provider.linkUrl))
      .map((provider) => provider.key),
  ];

  return (
    <DrawerStack className="settings-card__account-content">
      {socialProviderKeys.length > 0 ? (
        <DrawerSection className="settings-card__social" eyebrow="소셜 계정" aria-label="연결된 소셜 계정">
          <div className="settings-card__social-list">
            {socialProviderKeys.map((providerKey) => {
              const provider = providerByKey.get(providerKey);
              const isLinked = linkedProviders.includes(providerKey);
              const providerLabel = getAuthProviderDisplayLabel({ key: providerKey });

              if (isLinked) {
                return (
                  <div key={providerKey} className="settings-card__social-row" aria-label={`${providerLabel} 연결됨`}>
                    <span className="settings-card__social-provider">{providerLabel}</span>
                    <span className="settings-card__social-status">연결됨</span>
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
                  className="settings-card__social-action"
                  onClick={() => onLinkProvider(provider)}
                  aria-label={`${providerLabel} 계정 연동`}
                >
                  <span className="settings-card__social-provider">{providerLabel}</span>
                  <span className="settings-card__social-action-label">계정 연동</span>
                </button>
              );
            })}
          </div>
        </DrawerSection>
      ) : null}
      <ProfileAvatarEditor
        sessionUser={sessionUser}
        profileSaving={profileSaving}
        onAvatarChange={onAvatarChange}
        onDeleteAvatar={onDeleteAvatar}
      />
      <form className="drawer-kit-section route-builder-form" onSubmit={(event) => void onSubmit(event)}>
        <DrawerFormGroup label="프로필명">
          <input
            value={nickname}
            onChange={(event) => onNicknameChange(event.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={40}
          />
        </DrawerFormGroup>
        {profileError ? <p className="form-error-copy">{profileError}</p> : null}
        <button type="submit" className="primary-button route-submit-button" disabled={profileSaving || nickname.trim().length < 2}>
          {profileSaving ? '저장 중' : '프로필 저장'}
        </button>
      </form>
      <button type="button" className="secondary-button route-submit-button" onClick={onLogout} disabled={isLoggingOut}>
        {isLoggingOut ? '정리 중' : '로그아웃'}
      </button>
    </DrawerStack>
  );
}
