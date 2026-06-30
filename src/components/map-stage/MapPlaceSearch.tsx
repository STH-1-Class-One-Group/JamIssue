import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { searchPlaces, type PlaceSearchResult } from '../../api/placesSearchClient';
import type { Place } from '../../types/core';

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface MapPlaceSearchProps {
  places: Place[];
  onOpenPlace: (placeId: string) => void;
  locationAction?: ReactNode;
  locationStatus?: ReactNode;
}

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 10;

export function MapPlaceSearch({
  places,
  onOpenPlace,
  locationAction,
  locationStatus,
}: MapPlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [message, setMessage] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const requestSeqRef = useRef(0);
  const trimmedQuery = query.trim();
  const placeIds = useMemo(() => new Set(places.map((place) => place.id)), [places]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    const nextSeq = requestSeqRef.current + 1;
    requestSeqRef.current = nextSeq;
    setMessage(null);
    setActiveIndex(-1);

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus('loading');
      void searchPlaces({ q: trimmedQuery, limit: SEARCH_LIMIT }, { signal: controller.signal })
        .then((response) => {
          if (requestSeqRef.current !== nextSeq) {
            return;
          }
          setResults(response.items);
          setStatus('ready');
          setIsOpen(true);
        })
        .catch((error) => {
          if (controller.signal.aborted || requestSeqRef.current !== nextSeq) {
            return;
          }
          setResults([]);
          setStatus('error');
          setMessage(error instanceof Error ? error.message : '장소 검색에 실패했어요.');
          setIsOpen(true);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  const hasResults = results.length > 0;
  const shouldShowPanel = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;

  const selectResult = (result: PlaceSearchResult) => {
    if (!placeIds.has(result.placeId)) {
      setMessage('현재 지도 데이터에서 찾을 수 없어요.');
      setStatus('error');
      setIsOpen(true);
      return;
    }

    setQuery(result.label);
    setIsOpen(false);
    setMessage(null);
    onOpenPlace(result.placeId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!shouldShowPanel || !hasResults) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }
  };

  return (
    <div className="map-place-search" ref={rootRef} data-map-place-search="root">
      <label className="map-place-search__label" htmlFor="map-place-search-input">
        장소 검색
      </label>
      <div className="map-place-search__control">
        <span className="map-place-search__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id="map-place-search-input"
          className="map-place-search__input"
          type="search"
          value={query}
          placeholder="장소를 검색해 보세요"
          autoComplete="off"
          role="combobox"
          aria-expanded={shouldShowPanel}
          aria-controls="map-place-search-results"
          aria-autocomplete="list"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {locationAction ? <div className="map-place-search__location-action">{locationAction}</div> : null}
      </div>
      {locationStatus ? <div className="map-place-search__location-status">{locationStatus}</div> : null}

      {shouldShowPanel ? (
        <div className="map-place-search__popover" id="map-place-search-results" role="listbox">
          {status === 'loading' ? (
            <p className="map-place-search__status" role="status">검색 중</p>
          ) : null}
          {status === 'error' && message ? (
            <p className="map-place-search__status is-error" role="alert">{message}</p>
          ) : null}
          {status === 'ready' && !hasResults ? (
            <p className="map-place-search__status">검색 결과가 없어요.</p>
          ) : null}
          {hasResults ? (
            <ul className="map-place-search__list">
              {results.map((result, index) => (
                <li key={result.placeId}>
                  <button
                    type="button"
                    className={index === activeIndex ? 'map-place-search__result is-active' : 'map-place-search__result'}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectResult(result)}
                  >
                    <span className="map-place-search__result-main">{result.label}</span>
                    <span className="map-place-search__result-sub">{result.subLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
