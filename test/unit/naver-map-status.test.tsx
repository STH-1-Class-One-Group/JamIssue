import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NaverMapStatus } from '../../src/components/naver-map/NaverMapStatus';

describe('NaverMapStatus', () => {
  it('shows readable current-location feedback and calls the locate action', () => {
    const onLocateCurrentPosition = vi.fn();

    render(
      <NaverMapStatus
        clientId="client-id"
        status="ready"
        errorMessage={null}
        currentLocationStatus="ready"
        currentLocationMessage="현재 위치를 확인했어요."
        currentPosition={null}
        onLocateCurrentPosition={onLocateCurrentPosition}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '내 위치 찾기' }));

    expect(onLocateCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByText('현재 위치를 확인했어요.')).toBeInTheDocument();
  });

  it('keeps the locate button disabled while a position request is pending', () => {
    render(
      <NaverMapStatus
        clientId="client-id"
        status="ready"
        errorMessage={null}
        currentLocationStatus="loading"
        currentLocationMessage="현재 위치를 확인하고 있어요."
        currentPosition={null}
        onLocateCurrentPosition={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '확인 중' })).toBeDisabled();
  });
});
