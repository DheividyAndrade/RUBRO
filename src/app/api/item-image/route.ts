export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return new Response(null, { status: 400 });

  try {
    const wikiUrl = `https://www.tibiawiki.com.br/wiki/Especial:Redirecionar?file=${encodeURIComponent(name)}.gif`;
    const res = await fetch(wikiUrl, {
      redirect: "follow",
      headers: { "User-Agent": "RubroGuildManager/1.0" },
    });

    if (!res.ok) return new Response(null, { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/gif";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
