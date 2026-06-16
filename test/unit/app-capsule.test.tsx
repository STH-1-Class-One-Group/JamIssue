import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AppCapsule } from '../../src/components/app-shell/AppCapsule';
import type { GlobalSettingsMenuProps } from '../../src/components/GlobalSettingsMenu';

const globalUtility: GlobalSettingsMenuProps = {
  sessionUserName: 'tester',
  notifications: [],
  unreadCount: 0,
  onOpenNotification: vi.fn(),
  onMarkAllNotificationsRead: vi.fn(),
  onDeleteNotification: vi.fn(),
};

describe('AppCapsule shell contract', () => {
  it('renders menu, center slot, back action, and GlobalSettingsMenu action through props', () => {
    render(
      <AppCapsule
        canNavigateBack
        center={<button type="button">필터</button>}
        globalUtility={globalUtility}
        onNavigateBack={vi.fn()}
        onOpenMenu={vi.fn()}
      />,
    );

    const capsule = screen.getByRole('navigation', { name: '앱 캡슐 네비게이션' });

    expect(within(capsule).getByRole('button', { name: '메뉴 열기' })).toBeInTheDocument();
    expect(within(capsule).getByRole('button', { name: '이전 화면으로 돌아가기' })).toBeEnabled();
    expect(within(capsule).getByRole('button', { name: '필터' })).toBeInTheDocument();
    expect(within(capsule).getByRole('button', { name: '설정 열기' })).toHaveClass('global-settings-menu__trigger');
  });

  it('uses canNavigateBack and onNavigateBack instead of reading browser history', async () => {
    const user = userEvent.setup();
    const onNavigateBack = vi.fn();

    render(
      <AppCapsule
        canNavigateBack={false}
        center={<span>center</span>}
        globalUtility={globalUtility}
        onNavigateBack={onNavigateBack}
      />,
    );

    const backButton = screen.getByRole('button', { name: '이전 화면으로 돌아가기' });

    expect(backButton).toBeDisabled();
    await user.click(backButton);
    expect(onNavigateBack).not.toHaveBeenCalled();
  });

  it('emits the menu callback without rendering SideDrawer content or copy', async () => {
    const user = userEvent.setup();
    const onOpenMenu = vi.fn();

    render(
      <AppCapsule
        canNavigateBack={false}
        center={null}
        globalUtility={globalUtility}
        onNavigateBack={vi.fn()}
        onOpenMenu={onOpenMenu}
      />,
    );

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(onOpenMenu).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not introduce history, settings route, or ti icon coupling', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/app-shell/AppCapsule.tsx'),
      'utf8',
    );

    expect(source).not.toContain('window.history');
    expect(source).not.toContain('/settings');
    expect(source).not.toMatch(/className=["'`][^"'`]*\bti-/);
  });
});
