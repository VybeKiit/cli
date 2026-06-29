import { resolveNotificationsProvider } from '@vybekiit/notifications';

/** Notification delivery wire point — skill: add-notifications */
export function getNotifications() {
  return resolveNotificationsProvider();
}
