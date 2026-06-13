import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourismInfoSheet } from '../../src/components/TourismInfoSheet';
import type { TourismPlaceItem } from '../../src/tourismTypes';

const tourismPlace: TourismPlaceItem = {
  id: 'kto-content-2866231',
  name: '11시들쌈밥',
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
  district: '대덕구',
  address: '대전광역시 대덕구 대청로 9 (신탄진동)',
  roadAddress: null,
  summary: '11시들쌈밥 KTO TourAPI 대전 관광 정보',
  description: null,
  latitude: 36.4516742756,
  longitude: 127.4296834974,
  imageUrl: 'http://tong.visitkorea.or.kr/cms/resource/17/2866217_image2_1.jpg',
  sourcePageUrl: 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=2866231',
  sourceUpdatedAt: '2025-09-10T04:25:17+00:00',
  sourceName: 'KTO TourAPI Daejeon Tourism',
  isCurated: false,
  curatedPlace: null,
};

describe('TourismInfoSheet', () => {
  it('renders the available KTO tourism contract fields instead of relying on the source link', () => {
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

    expect(screen.getByRole('img', { name: '11시들쌈밥 관광정보 이미지' })).toHaveAttribute(
      'src',
      tourismPlace.imageUrl,
    );
    expect(screen.getByRole('heading', { name: '11시들쌈밥' })).toBeInTheDocument();
    expect(screen.getByText('11시들쌈밥 KTO TourAPI 대전 관광 정보')).toBeInTheDocument();
    expect(screen.getByText('음식점')).toBeInTheDocument();
    expect(screen.getByText('restaurant')).toBeInTheDocument();
    expect(screen.getByText('대덕구')).toBeInTheDocument();
    expect(screen.getByText('대전광역시 대덕구 대청로 9 (신탄진동)')).toBeInTheDocument();
    expect(screen.getByText('좌표 36.45167, 127.42968')).toBeInTheDocument();
    expect(screen.getByText('39', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('A05')).toBeInTheDocument();
    expect(screen.getByText('A0502')).toBeInTheDocument();
    expect(screen.getByText('A05020100')).toBeInTheDocument();
    expect(screen.getByText('KTO TourAPI Daejeon Tourism')).toBeInTheDocument();
    expect(screen.getByText('업데이트', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'KTO 원문 보기' })).toHaveAttribute('href', tourismPlace.sourcePageUrl);
  });

  it('does not render a clickable source link when the provider URL is invalid', () => {
    render(
      <TourismInfoSheet
        place={{ ...tourismPlace, sourcePageUrl: 'javascript:alert(1)', homepageUrl: null }}
        isOpen
        sheetState="partial"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.queryByRole('link', { name: 'KTO 원문 보기' })).not.toBeInTheDocument();
    expect(
      screen.getByText('KTO 원문 링크가 유효하지 않아 현재 시트의 정보를 기준으로 확인해 주세요.'),
    ).toBeInTheDocument();
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
