import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourismInfoSheet } from '../../src/components/TourismInfoSheet';
import type { TourismPlaceItem } from '../../src/tourismTypes';

const tourismPlace: TourismPlaceItem = {
  id: 'tourism-1',
  title: '대전근현대사전시관',
  category: '문화관광',
  district: '중구',
  address: '대전 중구 중앙로 101',
  summary: '옛 충남도청 건물을 활용한 전시 공간입니다.',
  description: '근현대 대전의 전시 변화를 전시와 사진 자료로 볼 수 있습니다.',
  latitude: 36.327,
  longitude: 127.421,
  imageUrl: 'https://example.com/tourism.jpg',
  homepageUrl: 'https://example.com/tourism',
  sourceName: 'KTO',
  isCurated: false,
  curatedPlace: null,
};

describe('TourismInfoSheet', () => {
  it('renders the available KTO tourism data instead of only title and address', () => {
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

    expect(screen.getByRole('img', { name: '대전근현대사전시관 관광정보 이미지' })).toHaveAttribute(
      'src',
      tourismPlace.imageUrl,
    );
    expect(screen.getByText('옛 충남도청 건물을 활용한 전시 공간입니다.')).toBeInTheDocument();
    expect(screen.getByText('근현대 대전의 전시 변화를 전시와 사진 자료로 볼 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByText('문화관광')).toBeInTheDocument();
    expect(screen.getByText('중구')).toBeInTheDocument();
    expect(screen.getByText('대전 중구 중앙로 101')).toBeInTheDocument();
    expect(screen.getByText('KTO')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '자세히 보기' })).toHaveAttribute('href', tourismPlace.homepageUrl);
  });
});
