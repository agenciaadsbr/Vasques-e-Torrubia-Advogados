/* Formulário de leads — compartilhado pelas duas LPs.
   Cada <form data-vt-lead> informa a frente e a página de obrigado:
   data-frente="direito_saude" | "direitos_pcd"
   data-obrigado="/direito-a-saude/obrigado"
   O redirecionamento só acontece quando /api/lead confirma o registro. */
(function () {
  document.documentElement.classList.add('js');

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

  function lerUtms() {
    var salvo = {};
    try { salvo = JSON.parse(sessionStorage.getItem('vt_utm') || '{}'); } catch (e) {}
    var q = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (k) { if (q.get(k)) salvo[k] = q.get(k); });
    try { sessionStorage.setItem('vt_utm', JSON.stringify(salvo)); } catch (e) {}
    return salvo;
  }
  var utms = lerUtms();

  function mascara(v) {
    var d = (v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function initForm(form) {
    var nome = form.querySelector('[name="nome"]');
    var whats = form.querySelector('[name="whatsapp"]');
    var erro = form.querySelector('.vt-form__erro');
    var botao = form.querySelector('button[type="submit"]');
    var textoBotao = botao.textContent;

    function mostrarErro(msg, campo) {
      erro.textContent = msg;
      [nome, whats].forEach(function (c) { c.setAttribute('aria-invalid', c === campo ? 'true' : 'false'); });
      if (campo) campo.focus();
    }

    whats.addEventListener('input', function () { whats.value = mascara(whats.value); });
    [nome, whats].forEach(function (c) { c.addEventListener('input', function () { erro.textContent = ''; c.setAttribute('aria-invalid', 'false'); }); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = nome.value.trim();
      var d = whats.value.replace(/\D/g, '');
      if (n.length < 2) return mostrarErro('Informe seu nome para continuar.', nome);
      if (d.length < 10 || d.length > 11) return mostrarErro('Informe um WhatsApp com DDD, por exemplo (21) 90000-0000.', whats);

      botao.disabled = true;
      botao.textContent = 'Enviando...';
      erro.textContent = '';

      var payload = {
        nome: n,
        whatsapp: d,
        frente: form.getAttribute('data-frente'),
        pagina_origem: window.location.pathname,
        referrer: document.referrer || '',
        site: form.querySelector('[name="site"]') ? form.querySelector('[name="site"]').value : ''
      };
      UTM_KEYS.forEach(function (k) { payload[k] = utms[k] || ''; });

      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.ok) throw new Error(res.j.error || 'falha');
          if (window.VT_TRACK) window.VT_TRACK('Lead', { frente: payload.frente });
          try { sessionStorage.setItem('vt_lead_ok', payload.frente); } catch (e) {}
          window.location.href = form.getAttribute('data-obrigado');
        })
        .catch(function () {
          botao.disabled = false;
          botao.textContent = textoBotao;
          mostrarErro('Não foi possível enviar agora. Tente novamente em instantes ou fale conosco pelo WhatsApp (21) 96963-9667.', null);
        });
    });
  }

  document.querySelectorAll('form[data-vt-lead]').forEach(initForm);

  /* Animação de entrada (respeita prefers-reduced-motion via CSS) */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.vt-reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.vt-reveal').forEach(function (el) { el.classList.add('is-in'); });
  }
})();
