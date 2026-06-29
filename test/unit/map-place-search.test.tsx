import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPlaceSearch } from '../../src/components/map-stage/MapPlaceSearch';
import type { PlaceSearchResult } from '../../src/api/placesSearchClient';
import type { Place } from '../../src/types/core';
import { placeFixture } from '../fixtures/app-fixtures';

const searchPlacesMock = vi.fn();

vi.mock('../../src/api/placesSearchClient', () => ({
  searchPlaces: (...args: unknown[]) => searchPlacesMock(...args),
}));

const places: Place[] = [
  {
    ...placeFixture,
    id: 'place-1',
    name: '여기 소제',
    district: '동구',
    category: 'cafe',
  },
];

const result: PlaceSearchResult = {
  placeId: 'place-1',
  label: '여기 소제',
  subLabel: '동구 · 카페',
  matchType: 'name',
};

describe('MapPlaceSearch', () => {
  beforeEach(() => {
    searchPlacesMock.mockResolvedValue({ items: [result] });
  });

  afterEach(() => {
    searchPlacesMock.mockReset();
  });

  it('does not request the API for queries shorter than two characters', () => {
    render(<MapPlaceSearch places={places} onOpenPlace={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox', { name: '장소 검색' }), { target: { value: '여' } });

    expect(searchPlacesMock).not.toHaveBeenCalled();
  });

  it('opens the matching map-bootstrap place when a result is selected', async () => {
    const onOpenPlace = vi.fn();
    render(<MapPlaceSearch places={places} onOpenPlace={onOpenPlace} />);

    fireEvent.change(screen.getByRole('combobox', { name: '장소 검색' }), { target: { value: '여기' } });

    await screen.findByRole('option', { name: /여기 소제/ });
    fireEvent.click(screen.getByRole('option', { name: /여기 소제/ }));

    expect(searchPlacesMock).toHaveBeenCalledWith(
      { q: '여기', limit: 10 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(onOpenPlace).toHaveBeenCalledWith('place-1');
  });

  it('does not fallback to a detail endpoint when the result is missing from map-bootstrap places', async () => {
    render(<MapPlaceSearch places={[]} onOpenPlace={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox', { name: '장소 검색' }), { target: { value: '여기' } });

    await screen.findByRole('option', { name: /여기 소제/ });
    fireEvent.click(screen.getByRole('option', { name: /여기 소제/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('현재 지도 데이터에서 찾을 수 없어요.');
    });
  });
});
