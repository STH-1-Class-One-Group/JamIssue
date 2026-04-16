import type { PublicEventBannerResponse } from '../../publicEventTypes';

export function buildRoadmapSummaryItems(data: PublicEventBannerResponse) {
  return [
    { label: '현재 일정', value: `${data.items.length}건`, tone: 'pink' as const },
    { label: '데이터 출처', value: data.sourceName ?? '미연결', tone: 'blue' as const },
    { label: '가져온 시각', value: data.importedAt ?? '아직 없음', tone: 'mint' as const },
  ];
}
