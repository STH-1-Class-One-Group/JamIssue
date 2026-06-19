import type { ReactNode } from 'react';

interface ReviewFeedCardHeaderProps {
  title: ReactNode;
  mood: ReactNode;
  meta: ReactNode;
  avatar?: ReactNode;
}

export function ReviewFeedCardHeader({ title, mood, meta, avatar = null }: ReviewFeedCardHeaderProps) {
  return (
    <div className="review-card__top review-card__top--feed" data-feed-section="header">
      {avatar ? <div className="review-card__feed-avatar" aria-hidden="true">{avatar}</div> : null}
      <div className="review-card__title-block review-card__title-block--feed">
        <div className="review-card__title-row">
          {title}
          <span className="review-card__mood-inline">{mood}</span>
        </div>
        <p className="review-card__feed-meta">{meta}</p>
      </div>
    </div>
  );
}
