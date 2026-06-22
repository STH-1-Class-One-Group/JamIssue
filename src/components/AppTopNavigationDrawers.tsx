import type { SessionUser } from '../types/auth';
import { SideDrawer } from './app-shell/SideDrawer';
import { resolveSecondaryMenuItems } from './app-shell/secondaryMenu';
import { NotificationDrawerContent, type NotificationDrawerContentProps } from './notifications/NotificationDrawerContent';

interface AppTopNavigationDrawersProps {
  isSideDrawerOpen: boolean;
  notificationUtility: NotificationDrawerContentProps;
  onCloseSideDrawer: () => void;
  sessionUser: SessionUser | null;
}

export function AppTopNavigationDrawers({
  isSideDrawerOpen,
  notificationUtility,
  onCloseSideDrawer,
  sessionUser,
}: AppTopNavigationDrawersProps) {
  const secondaryMenuItems = resolveSecondaryMenuItems({
    canOpenAdminTools: Boolean(sessionUser?.isAdmin),
    isAdmin: Boolean(sessionUser?.isAdmin),
    unreadNotificationCount: notificationUtility.unreadCount,
  });

  return (
    <SideDrawer
      isOpen={isSideDrawerOpen}
      items={secondaryMenuItems}
      onClose={onCloseSideDrawer}
      renderItemContent={(itemId) => (
        itemId === 'notification' ? <NotificationDrawerContent {...notificationUtility} onClose={onCloseSideDrawer} /> : null
      )}
    />
  );
}
