"use client";

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
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, message, link }),
    });
  } catch {
    // silently ignore
  }
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
  try {
    await fetch("/api/notifications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ huntId, excludeUserId, title, message, link }),
    });
  } catch {
    // silently ignore
  }
}
