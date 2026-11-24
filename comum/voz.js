/* Joguinhos da Casa: voz e idioma compartilhados.
 * - L(pt, en): escolhe o texto do idioma atual.
 * - speak(texto, estilo): toca a fala gravada (comum/voz/<idioma>/<hash>.mp3).
 *   Se o arquivo não existir, usa a voz do aparelho, mas SÓ se for do idioma certo.
 * - Elementos com data-en="..." são traduzidos automaticamente.
 * - Botões com class="lang-toggle" trocam o idioma.
 */
(function () {
  var KEY = 'joguinhos-lang';
  var lang = 'pt';
  try { if (localStorage.getItem(KEY) === 'en') lang = 'en'; } catch (e) {}
  window.LANG = lang;
  window.L = function (pt, en) { return lang === 'en' ? en : pt; };
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';

  /* mesmo hash usado em ferramentas/gerar-vozes.mjs */
  function hash(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
  window.vozArquivo = function (text, style) { return hash(lang + '|' + (style || '') + '|' + text); };

  var me = document.currentScript && document.currentScript.src;
  var base = me ? new URL('voz/', me).href : 'comum/voz/';

  var actx = null;
  function ctx() {
    if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  /* desbloqueia o áudio no primeiro toque (iPad/iPhone exigem isso) */
  function unlock() {
    var c = ctx(); if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  }
  addEventListener('pointerdown', unlock, true);
  addEventListener('touchend', unlock, true);

  var cache = {};
  function decode(buf) {
    return new Promise(function (res, rej) { var c = ctx(); if (!c) return rej(); var p = c.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
  }
  function load(text, style) {
    var k = window.vozArquivo(text, style);
    if (!cache[k]) {
      cache[k] = fetch(base + lang + '/' + k + '.mp3')
        .then(function (r) { if (!r.ok) throw new Error('sem audio'); return r.arrayBuffer(); })
        .then(decode)
        .catch(function () { delete cache[k]; return null; });
    }
    return cache[k];
  }

  var cur = null, token = 0;
  function stop() {
    token++;
    if (cur) { try { cur.stop(); } catch (e) {} cur = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  /* reserva: voz do aparelho, apenas se for do idioma escolhido */
  var reserva = null;
  function pickReserva() {
    if (!('speechSynthesis' in window)) return;
    var want = lang === 'en' ? /^en/i : /^pt/i, pref = lang === 'en' ? /en[-_]US/i : /pt[-_]BR/i;
    var good = /natural|neural|enhanced|premium|online|google|luciana|francisca|felipe|samantha|jenny|aria/i;
    var vs = speechSynthesis.getVoices().filter(function (v) { return want.test(v.lang); });
    vs.sort(function (a, b) { var sa = (pref.test(a.lang) ? 2 : 0) + (good.test(a.name) ? 1 : 0), sb = (pref.test(b.lang) ? 2 : 0) + (good.test(b.name) ? 1 : 0); return sb - sa; });
    reserva = vs[0] || null;
  }
  if ('speechSynthesis' in window) { pickReserva(); speechSynthesis.onvoiceschanged = pickReserva; }
  function falaReserva(text, style) {
    if (!('speechSynthesis' in window)) return;
    if (!reserva) pickReserva();
    if (!reserva) return; /* sem voz do idioma certo: melhor ficar quieto do que falar com sotaque errado */
    var u = new SpeechSynthesisUtterance(text);
    u.voice = reserva; u.lang = reserva.lang;
    u.rate = 0.95; u.pitch = style === 'robo' ? 0.6 : style === 'monstro' ? 1.4 : 1.1;
    speechSynthesis.speak(u);
  }

  window.speak = function (text, style) {
    if (!text) return;
    stop();
    var my = token;
    load(text, style).then(function (buf) {
      if (my !== token) return;
      if (!buf) return falaReserva(text, style);
      var c = ctx(), s = c.createBufferSource();
      s.buffer = buf; s.connect(c.destination); s.start(0); cur = s;
      s.onended = function () { if (cur === s) cur = null; };
    });
  };
  window.speak.preload = function (list) { (list || []).forEach(function (x) { Array.isArray(x) ? load(x[0], x[1]) : load(x); }); };
  window.speak.stop = stop;

  /* tradução da página e botão de idioma */
  var css = '.lang-toggle{font-family:inherit;font-size:20px;border:4px solid #2d1b4e;background:#fff;color:#2d1b4e;border-radius:999px;padding:6px 16px;margin-top:14px;cursor:pointer;box-shadow:0 4px 0 #2d1b4e}.lang-toggle:active{transform:translateY(3px);box-shadow:0 1px 0 #2d1b4e}';
  function aplicar() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    if (lang === 'en') {
      document.querySelectorAll('[data-en]').forEach(function (el) {
        if (el.tagName === 'TITLE') el.textContent = el.getAttribute('data-en'); else el.innerHTML = el.getAttribute('data-en');
      });
    }
    document.querySelectorAll('.lang-toggle').forEach(function (b) {
      b.innerHTML = lang === 'en' ? '🇧🇷 Mudar para Português' : '🇺🇸 Play in English';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        try { localStorage.setItem(KEY, lang === 'en' ? 'pt' : 'en'); } catch (er) {}
        location.reload();
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar); else aplicar();
})();
