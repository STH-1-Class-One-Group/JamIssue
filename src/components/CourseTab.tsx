import { memo } from 'react';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { CommunityRouteCard } from './course/CommunityRouteCard';
import { CourseTabHeader } from './course/CourseTabHeader';
import type { CourseTabProps } from './course/courseTabTypes';
import { useHighlightedCourseRoute } from './course/useHighlightedCourseRoute';
import { AppSurface, EmptyState, FilterChip, SectionHeader } from './ui-kit';

export const CourseTab = memo(function CourseTab({
  courses,
  communityRoutes,
  sort,
  sessionUser,
  routeLikeUpdatingId,
  highlightedRouteId,
  placeNameById,
  onChangeSort,
  onToggleLike,
  onOpenPlace,
  onOpenRoutePreview,
  onRequestLogin,
}: CourseTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>('course');
  const routeRefs = useHighlightedCourseRoute(highlightedRouteId);

  void courses;

  return (
    <section ref={scrollRef} className="page-panel page-panel--scrollable" data-page-surface="course">
      <CourseTabHeader />

      <AppSurface variant="section" className="course-list-surface sheet-card stack-gap">
        <SectionHeader
          className="section-title-row section-title-row--tight"
          eyebrow="USER GENERATED"
          title="좋아요순과 최신순으로 보는 공개 경로"
        />
        <div className="chip-row compact-gap course-sort-row" role="group" aria-label="공개 경로 정렬">
          <FilterChip className={sort === 'popular' ? 'is-active' : undefined} selected={sort === 'popular'} onClick={() => onChangeSort('popular')}>
            좋아요순
          </FilterChip>
          <FilterChip className={sort === 'latest' ? 'is-active' : undefined} selected={sort === 'latest'} onClick={() => onChangeSort('latest')}>
            최신순
          </FilterChip>
        </div>
        <div className="community-route-list">
          {communityRoutes.map((route) => (
            <CommunityRouteCard
              key={route.id}
              route={route}
              highlightedRouteId={highlightedRouteId}
              routeLikeUpdatingId={routeLikeUpdatingId}
              sessionUser={sessionUser}
              placeNameById={placeNameById}
              routeRefs={routeRefs}
              onToggleLike={onToggleLike}
              onOpenPlace={onOpenPlace}
              onOpenRoutePreview={onOpenRoutePreview}
              onRequestLogin={onRequestLogin}
            />
          ))}
          {communityRoutes.length === 0 ? <EmptyState className="course-empty-state" title="아직 공개된 사용자 경로가 없어요." /> : null}
        </div>
      </AppSurface>
    </section>
  );
});
