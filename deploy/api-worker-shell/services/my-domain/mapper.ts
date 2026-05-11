import { formatDateTime } from '../../lib/dates';
import type { WorkerMyCommentRow, WorkerMyFeedInput, WorkerMyFeedRow, WorkerMyPlaceMap } from './contracts';

export function mapMyComments(
  commentRows: WorkerMyCommentRow[],
  feedRows: WorkerMyFeedInput,
  placesByPositionId: WorkerMyPlaceMap,
) {
  const isDeletedCommentRow = (row: WorkerMyCommentRow) => {
    const body = String(row?.body ?? '').trim();
    return Boolean(row?.is_deleted) || body === '[deleted]' || body === '삭제된 댓글입니다.';
  };
  const feedById =
    feedRows instanceof Map
      ? feedRows
      : new Map<string, WorkerMyFeedRow>((feedRows ?? []).map((row) => [String(row.feed_id ?? row.id), row]));
  return commentRows
    .filter((row) => !isDeletedCommentRow(row))
    .map((row) => {
      const feed = feedById.get(String(row.feed_id));
      const place = feed && feed.position_id ? placesByPositionId.get(String(feed.position_id)) : feed?.placeId ? { id: feed.placeId, name: feed.placeName ?? '장소 정보 없음' } : null;
      return {
        id: String(row.comment_id),
        reviewId: String(row.feed_id),
        placeId: place?.id ?? String(feed?.position_id ?? feed?.placeId ?? ''),
        placeName: place?.name ?? '장소 정보 없음',
        body: row.body,
        isDeleted: false,
        parentId: row.parent_id ? String(row.parent_id) : null,
        createdAt: formatDateTime(row.created_at),
        reviewBody: feed?.body ?? '',
      };
    });
}
