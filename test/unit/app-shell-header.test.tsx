/*
 * File: app-shell-header.test.tsx
 * Purpose: Verify the TSK-012 app header contract at the AppShell public boundary.
 * Primary Responsibility: Prove that navigation and utility actions live inside the app header slot.
 * Design Intent: Use rendered DOM behavior instead of private component internals so later layout work can refactor safely.
 * Non-Goals: This test does not validate sub-navigation grid layout or KTO map layer behavior.
 * Dependencies: React Testing Library, Vitest, and the AppShell component.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../../src/components/app-shell/AppShell';

function renderShell(canNavigateBack: boolean, onNavigateBack = vi.fn()) {
  render(
    <AppShell
      activeTab="map"
      canNavigateBack={canNavigateBack}
      globalStatus={null}
      headerUtilityAction={<button type="button">설정</button>}
      onBottomTabChange={vi.fn()}
      onNavigateBack={onNavigateBack}
    >
      <div data-testid="content">content</div>
    </AppShell>,
  );
}

function renderHeaderHiddenShell() {
  render(
    <AppShell
      activeTab="map"
      canNavigateBack={false}
      globalStatus={null}
      headerMode="hidden"
      onBottomTabChange={vi.fn()}
      onNavigateBack={vi.fn()}
    >
      <div data-testid="content">content</div>
    </AppShell>,
  );
}

describe('AppShell app header contract', () => {
  it('renders brand and injected utility action inside the app header when back navigation is not available', () => {
    renderShell(false);

    const header = screen.getByRole('banner', { name: 'Jam Issue app header' });

    expect(within(header).getByText('JAM ISSUE')).toBeInTheDocument();
    expect(within(header).getByText('DAEJEON LOCAL GUIDE')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: '설정' })).toBeInTheDocument();
    expect(screen.queryByTestId('app-shell-overlay')).not.toBeInTheDocument();
  });

  it('uses a header leading button instead of a floating overlay for back navigation', async () => {
    const user = userEvent.setup();
    const onNavigateBack = vi.fn();

    renderShell(true, onNavigateBack);

    const header = screen.getByRole('banner', { name: 'Jam Issue app header' });
    const backButton = within(header).getByRole('button', { name: '이전 화면으로 돌아가기' });

    expect(backButton).toHaveClass('app-header__back-button');
    expect(screen.queryByTestId('app-shell-overlay')).not.toBeInTheDocument();

    await user.click(backButton);

    expect(onNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('can hide the app header for map-owned floating navigation', () => {
    renderHeaderHiddenShell();

    expect(screen.getByTestId('app-shell-phone')).toHaveClass('app-shell--header-hidden');
    expect(screen.queryByRole('banner', { name: 'Jam Issue app header' })).not.toBeInTheDocument();
    expect(screen.getByTestId('app-shell-content')).toContainElement(screen.getByTestId('content'));
  });
});
