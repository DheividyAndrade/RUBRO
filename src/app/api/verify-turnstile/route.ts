export async function POST(request: Request) {
  const token = await request.json().then((b) => b.token).catch(() => null);
  if (!token) return Response.json({ ok: false, error: "Token ausente" }, { status: 400 });

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return Response.json({ ok: false, error: "Servidor não configurado" }, { status: 500 });

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  }).then((r) => r.json()).catch(() => null);

  if (!result?.success) {
    return Response.json({ ok: false, error: "Verificação falhou" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
