/*
 * File: TourismInfoSheet.tsx
 * Purpose: Present non-curated KTO tourism place information from the map layer.
 * Primary Responsibility: Render a read-only information sheet without stamp, review, or feed actions.
 * Design Intent: Reuse the existing map sheet visual language while keeping tourism info separate from curated place interactions.
 * Non-Goals: This component does not allow stamping, review creation, or direct KTO/OpenAPI calls.
 * Dependencies: TourismPlaceItem DTO and map sheet state class helper.
 */
import type { TourismPlaceItem } from '../tourismTypes';
import type { DrawerState } from '../types/core';
import { buildMapSheetClassName } from './map-stage/mapSheetState';
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
  const sheetClassName = buildMapSheetClassName('place-drawer', mapSheetState, drawerState);

  return (
    <section className={sheetClassName} data-map-sheet-state={mapSheetState} aria-label="관광정보 시트">
      <button
        type="button"
        className="place-drawer__handle"
        aria-label="시트 높이 조절"
        onClick={sheetState === 'partial' ? onExpand : onCollapse}
      >
        <span />
      </button>

      <div className="place-drawer__content">
        <div className="place-drawer__header">
          <div>
            <p className="eyebrow">KTO INFO</p>
            <h2>{place.title}</h2>
            <p className="place-drawer__summary">{place.summary || place.description || '관광지 기본 정보를 확인할 수 있어요.'}</p>
          </div>
          <button type="button" className="text-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="place-drawer__badges">
          {place.category ? <span className="counter-pill">{place.category}</span> : null}
          {place.district ? <span className="counter-pill">{place.district}</span> : null}
        </div>

        <div className="sheet-card stack-gap">
          <div>
            <strong>주소</strong>
            <p>{place.address || '주소 정보가 아직 제공되지 않았어요.'}</p>
          </div>
          <div>
            <strong>출처</strong>
            <p>{place.sourceName || 'KTO 관광정보'}</p>
          </div>
          {place.homepageUrl ? (
            <a className="primary-button primary-button--block" href={place.homepageUrl} target="_blank" rel="noreferrer">
              자세히 보기
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
