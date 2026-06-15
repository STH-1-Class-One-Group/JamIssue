import { useEffect, useRef, useState } from 'react';
import type { TourismDisplayGroupFilter, TourismFacets, TourismPlaceItem } from '../../tourismTypes';
import type { Category } from '../../types/core';
import { categoryInfo, categoryItems } from '../../lib/categories';
import { buildTourismDisplayGroupItems } from '../../lib/tourismTaxonomy';
import { GlobalSettingsMenu, type GlobalSettingsMenuProps } from '../GlobalSettingsMenu';

type FloatingFilterItem = {
  key: string;
  label: string;
  icon?: string;
};

export interface MapFloatingNavProps {
  activeCategory: Category;
  activeTourismDisplayGroup: TourismDisplayGroupFilter;
  showTourismInfo: boolean;
  tourismFacets: TourismFacets | null;
  tourismPlaces: TourismPlaceItem[];
  tourismSourceReady: boolean;
  tourismLoading: boolean;
  tourismError: string | null;
  globalUtility: GlobalSettingsMenuProps;
  onSelectCategory: (category: Category) => void;
  onSelectTourismDisplayGroup: (displayGroup: TourismDisplayGroupFilter) => void;
  onToggleTourismInfo: () => void;
}

export function MapFloatingNav({
  activeCategory,
  activeTourismDisplayGroup,
  showTourismInfo,
  tourismFacets,
  tourismPlaces,
  tourismSourceReady,
  tourismLoading,
  tourismError,
  globalUtility,
  onSelectCategory,
  onSelectTourismDisplayGroup,
  onToggleTourismInfo,
}: MapFloatingNavProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const categoryOptions = showTourismInfo
    ? buildTourismDisplayGroupItems(tourismFacets?.displayGroups)
    : categoryItems;
  const selectedFilter = categoryOptions.find((item) => (
    showTourismInfo ? item.key === activeTourismDisplayGroup : item.key === activeCategory
  )) ?? categoryOptions[0];
  const isTourismInitialPending =
    showTourismInfo &&
    !tourismSourceReady &&
    tourismPlaces.length === 0 &&
    !tourismError;
  const shouldShowTourismLoading = tourismLoading || isTourismInitialPending;

  useEffect(() => {
    if (!filterOpen) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [filterOpen]);

  const renderFilterLabel = (item: FloatingFilterItem | undefined) => (
    <>
      <span className="map-floating-nav__filter-icon" aria-hidden="true">
        {item?.icon ?? '✨'}
      </span>
      <span className="map-floating-nav__filter-label">{item?.label ?? '전체'}</span>
      <span className="map-floating-nav__filter-caret" aria-hidden="true">⌄</span>
    </>
  );

  return (
    <div className="map-floating-nav" data-map-floating-nav="root">
      <button type="button" className="map-floating-nav__icon-btn" aria-label="메뉴" aria-disabled="true">
        <span aria-hidden="true">☰</span>
      </button>

      <div className="map-floating-nav__filter" ref={filterRef}>
        <button
          type="button"
          className="map-floating-nav__filter-btn"
          data-map-filter-trigger="true"
          aria-expanded={filterOpen}
          aria-haspopup="menu"
          aria-label={`${selectedFilter?.label ?? '전체'} 필터 열기`}
          onClick={() => setFilterOpen((current) => !current)}
        >
          {renderFilterLabel(selectedFilter)}
        </button>

        {filterOpen && (
          <div className="map-floating-nav__dropdown" role="menu">
            {categoryOptions.map((item) => {
              const isActive = showTourismInfo
                ? item.key === activeTourismDisplayGroup
                : item.key === activeCategory;
              const style = !showTourismInfo && item.key !== 'all'
                ? {
                    background: isActive ? categoryInfo[item.key as keyof typeof categoryInfo].color : undefined,
                  }
                : undefined;

              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  data-map-filter-key={item.key}
                  className={isActive ? 'map-floating-nav__dropdown-item is-active' : 'map-floating-nav__dropdown-item'}
                  style={style}
                  onClick={() => {
                    if (showTourismInfo) {
                      onSelectTourismDisplayGroup(item.key as TourismDisplayGroupFilter);
                    } else {
                      onSelectCategory(item.key as Category);
                    }
                    setFilterOpen(false);
                  }}
                >
                  <span className="map-floating-nav__dropdown-icon" aria-hidden="true">
                    {item.icon ?? '✨'}
                  </span>
                  <span className="map-floating-nav__dropdown-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className={showTourismInfo ? 'tourism-toggle-chip is-active' : 'tourism-toggle-chip'}
        data-tourism-toggle="map"
        aria-busy={shouldShowTourismLoading || undefined}
        aria-pressed={showTourismInfo}
        onClick={onToggleTourismInfo}
      >
        관광정보
      </button>
      {showTourismInfo && shouldShowTourismLoading ? (
        <span className="map-floating-nav__status" data-tourism-load-status="initial" role="status">
          확인 중
        </span>
      ) : null}
      {showTourismInfo && tourismError ? (
        <span className="map-floating-nav__status is-error" role="alert">
          {tourismError}
        </span>
      ) : null}
      <GlobalSettingsMenu {...globalUtility} />
    </div>
  );
}
