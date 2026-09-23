import type { AxiosInstance } from "axios";
import { z } from "zod";
import type { ProfileGateway } from "../domain/profile-gateway";
import type {
  NotificationList,
  ProfileSnapshot,
  ProfileUpdate,
  ProfileUser,
} from "../domain/profile-summary";

const rawProfileUserSchema = z.object({
  id: z.string().default(""),
  email: z.string().default(""),
  fullName: z.string().default(""),
  role: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
});

const notificationSchema = z.object({
  id: z.string(),
  kind: z.string().default(""),
  title: z.string(),
  body: z.string().default(""),
  readAt: z.string().nullable().default(null),
  createdAt: z.string(),
});

const notificationListSchema = z.object({
  notifications: z.array(notificationSchema).default([]),
  unreadCount: z.number().default(0),
});

const spacesEnvelopeSchema = z.object({
  learningSpaces: z
    .array(
      z.object({
        id: z.string(),
        sourceCount: z.number().default(0),
      }),
    )
    .default([]),
});

const progressEnvelopeSchema = z.object({
  user: z
    .object({
      dailyStreak: z.number().optional(),
      xpEarned: z.number().optional(),
      quizzesTaken: z.number().optional(),
    })
    .nullable()
    .optional(),
  spaces: z
    .array(
      z.object({
        id: z.string(),
        totalLessons: z.number().default(0),
        completedLessons: z.number().default(0),
      }),
    )
    .default([]),
});

const streakEnvelopeSchema = z.object({
  streak: z
    .array(
      z.object({
        date: z.string(),
        active: z.boolean(),
      }),
    )
    .optional(),
});

const subscriptionSchema = z.object({
  premium: z.boolean().optional(),
});

const unreadSchema = z.object({
  unreadCount: z.number().optional(),
});

/** role and institution are NULL until set; normalise to strings. */
function toUser(raw: z.infer<typeof rawProfileUserSchema>): ProfileUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    role: raw.role ?? "",
    institution: raw.institution ?? "",
  };
}

/**
 * Profile fans out to several API resources. Each response is validated at the
 * boundary before the application layer derives stats and streak UI from it.
 */
export function createBrowserProfileGateway(
  client: AxiosInstance,
): ProfileGateway {
  return {
    async loadUser(): Promise<ProfileUser> {
      const { data } = await client.get("/me");
      return toUser(rawProfileUserSchema.parse(data));
    },
    async updateUser(update: ProfileUpdate): Promise<ProfileUser> {
      const { data } = await client.patch("/me", update);
      return toUser(rawProfileUserSchema.parse(data));
    },
    async loadNotifications(): Promise<NotificationList> {
      const { data } = await client.get("/me/notifications");
      return notificationListSchema.parse(data);
    },
    async markNotificationRead(id: string): Promise<void> {
      await client.patch(`/me/notifications/${encodeURIComponent(id)}/read`);
    },
    async loadSnapshot(): Promise<ProfileSnapshot> {
      const [me, spaces, progress, streak, subscription, notifications] =
        await Promise.all([
          client.get("/me"),
          client.get("/spaces"),
          client.get("/me/progress"),
          client
            .get("/me/streak", { params: { days: 7 } })
            .then((response) =>
              streakEnvelopeSchema.parse(response.data).streak ?? null,
            )
            .catch(() => null),
          client
            .get("/me/subscription")
            .then((response) =>
              Boolean(subscriptionSchema.parse(response.data).premium),
            )
            .catch(() => null),
          client
            .get("/me/notifications")
            .then(
              (response) =>
                unreadSchema.parse(response.data).unreadCount ?? 0,
            )
            .catch(() => null),
        ]);

      const user = toUser(rawProfileUserSchema.parse(me.data));
      const parsedSpaces = spacesEnvelopeSchema.parse(spaces.data);
      const parsedProgress = progressEnvelopeSchema.parse(progress.data);

      return {
        user,
        dailyStreak: parsedProgress.user?.dailyStreak ?? 0,
        xpEarned: parsedProgress.user?.xpEarned ?? 0,
        quizzesTaken: parsedProgress.user?.quizzesTaken ?? 0,
        streakHistory: streak,
        premium: subscription,
        unreadNotifications: notifications,
        spaces: parsedSpaces.learningSpaces,
        progress: parsedProgress.spaces,
      };
    },
  };
}
