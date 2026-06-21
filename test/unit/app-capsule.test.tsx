import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AppCapsule } from '../../src/components/app-shell/AppCapsule';
import { SideDrawer } from '../../src/components/app-shell/SideDrawer';
import { SpeedDialFAB } from '../../src/components/app-shell/SpeedDialFAB';
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
  it('renders menu, notification, center slot, back action, and settings action through props', () => {
    render(
      <AppCapsule
        canNavigateBack
        center={<button type="button">필터</button>}
        globalUtility={globalUtility}
        notificationUnreadCount={2}
        onNavigateBack={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenNotifications={vi.fn()}
      />,
    );

    const capsule = screen.getByRole('navigation', { name: '앱 캡슐 내비게이션' });
    const leading = capsule.querySelector('[data-app-capsule-slot="leading"]');
    const actions = capsule.querySelector('[data-app-capsule-slot="actions"]');
    const menuButton = within(capsule).getByRole('button', { name: '보조 메뉴 열기' });
    const notificationButton = within(capsule).getByRole('button', { name: '알림 열기' });
    const backButton = within(capsule).getByRole('button', { name: '이전 화면으로 돌아가기' });
    const settingsButton = within(capsule).getByRole('button', { name: '설정 열기' });

    expect(menuButton).toBeInTheDocument();
    expect(notificationButton).toBeInTheDocument();
    expect(notificationButton.querySelector('.notification-bell__dot')).not.toBeNull();
    expect(backButton).toBeEnabled();
    expect(within(capsule).getByRole('button', { name: '필터' })).toBeInTheDocument();
    expect(settingsButton).toHaveClass('global-settings-menu__trigger');
    expect(capsule.querySelector('[data-app-settings-panel="root"]')).not.toBeNull();
    expect(menuButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(notificationButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(backButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(leading?.contains(menuButton)).toBe(true);
    expect(leading?.contains(notificationButton)).toBe(true);
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
    expect(screen.queryByRole('button', { name: '알림 열기' })).not.toBeInTheDocument();
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

  it('emits the notification callback without owning notification content', async () => {
    const user = userEvent.setup();
    const onOpenNotifications = vi.fn();

    render(
      <AppCapsule
        canNavigateBack={false}
        center={null}
        globalUtility={globalUtility}
        notificationUnreadCount={1}
        onNavigateBack={vi.fn()}
        onOpenNotifications={onOpenNotifications}
      />,
    );

    await user.click(screen.getByRole('button', { name: '알림 열기' }));

    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: '알림' })).not.toBeInTheDocument();
  });

  it('renders SideDrawer with general secondary items and close paths', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(<SideDrawer isOpen items={resolveSecondaryMenuItems()} onClose={onClose} />);

    const drawer = screen.getByRole('dialog');
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getAllByRole('menuitem')).toHaveLength(1);

    const closeButton = container.querySelector('.side-drawer__close');
    expect(closeButton).not.toBeNull();
    await user.click(closeButton as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps secondary menu labels out of primary tabs and settings ownership', () => {
    const generalItems = resolveSecondaryMenuItems();
    const adminItems = resolveSecondaryMenuItems({ isAdmin: true, canOpenAdminTools: true });

    expect(generalItems.map((item) => item.id)).toEqual(['usage-guide']);
    expect(adminItems.map((item) => item.id)).toEqual(['usage-guide', 'admin-tools']);
    for (const item of adminItems) {
      expect(isReservedPrimaryOrSettingsLabel(item.label)).toBe(false);
    }
  });

  it('renders SpeedDialFAB from an actions array and closes after an enabled action click', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const onDisabled = vi.fn();

    render(
      <SpeedDialFAB
        actions={[
          { id: 'locate', label: '내 위치 찾기', icon: <span aria-hidden="true">•</span>, onClick: onLocate },
          { id: 'disabled', label: '사용 불가', onClick: onDisabled, disabled: true },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: '지도 빠른 작업 열기' }));

    expect(screen.getByRole('menuitem', { name: '내 위치 찾기' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '사용 불가' })).toBeDisabled();

    await user.click(screen.getByRole('menuitem', { name: '사용 불가' }));
    expect(onDisabled).not.toHaveBeenCalled();

    await user.click(screen.getByRole('menuitem', { name: '내 위치 찾기' }));

    expect(onLocate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem', { name: '내 위치 찾기' })).not.toBeInTheDocument();
  });

  it('keeps SpeedDialFAB hidden when requested and without actions', () => {
    const { rerender } = render(<SpeedDialFAB actions={[]} />);
    expect(screen.queryByRole('button', { name: '지도 빠른 작업 열기' })).not.toBeInTheDocument();

    rerender(
      <SpeedDialFAB
        hidden
        actions={[{ id: 'locate', label: '내 위치 찾기', onClick: vi.fn() }]}
      />,
    );
    expect(screen.queryByRole('button', { name: '지도 빠른 작업 열기' })).not.toBeInTheDocument();
  });

  it('does not introduce history, settings route, notification ownership, ti icon, or icon package coupling', () => {
    const capsuleSource = readFileSync(
      join(process.cwd(), 'src/components/app-shell/AppCapsule.tsx'),
      'utf8',
    );
    const sideDrawerSource = readFileSync(
      join(process.cwd(), 'src/components/app-shell/SideDrawer.tsx'),
      'utf8',
    );
    const speedDialSource = readFileSync(
      join(process.cwd(), 'src/components/app-shell/SpeedDialFAB.tsx'),
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
    const appMapStageViewSource = readFileSync(
      join(process.cwd(), 'src/components/AppMapStageView.tsx'),
      'utf8',
    );
    const source = `${capsuleSource}\n${sideDrawerSource}\n${speedDialSource}\n${secondaryMenuSource}\n${appSettingsPanelSource}\n${appMapStageViewSource}`;

    expect(source).not.toContain('window.history');
    expect(source).not.toContain('/settings');
    expect(source).not.toMatch(/className=["'`][^"'`]*\bti-/);
    expect(source).not.toContain('@tabler');
    expect(source).not.toContain('\uFFFD');
    expect(capsuleSource).toContain('onOpenNotifications');
    expect(capsuleSource).toContain('notificationUnreadCount');
    expect(capsuleSource).toContain('AppSettingsPanel');
    expect(appSettingsPanelSource).not.toContain('NotificationPanel');
    expect(appSettingsPanelSource).not.toContain('useNotificationPanelActions');
    expect(secondaryMenuSource).not.toContain('bottomNavItems');
    expect(secondaryMenuSource).not.toContain('AppSettingsPanel');
    expect(secondaryMenuSource).not.toContain('ProfileAccountSettings');
  });
});
