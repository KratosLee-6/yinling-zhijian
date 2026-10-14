#!/usr/bin/env node
/* 本地试用服务器：node tools/serve.cjs [端口]  →  http://127.0.0.1:8931/
 * 只做静态文件服务，绑定环回地址，带路径穿越防护，不发起任何外部请求。 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const port = Number(process.argv[2]) || 8931;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.md':'text/markdown; charset=utf-8' };

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch (e) { res.writeHead(400); return res.end('bad request'); }
  if (pathname === '/') pathname = '/index.html';
  const target = path.normalize(path.join(root, pathname));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(target, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404 not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log('银龄指尖本地试用: http://127.0.0.1:' + port + '/'));
