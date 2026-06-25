import type { ChangeEvent, FormEvent } from 'react';
import type { AuthProvider, SessionUser } from '../../types/auth';
import { getAuthProviderDisplayLabel } from '../../utils/authProviderDisplay';
import { ActionButton, AppSurface, FormField, ListItem, SectionHeader } from '../ui-kit';
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
    <div className="settings-card__account-content ui-drawer-stack">
      {socialProviderKeys.length > 0 ? (
        <AppSurface className="settings-card__social" variant="panel" aria-label="연결된 소셜 계정">
          <SectionHeader eyebrow="SOCIAL" title="소셜 계정" />
          <div className="settings-card__social-list">
            {socialProviderKeys.map((providerKey) => {
              const provider = providerByKey.get(providerKey);
              const isLinked = linkedProviders.includes(providerKey);
              const providerLabel = getAuthProviderDisplayLabel({ key: providerKey });

              if (isLinked) {
                return (
                  <ListItem
                    key={providerKey}
                    className="settings-card__social-row"
                    title={providerLabel}
                    actions={<span className="settings-card__social-status">연결됨</span>}
                    aria-label={`${providerLabel} 연결됨`}
                  />
                );
              }

              if (!provider) {
                return null;
              }

              return (
                <ActionButton
                  key={providerKey}
                  className="settings-card__social-action"
                  onClick={() => onLinkProvider(provider)}
                  aria-label={`${providerLabel} 계정 연동`}
                  variant="secondary"
                >
                  <span className="settings-card__social-provider">{providerLabel}</span>
                  <span className="settings-card__social-action-label">계정 연동</span>
                </ActionButton>
              );
            })}
          </div>
        </AppSurface>
      ) : null}
      <ProfileAvatarEditor
        sessionUser={sessionUser}
        profileSaving={profileSaving}
        onAvatarChange={onAvatarChange}
        onDeleteAvatar={onDeleteAvatar}
      />
      <form className="settings-card__profile-form" onSubmit={(event) => void onSubmit(event)}>
        <AppSurface variant="panel">
          <FormField label="프로필명" htmlFor="profile-nickname">
            <input
              id="profile-nickname"
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={40}
            />
          </FormField>
          {profileError ? <p className="form-error-copy">{profileError}</p> : null}
          <ActionButton type="submit" variant="primary" disabled={profileSaving || nickname.trim().length < 2}>
            {profileSaving ? '저장 중' : '프로필 저장'}
          </ActionButton>
        </AppSurface>
      </form>
      <ActionButton variant="secondary" onClick={onLogout} disabled={isLoggingOut}>
        {isLoggingOut ? '처리 중' : '로그아웃'}
      </ActionButton>
    </div>
  );
}
