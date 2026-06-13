import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourismInfoSheet } from '../../src/components/TourismInfoSheet';
import type { TourismPlaceItem } from '../../src/tourismTypes';

const tourismPlace: TourismPlaceItem = {
  id: 'kto-content-133881',
  name: '명랑식당',
  category: 'restaurant',
  ktoContentTypeId: '39',
  ktoContentTypeLabel: '음식점',
  ktoCategoryCode1: 'A05',
  ktoCategoryLabel1: null,
  ktoCategoryCode2: 'A0502',
  ktoCategoryLabel2: null,
  ktoCategoryCode3: 'A05020100',
  ktoCategoryLabel3: null,
  ktoFacet: 'restaurant',
  district: '동구',
  address: '대전광역시 동구 태전로 56-20',
  roadAddress: null,
  summary: '명랑식당 KTO TourAPI 대전 관광 정보',
  description: null,
  latitude: 36.33635,
  longitude: 127.3865,
  imageUrl: 'http://tong.visitkorea.or.kr/cms/resource/example.jpg',
  sourcePageUrl: 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=133881',
  sourceUpdatedAt: '2025-07-21T00:00:00+00:00',
  sourceName: 'KTO 관광정보',
  isCurated: false,
  curatedPlace: null,
};

describe('TourismInfoSheet', () => {
  it('renders KTO tourism fields inside the app without delegating detail viewing to the source page', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        isOpen
        sheetState="partial"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: '명랑식당 관광정보 이미지' })).toHaveAttribute(
      'src',
      tourismPlace.imageUrl,
    );
    expect(screen.getByRole('heading', { name: '명랑식당' })).toBeInTheDocument();
    expect(screen.getByText('명랑식당 KTO TourAPI 대전 관광 정보')).toBeInTheDocument();
    expect(screen.getByText('음식점')).toBeInTheDocument();
    expect(screen.getByText('restaurant')).toBeInTheDocument();
    expect(screen.getByText('동구')).toBeInTheDocument();
    expect(screen.getByText('대전광역시 동구 태전로 56-20')).toBeInTheDocument();
    expect(screen.getByText('좌표 36.33635, 127.38650')).toBeInTheDocument();
    expect(screen.getByText('39', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('A05')).toBeInTheDocument();
    expect(screen.getByText('A0502')).toBeInTheDocument();
    expect(screen.getByText('A05020100')).toBeInTheDocument();
    expect(screen.getByText('KTO 관광정보')).toBeInTheDocument();
    expect(screen.getByText('업데이트', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('외부 원문 페이지가 열리지 않을 수 있어 앱에서 확인 가능한 정보만 표시합니다.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /KTO 원문|자세히 보기/ })).not.toBeInTheDocument();
  });

  it('does not render a clickable source link even when the provider URL uses a valid URL shape', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        isOpen
        sheetState="partial"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('uses the shared map bottom sheet shell and supports full-height scrolling', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        isOpen
        sheetState="full"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    const sheet = screen.getByRole('region', { name: '관광정보 시트' });
    const content = sheet.querySelector('.map-bottom-sheet__content');

    expect(sheet).toHaveClass('place-drawer', 'place-drawer--full', 'place-drawer--route-full');
    expect(content).not.toBeNull();
  });
});
