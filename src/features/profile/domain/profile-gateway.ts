import type {
  NotificationList,
  ProfileSnapshot,
  ProfileUpdate,
  ProfileUser,
} from "./profile-summary";

export type ProfileGateway = {
  /** One call for the screen: the three requests are fanned out behind it. */
  loadSnapshot(): Promise<ProfileSnapshot>;
  loadUser(): Promise<ProfileUser>;
  updateUser(update: ProfileUpdate): Promise<ProfileUser>;
  loadNotifications(): Promise<NotificationList>;
  markNotificationRead(id: string): Promise<void>;
};
