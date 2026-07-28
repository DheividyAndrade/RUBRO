import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return Response.json({ ok: false, error: "Nome inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    const cleanName = name.trim();

    const { data } = await supabase
      .from("guild_members")
      .select("character_name")
      .ilike("character_name", cleanName)
      .single();

    return Response.json({ ok: !!data });
  } catch {
    return Response.json({ ok: false, error: "Erro ao verificar" }, { status: 500 });
  }
}
