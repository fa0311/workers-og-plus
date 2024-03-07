export async function loadGoogleFont({
  family,
  weight,
  text,
}: {
  family: string;
  weight?: number;
  text?: string;
}) {
  const params: Record<string, string> = {
    family: `${encodeURIComponent(family)}${weight ? `:wght@${weight}` : ""}`,
  };

  if (text) {
    params.text = text;
  } else {
    params.subset = "latin";
  }

  const url = `https://fonts.googleapis.com/css2?${Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&")}`;

  // @ts-ignore
  const cache = caches.default;
  const cacheKey = url;

  const res = await (async () => {
    const cacheRes = await cache.match(cacheKey);
    if (cacheRes) {
      return cacheRes;
    } else {
      const res = await fetch(`${url}`, {
        headers: {
          // construct user agent to get TTF font
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      });
      if (res === undefined) {
        throw new Error("Failed to fetch font");
      }

      const newRes = new Response(res.body as BodyInit, res);
      newRes.headers.append("Cache-Control", "s-maxage=3600");
      await cache.put(cacheKey, newRes.clone());
      return newRes;
    }
  })();

  const body = await res.text();
  // Get the font URL from the CSS text
  const fontUrl = body.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  )?.[1];

  if (!fontUrl) {
    throw new Error("Could not find font URL");
  }

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}