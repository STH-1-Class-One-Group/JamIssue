import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourismInfoSheet } from '../../src/components/TourismInfoSheet';
import type { TourismPlaceDetailItem, TourismPlaceItem } from '../../src/tourismTypes';

const tourismPlace: TourismPlaceItem = {
  id: 'kto-content-133881',
  name: '귀빈돌솥밥',
  category: 'restaurant',
  primaryType: 'restaurant',
  subType: 'restaurant_general',
  displayGroup: 'restaurant',
  officialCategoryLabel: '음식점',
  curationStatus: 'raw_kto',
  ktoContentTypeId: '39',
  ktoContentTypeLabel: '음식점',
  ktoCategoryCode1: 'A05',
  ktoCategoryLabel1: null,
  ktoCategoryCode2: 'A0502',
  ktoCategoryLabel2: null,
  ktoCategoryCode3: 'A05020100',
  ktoCategoryLabel3: null,
  ktoFacet: 'restaurant',
  district: '서구',
  address: '대전광역시 서구 만년로68번길 21',
  roadAddress: null,
  summary: '귀빈돌솥밥 KTO TourAPI 대전 관광 정보',
  description: null,
  latitude: 36.3663498341,
  longitude: 127.3805013325,
  imageUrl: 'http://tong.visitkorea.or.kr/cms/resource/72/3060272_image2_1.JPG',
  sourcePageUrl: 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=133881',
  sourceUpdatedAt: '2025-07-21T07:52:32+00:00',
  sourceName: 'KTO 관광정보',
  hasDetail: true,
  detailKind: 'restaurant',
  isCurated: false,
  curatedPlace: null,
};

const tourismDetail: TourismPlaceDetailItem = {
  ...tourismPlace,
  overview: '귀빈돌솥밥 KTO TourAPI 대전 관광 정보',
  contact: '0507-1429-3364',
  homepageUrl: null,
  images: [],
  displaySections: [
    {
      title: 'Usage',
      items: [
        {
          label: 'Hours',
          value: '11:00~19:50<br>- 준비시간 15:00~17:00<br>- 마지막 주문 19:30',
        },
        { label: 'Closed days', value: '연중무휴' },
        { label: 'Parking', value: '가능' },
      ],
    },
    {
      title: 'Menu',
      items: [
        { label: 'Main menu', value: '돌솥밥' },
        { label: 'Menu', value: '수육 / 돼지갈비 / 육회갈비' },
      ],
    },
    {
      title: 'Restaurant info',
      items: [{ label: 'Smoking', value: '모두 금연' }],
    },
  ],
  detail: {
    restaurant: {
      firstMenu: '돌솥밥',
    },
  },
};

