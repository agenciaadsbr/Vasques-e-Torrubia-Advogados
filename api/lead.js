// Recebe o lead das LPs e repassa para a integração configurada.
// Configure no Vercel a variável de ambiente LEAD_WEBHOOK_URL (CRM, automação ou planilha).
// Sem ela, a função responde 503 e o visitante NÃO é redirecionado — nada é simulado.

const FRENTES = new Set(['direito_saude', 'direitos_pcd']);
const CAMPOS_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

function limpa(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Campo isca contra robôs: se vier preenchido, aceita em silêncio sem repassar.
  if (limpa(body.site, 200)) return res.status(200).json({ ok: true });

  const nome = limpa(body.nome, 120);
  const whatsapp = limpa(body.whatsapp, 20).replace(/\D/g, '');
  const frente = limpa(body.frente, 40);

  if (nome.length < 2) return res.status(400).json({ ok: false, error: 'nome_invalido' });
  if (whatsapp.length < 10 || whatsapp.length > 11) return res.status(400).json({ ok: false, error: 'whatsapp_invalido' });
  if (!FRENTES.has(frente)) return res.status(400).json({ ok: false, error: 'frente_invalida' });

  const lead = {
    nome,
    whatsapp: '55' + whatsapp,
    frente,
    frente_label: frente === 'direito_saude' ? 'Direito à Saúde' : 'Direitos da Pessoa com Deficiência',
    pagina_origem: limpa(body.pagina_origem, 200),
    referrer: limpa(body.referrer, 500),
    criado_em: new Date().toISOString(),
    user_agent: limpa(req.headers['user-agent'], 300)
  };
  CAMPOS_UTM.forEach((k) => { lead[k] = limpa(body[k], 300); });

  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    console.error('[lead] LEAD_WEBHOOK_URL não configurada — lead não registrado');
    return res.status(503).json({ ok: false, error: 'integracao_nao_configurada' });
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.LEAD_WEBHOOK_TOKEN) headers.Authorization = 'Bearer ' + process.env.LEAD_WEBHOOK_TOKEN;
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(lead), signal: AbortSignal.timeout(8000) });
    if (!r.ok) {
      console.error('[lead] webhook respondeu', r.status);
      return res.status(502).json({ ok: false, error: 'falha_integracao' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[lead] erro ao enviar', e && e.message);
    return res.status(502).json({ ok: false, error: 'falha_integracao' });
  }
};
