// Ejecuta las herramientas de assets en Chrome/Edge sin ventana y con un perfil temporal aislado.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';

export const requestBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
};

export async function runBrowserTask(page, handleRequest, timeoutMs = 15 * 60 * 1000) {
  const browser = [
    process.env.BROWSER_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => p && existsSync(p));
  if (!browser) throw new Error('No encontré Chrome ni Edge. Define BROWSER_PATH.');

  let finish;
  const finished = new Promise((ok) => {
    finish = ok;
  });
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/') {
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(page);
      } else if (url.pathname === '/done') {
        const result = (await requestBody(req)).toString();
        res.end('ok');
        finish(result);
      } else if (url.pathname === '/log') {
        console.log((await requestBody(req)).toString());
        res.end('ok');
      } else await handleRequest(req, res, url);
    } catch (e) {
      res.statusCode = 500;
      res.end(String(e.stack || e));
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const taskTempRoot = resolve(tmpdir());
  const profile = await mkdtemp(join(taskTempRoot, 'basedex-browser-'));
  const child = spawn(
    browser,
    [
      '--headless=new',
      '--no-first-run',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      `--user-data-dir=${profile}`,
      `http://127.0.0.1:${server.address().port}/`,
    ],
    { stdio: 'ignore', windowsHide: true },
  );
  child.on('error', (e) => finish(`ERROR: ${e.message}`));
  child.on('exit', (code) =>
    finish(`ERROR: navegador terminó antes de completar la tarea (${code})`),
  );
  const timeout = setTimeout(() => finish('ERROR: tiempo agotado'), timeoutMs);
  try {
    const result = await finished;
    if (result !== 'ok') throw new Error(result);
  } finally {
    clearTimeout(timeout);
    child.kill();
    server.closeAllConnections();
    server.close();
    // Antes de borrar recursivamente, verifica el destino absoluto y su contención en la carpeta temporal.
    const rel = relative(taskTempRoot, resolve(profile));
    if (
      !isAbsolute(rel) &&
      !rel.startsWith('..') &&
      basename(profile).startsWith('basedex-browser-')
    ) {
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(
        () => undefined,
      );
    }
  }
}
