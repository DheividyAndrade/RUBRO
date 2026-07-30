import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || serviceKey === "sua-service-role-key-aqui") {
      return Response.json({ error: "Service key não configurada no servidor" }, { status: 500 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "LEADER" && profile.role !== "VICE")) {
      return Response.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) return Response.json({ error: "ID do usuário ausente" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Erro interno" }, { status: 500 });
  }
}
