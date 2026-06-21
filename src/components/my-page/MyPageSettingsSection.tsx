import type { ChangeEvent, FormEvent } from 'react';
import type { AuthProvider, SessionUser } from '../../types/auth';
import { ProfileAccountSettings } from './ProfileAccountSettings';

type MyPageSettingsSectionProps = {
  sessionUser: SessionUser;
  providers: AuthProvider[];
  nickname: string;
  showSettings: boolean;
  profileCompletedAt: string | null | undefined;
  profileSaving: boolean;
  profileError: string | null;
  isLoggingOut: boolean;
  onLinkProvider: (provider: AuthProvider) => void;
  onNicknameChange: (value: string) => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteAvatar: () => Promise<void>;
  onLogout: () => void;
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
  isLoggingOut,
  onLinkProvider,
  onNicknameChange,
  onAvatarChange,
  onDeleteAvatar,
  onLogout,
  onClose,
  onSubmit,
}: MyPageSettingsSectionProps) {
  if (!showSettings && profileCompletedAt) {
    return null;
  }

  return (
    <section className="sheet-card stack-gap settings-card">
      <div className="settings-card__header">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h3>{profileCompletedAt ? '\uD504\uB85C\uD544 \uC124\uC815' : '\uD504\uB85C\uD544\uC744 \uBA3C\uC800 \uC815\uD574 \uC8FC\uC138\uC694'}</h3>
          <p className="section-copy">{'\uD504\uB85C\uD544\uC740 \uC11C\uBE44\uC2A4 \uC804\uCCB4\uC5D0\uC11C \uD558\uB098\uB9CC \uC0AC\uC6A9\uB3FC\uC694.'}</p>
        </div>
        {profileCompletedAt && (
          <button type="button" className="settings-card__close" onClick={onClose} aria-label={'\uC124\uC815 \uB2EB\uAE30'}>
            <span aria-hidden="true">{'\u00D7'}</span>
          </button>
        )}
      </div>
      <ProfileAccountSettings
        sessionUser={sessionUser}
        providers={providers}
        nickname={nickname}
        profileSaving={profileSaving}
        profileError={profileError}
        isLoggingOut={isLoggingOut}
        onLinkProvider={onLinkProvider}
        onNicknameChange={onNicknameChange}
        onAvatarChange={onAvatarChange}
        onDeleteAvatar={onDeleteAvatar}
        onLogout={onLogout}
        onSubmit={onSubmit}
      />
    </section>
  );
}
