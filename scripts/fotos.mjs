// Build do Vercel: baixa as fotos (Unsplash, licença livre) já recortadas e em WebP
// para /assets/img/fotos, servidas do mesmo domínio do site (melhor LCP).
// Para trocar uma foto: altere o "id" abaixo e faça um novo deploy.
import { mkdir, writeFile } from 'node:fs/promises';

const FOTOS = [
  // nome, id Unsplash, proporção (altura/largura), larguras geradas, recorte
  { nome: 'saude-hero', id: 'photo-1758691461957-474a7686e388', ar: 1.25, ws: [400, 600, 900], crop: 'faces', q: 62 },
  { nome: 'saude-docs', id: 'photo-1631557776808-91908aba7ca0', ar: 0.9, ws: [600, 1000] },
  { nome: 'pcd-hero', id: 'photo-1764173038973-9f2d6094b6bc', ar: 1.25, ws: [400, 600, 900], crop: 'faces', q: 62 },
  { nome: 'pcd-trabalho', id: 'photo-1758611972595-ac23d772446f', ar: 0.9, ws: [600, 1000] }
];

const dir = new URL('../assets/img/fotos/', import.meta.url);
await mkdir(dir, { recursive: true });

for (const f of FOTOS) {
  for (const w of f.ws) {
    const h = Math.round(w * f.ar);
    const url = `https://images.unsplash.com/${f.id}?fm=webp&fit=crop&w=${w}&h=${h}&q=${f.q || 70}${f.crop ? '&crop=' + f.crop : ''}`;
    let ok = false;
    for (let t = 1; t <= 3 && !ok; t++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        await writeFile(new URL(`${f.nome}-${w}.webp`, dir), Buffer.from(await r.arrayBuffer()));
        ok = true;
      } catch (e) {
        console.error(`tentativa ${t} falhou para ${f.nome}-${w}:`, e.message);
      }
    }
    if (!ok) { console.error('Falha ao baixar foto, abortando build'); process.exit(1); }
    console.log('ok', `${f.nome}-${w}.webp`);
  }
}
