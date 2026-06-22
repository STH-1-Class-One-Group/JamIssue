import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { AuthProvider, SessionUser } from '../../types/auth';
import { ProfileAccountSettings } from '../my-page/ProfileAccountSettings';

export type AppAccountSettingsSlotProps = {
  isLoggingOut: boolean;
  onDeleteAvatar: () => Promise<void>;
  onLinkProvider: (provider: AuthProvider) => void;
  onLogout: () => Promise<void>;
  onSaveNickname: (nickname: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  profileError: string | null;
  profileSaving: boolean;
  providers: AuthProvider[];
  sessionUser: SessionUser;
};

export function AppAccountSettingsSlot({
  isLoggingOut,
  onDeleteAvatar,
  onLinkProvider,
  onLogout,
  onSaveNickname,
  onUploadAvatar,
  profileError,
  profileSaving,
  providers,
  sessionUser,
}: AppAccountSettingsSlotProps) {
  const [nickname, setNickname] = useState(sessionUser.nickname ?? '');

  useEffect(() => {
    setNickname(sessionUser.nickname ?? '');
  }, [sessionUser.nickname]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) {
      return;
    }
    await onUploadAvatar(file);
  };

  const handleNicknameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveNickname(nickname.trim());
  };

  return (
    <ProfileAccountSettings
      sessionUser={sessionUser}
      providers={providers}
      nickname={nickname}
      profileSaving={profileSaving}
      profileError={profileError}
      isLoggingOut={isLoggingOut}
      onLinkProvider={onLinkProvider}
      onNicknameChange={setNickname}
      onAvatarChange={handleAvatarChange}
      onDeleteAvatar={onDeleteAvatar}
      onLogout={() => void onLogout()}
      onSubmit={handleNicknameSubmit}
    />
  );
}
