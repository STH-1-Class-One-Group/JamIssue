/*
 * File: TourismInfoSheet.tsx
 * Purpose: Present non-curated KTO tourism place information from the map layer.
 * Primary Responsibility: Render user-facing KTO list/detail fields inside the shared map bottom sheet.
 * Design Intent: Use the same drawer shell and card rhythm as curated places while hiding provider/internal metadata.
 * Non-Goals: This component does not allow stamping, review creation, direct KTO/OpenAPI calls, or external source-page validation.
 * Dependencies: TourismPlaceItem/TourismPlaceDetailItem DTOs, tourism taxonomy helpers, and MapBottomSheet.
 */
import { getTourismDisplayGroupLabel } from '../lib/tourismTaxonomy';
import type { TourismDetailSection, TourismPlaceDetailItem, TourismPlaceItem } from '../tourismTypes';
import type { DrawerState } from '../types/core';
import { MapBottomSheet } from './map-stage/MapBottomSheet';
import type { MapSheetState } from './map-stage/mapSheetState';

export type TourismInfoSheetState = Exclude<DrawerState, 'closed'>;

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
  Fee: '요금',
  'Main menu': '대표 메뉴',
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
  // Use a single nested for...of loop instead of .map().filter() chains
  // to avoid creating multiple intermediate arrays.
  const visibleSections: { title: string; items: { label: string; value: string }[] }[] = [];

  for (const section of sections) {
    const visibleItems: { label: string; value: string }[] = [];

    for (const item of section.items) {
      const normalizedValue = normalizeDetailValue(item.value);
      if (normalizedValue.length > 0) {
        visibleItems.push({
          label: translateItemLabel(item.label),
          value: normalizedValue,
        });
      }
    }

    if (visibleItems.length > 0) {
      visibleSections.push({
        title: translateSectionTitle(section.title),
        items: visibleItems,
      });
    }
  }

  return visibleSections;
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

  const drawerState: DrawerState = sheetState;
  const mapSheetState: MapSheetState = sheetState;
  const title = getTourismPlaceTitle(place);
  const address = getTourismPlaceAddress(place);
  const categoryLabel = getTourismDisplayGroupLabel(place);
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
      onClose={onClose}
      onCollapse={onCollapse}
      onExpand={onExpand}
      media={imageUrl ? (
        <img src={imageUrl} alt={title} className="map-bottom-sheet__media-image" loading="lazy" />
      ) : null}
    >

      <div className="place-drawer__header tourism-info-sheet__intro">
        <div>
          <p className="eyebrow">KTO INFO</p>
          <h2>{title}</h2>
          {overview ? <p className="place-drawer__summary">{overview}</p> : null}
        </div>
      </div>

      <div className="place-drawer__badges">
        {categoryLabel ? <span className="counter-pill">{categoryLabel}</span> : null}
        {place.district ? <span className="counter-pill">{place.district}</span> : null}
        {detail?.hasDetail || place.hasDetail ? <span className="counter-pill">상세정보</span> : null}
      </div>

      <section className="sheet-card tourism-info-sheet__section" aria-label="관광지 기본 정보">
        <dl className="tourism-info-sheet__detail-list">
          <div className="tourism-info-sheet__detail-row">
            <dt>위치</dt>
            <dd>{address || '주소 정보가 아직 제공되지 않았어요.'}</dd>
          </div>
          {contact ? (
            <div className="tourism-info-sheet__detail-row">
              <dt>문의</dt>
              <dd>{contact}</dd>
            </div>
          ) : null}
        </dl>
        {detailLoading ? <p className="section-copy">상세 정보를 불러오는 중입니다.</p> : null}
        {detailError ? <p className="section-copy">{detailError}</p> : null}
      </section>

      {sections.map((section) => (
        <section key={section.title} className="sheet-card tourism-info-sheet__section" aria-label={section.title}>
          <h3>{section.title}</h3>
          <dl className="tourism-info-sheet__detail-list">
            {section.items.map((item) => (
              <div key={`${section.title}-${item.label}`} className="tourism-info-sheet__detail-row">
                <dt>{item.label}</dt>
                <dd>{renderMultilineValue(item.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="sheet-card tourism-info-sheet__section" aria-label="관광정보 출처">
        <dl className="tourism-info-sheet__detail-list">
          <div className="tourism-info-sheet__detail-row">
            <dt>출처</dt>
            <dd>{detail?.sourceName || place.sourceName || 'KTO 관광정보'}</dd>
          </div>
        </dl>
        {officialLabel ? (
          <p className="section-copy">공식 분류: {officialLabel}</p>
        ) : null}
      </section>
    </MapBottomSheet>
  );
}
