import type { AppNotification, NotificationList } from "./profile-summary";

const RELATIVE = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

/** "5 menit yang lalu", "kemarin" — how long ago a notification arrived. */
export function notificationAge(createdAt: string, now = Date.now()): string {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) return "";
  const minutes = Math.round((parsed - now) / 60_000);
  if (Math.abs(minutes) < 1) return "baru saja";
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return RELATIVE.format(hours, "hour");
  return RELATIVE.format(Math.round(hours / 24), "day");
}

/**
 * Marks one notification read locally, so the list responds on tap while the
 * request is in flight. Idempotent: an already-read item changes nothing.
 */
export function markReadLocally(
  list: NotificationList,
  id: string,
  now: string,
): NotificationList {
  let changed = false;
  const notifications = list.notifications.map((item: AppNotification) => {
    if (item.id !== id || item.readAt) return item;
    changed = true;
    return { ...item, readAt: now };
  });
  if (!changed) return list;
  return {
    notifications,
    unreadCount: Math.max(0, list.unreadCount - 1),
  };
}
