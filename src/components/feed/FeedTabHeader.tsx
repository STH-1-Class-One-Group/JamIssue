import { ActionButton, SectionHeader } from '../ui-kit';

interface FeedTabHeaderProps {
  placeFilterName: string | null;
  onClearPlaceFilter: () => void;
}

export function FeedTabHeader({ placeFilterName, onClearPlaceFilter }: FeedTabHeaderProps) {
  return (
    <SectionHeader
      className="panel-header panel-header--feed"
      eyebrow="FEED"
      title={placeFilterName ? `${placeFilterName} 피드` : '방문 피드'}
      description={
        placeFilterName ? (
          '지도에서 고른 장소의 방문 피드만 먼저 보여줍니다.'
        ) : (
          <>
            스탬프를 찍은 뒤에만 남길 수 있는
            <br />
            실제 방문 후기만 모아 보여줍니다.
          </>
        )
      }
      actions={
        placeFilterName ? (
          <div className="chip-row compact-gap">
            <span className="soft-tag">{`현재 장소: ${placeFilterName}`}</span>
            <ActionButton size="sm" variant="secondary" onClick={onClearPlaceFilter}>
              전체 피드 보기
            </ActionButton>
          </div>
        ) : null
      }
    />
  );
}
