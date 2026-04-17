import { useState, type FormEvent } from 'react';
import { FEEDBACK_FORM_URL } from '../GlobalFeedbackButton';
import { NotificationPanel } from '../notifications/NotificationPanel';
import type { NotificationItem } from '../notifications/notificationTypes';
import { useNotificationPanelActions } from '../notifications/useNotificationPanelActions';

type MyPageSettingsSectionProps = {
  nickname: string;
  showSettings: boolean;
  sessionUserName: string;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  profileCompletedAt: string | null | undefined;
  profileSaving: boolean;
  profileError: string | null;
  onNicknameChange: (value: string) => void;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: string) => Promise<void>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function MyPageSettingsSection({
  nickname,
  showSettings,
  sessionUserName,
  notifications,
  unreadNotificationCount,
  profileCompletedAt,
  profileSaving,
  profileError,
  onNicknameChange,
  onOpenNotification,
  onMarkAllNotificationsRead,
  onDeleteNotification,
  onClose,
  onSubmit,
}: MyPageSettingsSectionProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationActions = useNotificationPanelActions({
    onOpenNotification,
    onMarkAllNotificationsRead,
    onDeleteNotification,
    onClose: () => setShowNotifications(false),
  });

  if (!showSettings && profileCompletedAt) {
    return null;
  }

  return (
    <section className="sheet-card stack-gap settings-card">
      <div className="settings-card__header">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h3>{profileCompletedAt ? '프로필 설정' : '프로필을 먼저 정해 주세요'}</h3>
          <p className="section-copy">프로필은 서비스 전체에서 하나만 사용돼요.</p>
        </div>
        {profileCompletedAt && (
          <button type="button" className="settings-card__close" onClick={onClose} aria-label="설정 닫기">
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <form className="route-builder-form" onSubmit={(event) => void onSubmit(event)}>
        <label className="route-builder-field">
          <span>프로필명</span>
          <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} placeholder="예: 대전산책러" maxLength={40} />
        </label>
        {profileError && <p className="form-error-copy">{profileError}</p>}
        <button type="submit" className="primary-button route-submit-button" disabled={profileSaving || nickname.trim().length < 2}>
          {profileSaving ? '저장 중' : '프로필 저장'}
        </button>
      </form>
      <div className="settings-card__links">
        <button
          type="button"
          className={showNotifications ? 'secondary-button is-complete settings-card__link-button' : 'secondary-button settings-card__link-button'}
          onClick={() => setShowNotifications((current) => !current)}
        >
          <span>알람</span>
          {unreadNotificationCount > 0 && <strong>{unreadNotificationCount}</strong>}
        </button>
        <a className="secondary-button settings-card__link-button" href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer">
          <span>피드백</span>
        </a>
      </div>
      {showNotifications && (
        <NotificationPanel
          sessionUserName={sessionUserName}
          notifications={notifications}
          unreadCount={unreadNotificationCount}
          actions={notificationActions}
          embedded
        />
      )}
    </section>
  );
}
