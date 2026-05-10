import type { MyPageTabKey } from '../../types/core';

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
    <div className={isAdmin ? 'chip-row compact-gap my-page-primary-tabs my-page-primary-tabs--admin' : 'chip-row compact-gap my-page-primary-tabs'}>
      <button type="button" className={activeTab === 'stamps' ? 'chip is-active' : 'chip'} onClick={() => onChangeTab('stamps')}>
        {'\uC2A4\uD0EC\uD504'}
      </button>
      <button type="button" className={activeTab === 'feeds' ? 'chip is-active' : 'chip'} onClick={() => onChangeTab('feeds')}>
        {'\uD53C\uB4DC'}
      </button>
      <button type="button" className={activeTab === 'comments' ? 'chip is-active' : 'chip'} onClick={() => onChangeTab('comments')}>
        {'\uB313\uAE00'}
      </button>
      <button type="button" className={activeTab === 'routes' ? 'chip is-active' : 'chip'} onClick={() => onChangeTab('routes')}>
        {'\uCF54\uC2A4'}
      </button>
      {isAdmin && (
        <button type="button" className={activeTab === 'admin' ? 'chip is-active' : 'chip'} onClick={() => onChangeTab('admin')}>
          {'\uAD00\uB9AC'}
        </button>
      )}
    </div>
  );
}

