import { create } from 'zustand';
import { createNotificationStoreActions } from './notification-store/actions';
import { initialNotificationStoreState } from './notification-store/helpers';
import type { NotificationStore } from './notification-store/types';

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  ...initialNotificationStoreState,
  ...createNotificationStoreActions(set, get),
}));
