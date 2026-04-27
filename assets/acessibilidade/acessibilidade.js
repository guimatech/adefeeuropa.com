(function () {
  'use strict';

  // --- State ---
  var state = {
    fontSize: 0,       // -3 to +5 steps
    contrast: false,
    grayscale: false,
    ttsActive: false
  };

  var synth = window.speechSynthesis || null;
  var currentUtterance = null;

  // --- Build UI ---
  var toggle = document.createElement('button');
  toggle.id = 'a11y-toggle';
  toggle.setAttribute('aria-label', 'Acessibilidade');
  toggle.title = 'Acessibilidade';
  toggle.innerHTML = '<i class="bx bx-universal-access"></i>';

  var panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Painel de Acessibilidade');
  panel.innerHTML =
    '<h6><i class="bx bx-universal-access"></i> Acessibilidade</h6>' +

    '<div class="a11y-row">' +
      '<span>Tamanho da fonte</span>' +
      '<div class="a11y-btns">' +
        '<button class="a11y-btn" id="a11y-font-down" aria-label="Diminuir fonte">A-</button>' +
        '<button class="a11y-btn" id="a11y-font-reset" aria-label="Fonte padrão">A</button>' +
        '<button class="a11y-btn" id="a11y-font-up" aria-label="Aumentar fonte">A+</button>' +
      '</div>' +
    '</div>' +

    '<button class="a11y-full-btn" id="a11y-contrast">' +
      '<i class="bx bx-adjust"></i> Alto Contraste' +
    '</button>' +

    '<button class="a11y-full-btn" id="a11y-gray">' +
      '<i class="bx bx-palette"></i> Escala de Cinza' +
    '</button>' +

    (synth ?
      '<button class="a11y-full-btn" id="a11y-tts">' +
        '<i class="bx bx-volume-full"></i> Ler página em voz alta' +
      '</button>' : '') +

    '<button class="a11y-full-btn" id="a11y-reset" style="margin-top:0.3rem; border-color:#c0392b; color:#c0392b;">' +
      '<i class="bx bx-reset"></i> Restaurar padrão' +
    '</button>';

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  // --- Toggle panel ---
  toggle.addEventListener('click', function () {
    panel.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (!panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  // --- Font size ---
  function applyFontSize() {
    document.documentElement.style.fontSize = (100 + state.fontSize * 8) + '%';
  }
  document.getElementById('a11y-font-up').addEventListener('click', function () {
    if (state.fontSize < 5) { state.fontSize++; applyFontSize(); }
  });
  document.getElementById('a11y-font-down').addEventListener('click', function () {
    if (state.fontSize > -3) { state.fontSize--; applyFontSize(); }
  });
  document.getElementById('a11y-font-reset').addEventListener('click', function () {
    state.fontSize = 0; applyFontSize();
  });

  // --- High contrast ---
  var contrastBtn = document.getElementById('a11y-contrast');
  contrastBtn.addEventListener('click', function () {
    state.contrast = !state.contrast;
    document.documentElement.classList.toggle('a11y-high-contrast', state.contrast);
    contrastBtn.classList.toggle('active', state.contrast);
  });

  // --- Grayscale ---
  var grayBtn = document.getElementById('a11y-gray');
  grayBtn.addEventListener('click', function () {
    state.grayscale = !state.grayscale;
    document.documentElement.classList.toggle('a11y-grayscale', state.grayscale);
    grayBtn.classList.toggle('active', state.grayscale);
  });

  // --- Text-to-Speech ---
  if (synth) {
    var ttsBtn = document.getElementById('a11y-tts');
    ttsBtn.addEventListener('click', function () {
      if (state.ttsActive) {
        synth.cancel();
        state.ttsActive = false;
        ttsBtn.classList.remove('active');
        ttsBtn.innerHTML = '<i class="bx bx-volume-full"></i> Ler página em voz alta';
        var highlighted = document.querySelectorAll('.a11y-tts-reading');
        highlighted.forEach(function (el) { el.classList.remove('a11y-tts-reading'); });
        return;
      }

      state.ttsActive = true;
      ttsBtn.classList.add('active');
      ttsBtn.innerHTML = '<i class="bx bx-stop"></i> Parar leitura';

      var blocks = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,label,figcaption,.mbr-text,.card-text,.card-title');
      var i = 0;

      function readNext() {
        if (i >= blocks.length || !state.ttsActive) {
          state.ttsActive = false;
          ttsBtn.classList.remove('active');
          ttsBtn.innerHTML = '<i class="bx bx-volume-full"></i> Ler página em voz alta';
          return;
        }
        var el = blocks[i];
        var text = (el.innerText || '').trim();
        if (!text || text.length < 2) { i++; readNext(); return; }

        el.classList.add('a11y-tts-reading');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        var utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'pt-BR';
        utt.rate = 0.95;
        utt.onend = function () {
          el.classList.remove('a11y-tts-reading');
          i++;
          readNext();
        };
        utt.onerror = function () {
          el.classList.remove('a11y-tts-reading');
          i++;
          readNext();
        };
        synth.speak(utt);
      }
      readNext();
    });
  }

  // --- Reset ---
  document.getElementById('a11y-reset').addEventListener('click', function () {
    state.fontSize = 0;
    state.contrast = false;
    state.grayscale = false;
    state.ttsActive = false;
    if (synth) synth.cancel();
    document.documentElement.style.fontSize = '';
    document.documentElement.classList.remove('a11y-high-contrast', 'a11y-grayscale');
    contrastBtn.classList.remove('active');
    grayBtn.classList.remove('active');
    if (synth) {
      var ttsBtn = document.getElementById('a11y-tts');
      ttsBtn.classList.remove('active');
      ttsBtn.innerHTML = '<i class="bx bx-volume-full"></i> Ler página em voz alta';
    }
    var highlighted = document.querySelectorAll('.a11y-tts-reading');
    highlighted.forEach(function (el) { el.classList.remove('a11y-tts-reading'); });
  });

})();
