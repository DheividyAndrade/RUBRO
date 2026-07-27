import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { userId, title, message, link } = await request.json();

    if (!userId || !title || !message) {
      return Response.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Only allow creating notifications for yourself
    if (userId !== user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title: String(title).slice(0, 200),
      message: String(message).slice(0, 1000),
      link: link ? String(link).slice(0, 500) : null,
      read: false,
    });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Payload inválido" }, { status: 400 });
  }
}
