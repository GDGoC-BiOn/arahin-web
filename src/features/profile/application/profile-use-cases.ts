import type { ProfileGateway } from "../domain/profile-gateway";
import {
  buildStats,
  buildStreakDays,
  profileSubtitle,
} from "../domain/profile-stats";
import type {
  ProfileUpdate,
  ProfileUser,
  StatTile,
  StreakDay,
} from "../domain/profile-summary";

export type ProfileView = {
  user: ProfileUser;
  stats: StatTile[];
  streakDays: StreakDay[];
  dailyStreak: number;
  premium: boolean | null;
  unreadNotifications: number | null;
};

export function createProfileUseCases(gateway: ProfileGateway) {
  return {
    loadUser(): Promise<ProfileUser> {
      return gateway.loadUser();
    },
    updateUser(update: ProfileUpdate): Promise<ProfileUser> {
      return gateway.updateUser({
        fullName: update.fullName.trim(),
        role: update.role.trim(),
        institution: update.institution.trim(),
      });
    },
    subtitleOf: profileSubtitle,
    loadNotifications() {
      return gateway.loadNotifications();
    },
    markNotificationRead(id: string) {
      return gateway.markNotificationRead(id);
    },
    /**
     * `today` is injected rather than read inside the derivation, so the
     * weekday labels are testable and a stale render cannot silently disagree
     * with the clock.
     */
    async loadProfile(today: Date = new Date()): Promise<ProfileView> {
      const snapshot = await gateway.loadSnapshot();
      return {
        user: snapshot.user,
        stats: buildStats(snapshot),
        streakDays: buildStreakDays(
          snapshot.dailyStreak,
          today,
          snapshot.streakHistory,
        ),
        dailyStreak: snapshot.dailyStreak,
        premium: snapshot.premium,
        unreadNotifications: snapshot.unreadNotifications,
      };
    },
  };
}

export type ProfileUseCases = ReturnType<typeof createProfileUseCases>;