describe('TourismInfoSheet', () => {
  it('renders user-value KTO detail fields from the Worker detail contract', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        detail={tourismDetail}
        detailLoading={false}
        detailError={null}
        isOpen
        sheetState="peek"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: '관광정보 시트' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '귀빈돌솥밥' })).toHaveAttribute(
      'src',
      tourismPlace.imageUrl,
    );
    expect(screen.getByRole('heading', { name: '귀빈돌솥밥' })).toBeInTheDocument();
    expect(screen.getByText('음식점')).toBeInTheDocument();
    expect(screen.getByText('서구')).toBeInTheDocument();
    expect(screen.getByText('상세정보')).toBeInTheDocument();
    expect(screen.getByText('대전광역시 서구 만년로68번길 21')).toBeInTheDocument();
    expect(screen.getByText('0507-1429-3364')).toBeInTheDocument();
    expect(screen.getByText('이용정보')).toBeInTheDocument();
    expect(screen.getByText('영업시간')).toBeInTheDocument();
    expect(screen.getByText('11:00~19:50')).toBeInTheDocument();
    expect(screen.getByText('- 준비시간 15:00~17:00')).toBeInTheDocument();
    expect(screen.getByText('- 마지막 주문 19:30')).toBeInTheDocument();
    expect(screen.getByText('휴무일')).toBeInTheDocument();
    expect(screen.getByText('연중무휴')).toBeInTheDocument();
    expect(screen.getByText('주차')).toBeInTheDocument();
    expect(screen.getByText('가능')).toBeInTheDocument();
    expect(screen.getByText('대표 메뉴')).toBeInTheDocument();
    expect(screen.getByText('돌솥밥')).toBeInTheDocument();
    expect(screen.getByText('수육 / 돼지갈비 / 육회갈비')).toBeInTheDocument();
    expect(screen.getByText('흡연')).toBeInTheDocument();
    expect(screen.getByText('모두 금연')).toBeInTheDocument();
    expect(screen.getByText('KTO 관광정보')).toBeInTheDocument();
    expect(screen.getByText('공식 분류: 음식점')).toBeInTheDocument();
  });

  it('uses displayGroup as the primary badge when official category is broader', () => {
    render(
      <TourismInfoSheet
        place={{ ...tourismPlace, subType: 'cafe', displayGroup: 'cafe' }}
        detail={{ ...tourismDetail, subType: 'cafe', displayGroup: 'cafe' }}
        detailLoading={false}
        detailError={null}
        isOpen
        sheetState="peek"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.getByText('카페')).toBeInTheDocument();
    expect(screen.queryByText('음식점 / 39')).not.toBeInTheDocument();
    expect(screen.getByText('공식 분류: 음식점')).toBeInTheDocument();
  });

  it('hides provider metadata and external source links that are not useful in the sheet', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        detail={tourismDetail}
        detailLoading={false}
        detailError={null}
        isOpen
        sheetState="peek"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.queryByText('restaurant')).not.toBeInTheDocument();
    expect(screen.queryByText('음식점 / 39')).not.toBeInTheDocument();
    expect(screen.queryByText('A05')).not.toBeInTheDocument();
    expect(screen.queryByText('A0502')).not.toBeInTheDocument();
    expect(screen.queryByText('A05020100')).not.toBeInTheDocument();
    expect(screen.queryByText(/좌표/)).not.toBeInTheDocument();
    expect(screen.queryByText(/업데이트/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /KTO 원문|자세히 보기/ })).not.toBeInTheDocument();
  });

  it('shows a detail loading state while keeping list-level information available', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        detail={null}
        detailLoading
        detailError={null}
        isOpen
        sheetState="peek"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '귀빈돌솥밥' })).toBeInTheDocument();
    expect(screen.getByText('대전광역시 서구 만년로68번길 21')).toBeInTheDocument();
    expect(screen.getByText('상세 정보를 불러오는 중입니다.')).toBeInTheDocument();
  });

  it('uses the shared map bottom sheet shell and supports full-height scrolling', () => {
    render(
      <TourismInfoSheet
        place={tourismPlace}
        detail={tourismDetail}
        detailLoading={false}
        detailError={null}
        isOpen
        sheetState="full"
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );

    const sheet = screen.getByRole('region', { name: '관광정보 시트' });
    const content = sheet.querySelector('.map-bottom-sheet__content');
    const image = sheet.querySelector('img');
    const mediaFrame = image?.closest('.map-bottom-sheet__media-frame');

    expect(sheet).toHaveClass('place-drawer', 'place-drawer--full', 'place-drawer--route-full');
    expect(content).not.toBeNull();
    expect(image).not.toBeNull();
    expect(mediaFrame).not.toBeNull();
    expect(content?.contains(image)).toBe(false);
  });

  it('keeps KTO user-facing modules free from mojibake regressions', () => {
    const files = [
      'src/components/TourismInfoSheet.tsx',
      'src/lib/tourismTaxonomy.ts',
    ];
    const mojibakeFragments = [
      0xfffd,
      0x9858,
      0x613f,
      0xbb52,
      0x934e,
      0xb69f,
      0xc493,
      0xf98e,
      0xf98f,
    ].map((codePoint) => String.fromCodePoint(codePoint));

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const fragment of mojibakeFragments) {
        expect(source, file).not.toContain(fragment);
      }
    }
  });
});
