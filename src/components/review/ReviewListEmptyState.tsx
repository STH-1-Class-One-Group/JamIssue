import { EmptyState } from '../ui-kit';

interface ReviewListEmptyStateProps {
  emptyTitle: string;
  emptyBody: string;
}

export function ReviewListEmptyState({ emptyTitle, emptyBody }: ReviewListEmptyStateProps) {
  return <EmptyState className="review-list-empty-state" title={emptyTitle} description={emptyBody} />;
}
