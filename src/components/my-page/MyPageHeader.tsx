import type { SessionUser } from '../../types/auth';
import { Avatar } from '../Avatar';
import { SectionHeader } from '../ui-kit';

interface MyPageHeaderProps {
  sessionUser: SessionUser;
}

export function MyPageHeader({ sessionUser }: MyPageHeaderProps) {
  return (
    <header className="my-page-profile-header">
      <Avatar src={sessionUser.profileImage} name={sessionUser.nickname} size="lg" className="my-page-profile-header__avatar" />
      <SectionHeader
        className="my-page-profile-header__body"
        eyebrow="MY PAGE"
        title={`${sessionUser.nickname}님의 기록`}
        description="방문과 스탬프, 리뷰 활동을 한곳에서 확인할 수 있어요."
      />
    </header>
  );
}
