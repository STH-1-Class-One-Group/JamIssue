/*
 * File: TourismInfoSheet.tsx
 * Purpose: Present non-curated KTO tourism place information from the map layer.
 * Primary Responsibility: Render available KTO consumer-contract fields inside the app as a read-only information sheet.
 * Design Intent: Keep KTO places useful without sending users to unstable external provider detail pages.
 * Non-Goals: This component does not allow stamping, review creation, direct KTO/OpenAPI calls, or external source-page validation.
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

function compactText(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
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

function formatCoordinates(place: TourismPlaceItem) {
  if (typeof place.latitude !== 'number' || typeof place.longitude !== 'number') {
    return null;
  }
  return `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`;
}

function formatSourceUpdatedAt(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

function getCategoryRows(place: TourismPlaceItem) {
  return [
    compactText([place.ktoCategoryLabel1, place.ktoCategoryCode1]).join(' / '),
    compactText([place.ktoCategoryLabel2, place.ktoCategoryCode2]).join(' / '),
    compactText([place.ktoCategoryLabel3, place.ktoCategoryCode3]).join(' / '),
  ].filter(Boolean);
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
  const primaryDescription = place.description && place.description !== place.summary ? place.description : null;
  const summary = place.summary || primaryDescription || '관광지 기본 정보를 확인할 수 있어요.';
  const coordinates = formatCoordinates(place);
  const sourceUpdatedAt = formatSourceUpdatedAt(place.sourceUpdatedAt);
  const categoryRows = getCategoryRows(place);

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
        {place.ktoFacet ? <span className="counter-pill">{place.ktoFacet}</span> : null}
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
          {coordinates ? <p className="section-copy">좌표 {coordinates}</p> : null}
        </div>
        <div>
          <strong>분류</strong>
          <p>
            {compactText([place.ktoContentTypeLabel, place.ktoContentTypeId]).join(' / ') ||
              '분류 정보가 아직 제공되지 않았어요.'}
          </p>
          {categoryRows.length > 0 ? (
            <ul className="tourism-info-sheet__meta-list" aria-label="KTO 내부 분류">
              {categoryRows.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <strong>출처</strong>
          <p>{place.sourceName || 'KTO 관광정보'}</p>
          {sourceUpdatedAt ? <p className="section-copy">업데이트 {sourceUpdatedAt}</p> : null}
          <p className="section-copy">
            외부 원문 페이지가 열리지 않을 수 있어 앱에서 확인 가능한 정보만 표시합니다.
          </p>
        </div>
      </div>
    </MapBottomSheet>
  );
}
