import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NaverMapStatus } from '../../src/components/naver-map/NaverMapStatus';

describe('NaverMapStatus', () => {
  it('renders an error card without floating controls when SDK config or loading fails', () => {
    const { rerender } = render(
      <NaverMapStatus
        clientId=""
        status="loading"
        errorMessage={null}
        currentLocationStatus="idle"
        currentLocationMessage={null}
        currentPosition={null}
        onLocateCurrentPosition={vi.fn()}
      />,
    );

    expect(document.querySelector('.map-status-card')).toBeInTheDocument();
    expect(document.querySelector('.map-floating-controls')).toBeNull();

    rerender(
      <NaverMapStatus
        clientId="client-id"
        status="error"
        errorMessage="sdk failed"
        currentLocationStatus="idle"
        currentLocationMessage={null}
        currentPosition={null}
        onLocateCurrentPosition={vi.fn()}
      />,
    );
    expect(screen.getByText('sdk failed')).toBeInTheDocument();
  });

  it('renders loading overlay, locate controls, and location messages while map config is valid', async () => {
    const user = userEvent.setup();
    const onLocateCurrentPosition = vi.fn();
    const { rerender } = render(
      <NaverMapStatus
        clientId="client-id"
        status="loading"
        errorMessage={null}
        currentLocationStatus="loading"
        currentLocationMessage="location pending"
        currentPosition={null}
        onLocateCurrentPosition={onLocateCurrentPosition}
      />,
    );

    expect(document.querySelector('.map-status-card--overlay')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('location pending')).toHaveClass('map-location-pill');

    rerender(
      <NaverMapStatus
        clientId="client-id"
        status="ready"
        errorMessage={null}
        currentLocationStatus="idle"
        currentLocationMessage={null}
        currentPosition={{ latitude: 36.35, longitude: 127.38 }}
        onLocateCurrentPosition={onLocateCurrentPosition}
      />,
    );
    expect(document.querySelector('.map-status-card--overlay')).toBeNull();
    await user.click(screen.getByRole('button'));
    expect(onLocateCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
