import type { Tab } from '../types/core';

interface BottomNavProps {
  activeTab: Tab;
  onChange: (nextTab: Tab) => void;
}

export const bottomNavItems: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'map', label: '지도', icon: '🗺️' },
  { key: 'event', label: '행사', icon: '🌸' },
  { key: 'feed', label: '피드', icon: '💬' },
  { key: 'course', label: '코스', icon: '🧭' },
  { key: 'my', label: '마이', icon: '👤' },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="하단 네비게이션">
      {bottomNavItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={item.key === activeTab ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
          data-tab-key={item.key}
          aria-current={item.key === activeTab ? 'page' : undefined}
          onClick={() => onChange(item.key)}
        >
          <span className="bottom-nav__active-pill" aria-hidden="true" />
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
