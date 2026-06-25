import type { MyPageTabKey } from '../../types/core';
import { FilterChip } from '../ui-kit';

type MyPagePrimaryTabsProps = {
  activeTab: MyPageTabKey;
  isAdmin: boolean;
  onChangeTab: (nextTab: MyPageTabKey) => void;
};

export function MyPagePrimaryTabs({
  activeTab,
  isAdmin,
  onChangeTab,
}: MyPagePrimaryTabsProps) {
  return (
    <div className={isAdmin ? 'my-page-primary-tabs my-page-primary-tabs--admin' : 'my-page-primary-tabs'}>
      <FilterChip selected={activeTab === 'stamps'} onClick={() => onChangeTab('stamps')}>
        {'\uC2A4\uD0EC\uD504'}
      </FilterChip>
      <FilterChip selected={activeTab === 'feeds'} onClick={() => onChangeTab('feeds')}>
        {'\uD53C\uB4DC'}
      </FilterChip>
      <FilterChip selected={activeTab === 'comments'} onClick={() => onChangeTab('comments')}>
        {'\uB313\uAE00'}
      </FilterChip>
      <FilterChip selected={activeTab === 'routes'} onClick={() => onChangeTab('routes')}>
        {'\uCF54\uC2A4'}
      </FilterChip>
      {isAdmin && (
        <FilterChip selected={activeTab === 'admin'} onClick={() => onChangeTab('admin')}>
          {'\uAD00\uB9AC'}
        </FilterChip>
      )}
    </div>
  );
}
