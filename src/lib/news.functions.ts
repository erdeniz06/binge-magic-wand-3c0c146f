import { createServerFn } from "@tanstack/react-start";

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string | null;
  description: string;
  image: string | null;
  source: string;
};

const FEEDS = [
  { url: "https://www.tvline.com/feed/", source: "TVLine" },
];


function pick(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m?.[1] ?? "";
}

function clean(raw: string) {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#\d+;/g, "")
    .trim();
}

function findImage(block: string) {
  const media = block.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i)?.[1];
  if (media) return media;
  const enclosure = block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1];
  if (enclosure) return enclosure;
  const inline = block.match(/<img[^>]*src="([^"]+)"/i)?.[1];
  return inline ?? null;
}

/** Latest TV news from TVLine's public RSS feed. */
export const getTvNews = createServerFn({ method: "GET" }).handler(async (): Promise<NewsItem[]> => {
  const items: NewsItem[] = [];

  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { accept: "application/rss+xml, application/xml, text/xml", "user-agent": "BingeBox/1.0" },
        });
        if (!res.ok) return;
        const xml = await res.text();
        const blocks = xml.split(/<item[\s>]/i).slice(1);
        for (const raw of blocks.slice(0, 20)) {
          const block = raw.slice(0, raw.search(/<\/item>/i) + 1 || undefined);
          const title = clean(pick(block, "title"));
          const link = clean(pick(block, "link"));
          if (!title || !link) continue;
          const pub = clean(pick(block, "pubDate"));
          items.push({
            title,
            link,
            pubDate: pub ? new Date(pub).toISOString() : null,
            description: clean(pick(block, "description")).slice(0, 320),
            image: findImage(block),
            source: feed.source,
          });
        }
      } catch {
        // ignore feed failures
      }
    }),
  );

  items.sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? ""));
  return items.slice(0, 20);
});
