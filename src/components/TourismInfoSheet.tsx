/*
 * File: TourismInfoSheet.tsx
 * Purpose: Present non-curated KTO tourism place information from the map layer.
 * Primary Responsibility: Render a read-only information sheet without stamp, review, or feed actions.
 * Design Intent: Reuse the shared map bottom-sheet shell while keeping tourism info separate from curated place interactions.
 * Non-Goals: This component does not allow stamping, review creation, or direct KTO/OpenAPI calls.
 * Dependencies: TourismPlaceItem DTO and MapBottomSheet.
 */
import type { TourismPlaceItem } from '../tourismTypes';
import type { DrawerState } from '../types/core';
import { MapBottomSheet } from './map-stage/MapBottomSheet';
import type { MapSheetState } from './map-stage/mapSheetState';

export type TourismInfoSheetState = 'partial' | 'full';

interface TourismInfoSheetProps {
  place: TourismPlaceItem | null;
  isOpen: boolean;
  sheetState: TourismInfoSheetState;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

function getTourismPlaceTitle(place: TourismPlaceItem) {
  return place.name || place.title || '관광정보';
}

function getTourismPlaceAddress(place: TourismPlaceItem) {
  return place.address || place.roadAddress || null;
}

function getTourismPlaceCategoryLabel(place: TourismPlaceItem) {
  return place.ktoContentTypeLabel || place.category || place.ktoFacet || null;
}

function getTourismPlaceSourceUrl(place: TourismPlaceItem) {
  return place.sourcePageUrl || place.homepageUrl || null;
}

export function TourismInfoSheet({
  place,
  isOpen,
  sheetState,
  onClose,
  onExpand,
  onCollapse,
}: TourismInfoSheetProps) {
  if (!place || !isOpen) {
    return null;
  }

  const drawerState: DrawerState = sheetState === 'full' ? 'full' : 'partial';
  const mapSheetState: MapSheetState = sheetState === 'full' ? 'full' : 'peek';
  const title = getTourismPlaceTitle(place);
  const address = getTourismPlaceAddress(place);
  const categoryLabel = getTourismPlaceCategoryLabel(place);
  const sourceUrl = getTourismPlaceSourceUrl(place);
  const primaryDescription = place.description && place.description !== place.summary ? place.description : null;
  const summary = place.summary || primaryDescription || '관광지 기본 정보를 확인할 수 있어요.';

  return (
    <MapBottomSheet
      ariaLabel="관광정보 시트"
      drawerState={drawerState}
      sheetState={mapSheetState}
      onCollapse={onCollapse}
      onExpand={onExpand}
    >
      {place.imageUrl ? (
        <figure className="tourism-info-sheet__media">
          <img src={place.imageUrl} alt={`${title} 관광정보 이미지`} loading="lazy" />
        </figure>
      ) : null}

      <div className="place-drawer__header">
        <div>
          <p className="eyebrow">KTO INFO</p>
          <h2>{title}</h2>
          <p className="place-drawer__summary">{summary}</p>
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="place-drawer__badges">
        {categoryLabel ? <span className="counter-pill">{categoryLabel}</span> : null}
        {place.district ? <span className="counter-pill">{place.district}</span> : null}
      </div>

      <div className="sheet-card stack-gap">
        {primaryDescription ? (
          <div>
            <strong>소개</strong>
            <p>{primaryDescription}</p>
          </div>
        ) : null}
        <div>
          <strong>위치</strong>
          <p>{address || '주소 정보가 아직 제공되지 않았어요.'}</p>
        </div>
        <div>
          <strong>출처</strong>
          <p>{place.sourceName || 'KTO 관광정보'}</p>
        </div>
        {sourceUrl ? (
          <a className="primary-button primary-button--block" href={sourceUrl} target="_blank" rel="noreferrer">
            자세히 보기
          </a>
        ) : null}
      </div>
    </MapBottomSheet>
  );
}
