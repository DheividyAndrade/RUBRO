import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { huntId, excludeUserId, title, message, link } = await request.json();

    if (!huntId || !title || !message) {
      return Response.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Verify the caller is the hunt creator or participant
    const { data: hunt } = await supabase.from("hunts").select("created_by").eq("id", huntId).single();
    if (!hunt) return Response.json({ error: "Hunt não encontrada" }, { status: 404 });

    const { data: participants } = await supabase
      .from("hunt_participants")
      .select("user_id")
      .eq("hunt_id", huntId);

    if (!participants?.length) return Response.json({ ok: true });

    const userIds = participants
      .map((p) => p.user_id)
      .filter((id) => id !== excludeUserId);

    if (!userIds.length) return Response.json({ ok: true });

    const notifications = userIds.map((uid) => ({
      user_id: uid,
      title: String(title).slice(0, 200),
      message: String(message).slice(0, 1000),
      link: link ? String(link).slice(0, 500) : null,
      read: false,
    }));

    const { error } = await supabase.from("notifications").insert(notifications);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Payload inválido" }, { status: 400 });
  }
}
