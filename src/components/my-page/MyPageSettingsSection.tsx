import type { FormEvent } from 'react';

type MyPageSettingsSectionProps = {
  nickname: string;
  showSettings: boolean;
  profileCompletedAt: string | null | undefined;
  profileSaving: boolean;
  profileError: string | null;
  onNicknameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function MyPageSettingsSection({
  nickname,
  showSettings,
  profileCompletedAt,
  profileSaving,
  profileError,
  onNicknameChange,
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
          <p className="eyebrow">SETTINGS</p>
          <h3>{profileCompletedAt ? '닉네임 수정' : '닉네임을 먼저 정해 주세요'}</h3>
          <p className="section-copy">닉네임은 서비스 전체에서 하나만 사용할 수 있어요.</p>
        </div>
        {profileCompletedAt && (
          <button type="button" className="settings-card__close" onClick={onClose} aria-label="설정 닫기">
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <form className="route-builder-form" onSubmit={(event) => void onSubmit(event)}>
        <label className="route-builder-field">
          <span>닉네임</span>
          <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} placeholder="예: 대전산책러" maxLength={40} />
        </label>
        {profileError && <p className="form-error-copy">{profileError}</p>}
        <button type="submit" className="primary-button route-submit-button" disabled={profileSaving || nickname.trim().length < 2}>
          {profileSaving ? '저장 중' : '닉네임 저장'}
        </button>
      </form>
    </section>
  );
}
