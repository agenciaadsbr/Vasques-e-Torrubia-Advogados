// Recebe o lead das LPs e grava no Supabase "ADS BR CLIENTES" (tabela lp_leads, multi-tenant por "site").
// O redirecionamento para o WhatsApp só acontece se a gravação for confirmada (nada é simulado).
// Opcional: LEAD_WEBHOOK_URL no Vercel replica o lead para um CRM/automação (sem bloquear o visitante).

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qxhnjzyhtllmtdrcyygi.supabase.co';
// Chave pública (anon) — só permite INSERT nas tabelas de LP, pelas regras RLS do projeto.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aG5qenlodGxsbXRkcmN5eWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzczNjgsImV4cCI6MjA5NzgxMzM2OH0.DWf4I_x9F--H7ZZHUt_n4V3B__Nlsf1jNZdUV0vNBLU';

const SITES = { direito_saude: 'vasques-torrubia-saude', direitos_pcd: 'vasques-torrubia-pcd' };

function limpa(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
}

function origemDe(b) {
  const src = limpa(b.utm_source, 80).toLowerCase();
  const camp = limpa(b.utm_campaign, 120);
  let canal = '';
  if (limpa(b.fbclid, 10) || /facebook|instagram|meta|^fb|^ig/.test(src)) canal = 'Meta Ads';
  else if (limpa(b.gclid, 10) || /google/.test(src)) canal = 'Google Ads';
  else if (src) canal = src;
  else {
    try { canal = b.referrer ? new URL(b.referrer).hostname : ''; } catch (e) { canal = ''; }
  }
  if (!canal) canal = 'direto';
  return camp ? `${canal} | ${camp}` : canal;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Campo isca contra robôs: se vier preenchido, aceita em silêncio sem gravar.
  if (limpa(body.site, 200)) return res.status(200).json({ ok: true });

  const nome = limpa(body.nome, 120);
  const whatsapp = limpa(body.whatsapp, 20).replace(/\D/g, '');
  const site = SITES[limpa(body.frente, 40)];

  if (nome.length < 2) return res.status(400).json({ ok: false, error: 'nome_invalido' });
  if (whatsapp.length < 10 || whatsapp.length > 11) return res.status(400).json({ ok: false, error: 'whatsapp_invalido' });
  if (!site) return res.status(400).json({ ok: false, error: 'frente_invalida' });

  const lead = { site, nome, whatsapp, origem: origemDe(body) };

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/lp_leads`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) {
      console.error('[lead] supabase respondeu', r.status, (await r.text()).slice(0, 200));
      return res.status(502).json({ ok: false, error: 'falha_ao_gravar' });
    }
  } catch (e) {
    console.error('[lead] erro ao gravar', e && e.message);
    return res.status(502).json({ ok: false, error: 'falha_ao_gravar' });
  }

  // Réplica opcional para CRM/automação — não bloqueia nem derruba o envio.
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      const h = { 'Content-Type': 'application/json' };
      if (process.env.LEAD_WEBHOOK_TOKEN) h.Authorization = 'Bearer ' + process.env.LEAD_WEBHOOK_TOKEN;
      await fetch(hook, { method: 'POST', headers: h, body: JSON.stringify({ ...lead, whatsapp: '55' + whatsapp, pagina_origem: limpa(body.pagina_origem, 200), criado_em: new Date().toISOString() }), signal: AbortSignal.timeout(4000) });
    } catch (e) { console.error('[lead] webhook falhou', e && e.message); }
  }

  return res.status(200).json({ ok: true });
};
