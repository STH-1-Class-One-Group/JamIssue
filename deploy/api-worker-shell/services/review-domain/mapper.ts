import { formatDateTime } from '../../lib/dates';

export function createReviewMapper(formatVisitLabel: (visitNumber: unknown) => string) {
  function countComments(comments: any[]): number {
    let total = 0;
    for (const comment of comments) {
      total += 1 + countComments(comment.replies);
    }
    return total;
  }

  function buildCommentTree(commentRows: any[], usersById: Map<any, any>) {
    const isDeletedCommentRow = (row: any) => {
      const body = String(row?.body ?? '').trim();
      return Boolean(row?.is_deleted) || body === '[deleted]' || body === '삭제된 댓글입니다.';
    };
    const commentsById = new Map<string, any>();
    const rowsById = new Map<string, any>(commentRows.map((row) => [String(row.comment_id), row]));
    const roots: any[] = [];
    for (const row of commentRows) {
      const comment = {
        id: String(row.comment_id),
        userId: row.user_id,
        author: usersById.get(row.user_id)?.nickname ?? '이름 없음',
        body: isDeletedCommentRow(row) ? '삭제된 댓글입니다.' : row.body,
        parentId: row.parent_id ? String(row.parent_id) : null,
        isDeleted: isDeletedCommentRow(row),
        createdAt: formatDateTime(row.created_at),
        replies: [],
      };
      commentsById.set(comment.id, comment);
    }
    for (const comment of commentsById.values()) {
      const parentRow = comment.parentId ? rowsById.get(comment.parentId) : null;
      const rootParentId = parentRow ? String(parentRow.parent_id ?? parentRow.comment_id) : null;
      if (rootParentId && commentsById.has(rootParentId)) {
        commentsById.get(rootParentId).replies.push(comment);
      } else {
        roots.push(comment);
      }
    }

    const hasLiveDescendant = (node: any): boolean => node.replies.some((reply: any) => !reply.isDeleted || hasLiveDescendant(reply));
    const collapseDeletedNodes = (nodes: any[]) =>
      nodes.reduce((acc: any[], node: any) => {
        const nextNode = { ...node, replies: collapseDeletedNodes(node.replies) };
        if (nextNode.isDeleted) {
          if (hasLiveDescendant(nextNode)) {
            acc.push(nextNode);
          }
          return acc;
        }
        acc.push(nextNode);
        return acc;
      }, []);
    return collapseDeletedNodes(roots);
  }

  function mapReviewRows(
    feedRows: any[],
    commentRows: any[],
    likeRows: any[],
    usersById: Map<any, any>,
    placesByPositionId: Map<any, any>,
    stampRowsById: Map<any, any>,
    routeRows: any[] = [],
    likedFeedIds = new Set<any>(),
  ) {
    const commentsByFeedId = new Map();
    for (const row of commentRows) {
      const feedId = String(row.feed_id);
      if (!commentsByFeedId.has(feedId)) {
        commentsByFeedId.set(feedId, []);
      }
      commentsByFeedId.get(feedId).push(row);
    }
    const likesByFeedId = new Map();
    for (const row of likeRows) {
      const feedId = String(row.feed_id);
      likesByFeedId.set(feedId, (likesByFeedId.get(feedId) ?? 0) + 1);
    }
    const publishedRouteIdBySession = new Map(
      routeRows.filter((row) => row.travel_session_id).map((row) => [String(row.travel_session_id), String(row.route_id)]),
    );
    return feedRows.map((row) => {
      const place = placesByPositionId.get(String(row.position_id));
      const stamp = row.stamp_id ? stampRowsById.get(String(row.stamp_id)) : null;
      const reviewComments = buildCommentTree(commentsByFeedId.get(String(row.feed_id)) ?? [], usersById);
      const visitNumber = stamp?.visit_ordinal ?? 1;
      const travelSessionId = stamp?.travel_session_id ? String(stamp.travel_session_id) : null;
      return {
        id: String(row.feed_id),
        userId: row.user_id,
        placeId: place?.id ?? String(row.position_id),
        placeName: place?.name ?? '장소 정보 없음',
        author: usersById.get(row.user_id)?.nickname ?? '이름 없음',
        body: row.body,
        mood: row.mood,
        badge: row.badge,
        visitedAt: formatDateTime(row.created_at),
        imageUrl: row.image_url ?? null,
        commentCount: countComments(reviewComments),
        likeCount: likesByFeedId.get(String(row.feed_id)) ?? 0,
        likedByMe: likedFeedIds.has(String(row.feed_id)),
        stampId: row.stamp_id ? String(row.stamp_id) : null,
        visitNumber,
        visitLabel: formatVisitLabel(visitNumber),
        travelSessionId,
        hasPublishedRoute: travelSessionId ? publishedRouteIdBySession.has(travelSessionId) : false,
        comments: reviewComments,
      };
    });
  }

  return { buildCommentTree, countComments, mapReviewRows };
}
