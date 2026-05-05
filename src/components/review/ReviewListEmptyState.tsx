import { memo } from 'react';

interface ReviewListEmptyStateProps {
  emptyTitle: string;
  emptyBody: string;
}

// Optimizes performance by preventing unnecessary re-renders when parent state updates but empty state props don't change
export const ReviewListEmptyState = memo(function ReviewListEmptyState({ emptyTitle, emptyBody }: ReviewListEmptyStateProps) {
  return (
    <section className="sheet-card stack-gap">
      <strong>{emptyTitle}</strong>
      <p className="section-copy">{emptyBody}</p>
    </section>
  );
});
