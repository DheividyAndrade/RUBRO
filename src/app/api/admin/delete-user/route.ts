import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user } } = await supabaseAdmin.auth.getUser(
    request.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  );

  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "LEADER" && profile.role !== "VICE")) {
    return Response.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { userId } = await request.json();
    if (!userId) return Response.json({ error: "ID do usuário ausente" }, { status: 400 });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
