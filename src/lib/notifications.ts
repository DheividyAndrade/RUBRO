import { createClient } from "@/lib/supabase/client";

export async function createNotification({
  userId,
  title,
  message,
  link,
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    read: false,
    link: link ?? null,
  });
}

export async function notifyAllHuntParticipants({
  huntId,
  excludeUserId,
  title,
  message,
  link,
}: {
  huntId: string;
  excludeUserId?: string;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = createClient();
  const { data: participants } = await supabase
    .from("hunt_participants")
    .select("user_id")
    .eq("hunt_id", huntId);

  if (!participants) return;

  const userIds = participants
    .map((p) => p.user_id)
    .filter((id) => id !== excludeUserId);

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    title,
    message,
    read: false,
    link: link ?? null,
  }));

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }
}
