import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventTabTourismSection } from '../../src/components/EventTabTourismSection';
import type { TourismPlacesResponse } from '../../src/tourismTypes';

const apiMocks = vi.hoisted(() => ({
  getTourismPlaces: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
  getTourismPlaces: apiMocks.getTourismPlaces,
}));

function tourismResponse(overrides: Partial<TourismPlacesResponse> = {}): TourismPlacesResponse {
  return {
    sourceReady: true,
    sourceName: 'KTO',
    importedAt: '2026-05-14T00:00:00Z',
    facets: {
      contentTypes: [{ id: '12', label: 'Tour', count: 2 }],
      districts: [{ name: 'Yuseong', count: 1 }],
      ktoFacets: [{ key: 'night', label: 'Night', count: 1 }],
    },
    items: [
      {
        id: 'tour-1',
        name: 'Tour 1',
        district: 'Yuseong',
        address: 'Address',
        roadAddress: 'Road',
        latitude: null,
        longitude: null,
        summary: 'Summary',
        sourcePageUrl: 'https://tour.test',
        ktoContentTypeId: '12',
        ktoContentTypeLabel: 'Tour',
        ktoCategoryLabel3: 'Category',
        ktoFacet: 'Night',
        isCurated: true,
        curatedPlace: { id: 'place-1', name: 'Place 1' },
      },
    ],
    ...overrides,
  };
}

describe('EventTabTourismSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not load tourism places while inactive', () => {
    render(<EventTabTourismSection active={false} />);

    expect(apiMocks.getTourismPlaces).not.toHaveBeenCalled();
    expect(document.querySelector('.tourism-filter-panel')).toBeInTheDocument();
  });

  it('loads tourism cards and toggles each facet filter through the public API client', async () => {
    const user = userEvent.setup();
    apiMocks.getTourismPlaces.mockResolvedValue(tourismResponse());

    render(<EventTabTourismSection active />);

    await waitFor(() => {
      expect(screen.getByText('Tour 1')).toBeInTheDocument();
    });
    expect(screen.getByText('Road')).toBeInTheDocument();
    expect(screen.getByText('Tour · Category · Night')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://tour.test');

    await user.click(screen.getByRole('button', { name: 'Yuseong 1' }));
    await user.click(screen.getByRole('button', { name: 'Tour 2' }));
    await user.click(screen.getByRole('button', { name: 'Night 1' }));
    await user.click(screen.getByRole('button', { name: 'Yuseong 1' }));

    expect(apiMocks.getTourismPlaces).toHaveBeenCalledWith({ district: 'Yuseong', ktoContentTypeId: null, ktoFacet: null });
    expect(apiMocks.getTourismPlaces).toHaveBeenCalledWith({ district: 'Yuseong', ktoContentTypeId: '12', ktoFacet: null });
    expect(apiMocks.getTourismPlaces).toHaveBeenCalledWith({ district: 'Yuseong', ktoContentTypeId: '12', ktoFacet: 'night' });
    expect(apiMocks.getTourismPlaces).toHaveBeenCalledWith({ district: null, ktoContentTypeId: '12', ktoFacet: 'night' });
  });

  it('renders empty and error states without preserving stale tourism items', async () => {
    apiMocks.getTourismPlaces.mockResolvedValueOnce(tourismResponse({ items: [], facets: { contentTypes: [], districts: [], ktoFacets: [] } }));
    const { rerender } = render(<EventTabTourismSection active />);

    await waitFor(() => {
      expect(document.querySelector('.tourism-card-list')).toBeNull();
    });

    apiMocks.getTourismPlaces.mockRejectedValueOnce(new Error('network'));
    rerender(<EventTabTourismSection active={false} />);
    rerender(<EventTabTourismSection active />);

    await waitFor(() => {
      expect(document.querySelector('.tourism-card-list')).toBeNull();
    });
    expect(apiMocks.getTourismPlaces).toHaveBeenCalledTimes(2);
  });
});
