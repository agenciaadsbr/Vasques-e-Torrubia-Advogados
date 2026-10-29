/* Rastreamento — estrutura preparada, DESATIVADA.
   Preencha os IDs apenas quando forem fornecidos. Com os campos vazios, nada é carregado nem disparado. */
window.VT_CONFIG = {
  metaPixelId: '',      // Meta Ads (Pixel) — ex.: '123456789012345'
  googleAdsId: '',      // Google Ads — ex.: 'AW-XXXXXXXXX' (inativo nesta etapa)
  googleAdsLeadLabel: ''
};

(function (cfg) {
  var track = [];
  if (cfg.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', cfg.metaPixelId);
    window.fbq('track', 'PageView');
    track.push(function (ev, data) { window.fbq('track', ev, data || {}); });
  }
  if (cfg.googleAdsId) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.googleAdsId; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', cfg.googleAdsId);
    track.push(function (ev) { if (ev === 'Lead' && cfg.googleAdsLeadLabel) window.gtag('event', 'conversion', { send_to: cfg.googleAdsId + '/' + cfg.googleAdsLeadLabel }); });
  }
  window.VT_TRACK = function (ev, data) { track.forEach(function (fn) { try { fn(ev, data); } catch (e) {} }); };
})(window.VT_CONFIG);
