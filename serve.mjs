// Serves the project folder on http://localhost:8731 so a signed PDF can be viewed in a browser.
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('.');
http.createServer((req, res) => {
  const f = decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/^\//, '');
  try {
    const file = path.resolve(root, f);
    if (!file.startsWith(root + path.sep)) throw new Error('outside project folder');
    const buf = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': f.endsWith('.pdf') ? 'application/pdf' : 'text/html' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('nope'); }
}).listen(8731, '127.0.0.1', () => console.log('serving on http://localhost:8731'));
