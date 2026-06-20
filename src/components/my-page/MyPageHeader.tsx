import { Avatar } from '../Avatar';
import type { SessionUser } from '../../types/auth';

interface MyPageHeaderProps {
  sessionUser: SessionUser;
}

export function MyPageHeader({ sessionUser }: MyPageHeaderProps) {
  return (
    <header className="panel-header panel-header--with-action my-page-profile-header">
      <Avatar src={sessionUser.profileImage} name={sessionUser.nickname} size="lg" className="my-page-profile-header__avatar" />
      <div className="my-page-profile-header__body">
        <p className="eyebrow">MY PAGE</p>
        <h2>{sessionUser.nickname}님의 기록</h2>
        <p>방문과 스탬프, 리뷰 활동을 한곳에서 확인할 수 있어요.</p>
      </div>
    </header>
  );
}
