(() => {
  'use strict';

  const copyButtons = Array.from(document.querySelectorAll('[data-copy-text]'));
  const status = document.querySelector('[data-copy-status]');
  let statusTimer = 0;

  const fallbackCopy = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    field.style.pointerEvents = 'none';
    document.body.appendChild(field);
    field.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    field.remove();
    return copied;
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return fallbackCopy(text);
  };

  const showStatus = (message) => {
    if (!status) return;

    window.clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.add('is-visible');

    statusTimer = window.setTimeout(() => {
      status.classList.remove('is-visible');
    }, 2600);
  };

  copyButtons.forEach((button) => {
    const label = button.querySelector('[data-copy-button-label]');
    const defaultText = label ? label.textContent : '';

    button.addEventListener('click', async () => {
      const text = button.dataset.copyText || '';
      const itemLabel = button.dataset.copyLabel || 'Informação';
      if (!text) return;

      try {
        const copied = await copyText(text);
        if (!copied) throw new Error('Não foi possível copiar.');

        button.classList.add('is-copied');
        if (label) label.textContent = 'Copiado';
        showStatus(`${itemLabel} copiado.`);

        window.setTimeout(() => {
          button.classList.remove('is-copied');
          if (label) label.textContent = defaultText;
        }, 2200);
      } catch (error) {
        showStatus(`Não foi possível copiar ${itemLabel.toLowerCase()}. Selecione o texto manualmente.`);
      }
    });
  });

  document.querySelectorAll('[data-support-qr]').forEach((root) => {
    const image = root.querySelector('[data-support-qr-image]');
    if (!image) return;

    const showImage = () => root.classList.add('is-loaded');
    const showPlaceholder = () => root.classList.remove('is-loaded');

    image.addEventListener('load', showImage, { once: true });
    image.addEventListener('error', showPlaceholder, { once: true });

    if (image.complete) {
      if (image.naturalWidth > 0) showImage();
      else showPlaceholder();
    }
  });
})();
