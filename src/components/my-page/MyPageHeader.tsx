import { Avatar } from '../Avatar';
import type { SessionUser } from '../../types/auth';

interface MyPageHeaderProps {
  sessionUser: SessionUser;
  summary?: {
    uniquePlaceCount: number;
    stampCount: number;
    reviewCount: number;
  } | null;
}

export function MyPageHeader({ sessionUser, summary }: MyPageHeaderProps) {
  return (
    <header className="panel-header panel-header--with-action my-page-profile-header">
      <Avatar src={sessionUser.profileImage} name={sessionUser.nickname} size="lg" className="my-page-profile-header__avatar" />
      <div className="my-page-profile-header__body">
        <p className="eyebrow">MY PAGE</p>
        <h2>{sessionUser.nickname}님의 기록</h2>
        {summary ? (
          <dl className="my-page-profile-header__summary" aria-label="내 활동 요약">
            <div>
              <dt>방문</dt>
              <dd>{summary.uniquePlaceCount}</dd>
            </div>
            <div>
              <dt>스탬프</dt>
              <dd>{summary.stampCount}</dd>
            </div>
            <div>
              <dt>리뷰</dt>
              <dd>{summary.reviewCount}</dd>
            </div>
          </dl>
        ) : (
          <p>스탬프와 리뷰를 모아 내 활동을 확인할 수 있어요.</p>
        )}
      </div>
    </header>
  );
}
