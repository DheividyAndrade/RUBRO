import { createClient } from "@/lib/supabase/server";

function calcLevel(xp: number) { return Math.floor(xp / 100) + 1; }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { amount } = await request.json();
  if (!amount || amount <= 0) return Response.json({ error: "amount obrigatório" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
  const newXp = (profile?.xp || 0) + amount;
  const newLevel = calcLevel(newXp);

  await supabase.from("profiles").upsert({ id: user.id, xp: newXp, user_level: newLevel }, { onConflict: "id" });

  return Response.json({ ok: true, xp: newXp, level: newLevel });
}
