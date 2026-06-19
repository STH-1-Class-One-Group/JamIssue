import type { ReactNode } from 'react';
import type { Tab } from '../types/core';

interface BottomNavProps {
  activeTab: Tab;
  onChange: (nextTab: Tab) => void;
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M4 6.5 9 4l6 3 5-2.5v13L15 20l-6-3-5 2.5v-13Z" />
      <path d="M9 4v13" />
      <path d="M15 7v13" />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M5 8h14" />
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="m8.5 14 2.2 2.1 4.8-5.1" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M5 6.5h14" />
      <path d="M5 12h10" />
      <path d="M5 17.5h7" />
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    </svg>
  );
}

function CourseIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M4 18c4 0 4-12 8-12s4 12 8 12" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="20" cy="18" r="2" />
    </svg>
  );
}

function MyIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c1.6-4 12.4-4 14 0" />
    </svg>
  );
}

export const bottomNavItems: Array<{ key: Tab; label: string; icon: ReactNode }> = [
  { key: 'map', label: '지도', icon: <MapIcon /> },
  { key: 'event', label: '행사', icon: <EventIcon /> },
  { key: 'feed', label: '피드', icon: <FeedIcon /> },
  { key: 'course', label: '코스', icon: <CourseIcon /> },
  { key: 'my', label: '마이', icon: <MyIcon /> },
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
          <span className="bottom-nav__icon-frame" aria-hidden="true">
            <span className="bottom-nav__active-pill" />
            <span className="bottom-nav__icon">{item.icon}</span>
          </span>
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
