import { routeMoodOptions } from './myRoutesTabTypes';
import type { DraftState, TravelSession } from './myRoutesTabTypes';

interface MyRouteDraftCardProps {
  session: TravelSession;
  draft: DraftState;
  routeSubmitting: boolean;
  onOpenPlace: (placeId: string) => void;
  onUpdateDraft: (sessionId: string, patch: Partial<DraftState>, fallbackSession: TravelSession) => void;
  onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => Promise<void>;
}

export function MyRouteDraftCard({
  session,
  draft,
  routeSubmitting,
  onOpenPlace,
  onUpdateDraft,
  onPublishRoute,
}: MyRouteDraftCardProps) {
  return (
    <article className="community-route-card community-route-card--draft">
      <div className="community-route-card__header">
        <div>
          <p className="eyebrow">TRAVEL SESSION</p>
          <h4>{session.durationLabel}</h4>
        </div>
        <span className="counter-pill">스탬프 {session.stampCount}개</span>
      </div>
      <div className="course-card__places community-route-places">
        {session.placeIds.map((placeId, index) => (
          <button key={`${session.id}-${placeId}`} type="button" className="soft-tag soft-tag--button course-card__place" onClick={() => onOpenPlace(placeId)}>
            {index + 1}. {session.placeNames[index] ?? placeId}
          </button>
        ))}
      </div>
      <div className="route-builder-form">
        <label className="route-builder-field">
          <span>코스 제목</span>
          <input value={draft.title} onChange={(event) => onUpdateDraft(session.id, { title: event.target.value }, session)} />
        </label>
        <label className="route-builder-field">
          <span>한 줄 설명</span>
          <textarea rows={3} value={draft.description} onChange={(event) => onUpdateDraft(session.id, { description: event.target.value }, session)} />
        </label>
        <div className="chip-row compact-gap">
          {routeMoodOptions.map((mood) => (
            <button key={mood} type="button" className={draft.mood === mood ? 'chip is-active' : 'chip'} onClick={() => onUpdateDraft(session.id, { mood }, session)}>
              {mood}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="primary-button route-submit-button"
          disabled={routeSubmitting || draft.title.trim().length < 2 || draft.description.trim().length < 8}
          onClick={() =>
            void onPublishRoute({
              travelSessionId: session.id,
              title: draft.title.trim(),
              description: draft.description.trim(),
              mood: draft.mood,
            })
          }
        >
          {routeSubmitting ? '발행 중' : '코스로 발행'}
        </button>
      </div>
    </article>
  );
}
