---
layout: page
title: "Contato e suporte"
description: "Fale com o Oratio para solicitar suporte, enviar sugestões, comunicar correções ou tratar de privacidade e colaboração."
permalink: /contato/
kicker: "Fale conosco"
reading_width: wide
contact_form: true
---
{% assign contact = site.data.contact %}
{% assign contact_email = site.data.site.email | default: contact.support_email %}
{% assign visible_social = site.data.social | where_exp: 'item', 'item.url != empty' %}

<div class="contact-page" data-contact-page>
  <section class="contact-hero" aria-labelledby="contact-hero-title">
    <div class="contact-hero__content">
      <div class="contact-hero__brand">
        <img
          src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}"
          width="72"
          height="72"
          alt=""
        >
        <div>
          <p class="contact-kicker">Contato oficial</p>
          <p class="contact-hero__brand-name">Oratio | App Católico</p>
        </div>
      </div>

      <h2 id="contact-hero-title">Uma mensagem pode ajudar o Oratio a servir melhor</h2>
      <p class="contact-hero__lead">
        Dúvidas, sugestões, correções e relatos de problemas ajudam o projeto a crescer com responsabilidade e a oferecer uma experiência cada vez mais serena, confiável e útil para a vida de oração.
      </p>
      <p class="contact-hero__note">
        Utilize o formulário abaixo ou escreva diretamente para o endereço oficial. Para facilitar o atendimento, procure explicar com clareza o que aconteceu e inclua as informações que possam ajudar a compreender sua solicitação.
      </p>
    </div>

    <aside class="contact-direct-card" aria-labelledby="contact-direct-title">
      <svg class="contact-direct-card__icon" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 3.2V18h16V7.2l-7.45 5.17a1 1 0 0 1-1.1 0L4 7.2ZM18.3 6H5.7L12 10.37 18.3 6Z" fill="currentColor"/>
      </svg>
      <p class="contact-direct-card__eyebrow">Prefere escrever diretamente?</p>
      <h3 id="contact-direct-title">Envie um e-mail</h3>
      <a class="contact-direct-card__email" href="mailto:{{ contact_email }}?subject=Contato%20pelo%20site%20do%20Oratio">{{ contact_email }}</a>
      <p>{{ contact.response_note }}</p>
      <div class="contact-direct-card__actions">
        <a class="button button--light" href="mailto:{{ contact_email }}?subject=Contato%20pelo%20site%20do%20Oratio">
          Abrir aplicativo de e-mail
        </a>
        <button
          class="contact-copy-button"
          type="button"
          data-contact-copy="{{ contact_email | escape }}"
          data-contact-copy-label="E-mail"
        >
          <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false">
            <path d="M8 7V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h2Zm3 0h3a3 3 0 0 1 3 3v3h2V5h-8v2Zm3 3H6v8h8v-8Z" fill="currentColor"/>
          </svg>
          <span data-contact-copy-button-label>Copiar endereço</span>
        </button>
      </div>
    </aside>
  </section>

  <section class="contact-main" id="formulario" aria-labelledby="contact-form-title">
    <div class="contact-form-panel">
      <div class="contact-section-heading">
        <p class="contact-kicker">Envie uma mensagem</p>
        <h2 id="contact-form-title">Como podemos ajudar?</h2>
        <p>Preencha os campos abaixo com as informações necessárias para que sua solicitação possa ser compreendida e respondida adequadamente.</p>
      </div>

      {% if contact.form_enabled and contact.form_action != empty and contact.access_key != empty %}
      <form
        class="contact-form"
        action="{{ contact.form_action }}"
        method="{{ contact.form_method | default: 'POST' }}"
        data-contact-form
        data-subject-prefix="{{ contact.email_subject_prefix | escape }}"
      >
        <input type="hidden" name="access_key" value="{{ contact.access_key }}">
        <input type="hidden" name="subject" value="{{ contact.email_subject_prefix }}" data-contact-email-subject>
        <input type="hidden" name="from_name" value="{{ contact.from_name | default: 'Site do Oratio' }}">
        <input type="hidden" name="pagina_de_origem" value="{{ page.url | absolute_url }}">

        <div class="contact-form__botcheck" aria-hidden="true">
          <label for="contact-botcheck">Não preencha este campo</label>
          <input id="contact-botcheck" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off">
        </div>

        <div class="contact-form__grid">
          <div class="contact-field">
            <label for="contact-name">Nome <span aria-hidden="true">*</span></label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autocomplete="name"
              maxlength="100"
              placeholder="Como podemos chamar você?"
              required
            >
          </div>

          <div class="contact-field">
            <label for="contact-email">E-mail <span aria-hidden="true">*</span></label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              maxlength="160"
              placeholder="voce@exemplo.com"
              aria-describedby="contact-email-help"
              required
            >
            <small id="contact-email-help">Este endereço será utilizado somente para responder à sua mensagem.</small>
          </div>

          <div class="contact-field">
            <label for="contact-category">Tipo de contato <span aria-hidden="true">*</span></label>
            <select id="contact-category" name="tipo_de_contato" required>
              <option value="" selected disabled>Selecione o motivo do contato</option>
              {% for category in contact.categories %}
              <option value="{{ category.value | escape }}">{{ category.label }}</option>
              {% endfor %}
            </select>
          </div>

          <div class="contact-field">
            <label for="contact-subject">Assunto <span aria-hidden="true">*</span></label>
            <input
              id="contact-subject"
              name="assunto"
              type="text"
              maxlength="120"
              placeholder="Resuma o motivo da mensagem"
              required
            >
          </div>
        </div>

        <div class="contact-field">
          <div class="contact-field__label-row">
            <label for="contact-message">Mensagem <span aria-hidden="true">*</span></label>
            <span class="contact-field__counter" data-contact-counter aria-live="polite">0 / {{ contact.message_max_length | default: 5000 }}</span>
          </div>
          <textarea
            id="contact-message"
            name="message"
            rows="9"
            maxlength="{{ contact.message_max_length | default: 5000 }}"
            placeholder="Descreva sua dúvida, sugestão ou dificuldade com o máximo de clareza possível."
            required
            data-contact-message
          ></textarea>
        </div>

        <div class="contact-form__privacy">
          <label class="contact-consent" for="contact-consent">
            <input id="contact-consent" name="consentimento" type="checkbox" value="Concordo" required>
            <span>
              Li o aviso abaixo e concordo com o uso dos dados informados para a análise e a resposta desta solicitação.
            </span>
          </label>
          <p>
            Os dados são utilizados exclusivamente para tratar sua mensagem. O envio é processado pelo Web3Forms, um serviço externo de formulários, conforme explicado na <a href="{{ '/privacidade/' | relative_url }}">Política de Privacidade</a>. Não envie senhas, códigos de acesso, informações bancárias ou outros dados sensíveis.
          </p>
        </div>

        <div class="contact-form__footer">
          <button class="button button--primary contact-submit" type="submit" data-contact-submit>
            <span data-contact-submit-label>Enviar mensagem</span>
            <span class="contact-submit__spinner" aria-hidden="true"></span>
          </button>
          <p class="contact-form__required-note"><span aria-hidden="true">*</span> Campos obrigatórios</p>
        </div>

        <div
          class="contact-form__status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          tabindex="-1"
          hidden
          data-contact-status
        ></div>
      </form>
      {% else %}
      <aside class="contact-form-unavailable" role="status">
        <strong>O formulário está temporariamente indisponível.</strong>
        <p>Envie sua mensagem diretamente para <a href="mailto:{{ contact_email }}">{{ contact_email }}</a>.</p>
      </aside>
      {% endif %}
    </div>

    <aside class="contact-sidebar" aria-label="Orientações para o contato">
      <section class="contact-info-card" aria-labelledby="contact-before-title">
        <div class="contact-info-card__heading">
          <span class="contact-info-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="23" height="23" focusable="false">
              <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-1 7h2v6h-2v-6Zm0-4h2v2h-2V7Z" fill="currentColor"/>
            </svg>
          </span>
          <div>
            <p class="contact-kicker">Antes de enviar</p>
            <h3 id="contact-before-title">Informações que ajudam</h3>
          </div>
        </div>

        <ul class="contact-guidance-list">
          <li>
            <strong>Problemas no aplicativo</strong>
            <span>Informe o modelo do aparelho, a versão do Android, a versão do Oratio e o que aconteceu antes do problema aparecer.</span>
          </li>
          <li>
            <strong>Correções de conteúdo</strong>
            <span>Indique o título da oração, formação, novena ou página e identifique claramente o trecho que precisa ser revisado.</span>
          </li>
          <li>
            <strong>Capturas e arquivos</strong>
            <span>O formulário não aceita anexos. Mencione na mensagem que possui um arquivo e ele poderá ser solicitado na resposta por e-mail.</span>
          </li>
        </ul>
      </section>

      <section class="contact-info-card contact-info-card--independent" aria-labelledby="contact-service-title">
        <div class="contact-info-card__heading">
          <span class="contact-info-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="23" height="23" focusable="false">
              <path d="M12 2 3 6v6c0 5.25 3.84 9.63 9 10 5.16-.37 9-4.75 9-10V6l-9-4Zm0 2.18L19 7.3V12c0 4.08-2.82 7.37-7 7.95C7.82 19.37 5 16.08 5 12V7.3l7-3.12Zm-1 4.82h2v6h-2V9Zm0 7h2v2h-2v-2Z" fill="currentColor"/>
            </svg>
          </span>
          <div>
            <p class="contact-kicker">Sobre o atendimento</p>
            <h3 id="contact-service-title">Um projeto independente</h3>
          </div>
        </div>
        <p>
          O Oratio não possui uma grande equipe profissional de atendimento. As mensagens são analisadas pessoalmente, em conjunto com as atividades de desenvolvimento, pesquisa, revisão e manutenção do projeto.
        </p>
        <p>
          Cada contato é importante, mas o tempo de resposta pode variar. Mensagens objetivas e acompanhadas das informações necessárias poderão ser compreendidas com maior facilidade.
        </p>
      </section>
    </aside>
  </section>

  <section class="contact-paths" aria-labelledby="contact-paths-title">
    <div class="contact-section-heading">
      <p class="contact-kicker">Outros caminhos</p>
      <h2 id="contact-paths-title">Encontre a informação de que precisa</h2>
      <p>Alguns assuntos podem ser resolvidos diretamente nas páginas institucionais e nos canais oficiais do Oratio.</p>
    </div>

    <div class="contact-paths__grid">
      <a class="contact-path-card" href="{{ '/aplicativo/' | relative_url }}">
        <span class="contact-path-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="25" height="25" focusable="false">
            <path d="M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7Zm3 13h4v2h-4v-2Z" fill="currentColor"/>
          </svg>
        </span>
        <span>
          <strong>Conheça o aplicativo</strong>
          <small>Veja recursos, requisitos e acesso pela Google Play.</small>
        </span>
        <span class="contact-path-card__arrow" aria-hidden="true">›</span>
      </a>

      <a class="contact-path-card" href="{{ '/privacidade/' | relative_url }}">
        <span class="contact-path-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="25" height="25" focusable="false">
            <path d="M12 2 4 5v6c0 5.08 3.42 9.68 8 11 4.58-1.32 8-5.92 8-11V5l-8-3Zm0 2.13L18 6.4V11c0 3.95-2.52 7.5-6 8.88C8.52 18.5 6 14.95 6 11V6.4l6-2.27ZM11 8h2v5h-2V8Zm0 6h2v2h-2v-2Z" fill="currentColor"/>
          </svg>
        </span>
        <span>
          <strong>Política de Privacidade</strong>
          <small>Entenda como os dados do portal e do formulário são tratados.</small>
        </span>
        <span class="contact-path-card__arrow" aria-hidden="true">›</span>
      </a>

      <a class="contact-path-card" href="{{ '/apoiar/' | relative_url }}">
        <span class="contact-path-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="25" height="25" focusable="false">
            <path d="M12 21s-8-4.67-8-11a4.5 4.5 0 0 1 8-2.83A4.5 4.5 0 0 1 20 10c0 6.33-8 11-8 11Zm0-2.35c2.12-1.39 6-4.65 6-8.65a2.5 2.5 0 0 0-4.72-1.16L12 11.3l-1.28-2.46A2.5 2.5 0 0 0 6 10c0 4 3.88 7.26 6 8.65Z" fill="currentColor"/>
          </svg>
        </span>
        <span>
          <strong>Apoie o Oratio</strong>
          <small>Conheça formas de colaborar com a continuidade do projeto.</small>
        </span>
        <span class="contact-path-card__arrow" aria-hidden="true">›</span>
      </a>
    </div>

    {% if visible_social.size > 0 %}
    <div class="contact-social" aria-labelledby="contact-social-title">
      <div>
        <p class="contact-kicker">Acompanhe o projeto</p>
        <h3 id="contact-social-title">Novidades e conteúdos nas redes sociais</h3>
        <p>Para suporte, correções ou privacidade, utilize preferencialmente o formulário ou o e-mail oficial.</p>
      </div>
      <ul class="contact-social__links">
        {% for social in visible_social %}
        <li>
          <a href="{{ social.url }}" target="_blank" rel="noopener noreferrer">
            {{ social.name }}
            <span aria-hidden="true">↗</span>
          </a>
        </li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}
  </section>

  <p class="contact-copy-status" role="status" aria-live="polite" aria-atomic="true" data-contact-copy-status></p>
</div>
