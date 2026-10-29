/* Vasques e Torrubia — comportamento das LPs (formulário + motion). Carregado com defer. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cabeçalho ao rolar + CTA fixo no celular ---------- */
  var hdr = document.querySelector('.hdr');
  var mcta = document.querySelector('.mcta');
  var hero = document.querySelector('.hero');
  var contato = document.getElementById('contato');
  function onScroll() { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (mcta && 'IntersectionObserver' in window) {
    var visivel = { hero: true, contato: false };
    var ioC = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visivel[e.target === hero ? 'hero' : 'contato'] = e.isIntersecting; });
      mcta.classList.toggle('is-on', !visivel.hero && !visivel.contato);
    }, { threshold: 0 });
    if (hero) ioC.observe(hero);
    if (contato) ioC.observe(contato);
  }

  /* ---------- Revelação ao rolar ---------- */
  var alvos = document.querySelectorAll('.rv, .steps');
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    alvos.forEach(function (el) { io.observe(el); });
  } else {
    alvos.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Luz que segue o cursor nos cards ---------- */
  if (!reduz && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (ev) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        c.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Faixa animada: botão de pausa (acessibilidade) ---------- */
  var tk = document.querySelector('.ticker');
  var tkb = document.querySelector('.ticker__pause');
  if (tk && tkb) {
    tkb.addEventListener('click', function () {
      var p = tk.classList.toggle('is-paused');
      tkb.setAttribute('aria-pressed', p ? 'true' : 'false');
      tkb.setAttribute('aria-label', p ? 'Retomar animação' : 'Pausar animação');
      tkb.innerHTML = p ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    });
  }

  /* ---------- Formulário de leads ---------- */
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  var utms = {};
  try { utms = JSON.parse(sessionStorage.getItem('vt_utm') || '{}'); } catch (e) {}
  var q = new URLSearchParams(window.location.search);
  UTM.forEach(function (k) { if (q.get(k)) utms[k] = q.get(k); });
  try { sessionStorage.setItem('vt_utm', JSON.stringify(utms)); } catch (e) {}

  function mascara(v) {
    var d = (v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  document.querySelectorAll('form[data-vt-lead]').forEach(function (form) {
    var nome = form.querySelector('[name="nome"]');
    var whats = form.querySelector('[name="whatsapp"]');
    var erro = form.querySelector('.vt-form__erro');
    var botao = form.querySelector('button[type="submit"]');
    var rotulo = botao.innerHTML;

    function falha(msg, campo) {
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
      if (n.length < 2) return falha('Informe seu nome para continuar.', nome);
      if (d.length < 10 || d.length > 11) return falha('Informe um WhatsApp com DDD, por exemplo (21) 90000-0000.', whats);

      botao.disabled = true;
      botao.textContent = 'Enviando...';
      erro.textContent = '';
      var hp = form.querySelector('[name="site"]');
      var dados = { nome: n, whatsapp: d, frente: form.getAttribute('data-frente'), pagina_origem: window.location.pathname, referrer: document.referrer || '', site: hp ? hp.value : '' };
      UTM.forEach(function (k) { dados[k] = utms[k] || ''; });

      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.ok) throw new Error('falha');
          if (window.VT_TRACK) window.VT_TRACK('Lead', { frente: dados.frente });
          window.location.href = form.getAttribute('data-obrigado');
        })
        .catch(function () {
          botao.disabled = false;
          botao.innerHTML = rotulo;
          falha('Não foi possível enviar agora. Tente novamente em instantes ou fale conosco pelo WhatsApp (21) 96963-9667.', null);
        });
    });
  });
})();
