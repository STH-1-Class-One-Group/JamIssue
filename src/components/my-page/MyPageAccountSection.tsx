import type { SessionUser } from '../../types';

type MyPageAccountSectionProps = {
  sessionUser: SessionUser;
  isLoggingOut: boolean;
  showSettings: boolean;
  onToggleSettings: () => void;
  onLogout: () => void;
};

export function MyPageAccountSection({
  sessionUser,
  isLoggingOut,
  showSettings,
  onToggleSettings,
  onLogout,
}: MyPageAccountSectionProps) {
  return (
    <section className="sheet-card stack-gap account-action-card">
      <div className="section-title-row section-title-row--tight">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h3>계정 관리</h3>
        </div>
      </div>
      <div className="account-action-row">
        <button type="button" className={showSettings ? 'secondary-button is-complete' : 'secondary-button'} onClick={onToggleSettings}>
          <span aria-hidden="true">⚙</span>{' '}
          {showSettings ? '설정 닫기' : '설정 열기'}
        </button>
        <button type="button" className="secondary-button" onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? '정리 중' : '로그아웃'}
        </button>
      </div>
      {!sessionUser.profileCompletedAt && (
        <p className="section-copy">프로필을 먼저 완성하면 기록과 계정 정보가 같은 기준으로 이어져요.</p>
      )}
    </section>
  );
}
