export const MANUAL_OVERRIDES_BY_NUMBER = {
  70: { latitude: 36.3688239, longitude: 127.3879822, district: '서구' },
  71: { latitude: 36.3601462, longitude: 127.3570634, district: '유성구' },
} as const;

export const CATEGORY_META = {
  restaurant: {
    name: '맛집',
    jamColor: '#FF6B9D',
    accentColor: '#FFB3C6',
    stampReward: '로컬 미식 스탬프',
    heroLabel: 'Local Bite',
    visitTime: '40분 - 1시간 30분',
  },
  cafe: {
    name: '카페',
    jamColor: '#7CB9D1',
    accentColor: '#A8D5E2',
    stampReward: '카페 투어 스탬프',
    heroLabel: 'Slow Brew',
    visitTime: '30분 - 1시간',
  },
  attraction: {
    name: '명소',
    jamColor: '#FFB3C6',
    accentColor: '#FFD4E0',
    stampReward: '도시 산책 스탬프',
    heroLabel: 'City Escape',
    visitTime: '1시간 - 2시간',
  },
  culture: {
    name: '문화',
    jamColor: '#A8D5E2',
    accentColor: '#C9E4EA',
    stampReward: '문화 탐방 스탬프',
    heroLabel: 'Art Spot',
    visitTime: '1시간 - 2시간',
  },
} as const;

export type SampleCategory = keyof typeof CATEGORY_META;

export function normalizeCategory(raw: string): SampleCategory {
  const value = raw.replace(/\s+/g, '');
  if (value.includes('카페')) return 'cafe';
  if (value.includes('문화') || value.includes('공방') || value.includes('소품샵')) return 'culture';
  if (value.includes('명소')) return 'attraction';
  return 'restaurant';
}

export function inferDistrict(name: string, lat: number, lng: number) {
  const n = name.replace(/\s+/g, '');
  if (/(관저|갈마|탄방|둔산|만년|괴정|월평|도안|복수)/.test(n)) return '서구';
  if (/(유성|봉명|궁동|충남대|도룡|온천|노은|엑스포|과학관)/.test(n)) return '유성구';
  if (/(소제|대동|신흥|원동|정동|대전역)/.test(n)) return '동구';
  if (/(대흥|은행|선화|중앙로|오월드|뿌리공원|사정|산성)/.test(n)) return '중구';
  if (lat < 36.31) return lng < 127.36 ? '서구' : '중구';
  if (lng >= 127.425) return lat >= 36.332 ? '동구' : '중구';
  if (lat >= 36.365 && lng < 127.39) return '유성구';
  if (lng < 127.4) return '서구';
  return '대전';
}

export function slugify(number: number, name: string, used: Set<string>) {
  const base = name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
  const safeBase = base || `place-${String(number).padStart(3, '0')}`;
  let slug = `${String(number).padStart(3, '0')}-${safeBase}`;
  let suffix = 2;
  while (used.has(slug)) {
    slug = `${String(number).padStart(3, '0')}-${safeBase}-${suffix++}`;
  }
  used.add(slug);
  return slug;
}

export function deriveTags(name: string, category: SampleCategory, district: string, rawCategory: string) {
  const tags = new Set([CATEGORY_META[category].name, district]);
  if (/칼국수/.test(name)) tags.add('칼국수');
  if (/빵|베이커리|제과|하레하레|손수베이커리|미미제과점|뮤제/.test(name)) tags.add('베이커리');
  if (/수목원|공원|뚝방|오월드/.test(name)) tags.add('산책');
  if (/미술관|예술|과학관|art|아트|공방/i.test(name)) tags.add('전시');
  if (rawCategory.includes('소품샵')) tags.add('소품샵');
  if (category === 'cafe') tags.add('카페투어');
  if (category === 'restaurant') tags.add('로컬맛집');
  if (category === 'culture') tags.add('문화코스');
  if (category === 'attraction') tags.add('도시산책');
  return Array.from(tags).slice(0, 4);
}

export function makeSummary(name: string, category: SampleCategory) {
  switch (category) {
    case 'restaurant':
      return `${name}에서 대전 로컬 미식 흐름을 가볍게 시작해 보세요.`;
    case 'cafe':
      return `${name}에서 대전 카페 동선을 천천히 이어가기 좋아요.`;
    case 'culture':
      return `${name}에서 대전 문화 코스를 한 번에 이어가기 좋아요.`;
    default:
      return `${name}에서 대전 명소 산책 흐름을 자연스럽게 이어갈 수 있어요.`;
  }
}

export function makeDescription(name: string, category: SampleCategory, district: string) {
  switch (category) {
    case 'restaurant':
      return `${name}는 ${district} 권역에서 한 끼 동선으로 묶기 좋은 로컬 맛집입니다. 식사 뒤 카페나 산책 스폿과 이어 방문하기 좋게 구성했습니다.`;
    case 'cafe':
      return `${name}는 ${district} 권역에서 쉬어가기 좋은 카페 스폿입니다. 식사 뒤 혹은 산책 중간에 들르기 좋도록 여유 있는 카페 동선을 기준으로 정리했습니다.`;
    case 'culture':
      return `${name}는 ${district} 권역의 문화 스폿으로, 전시·공방·체험 흐름으로 묶기 좋습니다. 반나절 코스 안에서 다른 장소와 함께 이어보는 구성을 상정했습니다.`;
    default:
      return `${name}는 ${district} 권역에서 산책과 사진 기록을 함께 남기기 좋은 장소입니다. 카페나 문화 스폿과 연결해 반나절 코스로 묶기 좋게 정리했습니다.`;
  }
}

export function makeRouteHint(category: SampleCategory, district: string) {
  switch (category) {
    case 'restaurant':
      return `${district} 동선에서 카페나 산책 스폿과 함께 묶기 좋아요.`;
    case 'cafe':
      return `${district} 동선에서 식사 뒤 한 번 더 쉬어가기 좋은 스폿이에요.`;
    case 'culture':
      return `${district} 권역의 전시·공방·소품샵 흐름으로 이어 보기 좋아요.`;
    default:
      return `${district} 권역에서 카페나 문화 스폿과 함께 반나절 코스로 이어 보세요.`;
  }
}

export function getImageFileName(number: number) {
  return number === 1 ? 'image.png' : `image ${number - 1}.png`;
}
