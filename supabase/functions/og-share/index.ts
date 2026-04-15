import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "KTH i bilder";
  const image = url.searchParams.get("image") || "";
  const source = url.searchParams.get("source") || "";
  const year = url.searchParams.get("year") || "";
  const photoId = url.searchParams.get("id") || "";
  const appYear = url.searchParams.get("appYear") || "";

  const appUrl = new URL("https://kth-i-bilder.lovable.app/");
  if (photoId) appUrl.searchParams.set("photo", photoId);
  if (appYear) appUrl.searchParams.set("year", appYear);
  const redirectUrl = appUrl.toString();

  const description = [source, year ? `(${year})` : ""].filter(Boolean).join(" ") ||
    "KTH:s historia i bilder – fotografier från öppna arkiv";

  const ogImage = image || "https://kth-i-bilder.lovable.app/og-image.jpg";

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8"/>
<title>${esc(title)} – KTH i bilder</title>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image" content="${esc(ogImage)}"/>
<meta property="og:url" content="${esc(redirectUrl)}"/>
<meta property="og:site_name" content="KTH i bilder"/>
<meta property="og:locale" content="sv_SE"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${esc(ogImage)}"/>
<meta http-equiv="refresh" content="0;url=${esc(redirectUrl)}"/>
</head>
<body>
<p>Omdirigerar till <a href="${esc(redirectUrl)}">KTH i bilder</a>…</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
