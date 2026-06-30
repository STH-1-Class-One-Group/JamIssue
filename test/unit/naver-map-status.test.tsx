import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NaverMapStatus } from '../../src/components/naver-map/NaverMapStatus';

describe('NaverMapStatus', () => {
  it('renders the SDK fallback status without owning current-location controls', () => {
    render(
      <NaverMapStatus
        clientId="client-id"
        status="error"
        errorMessage="네이버 지도 SDK를 불러오지 못했어요."
      />,
    );

    expect(screen.getByText('네이버 지도 연결 대기')).toBeInTheDocument();
    expect(screen.getByText('네이버 지도 SDK를 불러오지 못했어요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '내 위치 찾기' })).not.toBeInTheDocument();
  });

  it('renders the loading overlay while the SDK is preparing', () => {
    render(
      <NaverMapStatus
        clientId="client-id"
        status="loading"
        errorMessage={null}
      />,
    );

    expect(screen.getByText('대전 지도를 준비하고 있어요.')).toBeInTheDocument();
    expect(screen.getByText('잠시만 기다리면 지도와 마커를 바로 보여드릴게요.')).toBeInTheDocument();
  });

  it('does not render a status layer once the SDK is ready', () => {
    const { container } = render(
      <NaverMapStatus
        clientId="client-id"
        status="ready"
        errorMessage={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
