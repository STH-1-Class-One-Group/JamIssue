import { useMemo, useState } from 'react';
import { buildDefaultDraft } from './myRoutesTabTypes';
import type { DraftState, TravelSession } from './myRoutesTabTypes';

export function useMyRouteDraftState(travelSessions: TravelSession[]) {
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const unpublishedSessions = useMemo(
    () => travelSessions.filter((session) => session.canPublish && !session.publishedRouteId),
    [travelSessions],
  );

  function readDraft(session: TravelSession) {
    return drafts[session.id] ?? buildDefaultDraft(session);
  }

  function updateDraft(sessionId: string, patch: Partial<DraftState>, fallbackSession: TravelSession) {
    setDrafts((current) => ({
      ...current,
      [sessionId]: {
        ...buildDefaultDraft(fallbackSession),
        ...(current[sessionId] ?? {}),
        ...patch,
      },
    }));
  }

  return {
    unpublishedSessions,
    readDraft,
    updateDraft,
  };
}
