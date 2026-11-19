/**
 * NexusTrack Universal Tracker Script v1.0
 * Rastreamento de UTMs, atribuição e injeção automática em checkouts
 */
(function() {
  'use strict';

  var STORAGE_KEY = '_nx_tracking_v1';
  var SCRIPT_TAG = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var OFFER_SLUG = (SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-offer')) || 'default';
  var API_HOST = (SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-api')) || (function() {
    if (SCRIPT_TAG && SCRIPT_TAG.src) {
      try {
        var u = new URL(SCRIPT_TAG.src);
        return u.origin;
      } catch (e) {}
    }
    return '';
  })();

  // 1. Extrai UTMs da URL atual
  function getUrlParams() {
    var params = {};
    try {
      var searchParams = new URLSearchParams(window.location.search);
      var keys = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'src', 'sck', 'fbclid', 'gclid', 'ttclid'
      ];
      keys.forEach(function(k) {
        var val = searchParams.get(k);
        if (val) params[k] = val;
      });
    } catch (e) {}
    return params;
  }

  // 2. Persistência em localStorage com fallback em cookie
  function loadPersistedParams() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveParams(params) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch (e) {}
  }

  // Mescla parâmetros atuais com os persistidos
  var currentUrlParams = getUrlParams();
  var persisted = loadPersistedParams();
  var merged = Object.assign({}, persisted, currentUrlParams);

  if (Object.keys(currentUrlParams).length > 0) {
    saveParams(merged);
  }

  // 3. Injetar UTMs nos botões de Checkout
  var CHECKOUT_DOMAINS = [
    'ggcheckout.app',
    'kiwify.com.br',
    'hotmart.com',
    'eduzz.com',
    'braip.com',
    'greenn.com.br',
    'perfectpay.com.br',
    'monetizze.com.br'
  ];

  function isCheckoutUrl(urlStr) {
    try {
      var u = new URL(urlStr, window.location.href);
      for (var i = 0; i < CHECKOUT_DOMAINS.length; i++) {
        if (u.hostname.indexOf(CHECKOUT_DOMAINS[i]) !== -1) return true;
      }
      if (u.pathname.indexOf('/checkout') !== -1) return true;
    } catch (e) {}
    return false;
  }

  function appendUtmsToUrl(originalUrl) {
    try {
      var u = new URL(originalUrl, window.location.href);
      Object.keys(merged).forEach(function(key) {
        if (!u.searchParams.has(key)) {
          u.searchParams.set(key, merged[key]);
        }
      });
      // Injeta também a identificação da oferta
      if (!u.searchParams.has('offer')) {
        u.searchParams.set('offer', OFFER_SLUG);
      }
      return u.toString();
    } catch (e) {
      return originalUrl;
    }
  }

  function patchCheckoutLinks() {
    var links = document.querySelectorAll('a[href]');
    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (isCheckoutUrl(href) || link.hasAttribute('data-checkout')) {
        link.setAttribute('href', appendUtmsToUrl(href));
      }
    });
  }

  // Intercepta cliques para links gerados dinamicamente
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a');
    if (!target) return;
    var href = target.getAttribute('href');
    if (!href) return;
    if (isCheckoutUrl(href) || target.hasAttribute('data-checkout')) {
      target.setAttribute('href', appendUtmsToUrl(href));
    }
  }, true);

  // 4. Disparo de Beacon de Visualização/Clique
  function trackPageView() {
    if (!API_HOST) return;
    var payload = {
      offer: OFFER_SLUG,
      url: window.location.href,
      referrer: document.referrer || '',
      utms: merged,
      timestamp: new Date().toISOString()
    };

    var endpoint = API_HOST + '/api/v1/track';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
  }

  // Execução no carregamento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      patchCheckoutLinks();
      trackPageView();
    });
  } else {
    patchCheckoutLinks();
    trackPageView();
  }

  // Repete o patch se houver mudanças dinâmicas no DOM
  if (window.MutationObserver) {
    var observer = new MutationObserver(function() {
      patchCheckoutLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.NexusTrack = {
    getParams: function() { return merged; },
    getOffer: function() { return OFFER_SLUG; }
  };
})();
