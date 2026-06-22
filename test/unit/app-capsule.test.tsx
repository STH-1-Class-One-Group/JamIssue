import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AppCapsule } from '../../src/components/app-shell/AppCapsule';
import { SideDrawer } from '../../src/components/app-shell/SideDrawer';
import {
  isReservedPrimaryOrSettingsLabel,
  resolveSecondaryMenuItems,
} from '../../src/components/app-shell/secondaryMenu';
import type { AppSettingsPanelProps } from '../../src/components/app-settings/AppSettingsPanel';

const globalUtility: AppSettingsPanelProps = {
  mapDisplayPreferences: {
    showCuratedWithTourism: true,
    onShowCuratedWithTourismChange: vi.fn(),
  },
};

describe('AppCapsule shell contract', () => {
  it('renders menu, center slot, back action, and settings action without a separate notification button', () => {
    render(
      <AppCapsule
        canNavigateBack
        center={<button type="button">필터</button>}
        globalUtility={globalUtility}
        menuBadgeCount={2}
        onNavigateBack={vi.fn()}
        onOpenMenu={vi.fn()}
      />,
    );

    const capsule = screen.getByRole('navigation', { name: '앱 캡슐 내비게이션' });
    const leading = capsule.querySelector('[data-app-capsule-slot="leading"]');
    const actions = capsule.querySelector('[data-app-capsule-slot="actions"]');
    const menuButton = within(capsule).getByRole('button', { name: '보조 메뉴 열기' });
    const backButton = within(capsule).getByRole('button', { name: '이전 화면으로 돌아가기' });
    const settingsButton = within(capsule).getByRole('button', { name: '앱 설정 열기' });

    expect(menuButton).toBeInTheDocument();
    expect(menuButton.querySelector('.app-capsule__menu-badge')).not.toBeNull();
    expect(screen.queryByRole('button', { name: '알림 열기' })).not.toBeInTheDocument();
    expect(backButton).toBeEnabled();
    expect(within(capsule).getByRole('button', { name: '필터' })).toBeInTheDocument();
    expect(settingsButton).toHaveClass('global-settings-menu__trigger');
    expect(capsule.querySelector('[data-app-settings-panel="root"]')).not.toBeNull();
    expect(menuButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(backButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(leading?.contains(menuButton)).toBe(true);
    expect(leading?.contains(backButton)).toBe(false);
    expect(actions?.contains(backButton)).toBe(true);
    expect(actions?.contains(settingsButton)).toBe(true);
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
    expect(screen.queryByRole('button', { name: '보조 메뉴 열기' })).not.toBeInTheDocument();
  });

  it('emits the menu callback without rendering SideDrawer content itself', async () => {
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

    await user.click(screen.getByRole('button', { name: '보조 메뉴 열기' }));

    expect(onOpenMenu).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders SideDrawer notification and support items with close paths', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <SideDrawer
        isOpen
        items={resolveSecondaryMenuItems({ unreadNotificationCount: 3 })}
        onClose={onClose}
        renderItemContent={(itemId) => (itemId === 'notification' ? <section aria-label="알림">알림 목록</section> : null)}
      />,
    );

    const drawer = screen.getByRole('dialog', { name: '보조 메뉴' });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getAllByRole('menuitem')).toHaveLength(2);
    expect(within(drawer).getByRole('menuitem', { name: /알림/ })).toBeInTheDocument();
    expect(screen.getByLabelText('알림')).toHaveTextContent('알림 목록');

    const closeButton = container.querySelector('.side-drawer__close');
    expect(closeButton).not.toBeNull();
    await user.click(closeButton as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps secondary menu labels out of primary tabs and app/account settings ownership', () => {
    const generalItems = resolveSecondaryMenuItems();
    const adminItems = resolveSecondaryMenuItems({ isAdmin: true, canOpenAdminTools: true });

    expect(generalItems.map((item) => item.id)).toEqual(['notification', 'usage-guide']);
    expect(adminItems.map((item) => item.id)).toEqual(['notification', 'usage-guide', 'admin-tools']);
    for (const item of adminItems) {
      expect(isReservedPrimaryOrSettingsLabel(item.label)).toBe(false);
    }
  });

  it('does not introduce history, settings route, top notification ownership, or icon package coupling', () => {
    const capsuleSource = readFileSync(
      join(process.cwd(), 'src/components/app-shell/AppCapsule.tsx'),
      'utf8',
    );
    const sideDrawerSource = readFileSync(
      join(process.cwd(), 'src/components/app-shell/SideDrawer.tsx'),
      'utf8',
    );
    const secondaryMenuSource = readFileSync(
      join(process.cwd(), 'src/components/app-shell/secondaryMenu.ts'),
      'utf8',
    );
    const appSettingsPanelSource = readFileSync(
      join(process.cwd(), 'src/components/app-settings/AppSettingsPanel.tsx'),
      'utf8',
    );
    const appSettingsDrawerSource = readFileSync(
      join(process.cwd(), 'src/components/app-settings/AppSettingsDrawer.tsx'),
      'utf8',
    );
    const source = `${capsuleSource}\n${sideDrawerSource}\n${secondaryMenuSource}\n${appSettingsPanelSource}\n${appSettingsDrawerSource}`;

    expect(source).not.toContain('window.history');
    expect(source).not.toContain('/settings');
    expect(source).not.toMatch(/className=["'`][^"'`]*\bti-/);
    expect(source).not.toContain('@tabler');
    expect(source).not.toContain('\uFFFD');
    expect(capsuleSource).not.toContain('BellIcon');
    expect(capsuleSource).not.toContain('onOpenNotifications');
    expect(capsuleSource).not.toContain('notificationUnreadCount');
    expect(capsuleSource).toContain('menuBadgeCount');
    expect(appSettingsPanelSource).not.toContain('global-settings-menu__menu');
    expect(appSettingsPanelSource).toContain('AppSettingsDrawer');
    expect(appSettingsDrawerSource).not.toContain('NotificationPanel');
    expect(appSettingsDrawerSource).not.toContain('useNotificationPanelActions');
    expect(sideDrawerSource).toContain('renderItemContent');
    expect(secondaryMenuSource).not.toContain('bottomNavItems');
    expect(secondaryMenuSource).not.toContain('AppSettingsPanel');
    expect(secondaryMenuSource).not.toContain('ProfileAccountSettings');
  });
});
