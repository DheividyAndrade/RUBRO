export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) return Response.json({ ok: false }, { status: 400 });

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return Response.json({ ok: false }, { status: 500 });

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });

    const data = await result.json();

    if (!data.success) {
      return Response.json({ ok: false }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
