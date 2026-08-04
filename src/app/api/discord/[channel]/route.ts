import { createClient } from "@/lib/supabase/server";

const WEBHOOKS: Record<string, string> = {
  hunt: process.env.DISCORD_HUNT_WEBHOOK ?? "",
  boss: process.env.DISCORD_BOSS_WEBHOOK ?? "",
  event: process.env.DISCORD_EVENT_WEBHOOK ?? "",
  task: process.env.DISCORD_TASK_WEBHOOK ?? "",
};

const ALLOWED_CHANNELS = ["hunt", "boss", "event", "task"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { channel } = await params;
  const webhookUrl = WEBHOOKS[channel];
  if (!webhookUrl || !ALLOWED_CHANNELS.includes(channel)) {
    return Response.json({ error: "Canal inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (channel === "task") console.error("[task-body]", JSON.stringify(body).slice(0, 600));
    const payload = {
      content: body.content ? String(body.content).slice(0, 2000) : undefined,
      embeds: Array.isArray(body.embeds) ? body.embeds.slice(0, 10) : undefined,
    };

    const url = new URL(webhookUrl);
    url.searchParams.set("wait", "true");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Discord webhook error:", response.status, errText.slice(0, 200));
      return Response.json({ error: "Falha ao enviar webhook" }, { status: 502 });
    }

    let messageId: string | null = null;
    try { const data = await response.json(); messageId = data.id ?? null; } catch {}

    return Response.json({ ok: true, messageId });
  } catch {
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ channel: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { channel } = await params;
  const webhookUrl = WEBHOOKS[channel];
  const url = new URL(request.url);
  const messageId = url.searchParams.get("messageId");
  if (!webhookUrl || !messageId || !ALLOWED_CHANNELS.includes(channel)) {
    return Response.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = {
      content: body.content ? String(body.content).slice(0, 2000) : undefined,
      embeds: Array.isArray(body.embeds) ? body.embeds.slice(0, 10) : undefined,
    };

    const editUrl = `${webhookUrl}/messages/${encodeURIComponent(messageId)}`;
    const response = await fetch(editUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Discord webhook edit error:", response.status, errText.slice(0, 200));
      return Response.json({ error: "Falha ao editar webhook" }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
