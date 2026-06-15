/*
 * File: TourismInfoSheet.tsx
 * Purpose: Present non-curated KTO tourism place information from the map layer.
 * Primary Responsibility: Render user-facing KTO list/detail fields inside a read-only map bottom sheet.
 * Design Intent: Prefer useful consumer information from the Worker detail API and hide provider/internal metadata.
 * Non-Goals: This component does not allow stamping, review creation, direct KTO/OpenAPI calls, or external source-page validation.
 * Dependencies: TourismPlaceItem/TourismPlaceDetailItem DTOs, tourism taxonomy helpers, and MapBottomSheet.
 */
import { getTourismDisplayGroupLabel } from '../lib/tourismTaxonomy';
import type { TourismDetailSection, TourismPlaceDetailItem, TourismPlaceItem } from '../tourismTypes';
import type { DrawerState } from '../types/core';
import { MapBottomSheet } from './map-stage/MapBottomSheet';
import type { MapSheetState } from './map-stage/mapSheetState';

export type TourismInfoSheetState = 'partial' | 'full';

interface TourismInfoSheetProps {
  place: TourismPlaceItem | null;
  detail: TourismPlaceDetailItem | null;
  detailLoading: boolean;
  detailError: string | null;
  isOpen: boolean;
  sheetState: TourismInfoSheetState;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

const SECTION_TITLE_LABELS: Record<string, string> = {
  Usage: '이용정보',
  Menu: '메뉴',
  'Restaurant info': '음식점 정보',
  Lodging: '숙박 정보',
  Attraction: '관광 정보',
  Culture: '문화시설 정보',
  Leports: '레포츠 정보',
  Shopping: '쇼핑 정보',
};

const ITEM_LABELS: Record<string, string> = {
  Hours: '영업시간',
  'Closed days': '휴무일',
  Parking: '주차',
  'Main menu': '대표메뉴',
  Menu: '메뉴',
  Smoking: '흡연',
  Contact: '문의',
  Reservation: '예약',
  Packing: '포장',
};

function getTourismPlaceTitle(place: TourismPlaceItem) {
  return place.name || place.title || '관광정보';
}

function getTourismPlaceAddress(place: TourismPlaceItem) {
  return place.roadAddress || place.address || null;
}

function getTourismPlaceCategoryLabel(place: TourismPlaceItem) {
  return getTourismDisplayGroupLabel(place);
}

function isGenericKtoSummary(placeName: string, value: string | null | undefined) {
  if (!value) {
    return true;
  }
  return value.trim() === `${placeName} KTO TourAPI 대전 관광 정보`;
}

function getUsefulOverview(place: TourismPlaceItem, detail: TourismPlaceDetailItem | null) {
  const title = getTourismPlaceTitle(place);
  const overview = detail?.overview?.trim();
  if (overview && !isGenericKtoSummary(title, overview)) {
    return overview;
  }
  const summary = place.summary?.trim();
  if (summary && !isGenericKtoSummary(title, summary)) {
    return summary;
  }
  return null;
}

function getImageUrl(place: TourismPlaceItem, detail: TourismPlaceDetailItem | null) {
  return detail?.images.find((image) => image.url)?.url || place.imageUrl;
}

function normalizeDetailValue(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function translateSectionTitle(title: string) {
  return SECTION_TITLE_LABELS[title] ?? title;
}

function translateItemLabel(label: string) {
  return ITEM_LABELS[label] ?? label;
}

function getVisibleSections(sections: TourismDetailSection[]) {
  return sections
    .map((section) => ({
      title: translateSectionTitle(section.title),
      items: section.items
        .map((item) => ({
          label: translateItemLabel(item.label),
          value: normalizeDetailValue(item.value),
        }))
        .filter((item) => item.value.length > 0),
    }))
    .filter((section) => section.items.length > 0);
}

function renderMultilineValue(value: string) {
  return value.split('\n').map((line) => (
    <span key={line} className="tourism-info-sheet__line">
      {line}
    </span>
  ));
}

export function TourismInfoSheet({
  place,
  detail,
  detailLoading,
  detailError,
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
  const overview = getUsefulOverview(place, detail);
  const imageUrl = getImageUrl(place, detail);
  const sections = getVisibleSections(detail?.displaySections ?? []);
  const contact = detail?.contact?.trim() || null;
  const officialLabel = place.officialCategoryLabel || place.ktoContentTypeLabel || null;

  return (
    <MapBottomSheet
      ariaLabel="관광정보 시트"
      drawerState={drawerState}
      sheetState={mapSheetState}
      onCollapse={onCollapse}
      onExpand={onExpand}
    >
      {imageUrl ? (
        <figure className="tourism-info-sheet__media">
          <img src={imageUrl} alt={`${title} 관광정보 이미지`} loading="lazy" />
        </figure>
      ) : null}

      <div className="place-drawer__header">
        <div>
          <p className="eyebrow">KTO INFO</p>
          <h2>{title}</h2>
          {overview ? <p className="place-drawer__summary">{overview}</p> : null}
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="place-drawer__badges">
        {categoryLabel ? <span className="counter-pill">{categoryLabel}</span> : null}
        {place.district ? <span className="counter-pill">{place.district}</span> : null}
        {detail?.hasDetail || place.hasDetail ? <span className="counter-pill">상세정보</span> : null}
      </div>

      <div className="sheet-card stack-gap">
        <div>
          <strong>위치</strong>
          <p>{address || '주소 정보가 아직 제공되지 않았어요.'}</p>
        </div>
        {contact ? (
          <div>
            <strong>문의</strong>
            <p>{contact}</p>
          </div>
        ) : null}
        {detailLoading ? <p className="section-copy">상세 정보를 불러오는 중입니다.</p> : null}
        {detailError ? <p className="section-copy">{detailError}</p> : null}
        {sections.map((section) => (
          <div key={section.title}>
            <strong>{section.title}</strong>
            <dl className="tourism-info-sheet__detail-list">
              {section.items.map((item) => (
                <div key={`${section.title}-${item.label}`} className="tourism-info-sheet__detail-row">
                  <dt>{item.label}</dt>
                  <dd>{renderMultilineValue(item.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <div>
          <strong>출처</strong>
          <p>{detail?.sourceName || place.sourceName || 'KTO 관광정보'}</p>
          {officialLabel ? <p className="section-copy">공식 분류: {officialLabel}</p> : null}
        </div>
      </div>
    </MapBottomSheet>
  );
}
