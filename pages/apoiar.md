---
layout: page
title: "Apoiar o Oratio"
description: "Ajude a manter o Oratio gratuito, sem anúncios e disponível para acompanhar a vida de oração de cada vez mais pessoas."
permalink: /apoiar/
kicker: "Caminhe conosco"
reading_width: wide
---
{% assign support = site.data.support %}

<div class="support-page">
  <section class="support-hero" aria-labelledby="support-hero-title">
    <div class="support-hero__content">
      <p class="support-kicker">Uma contribuição que se transforma em serviço</p>
      <h2 id="support-hero-title">Ajude o Oratio a continuar servindo à vida de oração</h2>
      <p class="support-hero__lead">
        O Oratio é desenvolvido de forma independente e permanece disponível gratuitamente, sem anúncios e sem transformar a oração em produto. Cada contribuição ajuda a sustentar o trabalho técnico, editorial e pastoral necessário para que o aplicativo continue crescendo com serenidade, fidelidade e responsabilidade.
      </p>
      <div class="support-hero__actions" aria-label="Escolha uma forma de apoio">
        <a class="button button--primary" href="#apoio-recorrente">Apoiar mensalmente</a>
        <a class="button button--tonal" href="#apoio-unico">Fazer um apoio único</a>
      </div>
    </div>

    <aside class="support-hero__commitment" aria-label="Compromissos do Oratio">
      <img
        class="support-hero__symbol"
        src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}"
        width="72"
        height="72"
        alt=""
      >
      <p class="support-hero__commitment-title">Nosso compromisso</p>
      <ul class="support-check-list">
        <li>Manter o acesso gratuito</li>
        <li>Preservar uma experiência sem anúncios</li>
        <li>Colocar a tecnologia a serviço da oração</li>
        <li>Utilizar somente canais oficiais de apoio</li>
      </ul>
    </aside>
  </section>

  <section class="support-section" aria-labelledby="support-why-title">
    <div class="support-section__heading">
      <p class="support-kicker">Por que apoiar</p>
      <h2 id="support-why-title">Uma missão gratuita também possui necessidades concretas</h2>
      <p>
        Por trás de cada oração, atualização e novo recurso existe um trabalho contínuo de desenvolvimento, pesquisa, organização e revisão. O apoio financeiro permite que esse serviço prossiga sem depender de publicidade invasiva ou da cobrança pelo acesso aos conteúdos essenciais.
      </p>
    </div>

    <div class="support-purpose-grid">
      <article class="support-purpose-card">
        <span class="support-purpose-card__number" aria-hidden="true">01</span>
        <h3>Desenvolvimento e manutenção</h3>
        <p>Correções, melhorias de desempenho, compatibilidade com novas versões do Android e aperfeiçoamento constante da experiência de uso.</p>
      </article>

      <article class="support-purpose-card">
        <span class="support-purpose-card__number" aria-hidden="true">02</span>
        <h3>Conteúdo e revisão</h3>
        <p>Pesquisa, seleção, organização e revisão de orações, devoções, formações, conteúdos litúrgicos e materiais espirituais.</p>
      </article>

      <article class="support-purpose-card">
        <span class="support-purpose-card__number" aria-hidden="true">03</span>
        <h3>Infraestrutura do projeto</h3>
        <p>Manutenção dos canais digitais, serviços necessários ao funcionamento do projeto e recursos utilizados na publicação e nos testes.</p>
      </article>

      <article class="support-purpose-card">
        <span class="support-purpose-card__number" aria-hidden="true">04</span>
        <h3>Crescimento responsável</h3>
        <p>Criação de novos recursos e ampliação do acervo sem abandonar a simplicidade, a serenidade e a finalidade espiritual do Oratio.</p>
      </article>
    </div>
  </section>

  <section class="support-section support-section--recurring" id="apoio-recorrente" aria-labelledby="support-recurring-title">
    <div class="support-recurring-card">
      <div class="support-recurring-card__content">
        <p class="support-kicker">Apoio recorrente</p>
        <h2 id="support-recurring-title">Ajude todos os meses pelo {{ support.recurring.platform }}</h2>
        <p>
          O apoio mensal oferece maior previsibilidade para a continuidade do projeto. A contribuição é realizada pela campanha oficial do <strong>{{ support.recurring.campaign_name }}</strong>, apostolado no qual o Oratio nasceu e cuja missão permanece viva no aplicativo.
        </p>
        <p class="support-recurring-card__note">
          O valor e a duração do apoio são escolhidos diretamente por você na plataforma, conforme as opções disponíveis no momento da contribuição.
        </p>
        <div class="support-recurring-card__actions">
          <a
            class="button button--light"
            href="{{ support.recurring.url }}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apoiar mensalmente no {{ support.recurring.platform }}
            <span aria-hidden="true">↗</span>
          </a>
          <button
            class="support-link-copy"
            type="button"
            data-copy-text="{{ support.recurring.url | escape }}"
            data-copy-label="Link do apoio mensal"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M8 7V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h2Zm3 0h3a3 3 0 0 1 3 3v3h2V5h-8v2Zm3 3H6v8h8v-8Z" fill="currentColor"/>
            </svg>
            <span data-copy-button-label>Copiar link</span>
          </button>
        </div>
        <p class="support-recurring-card__url">{{ support.recurring.display_url }}</p>
      </div>

      <div class="support-recurring-card__visual" aria-hidden="true">
        <span class="support-recurring-card__halo"></span>
        <img
          src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}"
          width="132"
          height="132"
          alt=""
        >
        <span class="support-recurring-card__motto">Que Seu Nome nunca se afaste dos teus lábios.</span>
      </div>
    </div>
  </section>

  <section class="support-section" id="apoio-unico" aria-labelledby="support-once-title">
    <div class="support-section__heading">
      <p class="support-kicker">Apoio único</p>
      <h2 id="support-once-title">Escolha o meio adequado para sua região</h2>
      <p>
        Uma contribuição pontual também ajuda muito. Antes de confirmar qualquer transferência, confira atentamente os dados e o nome do beneficiário apresentado pela instituição financeira.
      </p>
    </div>

    <div class="support-payment-stack">
      <article class="support-payment-card support-payment-card--pix" aria-labelledby="support-pix-title">
        <div class="support-payment-card__header">
          <div>
            <span class="support-region-label">Para usuários brasileiros</span>
            <h3 id="support-pix-title">Apoio por {{ support.one_time.brazil.method }}</h3>
          </div>
          <span class="support-method-badge">Brasil</span>
        </div>

        <div class="support-pix-layout">
          <figure class="support-qr" data-support-qr>
            <div class="support-qr__media">
              <div class="support-qr__placeholder">
                <img
                  src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}"
                  width="64"
                  height="64"
                  alt=""
                >
                <strong>QR Code PIX</strong>
                <span>O QR Code oficial será exibido aqui.</span>
              </div>
              <img
                class="support-qr__image"
                src="{{ support.one_time.brazil.qr_code_image | relative_url }}"
                width="720"
                height="720"
                alt="QR Code para apoiar o Oratio por PIX"
                loading="lazy"
                data-support-qr-image
              >
            </div>
          </figure>

          <div class="support-payment-details">
            <p class="support-payment-details__intro">
              Abra o aplicativo do seu banco, escolha a opção PIX e escaneie o QR Code. Também é possível copiar a chave abaixo.
            </p>

            <div class="support-copy-field">
              <div class="support-copy-field__content">
                <span>Chave PIX</span>
                <strong>{{ support.one_time.brazil.pix_key }}</strong>
              </div>
              <button
                class="support-copy-button"
                type="button"
                data-copy-text="{{ support.one_time.brazil.pix_key | escape }}"
                data-copy-label="Chave PIX"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <path d="M8 7V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h2Zm3 0h3a3 3 0 0 1 3 3v3h2V5h-8v2Zm3 3H6v8h8v-8Z" fill="currentColor"/>
                </svg>
                <span data-copy-button-label>Copiar</span>
              </button>
            </div>

            <dl class="support-account-data">
              <div>
                <dt>Beneficiário</dt>
                <dd>{{ support.one_time.brazil.beneficiary }}</dd>
              </div>
              <div>
                <dt>Instituição</dt>
                <dd>{{ support.one_time.brazil.bank }}</dd>
              </div>
            </dl>

            <div class="support-security-note">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                <path d="M12 2 4 5v6c0 5.05 3.41 9.74 8 11 4.59-1.26 8-5.95 8-11V5l-8-3Zm0 3.18 5 1.87V11c0 3.44-2.12 6.86-5 7.93C9.12 17.86 7 14.44 7 11V7.05l5-1.87Zm-1.1 8.72-2-2 1.42-1.42.58.59 2.78-2.78 1.42 1.42-4.2 4.19Z" fill="currentColor"/>
              </svg>
              <p>Antes de concluir, confirme que o beneficiário exibido é <strong>{{ support.one_time.brazil.beneficiary }}</strong>.</p>
            </div>
          </div>
        </div>
      </article>

      <div class="support-payment-grid">
        <article class="support-payment-card" aria-labelledby="support-iban-title">
          <div class="support-payment-card__header">
            <div>
              <span class="support-region-label">Para usuários europeus</span>
              <h3 id="support-iban-title">Transferência por IBAN</h3>
            </div>
            <span class="support-method-badge">Europa</span>
          </div>

          <p>Utilize os dados abaixo para realizar uma transferência bancária pela instituição de sua preferência.</p>

          <div class="support-copy-field support-copy-field--stacked">
            <div class="support-copy-field__content">
              <span>IBAN</span>
              <strong>{{ support.one_time.europe.iban_display }}</strong>
            </div>
            <button
              class="support-copy-button"
              type="button"
              data-copy-text="{{ support.one_time.europe.iban | escape }}"
              data-copy-label="IBAN"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M8 7V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h2Zm3 0h3a3 3 0 0 1 3 3v3h2V5h-8v2Zm3 3H6v8h8v-8Z" fill="currentColor"/>
              </svg>
              <span data-copy-button-label>Copiar</span>
            </button>
          </div>

          <dl class="support-account-data">
            <div>
              <dt>Beneficiário</dt>
              <dd>{{ support.one_time.europe.beneficiary }}</dd>
            </div>
          </dl>

          <p class="support-payment-card__footnote">Taxas e prazos podem variar conforme a instituição utilizada e o país de origem.</p>
        </article>

        <article class="support-payment-card" aria-labelledby="support-paypal-title">
          <div class="support-payment-card__header">
            <div>
              <span class="support-region-label">Para usuários de outros países</span>
              <h3 id="support-paypal-title">Apoio pelo {{ support.one_time.international.method }}</h3>
            </div>
            <span class="support-method-badge">Internacional</span>
          </div>

          <p>No PayPal, utilize o endereço de e-mail oficial abaixo para localizar o destinatário da contribuição.</p>

          <div class="support-copy-field support-copy-field--stacked">
            <div class="support-copy-field__content">
              <span>E-mail do PayPal</span>
              <strong>{{ support.one_time.international.email }}</strong>
            </div>
            <button
              class="support-copy-button"
              type="button"
              data-copy-text="{{ support.one_time.international.email | escape }}"
              data-copy-label="E-mail do PayPal"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M8 7V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h2Zm3 0h3a3 3 0 0 1 3 3v3h2V5h-8v2Zm3 3H6v8h8v-8Z" fill="currentColor"/>
              </svg>
              <span data-copy-button-label>Copiar</span>
            </button>
          </div>

          <a
            class="button button--tonal support-payment-card__external"
            href="{{ support.one_time.international.platform_url }}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir o PayPal
            <span aria-hidden="true">↗</span>
          </a>

          <p class="support-payment-card__footnote">Conversão de moeda, tarifas e disponibilidade podem variar conforme o país e a conta utilizada.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="support-section" aria-labelledby="support-transparency-title">
    <div class="support-transparency">
      <div class="support-transparency__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" focusable="false">
          <path d="M12 2 3 6v6c0 5.16 3.84 9.74 9 10 5.16-.26 9-4.84 9-10V6l-9-4Zm0 3.28L18 8v4c0 3.55-2.49 6.74-6 7.83C8.49 18.74 6 15.55 6 12V8l6-2.72Zm-1 3.22h2v5h-2v-5Zm0 6.5h2v2h-2v-2Z" fill="currentColor"/>
        </svg>
      </div>
      <div>
        <p class="support-kicker">Transparência e segurança</p>
        <h2 id="support-transparency-title">A contribuição é livre, voluntária e não condiciona o acesso ao Oratio</h2>
        <p>
          O apoio financeiro não compra orações, graças, privilégios espirituais ou acesso exclusivo aos conteúdos essenciais. Ele representa uma colaboração espontânea para a continuidade de um projeto católico independente. O Oratio não solicita senhas, códigos de autenticação, dados completos de cartões ou acesso à sua conta bancária por e-mail ou mensagem.
        </p>
        <p>
          Utilize somente os canais apresentados nesta página e, em caso de dúvida, entre em contato antes de realizar a contribuição.
        </p>
      </div>
    </div>
  </section>

  <section class="support-section" aria-labelledby="support-other-title">
    <div class="support-section__heading">
      <p class="support-kicker">Outras formas de ajudar</p>
      <h2 id="support-other-title">Nem todo apoio precisa ser financeiro</h2>
      <p>O crescimento do Oratio também depende da oração, da divulgação responsável, de avaliações sinceras e de sugestões que ajudem a aperfeiçoar o aplicativo.</p>
    </div>

    <div class="support-other-grid">
      <article class="support-other-card">
        <h3>Reze pelo projeto</h3>
        <p>Inclua o Oratio, seus usuários e todos os que trabalham em sua manutenção nas suas intenções de oração.</p>
      </article>
      <article class="support-other-card">
        <h3>Divulgue o aplicativo</h3>
        <p>Apresente o Oratio a familiares, amigos, grupos, pastorais e comunidades para os quais ele possa ser um auxílio verdadeiro.</p>
      </article>
      <article class="support-other-card">
        <h3>Envie correções e sugestões</h3>
        <p>Relatos claros ajudam a aperfeiçoar os conteúdos, corrigir problemas e compreender necessidades reais dos usuários.</p>
      </article>
      <article class="support-other-card">
        <h3>Avalie na Google Play</h3>
        <p>Uma avaliação sincera ajuda outras pessoas a conhecerem o Oratio e oferece um retorno importante para o aperfeiçoamento do aplicativo.</p>
        <a
          class="button button--tonal support-other-card__action"
          href="{{ site.data.app.play_store_url }}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Avaliar o Oratio
          <span aria-hidden="true">↗</span>
        </a>
      </article>
    </div>
  </section>

  <section class="support-section" aria-labelledby="support-faq-title">
    <div class="support-section__heading">
      <p class="support-kicker">Perguntas frequentes</p>
      <h2 id="support-faq-title">Informações importantes antes de contribuir</h2>
    </div>

    <div class="support-faq">
      <details>
        <summary>O apoio financeiro é obrigatório para utilizar o Oratio?</summary>
        <div><p>Não. O uso do aplicativo e o acesso aos conteúdos essenciais permanecem gratuitos. A contribuição é inteiramente voluntária.</p></div>
      </details>

      <details>
        <summary>Qual é a diferença entre o apoio mensal e o apoio único?</summary>
        <div><p>O apoio mensal é realizado pela campanha oficial no APOIA.se e oferece maior previsibilidade para a continuidade do projeto. O apoio único é uma contribuição pontual por PIX, IBAN ou PayPal.</p></div>
      </details>

      <details>
        <summary>Preciso enviar o comprovante da contribuição?</summary>
        <div><p>Normalmente, não é necessário. Guarde o comprovante para seu controle e envie-o somente quando precisar esclarecer alguma dúvida ou identificar uma transferência.</p></div>
      </details>

      <details>
        <summary>Como posso confirmar que os dados são oficiais?</summary>
        <div><p>Confira sempre esta página no domínio oficial do Oratio e verifique o nome do beneficiário antes de confirmar. Em caso de divergência, não conclua a transferência e entre em contato.</p></div>
      </details>

      <details>
        <summary>Posso ajudar sem fazer uma contribuição financeira?</summary>
        <div><p>Sim. Rezar pelo projeto, divulgar o aplicativo, enviar sugestões, relatar problemas e colaborar com conhecimentos técnicos ou editoriais também são formas valiosas de apoio.</p></div>
      </details>
    </div>
  </section>

  <section class="support-contact" aria-labelledby="support-contact-title">
    <div>
      <p class="support-kicker">Dúvidas sobre o apoio</p>
      <h2 id="support-contact-title">Fale diretamente conosco</h2>
      <p>Para confirmar informações, esclarecer uma transferência ou comunicar qualquer problema relacionado aos canais de apoio, utilize o endereço oficial abaixo.</p>
    </div>

    <div class="support-contact__actions">
      <a class="button button--light" href="mailto:{{ support.contact_email }}">Enviar um e-mail</a>
      <button
        class="support-link-copy support-link-copy--light"
        type="button"
        data-copy-text="{{ support.contact_email | escape }}"
        data-copy-label="E-mail de contato"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M8 7V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h2Zm3 0h3a3 3 0 0 1 3 3v3h2V5h-8v2Zm3 3H6v8h8v-8Z" fill="currentColor"/>
        </svg>
        <span data-copy-button-label>Copiar e-mail</span>
      </button>
      <strong>{{ support.contact_email }}</strong>
    </div>
  </section>

  <p class="support-copy-status" role="status" aria-live="polite" aria-atomic="true" data-copy-status></p>
</div>
