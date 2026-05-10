import type { CommunityRouteSort, Course } from '../../types/core';
import type { SessionUser } from '../../types/auth';
import type { UserRoute } from '../../types/review';

export interface RoutePreviewPayload {
  id: string;
  title: string;
  subtitle: string;
  mood: string;
  placeIds: string[];
  placeNames: string[];
}

export interface CourseTabProps {
  courses: Course[];
  communityRoutes: UserRoute[];
  sort: CommunityRouteSort;
  sessionUser: SessionUser | null;
  routeLikeUpdatingId: string | null;
  highlightedRouteId: string | null;
  placeNameById: Record<string, string>;
  onChangeSort: (sort: CommunityRouteSort) => void;
  onToggleLike: (routeId: string) => Promise<void>;
  onOpenPlace: (placeId: string) => void;
  onOpenRoutePreview: (route: RoutePreviewPayload) => void;
  onRequestLogin: () => void;
}
