import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourismInfoSheet } from '../../src/components/TourismInfoSheet';
import type { TourismPlaceItem } from '../../src/tourismTypes';

const tourismPlace: TourismPlaceItem = {
  id: 'kto-content-1932079',
  name: '굿모닝레지던스호텔휴',
  category: 'lodging',
  ktoContentTypeId: '32',
  ktoContentTypeLabel: '숙박',
  ktoFacet: 'lodging',
  district: '서구',
  address: null,
  roadAddress: '대전 서구 둔산로73번길 21',
  summary: '대전 서구에 있는 숙박 관광자원입니다.',
  description: '객실과 편의시설을 갖춘 레지던스형 숙박시설입니다.',
  latitude: 36.35,
  longitude: 127.38,
  imageUrl: 'https://example.com/tourism.jpg',
  sourcePageUrl: 'https://example.com/tourism',
  sourceUpdatedAt: '2025-09-22T01:56:03+00:00',
  sourceName: 'KTO TourAPI Daejeon Tourism',
  isCurated: false,
  curatedPlace: null,
};

describe('TourismInfoSheet', () => {
  it('renders the available KTO tourism contract fields instead of only name and address', () => {
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

    expect(screen.getByRole('img', { name: '굿모닝레지던스호텔휴 관광정보 이미지' })).toHaveAttribute(
      'src',
      tourismPlace.imageUrl,
    );
    expect(screen.getByRole('heading', { name: '굿모닝레지던스호텔휴' })).toBeInTheDocument();
    expect(screen.getByText('대전 서구에 있는 숙박 관광자원입니다.')).toBeInTheDocument();
    expect(screen.getByText('객실과 편의시설을 갖춘 레지던스형 숙박시설입니다.')).toBeInTheDocument();
    expect(screen.getByText('숙박')).toBeInTheDocument();
    expect(screen.getByText('서구')).toBeInTheDocument();
    expect(screen.getByText('대전 서구 둔산로73번길 21')).toBeInTheDocument();
    expect(screen.getByText('KTO TourAPI Daejeon Tourism')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '자세히 보기' })).toHaveAttribute('href', tourismPlace.sourcePageUrl);
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
