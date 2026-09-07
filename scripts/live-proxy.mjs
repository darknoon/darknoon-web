// Comparison-only proxy of the deployed Gatsby site. Never part of dist/.
import http from 'node:http';
import https from 'node:https';
const port = Number(process.argv[2]);
if (!port) throw new Error('Usage: node scripts/live-proxy.mjs <port>');
http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  const target = new URL('https://darknoon.com');
  const local = new URL(req.url, 'http://localhost');
  target.pathname = local.pathname;
  target.search = local.search;
  const upstream = https.get(target, { method: req.method }, response => {
    const headers = { ...response.headers };
    if (headers.location?.startsWith('https://darknoon.com')) headers.location = headers.location.replace('https://darknoon.com', '');
    res.writeHead(response.statusCode, headers);
    response.pipe(res);
  });
  upstream.on('error', () => res.writeHead(502).end('Unable to reach the live site'));
}).listen(port, '0.0.0.0', () => console.log(`Live Gatsby comparison: http://localhost:${port}`));
