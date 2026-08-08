import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { amount, reason, reference_id } = await request.json();
  if (!amount || !reason) return Response.json({ error: "amount e reason obrigatórios" }, { status: 400 });

  const { data: current } = await supabase.from("rubro_coins").select("amount").eq("user_id", user.id).single();
  const newAmount = (current?.amount || 0) + amount;

  await supabase.from("rubro_coins").upsert({ user_id: user.id, amount: newAmount, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  await supabase.from("rubro_coin_history").insert({ user_id: user.id, amount, reason, reference_id });

  return Response.json({ ok: true, total: newAmount });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: leaderboard, error } = await supabase
    .from("rubro_coins")
    .select("user_id, amount")
    .order("amount", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const userIds = (leaderboard ?? []).map((e: any) => e.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, display_name, role, user_level").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const enriched = (leaderboard ?? []).map((e: any) => ({
    ...e,
    display_name: profileMap.get(e.user_id)?.display_name || "?",
    role: profileMap.get(e.user_id)?.role || "MEMBER",
    user_level: profileMap.get(e.user_id)?.user_level || 1,
  })).slice(0, 10);

  let myStats = null;
  if (user) {
    const { data: mine } = await supabase.from("rubro_coins").select("amount, user_id").eq("user_id", user.id).single();
    if (mine) {
      const { data: rankData } = await supabase.from("rubro_coins").select("user_id").order("amount", { ascending: false });
      const myRank = (rankData ?? []).findIndex((r: any) => r.user_id === user.id) + 1;
      myStats = { amount: mine.amount, rank: myRank || null };
    }
  }

  return Response.json({ leaderboard: enriched, myStats });
}
