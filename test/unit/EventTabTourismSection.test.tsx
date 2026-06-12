/*
 * File: EventTabTourismSection.test.tsx
 * Purpose: Verify the Event tab renders KTO tourism places as a separate segment.
 * Primary Responsibility: Pin segment switching, facet refetch, and curated projection display behavior.
 * Design Intent: Ensure KTO tourism cards never mix with festival cards or curated map bootstrap data.
 * Non-Goals: This file does not test map navigation, Supabase rows, or deployed Worker availability.
 * Dependencies: React Testing Library, Vitest, and EventTab public props.
 */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventTab } from '../../src/components/EventTab';
import type { FestivalItem } from '../../src/types/core';
import type { TourismPlacesResponse } from '../../src/tourismTypes';

const apiMocks = vi.hoisted(() => ({
  getTourismPlaces: vi.fn(),
}));

vi.mock('../../src/api/client', () => apiMocks);

const festival: FestivalItem = {
  id: 'festival-1',
  title: '[Daejeon] Festival Title (2026) ABC',
  venueName: 'Daejeon Hall',
  startDate: '2026-05-14',
  endDate: '2026-05-15',
  homepageUrl: 'https://festival.example.test',
  roadAddress: 'Daejeon Road',
  latitude: 36.35,
  longitude: 127.38,
  isOngoing: true,
};

const tourismFixture: TourismPlacesResponse = {
  sourceReady: true,
  sourceName: 'KTO',
  importedAt: '2026-06-01T00:00:00Z',
  facets: {
    contentTypes: [{ id: '12', label: '관광지', count: 1 }],
    ktoFacets: [{ key: 'attraction', label: '관광지', count: 1 }],
    districts: [{ name: '유성구', count: 1 }],
  },
  items: [{
    id: 'kto-1',
    name: '대전 관광지',
    category: 'tourism',
    ktoContentTypeId: '12',
    ktoContentTypeLabel: '관광지',
    ktoCategoryCode1: null,
    ktoCategoryLabel1: null,
    ktoCategoryCode2: null,
    ktoCategoryLabel2: null,
    ktoCategoryCode3: null,
    ktoCategoryLabel3: null,
    ktoFacet: 'attraction',
    district: '유성구',
    address: null,
    roadAddress: null,
    summary: '',
    imageUrl: null,
    sourcePageUrl: null,
    latitude: null,
    longitude: null,
    sourceUpdatedAt: null,
    isCurated: true,
    curatedPlace: { positionId: 101, slug: 'daejeon-place', name: '지도 장소' },
  }],
};

describe('EventTab tourism segment', () => {
  beforeEach(() => {
    apiMocks.getTourismPlaces.mockResolvedValue(tourismFixture);
  });

  it('switches from festivals to tourism places and refetches with selected facets', async () => {
    const user = userEvent.setup();
    const { container, findByText } = render(<EventTab festivals={[festival]} />);

    expect(container.querySelectorAll('.festival-card')).toHaveLength(1);
    await user.click(await findByText('관광장소'));
    await findByText('대전 관광지');
    await user.click(await findByText('유성구 1'));

    expect(apiMocks.getTourismPlaces).toHaveBeenNthCalledWith(1, {
      district: null,
      ktoContentTypeId: null,
      ktoFacet: null,
    });
    expect(apiMocks.getTourismPlaces).toHaveBeenNthCalledWith(2, {
      district: '유성구',
      ktoContentTypeId: null,
      ktoFacet: null,
    });
    expect(container.querySelector('.tourism-card__curated')?.textContent).toContain('지도 장소');
  });
});
