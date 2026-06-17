import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AppCapsule } from '../../src/components/app-shell/AppCapsule';
import { SideDrawer } from '../../src/components/app-shell/SideDrawer';
import { SpeedDialFAB } from '../../src/components/app-shell/SpeedDialFAB';
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

    const capsule = screen.getByRole('navigation', { name: '앱 캡슐 내비게이션' });
    const leading = capsule.querySelector('[data-app-capsule-slot="leading"]');
    const actions = capsule.querySelector('[data-app-capsule-slot="actions"]');
    const menuButton = within(capsule).getByRole('button', { name: '메뉴 열기' });
    const backButton = within(capsule).getByRole('button', { name: '이전 화면으로 돌아가기' });
    const settingsButton = within(capsule).getByRole('button', { name: '설정 열기' });

    expect(menuButton).toBeInTheDocument();
    expect(backButton).toBeEnabled();
    expect(within(capsule).getByRole('button', { name: '필터' })).toBeInTheDocument();
    expect(settingsButton).toHaveClass('global-settings-menu__trigger');
    expect(menuButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(backButton.querySelector('.app-capsule__icon')).not.toBeNull();
    expect(menuButton).not.toHaveTextContent('☰');
    expect(backButton).not.toHaveTextContent('←');
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

  it('renders SideDrawer shell with close paths and no unapproved placeholder copy', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SideDrawer isOpen onClose={onClose} />);

    const drawer = screen.getByRole('dialog', { name: '사이드 메뉴' });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByTestId('side-drawer-content')).toBeEmptyDOMElement();
    expect(screen.queryByText('메뉴 준비 중')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '메뉴 닫기' })[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders SpeedDialFAB from an actions array and closes after an enabled action click', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const onDisabled = vi.fn();

    render(
      <SpeedDialFAB
        actions={[
          { id: 'locate', label: '내 위치 찾기', icon: <span aria-hidden="true">◎</span>, onClick: onLocate },
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

  it('does not introduce history, settings route, ti icon, or icon package coupling', () => {
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
    const appMapStageViewSource = readFileSync(
      join(process.cwd(), 'src/components/AppMapStageView.tsx'),
      'utf8',
    );
    const source = `${capsuleSource}\n${sideDrawerSource}\n${speedDialSource}\n${appMapStageViewSource}`;

    expect(source).not.toContain('window.history');
    expect(source).not.toContain('/settings');
    expect(source).not.toMatch(/className=["'`][^"'`]*\bti-/);
    expect(source).not.toContain('@tabler');
    expect(capsuleSource).toContain('notificationPanelMode="floating"');
  });
});
