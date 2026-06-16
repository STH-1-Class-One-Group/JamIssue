import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MapFloatingNav } from '../../src/components/map-stage/MapFloatingNav';

const globalUtility = {
  sessionUserName: 'tester',
  notifications: [],
  unreadCount: 0,
  onOpenNotification: vi.fn(),
  onMarkAllNotificationsRead: vi.fn(),
  onDeleteNotification: vi.fn(),
};

function renderFloatingNav(canNavigateBack: boolean, onNavigateBack = vi.fn()) {
  render(
    <MapFloatingNav
      activeCategory="all"
      activeTourismDisplayGroup="all"
      canNavigateBack={canNavigateBack}
      showTourismInfo={false}
      tourismFacets={null}
      tourismPlaces={[]}
      tourismSourceReady={false}
      tourismLoading={false}
      tourismError={null}
      globalUtility={globalUtility}
      onNavigateBack={onNavigateBack}
      onSelectCategory={vi.fn()}
      onSelectTourismDisplayGroup={vi.fn()}
      onToggleTourismInfo={vi.fn()}
    />,
  );
}

describe('MapFloatingNav', () => {
  it('renders the back button next to the menu button and disables it when back navigation is unavailable', () => {
    renderFloatingNav(false);

    const menuButton = screen.getByRole('button', { name: '메뉴' });
    const backButton = screen.getByRole('button', { name: '이전 화면으로 돌아가기' });
    const leading = menuButton.closest('.map-floating-nav__leading');

    expect(menuButton).toBeInTheDocument();
    expect(backButton).toBeInTheDocument();
    expect(leading).not.toBeNull();
    expect(leading?.querySelectorAll('.map-floating-nav__icon-btn')[0]).toBe(menuButton);
    expect(leading?.querySelectorAll('.map-floating-nav__icon-btn')[1]).toBe(backButton);
    expect(backButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses the app-shell back navigation contract when back navigation is available', async () => {
    const user = userEvent.setup();
    const onNavigateBack = vi.fn();

    renderFloatingNav(true, onNavigateBack);

    const backButton = screen.getByRole('button', { name: '이전 화면으로 돌아가기' });
    expect(backButton).toHaveAttribute('aria-disabled', 'false');

    await user.click(backButton);

    expect(onNavigateBack).toHaveBeenCalledTimes(1);
  });
});
