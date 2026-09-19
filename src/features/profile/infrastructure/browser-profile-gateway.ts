import type { AxiosInstance } from "axios";
import type { ProfileGateway } from "../domain/profile-gateway";
import type {
  NotificationList,
  ProfileProgressSpace,
  ProfileSnapshot,
  ProfileSpace,
  ProfileUpdate,
  ProfileUser,
  StreakHistoryDay,
} from "../domain/profile-summary";

/** role and institution are NULL until set; normalise to strings. */
function toUser(raw: Partial<ProfileUser>): ProfileUser {
  return {
    id: raw.id ?? "",
    email: raw.email ?? "",
    fullName: raw.fullName ?? "",
    role: raw.role ?? "",
    institution: raw.institution ?? "",
  };
}

/**
 * Profile needs data owned by two other features (`/v1/me` from auth,
 * `/v1/spaces` and `/v1/me/progress` from ingestion). The layer rules forbid
 * reaching into another feature's infrastructure, so this calls the same
 * already-deployed proxy routes directly — no new route handlers, and the
 * session still rides in the httpOnly cookie.
 *
 * The three requests are independent, so they go out together rather than in
 * series: the screen is gated on the slowest one, not their sum.
 */
export function createBrowserProfileGateway(
  client: AxiosInstance,
): ProfileGateway {
  return {
    async loadUser(): Promise<ProfileUser> {
      const { data } = await client.get<Partial<ProfileUser>>("/me");
      return toUser(data);
    },
    async updateUser(update: ProfileUpdate): Promise<ProfileUser> {
      const { data } = await client.patch<Partial<ProfileUser>>("/me", update);
      return toUser(data);
    },
    async loadNotifications(): Promise<NotificationList> {
      const { data } =
        await client.get<Partial<NotificationList>>("/me/notifications");
      return {
        notifications: data.notifications ?? [],
        unreadCount: data.unreadCount ?? 0,
      };
    },
    async markNotificationRead(id: string): Promise<void> {
      await client.patch(`/me/notifications/${encodeURIComponent(id)}/read`);
    },
    async loadSnapshot(): Promise<ProfileSnapshot> {
      // Streak history and plan are garnish: if either fails, the screen
      // falls back rather than failing whole.
      const [me, spaces, progress, streak, subscription, notifications] =
        await Promise.all([
          client.get<Partial<ProfileUser>>("/me"),
          client.get<{ learningSpaces: ProfileSpace[] }>("/spaces"),
          client.get<{
            user: {
              dailyStreak?: number;
              xpEarned?: number;
              quizzesTaken?: number;
            } | null;
            spaces: ProfileProgressSpace[];
          }>("/me/progress"),
          client
            .get<{ streak?: StreakHistoryDay[] }>("/me/streak", {
              params: { days: 7 },
            })
            .then((r) => r.data.streak ?? null)
            .catch(() => null),
          client
            .get<{ premium?: boolean }>("/me/subscription")
            .then((r) => Boolean(r.data.premium))
            .catch(() => null),
          client
            .get<{ unreadCount?: number }>("/me/notifications")
            .then((r) => r.data.unreadCount ?? 0)
            .catch(() => null),
        ]);

      const user = toUser(me.data);

      return {
        user,
        // dailyStreak lives on the progress envelope's user, not on /v1/me.
        dailyStreak: progress.data.user?.dailyStreak ?? 0,
        xpEarned: progress.data.user?.xpEarned ?? 0,
        quizzesTaken: progress.data.user?.quizzesTaken ?? 0,
        streakHistory: streak,
        premium: subscription,
        unreadNotifications: notifications,
        spaces: spaces.data.learningSpaces ?? [],
        progress: progress.data.spaces ?? [],
      };
    },
  };
}
