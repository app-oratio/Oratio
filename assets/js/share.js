(function () {
  'use strict';

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('Falha ao copiar')); }
      catch (error) { reject(error); }
      field.remove();
    });
  }

  document.querySelectorAll('[data-share-tools]').forEach(function (tools) {
    var title = tools.getAttribute('data-share-title') || document.title;
    var url = tools.getAttribute('data-share-url') || window.location.href;
    var status = tools.querySelector('[data-share-status]');
    var nativeButton = tools.querySelector('[data-native-share]');
    var copyButton = tools.querySelector('[data-copy-link]');

    if (nativeButton) {
      if (!navigator.share) nativeButton.hidden = true;
      else nativeButton.addEventListener('click', function () {
        navigator.share({ title: title, url: url }).catch(function (error) {
          if (error && error.name !== 'AbortError' && status) status.textContent = 'Não foi possível abrir o compartilhamento.';
        });
      });
    }
    if (copyButton) copyButton.addEventListener('click', function () {
      copyText(url).then(function () {
        var label = copyButton.querySelector('[data-copy-link-label]');
        if (label) label.textContent = 'Link copiado';
        if (status) status.textContent = 'Link copiado para a área de transferência.';
        window.setTimeout(function () { if (label) label.textContent = 'Copiar link'; }, 2200);
      }).catch(function () { if (status) status.textContent = 'Não foi possível copiar o link.'; });
    });
  });

  document.querySelectorAll('[data-copy-prayer]').forEach(function (prayerCopy) {
    var copySource = prayerCopy.closest('[data-prayer-copy-source]') || document;
    var prayerStatus = copySource.querySelector('[data-prayer-status]');
    var prayerTexts = Array.prototype.slice.call(copySource.querySelectorAll('[data-prayer-text]'));
    if (!prayerTexts.length) return;
    prayerCopy.addEventListener('click', function () {
      var title = document.querySelector('h1');
      var text = prayerTexts.map(function (prayerText) {
        return prayerText.innerText.trim();
      }).filter(Boolean).join('\n\n');
      var label = prayerCopy.querySelector('[data-copy-prayer-label]');
      var originalLabel = label ? label.textContent : '';
      copyText((title ? title.textContent + '\n\n' : '') + text)
        .then(function () {
          if (label) label.textContent = 'Texto copiado';
          if (prayerStatus) prayerStatus.textContent = 'O texto de oração foi copiado.';
          window.setTimeout(function () { if (label) label.textContent = originalLabel; }, 2200);
        })
        .catch(function () {
          if (prayerStatus) prayerStatus.textContent = 'Não foi possível copiar o texto.';
        });
    });
  });

  document.querySelectorAll('[data-print-page]').forEach(function (button) { button.addEventListener('click', function () { window.print(); }); });
}());
