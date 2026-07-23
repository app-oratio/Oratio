(() => {
  'use strict';

  const page = document.querySelector('[data-contact-page]');
  if (!page) return;

  const copyButton = page.querySelector('[data-contact-copy]');
  const copyStatus = page.querySelector('[data-contact-copy-status]');
  let copyStatusTimer = 0;

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

  const showCopyStatus = (message) => {
    if (!copyStatus) return;

    window.clearTimeout(copyStatusTimer);
    copyStatus.textContent = message;
    copyStatus.classList.add('is-visible');
    copyStatusTimer = window.setTimeout(() => {
      copyStatus.classList.remove('is-visible');
    }, 2600);
  };

  if (copyButton) {
    const label = copyButton.querySelector('[data-contact-copy-button-label]');
    const defaultLabel = label ? label.textContent : '';

    copyButton.addEventListener('click', async () => {
      const text = copyButton.dataset.contactCopy || '';
      const itemLabel = copyButton.dataset.contactCopyLabel || 'Informação';
      if (!text) return;

      try {
        const copied = await copyText(text);
        if (!copied) throw new Error('Não foi possível copiar.');

        copyButton.classList.add('is-copied');
        if (label) label.textContent = 'Endereço copiado';
        showCopyStatus(`${itemLabel} copiado.`);

        window.setTimeout(() => {
          copyButton.classList.remove('is-copied');
          if (label) label.textContent = defaultLabel;
        }, 2200);
      } catch (error) {
        showCopyStatus(`Não foi possível copiar ${itemLabel.toLowerCase()}. Selecione o endereço manualmente.`);
      }
    });
  }

  const form = page.querySelector('[data-contact-form]');
  if (!form) return;

  const messageField = form.querySelector('[data-contact-message]');
  const counter = form.querySelector('[data-contact-counter]');
  const submitButton = form.querySelector('[data-contact-submit]');
  const submitLabel = form.querySelector('[data-contact-submit-label]');
  const status = form.querySelector('[data-contact-status]');
  const categoryField = form.querySelector('#contact-category');
  const subjectField = form.querySelector('#contact-subject');
  const emailSubjectField = form.querySelector('[data-contact-email-subject]');
  const defaultSubmitLabel = submitLabel ? submitLabel.textContent : 'Enviar mensagem';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateCounter = () => {
    if (!messageField || !counter) return;

    const maximum = Number(messageField.getAttribute('maxlength')) || 5000;
    counter.textContent = `${messageField.value.length} / ${maximum}`;
  };

  if (messageField) {
    messageField.addEventListener('input', updateCounter);
    updateCounter();
  }

  const clearInvalidState = (field) => {
    field.removeAttribute('aria-invalid');
  };

  form.addEventListener('invalid', (event) => {
    const field = event.target;
    if (field instanceof HTMLElement) field.setAttribute('aria-invalid', 'true');
  }, true);

  Array.from(form.elements).forEach((field) => {
    if (!(field instanceof HTMLElement)) return;
    field.addEventListener('input', () => clearInvalidState(field));
    field.addEventListener('change', () => clearInvalidState(field));
  });

  const markInvalidFields = () => {
    form.addEventListener('invalid', (event) => {
    const field = event.target;
    if (field instanceof HTMLElement) field.setAttribute('aria-invalid', 'true');
  }, true);

  Array.from(form.elements).forEach((field) => {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      if (field.type === 'hidden' || field.name === 'botcheck') return;
      field.setAttribute('aria-invalid', field.validity.valid ? 'false' : 'true');
    });
  };

  const updateEmailSubject = () => {
    if (!emailSubjectField) return;

    const prefix = form.dataset.subjectPrefix || 'Oratio | Contato pelo site';
    const category = categoryField && categoryField.selectedIndex > 0
      ? categoryField.options[categoryField.selectedIndex].text.trim()
      : '';
    const summary = subjectField ? subjectField.value.trim().slice(0, 90) : '';

    emailSubjectField.value = [prefix, category, summary].filter(Boolean).join(' | ').slice(0, 180);
  };

  const showFormStatus = (type, message, focus = false) => {
    if (!status) return;

    status.hidden = false;
    status.classList.remove('is-loading', 'is-success', 'is-error');
    status.classList.add(`is-${type}`);
    status.textContent = message;

    if (focus) {
      try {
        status.focus({ preventScroll: true });
      } catch (error) {
        status.focus();
      }
      status.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  };

  const setSendingState = (sending) => {
    form.classList.toggle('is-sending', sending);
    form.setAttribute('aria-busy', String(sending));

    if (submitButton) submitButton.disabled = sending;
    if (submitLabel) submitLabel.textContent = sending ? 'Enviando mensagem...' : defaultSubmitLabel;
  };

  form.addEventListener('submit', async (event) => {
    if (!window.fetch || !window.FormData) return;

    event.preventDefault();
    markInvalidFields();

    if (!form.checkValidity()) {
      form.reportValidity();
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    updateEmailSubject();
    setSendingState(true);
    showFormStatus('loading', 'Sua mensagem está sendo enviada com segurança.');

    try {
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json'
        }
      });

      let result = {};
      try {
        result = await response.json();
      } catch (error) {
        result = {};
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'O serviço não aceitou a mensagem.');
      }

      form.reset();
      updateCounter();
      Array.from(form.querySelectorAll('[aria-invalid]')).forEach((field) => field.removeAttribute('aria-invalid'));
      showFormStatus(
        'success',
        'Sua mensagem foi enviada com sucesso. Agradecemos pelo contato e responderemos assim que possível.',
        true
      );
    } catch (error) {
      showFormStatus(
        'error',
        'Não foi possível enviar sua mensagem neste momento. Verifique sua conexão e tente novamente ou escreva diretamente para contato@oratioapp.com.br.',
        true
      );
    } finally {
      setSendingState(false);
    }
  });
})();
