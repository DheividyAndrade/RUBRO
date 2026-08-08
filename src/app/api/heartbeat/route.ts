import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ ok: true });

    await supabase.from("profiles").update({
      last_active_at: new Date().toISOString(),
    }).eq("id", user.id);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
