import { categoryInfo, categoryItems } from '../../lib/categories';
import { buildTourismDisplayGroupItems } from '../../lib/tourismTaxonomy';
import type { TourismDisplayGroupFilter, TourismFacetOption } from '../../tourismTypes';
import type { Category } from '../../types/core';

type MapStageCategoryStripProps = {
  activeCategory: Category;
  activeTourismDisplayGroup: TourismDisplayGroupFilter;
  tourismDisplayGroupFacets?: TourismFacetOption[];
  showTourismInfo: boolean;
  onSelectCategory: (category: Category) => void;
  onSelectTourismDisplayGroup: (displayGroup: TourismDisplayGroupFilter) => void;
};

export function MapStageCategoryStrip({
  activeCategory,
  activeTourismDisplayGroup,
  tourismDisplayGroupFacets,
  showTourismInfo,
  onSelectCategory,
  onSelectTourismDisplayGroup,
}: MapStageCategoryStripProps) {
  const tourismDisplayGroups = buildTourismDisplayGroupItems(tourismDisplayGroupFacets);

  return (
    <div className="map-filter-strip">
      <div className="chip-row compact-gap">
        {showTourismInfo ? tourismDisplayGroups.map((item) => {
          const isActive = item.key === activeTourismDisplayGroup;
          return (
            <button
              key={item.key}
              type="button"
              className={isActive ? 'chip is-active map-filter-chip' : 'chip map-filter-chip'}
              onClick={() => onSelectTourismDisplayGroup(item.key)}
            >
              {item.icon ? `${item.icon} ${item.label}` : item.label}
            </button>
          );
        }) : categoryItems.map((item) => {
          const isActive = item.key === activeCategory;
          const info = item.key === 'all' ? null : categoryInfo[item.key];
          return (
            <button
              key={item.key}
              type="button"
              className={isActive ? 'chip is-active map-filter-chip' : 'chip map-filter-chip'}
              onClick={() => onSelectCategory(item.key)}
              style={
                info
                  ? {
                      background: isActive ? info.color : 'rgba(255,255,255,0.94)',
                      borderColor: info.jamColor,
                      color: '#4a3140',
                    }
                  : undefined
              }
            >
              {info ? String(info.icon) + ' ' + item.label : item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
