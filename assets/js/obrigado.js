/* Página de obrigado: abre o WhatsApp oficial após ~3 segundos, com mensagem da frente.
   Não leva dados pessoais na URL. */
(function () {
  var el = document.querySelector('[data-wa-msg]');
  if (!el) return;
  var url = 'https://wa.me/5521969639667?text=' + encodeURIComponent(el.getAttribute('data-wa-msg'));
  var botao = document.getElementById('wa-botao');
  var contador = document.getElementById('wa-contador');
  botao.setAttribute('href', url);
  if (window.VT_TRACK) window.VT_TRACK('Contact', {});
  var s = 3;
  var t = setInterval(function () {
    s -= 1;
    if (contador) contador.textContent = String(Math.max(s, 0));
    if (s <= 0) { clearInterval(t); window.location.href = url; }
  }, 1000);
})();
