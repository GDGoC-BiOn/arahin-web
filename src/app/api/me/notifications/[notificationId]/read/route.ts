import { profileHandlers } from "@/features/profile/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  const { notificationId } = await context.params;
  return profileHandlers.markNotificationRead(request, notificationId);
}
