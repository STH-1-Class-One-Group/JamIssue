/*
 * File: app-shell-subnav.test.tsx
 * Purpose: Verify the TSK-012 app shell sub-navigation slot contract.
 * Primary Responsibility: Prove that optional sub navigation is owned by AppShell rather than map-stage overlays.
 * Design Intent: Exercise the AppShell public props so layout internals can change without rewriting tests.
 * Non-Goals: This test does not validate KTO map markers or broad CSS cleanup covered by later child issues.
 * Dependencies: React Testing Library, Vitest, and the AppShell component.
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../../src/components/app-shell/AppShell';

const globalUtility = {
  sessionUserName: 'tester',
  notifications: [],
  unreadCount: 0,
  onOpenNotification: vi.fn(),
  onMarkAllNotificationsRead: vi.fn(),
  onDeleteNotification: vi.fn(),
};

function renderShell(subNav?: ReactNode) {
  render(
    <AppShell
      activeTab="map"
      canNavigateBack={false}
      globalStatus={null}
      globalUtility={globalUtility}
      onBottomTabChange={vi.fn()}
      onNavigateBack={vi.fn()}
      subNav={subNav}
    >
      <div data-testid="content">content</div>
    </AppShell>,
  );
}

describe('AppShell sub navigation contract', () => {
  it('renders sub navigation as a shell slot between header and content', () => {
    renderShell(<nav aria-label="stage filters">filters</nav>);

    const phoneShell = screen.getByTestId('app-shell-phone');
    const subNavSlot = screen.getByTestId('app-shell-sub-nav');
    const contentSlot = screen.getByTestId('app-shell-content');

    expect(phoneShell).toHaveClass('app-shell--with-subnav');
    expect(phoneShell).not.toHaveClass('app-shell--no-subnav');
    expect(subNavSlot).toHaveAttribute('data-app-shell-slot', 'sub-nav');
    expect(subNavSlot).toHaveTextContent('filters');
    expect(contentSlot).toContainElement(screen.getByTestId('content'));
  });

  it('uses the no-subnav variant when a screen has no stage-level navigation', () => {
    renderShell();

    const phoneShell = screen.getByTestId('app-shell-phone');

    expect(phoneShell).toHaveClass('app-shell--no-subnav');
    expect(phoneShell).not.toHaveClass('app-shell--with-subnav');
    expect(screen.queryByTestId('app-shell-sub-nav')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-shell-content')).toContainElement(screen.getByTestId('content'));
  });
});
