import { CourseTab } from '../CourseTab';
import type { PageStageCourseViewProps } from './appPageStageTypes';

import { memo } from 'react';

export const PageStageCourseView = memo(function PageStageCourseView({
  sharedData,
  courseData,
  sharedActions,
  courseActions,
}: PageStageCourseViewProps) {
  return (
    <CourseTab
      courses={courseData.courses}
      communityRoutes={courseData.communityRoutes}
      sort={courseData.communityRouteSort}
      sessionUser={sharedData.sessionUser}
      routeLikeUpdatingId={courseData.routeLikeUpdatingId}
      highlightedRouteId={courseData.highlightedRouteId}
      placeNameById={sharedData.placeNameById}
      onChangeSort={courseActions.onChangeRouteSort}
      onToggleLike={courseActions.onToggleRouteLike}
      onOpenPlace={sharedActions.onOpenPlace}
      onOpenRoutePreview={courseActions.onOpenRoutePreview}
      onRequestLogin={sharedActions.onRequestLogin}
    />
  );
});
