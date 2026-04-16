import type { SessionUser } from '../../types';

interface MyPageHeaderProps {
  sessionUser: SessionUser;
}

export function MyPageHeader({ sessionUser }: MyPageHeaderProps) {
  return (
    <header className="panel-header panel-header--with-action">
      <div>
        <p className="eyebrow">MY PAGE</p>
        <h2>{sessionUser.nickname}님의 기록</h2>
        <p>
          스탬프와 리뷰, 여정을 확인하면서,
          <br />
          하나의 여행 동선을 코스로 발행할 수 있어요.
        </p>
      </div>
    </header>
  );
}
