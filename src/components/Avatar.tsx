import { useEffect, useState } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

function getInitial(name: string) {
  return name.trim().slice(0, 1) || 'J';
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const canShowImage = Boolean(src) && src !== failedSrc;
  const classNames = ['avatar', `avatar--${size}`, className].filter(Boolean).join(' ');

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <span className={classNames} aria-label={`${name} 프로필 이미지`}>
      {canShowImage ? (
        <img className="avatar__image" src={src ?? undefined} alt="" onError={() => setFailedSrc(src ?? null)} />
      ) : (
        <span className="avatar__fallback" aria-hidden="true">
          {getInitial(name)}
        </span>
      )}
    </span>
  );
}
