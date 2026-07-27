import { createClient } from "@/lib/supabase/server";

const WEBHOOKS: Record<string, string> = {
  hunt: process.env.DISCORD_HUNT_WEBHOOK ?? "",
  boss: process.env.DISCORD_BOSS_WEBHOOK ?? "",
  event: process.env.DISCORD_EVENT_WEBHOOK ?? "",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { channel } = await params;
  const webhookUrl = WEBHOOKS[channel];

  if (!webhookUrl) {
    return Response.json({ error: "Canal inválido" }, { status: 400 });
  }

  const ALLOWED_CHANNELS = ["hunt", "boss", "event"];
  if (!ALLOWED_CHANNELS.includes(channel)) {
    return Response.json({ error: "Canal não permitido" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body.embeds && !body.content) {
      return Response.json({ error: "Payload inválido" }, { status: 400 });
    }

    const payload = {
      content: body.content ? String(body.content).slice(0, 2000) : undefined,
      embeds: Array.isArray(body.embeds) ? body.embeds.slice(0, 10) : undefined,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return Response.json(
        { error: "Falha ao enviar webhook" },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
