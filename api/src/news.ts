import { XMLParser } from 'fast-xml-parser';

export const NEWS_CHANNELS: Record<string, string> = {
  mlb: '',
  nyy: 'yankees',
  bos: 'redsox',
  hou: 'astros',
  tor: 'bluejays',
  bal: 'orioles',
  tex: 'rangers',
  det: 'tigers',
  cle: 'guardians',
  tb: 'rays',
  cws: 'whitesox',
  kc: 'royals',
  min: 'twins',
  ath: 'athletics',
  laa: 'angels',
  sea: 'mariners',
};
export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string | null;
  image: string | null;
}
export interface NewsFeed {
  channel: string;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  stale: boolean;
  items: NewsItem[];
}
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true });
const officialUrl = (value: unknown, image = false): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const valid = image ? url.hostname === 'img.mlbstatic.com' : url.hostname === 'www.mlb.com';
    return url.protocol === 'https:' && valid && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
};

export function parseNews(xml: string): NewsItem[] {
  // RSS oficial, sin DTD ni entidades externas. Solo se muestran titulares y enlaces, nunca HTML remoto.
  if (xml.length > 2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('Feed no válido');
  const channel = parser.parse(xml)?.rss?.channel;
  if (!channel) throw Error('Feed no válido');
  const rows = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const row of rows) {
    const url = officialUrl(row.link);
    const title =
      typeof row.title === 'string'
        ? row.title
            .replace(/<[^>]*>/g, '')
            .trim()
            .slice(0, 300)
        : '';
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);
    const time = Date.parse(row.pubDate);
    items.push({
      title,
      url,
      publishedAt: Number.isFinite(time) ? new Date(time).toISOString() : null,
      image: officialUrl(row.image?.['@_href'], true),
    });
    if (items.length === 10) break;
  }
  if (!items.length) throw Error('Feed sin noticias');
  return items;
}

/** Caché por canal y peticiones concurrentes agrupadas; conserva el último feed si MLB falla. */
export function createNewsService(fetcher: typeof fetch = fetch, now = () => Date.now()) {
  const cache = new Map<string, { time: number; feed: NewsFeed }>();
  const pending = new Map<string, Promise<NewsFeed>>();
  return async (channel: string): Promise<NewsFeed> => {
    if (!Object.hasOwn(NEWS_CHANNELS, channel)) throw Error('Canal inválido');
    const saved = cache.get(channel);
    if (saved && now() - saved.time < 10 * 60_000) return saved.feed;
    if (pending.has(channel)) return pending.get(channel)!;
    const job = (async () => {
      const slug = NEWS_CHANNELS[channel];
      const prefix = 'https://www.mlb.com/' + (slug ? slug + '/' : '');
      try {
        const response = await fetcher(prefix + 'feeds/news/rss.xml', {
          signal: AbortSignal.timeout(8_000),
          headers: { accept: 'application/rss+xml, text/xml' },
        });
        if (!response.ok) throw Error('RSS no disponible');
        const feed: NewsFeed = {
          channel,
          source: 'MLB.com',
          sourceUrl: prefix + 'news',
          fetchedAt: new Date(now()).toISOString(),
          stale: false,
          items: parseNews(await response.text()),
        };
        cache.set(channel, { time: now(), feed });
        return feed;
      } catch (error) {
        if (saved && now() - saved.time < 24 * 60 * 60_000) return { ...saved.feed, stale: true };
        throw error;
      }
    })();
    pending.set(channel, job);
    try {
      return await job;
    } finally {
      pending.delete(channel);
    }
  };
}
export const newsFeed = createNewsService();
