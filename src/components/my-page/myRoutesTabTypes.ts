import type { CourseMood, MyPageResponse } from '../../types';

export const routeMoodOptions: CourseMood[] = ['데이트', '사진', '힐링', '비 오는 날'];

export interface DraftState {
  title: string;
  description: string;
  mood: string;
}

export type TravelSession = NonNullable<MyPageResponse>['travelSessions'][number];
export type UserRoute = NonNullable<MyPageResponse>['routes'][number];

export interface MyRoutesTabSectionProps {
  travelSessions: TravelSession[];
  routes: UserRoute[];
  routeSubmitting: boolean;
  routeError: string | null;
  onOpenPlace: (placeId: string) => void;
  onOpenRoute: (routeId: string) => Promise<void>;
  onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => Promise<void>;
}

export function buildDefaultDraft(session: TravelSession): DraftState {
  const firstPlaceName = session.placeNames[0] ?? '하루 코스';
  const lastPlaceName = session.placeNames[session.placeNames.length - 1] ?? firstPlaceName;
  return {
    title: `${firstPlaceName}에서 ${lastPlaceName}까지`,
    description: `${session.placeNames.join(' - ')} 순서로 24시간 안에 이어진 실제 방문 기록이에요.`,
    mood: '데이트',
  };
}
