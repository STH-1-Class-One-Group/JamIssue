/*
 * File: EventTabTourismSection.tsx
 * Purpose: Render the KTO tourism segment inside the existing Event tab.
 * Primary Responsibility: Own tourism filters, local loading state, and KTO place cards.
 * Design Intent: Keep KTO tourism UI separate from festival cards and curated map places while consuming only Worker public API.
 * Non-Goals: This file does not navigate the map, call Supabase, call KTO/OpenAPI, or trigger import/sync operations.
 * Dependencies: React state/effect hooks, tourism API client, and public tourism response types.
 */
import { useEffect, useState } from 'react';
import { getTourismPlaces } from '../api/client';
import type { TourismPlacesResponse, TourismPlaceItem } from '../tourismTypes';

interface TourismFilters {
  district: string | null;
  ktoContentTypeId: string | null;
  ktoFacet: string | null;
}

const emptyTourismResponse: TourismPlacesResponse = {
  sourceReady: false,
  sourceName: null,
  importedAt: null,
  facets: { contentTypes: [], ktoFacets: [], districts: [] },
  items: [],
};

function primaryTourismAddress(place: TourismPlaceItem) {
  return place.roadAddress || place.address || place.district || '주소 정보가 아직 없어요';
}

function secondaryTourismMeta(place: TourismPlaceItem) {
  return [place.ktoContentTypeLabel, place.ktoCategoryLabel3, place.ktoFacet].filter(Boolean).join(' · ');
}

function useTourismPlaces(active: boolean, filters: TourismFilters) {
  const [tourism, setTourism] = useState<TourismPlacesResponse>(emptyTourismResponse);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!active) {
      return;
    }
    let cancelled = false;
    setStatus('loading');
    getTourismPlaces(filters)
      .then((response) => {
        if (!cancelled) {
          setTourism(response);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTourism(emptyTourismResponse);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [active, filters.district, filters.ktoContentTypeId, filters.ktoFacet]);

  return { tourism, status };
}

export function EventTabTourismSection({ active }: { active: boolean }) {
  const [filters, setFilters] = useState<TourismFilters>({ district: null, ktoContentTypeId: null, ktoFacet: null });
  const { tourism, status } = useTourismPlaces(active, filters);

  const setFilter = (key: keyof TourismFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: current[key] === value ? null : value,
    }));
  };

  return (
    <section className="sheet-card stack-gap">
      <div className="section-title-row section-title-row--tight">
        <div>
          <p className="eyebrow">KTO TOURISM PLACES</p>
          <h3>관광장소</h3>
        </div>
        <span className="counter-pill">{tourism.items.length}개</span>
      </div>

      <div className="tourism-filter-panel" aria-label="관광장소 필터">
        <FacetRow
          label="지역"
          items={tourism.facets.districts.map((item) => ({ key: item.name, label: item.name, count: item.count }))}
          selected={filters.district}
          onSelect={(value) => setFilter('district', value)}
        />
        <FacetRow
          label="유형"
          items={tourism.facets.contentTypes.map((item) => ({ key: item.id, label: item.label || item.id, count: item.count }))}
          selected={filters.ktoContentTypeId}
          onSelect={(value) => setFilter('ktoContentTypeId', value)}
        />
        <FacetRow
          label="테마"
          items={tourism.facets.ktoFacets.map((item) => ({ key: item.key, label: item.label || item.key, count: item.count }))}
          selected={filters.ktoFacet}
          onSelect={(value) => setFilter('ktoFacet', value)}
        />
      </div>

      {status === 'loading' ? <p className="empty-copy">관광장소를 불러오는 중이에요.</p> : null}
      {status === 'error' ? <p className="empty-copy">관광장소 정보를 불러오지 못했어요.</p> : null}
      {status !== 'loading' && status !== 'error' && tourism.items.length === 0 ? <p className="empty-copy">표시할 관광장소가 아직 없어요.</p> : null}

      {tourism.items.length > 0 ? (
        <div className="community-route-list festival-card-list tourism-card-list">
          {tourism.items.map((place) => (
            <TourismCard key={place.id} place={place} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FacetRow({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: Array<{ key: string; label: string; count: number }>;
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="tourism-filter-row">
      <span className="tourism-filter-row__label">{label}</span>
      <div className="chip-row tourism-filter-row__chips">
        {items.map((item) => (
          <button key={item.key} type="button" className={`chip ${selected === item.key ? 'is-active' : ''}`} onClick={() => onSelect(item.key)}>
            {item.label} {item.count}
          </button>
        ))}
      </div>
    </div>
  );
}

function TourismCard({ place }: { place: TourismPlaceItem }) {
  const secondaryMeta = secondaryTourismMeta(place);
  return (
    <article className="community-route-card community-route-card--curated festival-card tourism-card">
      <div className="festival-card__content">
        <div className="festival-card__meta-row">
          <span className="festival-card__date">{place.district}</span>
          {place.isCurated ? <span className="soft-tag festival-card__status-chip">지도 연결</span> : null}
        </div>

        <h4 className="festival-card__title">{place.name}</h4>
        <p className="festival-card__location-primary">{primaryTourismAddress(place)}</p>
        {secondaryMeta ? <p className="festival-card__location-secondary">{secondaryMeta}</p> : null}
        {place.summary ? <p className="tourism-card__summary">{place.summary}</p> : null}
        {place.curatedPlace ? <p className="tourism-card__curated">연결된 지도 장소: {place.curatedPlace.name}</p> : null}
      </div>

      {place.sourcePageUrl ? (
        <div className="festival-card__footer">
          <a className="festival-card__link" href={place.sourcePageUrl} target="_blank" rel="noreferrer">
            출처 보기
          </a>
        </div>
      ) : null}
    </article>
  );
}
