import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoadmapBannerPreview } from '../../src/components/RoadmapBannerPreview';

const previewDataMocks = vi.hoisted(() => ({
  useRoadmapBannerPreviewData: vi.fn(),
}));

vi.mock('../../src/components/roadmap-banner/useRoadmapBannerPreviewData', () => ({
  useRoadmapBannerPreviewData: previewDataMocks.useRoadmapBannerPreviewData,
}));

const baseData = {
  sourceReady: true,
  sourceName: 'events',
  importedAt: '2026-05-14T00:00:00Z',
  items: [],
};

describe('RoadmapBannerPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading, error, and empty states', () => {
    previewDataMocks.useRoadmapBannerPreviewData.mockReturnValueOnce({
      status: 'loading',
      data: baseData,
      errorMessage: '',
    });
    const { rerender } = render(<RoadmapBannerPreview />);
    expect(screen.getByText(/PUBLIC EVENT BANNER/)).toBeInTheDocument();
    expect(document.querySelector('.roadmap-empty')).not.toBeNull();

    previewDataMocks.useRoadmapBannerPreviewData.mockReturnValueOnce({
      status: 'error',
      data: { ...baseData, sourceReady: false },
      errorMessage: 'failed',
    });
    rerender(<RoadmapBannerPreview />);
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(document.querySelector('.roadmap-empty--error')).not.toBeNull();

    previewDataMocks.useRoadmapBannerPreviewData.mockReturnValueOnce({
      status: 'ready',
      data: { ...baseData, sourceReady: true },
      errorMessage: '',
    });
    rerender(<RoadmapBannerPreview />);
    expect(document.querySelector('.roadmap-empty')).not.toBeNull();
  });

  it('renders ongoing and upcoming event cards with optional metadata', () => {
    previewDataMocks.useRoadmapBannerPreviewData.mockReturnValue({
      status: 'ready',
      data: {
        ...baseData,
        items: [
          {
            id: 'event-1',
            title: 'Ongoing Event',
            summary: 'summary',
            dateLabel: 'Today',
            district: 'District',
            venueName: null,
            linkedPlaceName: null,
            sourcePageUrl: null,
            isOngoing: true,
          },
          {
            id: 'event-2',
            title: 'Upcoming Event',
            summary: 'summary',
            dateLabel: 'Tomorrow',
            district: 'District',
            venueName: 'Venue',
            linkedPlaceName: 'Place',
            sourcePageUrl: 'https://event.test',
            isOngoing: false,
          },
        ],
      },
      errorMessage: '',
    });

    render(<RoadmapBannerPreview />);

    expect(screen.getByText('Ongoing Event')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Event')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://event.test');
  });
});
