// Build do Vercel: carimba ?v=<hash do conteúdo> nos links de CSS/JS de todas as páginas.
// Assim cada publicação força o navegador a baixar os arquivos novos (sem cache velho).
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const ASSETS = ['/assets/css/lp.css', '/assets/js/lp.js', '/assets/js/tracking.js', '/assets/js/obrigado.js', '/assets/css/base.css'];
const raiz = new URL('../', import.meta.url);

const hashes = {};
for (const a of ASSETS) {
  try { hashes[a] = createHash('md5').update(await readFile(new URL('.' + a, raiz))).digest('hex').slice(0, 8); } catch {}
}

async function paginas(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'assets', 'api', 'scripts'].includes(e.name)) continue;
    const u = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    if (e.isDirectory()) out.push(...await paginas(u));
    else if (e.name === 'index.html') out.push(u);
  }
  return out;
}

for (const p of await paginas(raiz)) {
  let s = await readFile(p, 'utf8');
  const o = s;
  for (const [a, h] of Object.entries(hashes)) {
    const esc = a.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    s = s.replace(new RegExp(esc + '(\\?v=[0-9a-f]+)?"', 'g'), `${a}?v=${h}"`);
  }
  if (s !== o) { await writeFile(p, s); console.log('versionado', p.pathname); }
}
