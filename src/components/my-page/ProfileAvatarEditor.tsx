import type { ChangeEvent } from 'react';
import type { SessionUser } from '../../types/auth';
import { Avatar } from '../Avatar';

type ProfileAvatarEditorProps = {
  sessionUser: SessionUser;
  profileSaving: boolean;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteAvatar: () => Promise<void>;
};

export function ProfileAvatarEditor({
  sessionUser,
  profileSaving,
  onAvatarChange,
  onDeleteAvatar,
}: ProfileAvatarEditorProps) {
  return (
    <section className="settings-card__avatar-editor" aria-label="프로필 사진 설정">
      <div className="settings-card__avatar-preview">
        <Avatar src={sessionUser.profileImage} name={sessionUser.nickname} size="md" />
        <div>
          <p className="eyebrow">AVATAR</p>
          <p className="section-copy">작은 프로필 이미지로 피드와 댓글에서 표시돼요.</p>
        </div>
      </div>
      <div className="settings-card__avatar-action-row">
        <label className="secondary-button settings-card__avatar-action settings-card__avatar-upload">
          사진 변경
          <input type="file" accept="image/*" onChange={(event) => void onAvatarChange(event)} disabled={profileSaving} />
        </label>
        <button
          type="button"
          className="secondary-button settings-card__avatar-action"
          onClick={() => void onDeleteAvatar()}
          disabled={profileSaving || !sessionUser.profileImage}
        >
          사진 삭제
        </button>
      </div>
    </section>
  );
}
