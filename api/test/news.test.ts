import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNewsService, NEWS_CHANNELS, parseNews } from '../src/news.js';

const xml = `<rss><channel><item><title><![CDATA[News & <b>baseball</b>]]></title><link>https://www.mlb.com/news/test</link><pubDate>Sat, 14 Nov 2026 16:20:11 GMT</pubDate><image href="https://img.mlbstatic.com/test.jpg"/></item></channel></rss>`;
describe('Canales RSS oficiales', () => {
  it('normaliza RSS y elimina HTML, duplicados y enlaces no oficiales', () => {
    const unsafe = xml.replace(
      '</channel>',
      `<item><title>unsafe</title><link>javascript:alert(1)</link></item><item><title>duplicate</title><link>https://www.mlb.com/news/test</link></item></channel>`,
    );
    const items = parseNews(unsafe);
    assert.equal(items.length, 1);
    assert.equal(items[0].title, 'News & baseball');
    assert.equal(items[0].publishedAt, '2026-11-14T16:20:11.000Z');
    assert.equal(items[0].image, 'https://img.mlbstatic.com/test.jpg');
    assert.throws(() => parseNews('<!DOCTYPE rss><rss/>'));
    assert.throws(() => parseNews('<html>error</html>'));
  });
  it('incluye la liga y los quince equipos, sin aceptar URLs arbitrarias', async () => {
    assert.equal(Object.keys(NEWS_CHANNELS).length, 16);
    const service = createNewsService(async () => {
      throw Error('No debe llamar la red');
    });
    await assert.rejects(service('https://example.com'));
    await assert.rejects(service('__proto__'));
  });
  it('agrupa consultas concurrentes y conserva cachés separadas por equipo', async () => {
    const urls: string[] = [];
    const service = createNewsService(async (url) => {
      urls.push(String(url));
      return new Response(xml);
    });
    await Promise.all([service('nyy'), service('nyy')]);
    await service('nyy');
    await service('bos');
    assert.deepEqual(urls, [
      'https://www.mlb.com/yankees/feeds/news/rss.xml',
      'https://www.mlb.com/redsox/feeds/news/rss.xml',
    ]);
  });
  it('identifica noticias guardadas durante una caída y no sirve datos vencidos por más de un día', async () => {
    let time = 0,
      down = false;
    const service = createNewsService(
      async () => {
        if (down) throw Error('offline');
        return new Response(xml);
      },
      () => time,
    );
    assert.equal((await service('mlb')).stale, false);
    time = 11 * 60_000;
    down = true;
    assert.equal((await service('mlb')).stale, true);
    time = 25 * 60 * 60_000;
    await assert.rejects(service('mlb'));
  });
});
