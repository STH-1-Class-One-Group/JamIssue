import type { SessionUser } from '../types/auth';
import { SideDrawer } from './app-shell/SideDrawer';
import { resolveSecondaryMenuItems } from './app-shell/secondaryMenu';
import { NotificationDrawer, type NotificationDrawerContentProps } from './notifications/NotificationDrawer';

interface AppTopNavigationDrawersProps {
  isNotificationDrawerOpen: boolean;
  isSideDrawerOpen: boolean;
  notificationUtility: NotificationDrawerContentProps;
  onCloseNotifications: () => void;
  onCloseSideDrawer: () => void;
  sessionUser: SessionUser | null;
}

export function AppTopNavigationDrawers({
  isNotificationDrawerOpen,
  isSideDrawerOpen,
  notificationUtility,
  onCloseNotifications,
  onCloseSideDrawer,
  sessionUser,
}: AppTopNavigationDrawersProps) {
  const secondaryMenuItems = resolveSecondaryMenuItems({
    canOpenAdminTools: Boolean(sessionUser?.isAdmin),
    isAdmin: Boolean(sessionUser?.isAdmin),
  });

  return (
    <>
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={onCloseNotifications}
        {...notificationUtility}
      />
      <SideDrawer
        isOpen={isSideDrawerOpen}
        items={secondaryMenuItems}
        onClose={onCloseSideDrawer}
      />
    </>
  );
}
