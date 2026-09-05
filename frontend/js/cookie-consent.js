(function () {
  'use strict';

  // ID de mensuração do Google Analytics 4. Troque pelo ID real da loja
  // (formato G-XXXXXXXXXX) antes de publicar. Se ficar vazio, nenhum
  // script de analytics é carregado, mesmo que o usuário aceite.
  var GA_MEASUREMENT_ID = '';

  var CONSENT_KEY = 'rota1615_cookie_consent'; // valores: 'accepted' | 'rejected'

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  // Só carrega o Google Analytics se: (1) o usuário clicou em "Aceitar" e
  // (2) existe um GA_MEASUREMENT_ID configurado. Nada é carregado por padrão.
  function loadAnalytics() {
    if (!GA_MEASUREMENT_ID || window.__gaLoaded) return;
    window.__gaLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // anonymize_ip mantém o padrão de minimização de dados mesmo com consentimento.
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function revokeAnalytics() {
    // Se o usuário aceitou antes e depois recusa, paramos de enviar eventos
    // e removemos os cookies de mensuração que o GA possa ter criado.
    window.__gaLoaded = false;
    window.gtag = function () {};
    ['_ga', '_ga_' + GA_MEASUREMENT_ID.replace('G-', ''), '_gid', '_gat'].forEach(function (name) {
      document.cookie = name + '=; Max-Age=0; path=/;';
      document.cookie = name + '=; Max-Age=0; path=/; domain=.' + location.hostname.replace(/^www\./, '');
    });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var banner = document.getElementById('cookieBanner');
    if (!banner) return;

    var acceptBtn = document.getElementById('cookieAccept');
    var rejectBtn = document.getElementById('cookieReject');

    var existing = getConsent();
    if (existing === 'accepted') {
      loadAnalytics();
    } else if (existing === 'rejected') {
      // nada a carregar
    } else {
      banner.hidden = false;
    }

    if (acceptBtn) acceptBtn.addEventListener('click', function () {
      setConsent('accepted');
      banner.hidden = true;
      loadAnalytics();
    });

    if (rejectBtn) rejectBtn.addEventListener('click', function () {
      setConsent('rejected');
      banner.hidden = true;
      revokeAnalytics();
    });

    var revokeBtn = document.getElementById('revokeCookiesBtn');
    var revokeFeedback = document.getElementById('revokeCookiesFeedback');
    if (revokeBtn) revokeBtn.addEventListener('click', function () {
      setConsent('rejected');
      revokeAnalytics();
      if (revokeFeedback) revokeFeedback.hidden = false;
    });
  });

  // Exposto para a página de Privacidade poder oferecer "gerenciar cookies".
  window.RotaCookieConsent = {
    get: getConsent,
    accept: function () { setConsent('accepted'); loadAnalytics(); },
    reject: function () { setConsent('rejected'); revokeAnalytics(); }
  };
})();
