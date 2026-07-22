---
layout: app-page
title: "Oratio | Aplicativo católico para Android"
description: "Conheça o Oratio, aplicativo católico gratuito para Android com orações, Liturgia diária, Liturgia das Horas, Bíblias, novenas, santos, livros e outros recursos para a vida espiritual."
permalink: /aplicativo/
image: /assets/images/social/og-default.webp
---

{% assign app = site.data.app %}
{% assign download_url = app.play_store_url | default: app.support_url %}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": {{ app.full_name | jsonify }},
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": {{ app.minimum_android | jsonify }},
  "softwareVersion": {{ app.current_version | jsonify }},
  "description": {{ page.description | jsonify }},
  "url": {{ page.url | absolute_url | jsonify }},
  "downloadUrl": {{ app.play_store_url | jsonify }},
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "BRL"
  }
}
</script>

<section class="app-hero" aria-labelledby="app-hero-title">
  <div class="container container--large">
    <nav class="app-breadcrumb" aria-label="Navegação estrutural">
      <a href="{{ '/' | relative_url }}">Início</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Aplicativo</span>
    </nav>

    <div class="app-hero__grid">
      <div class="app-hero__content">
        <div class="app-hero__brand">
          <img src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}" width="52" height="52" alt="">
          <span>{{ app.hero.eyebrow }}</span>
        </div>

        <h1 id="app-hero-title">{{ app.hero.title }}</h1>
        <p class="app-hero__lead">{{ app.hero.description }}</p>
        <p class="app-hero__tagline">“{{ app.tagline }}”</p>

        <div class="app-hero__actions">
          <a class="button app-store-button" href="{{ download_url }}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M4.2 3.7c-.13.3-.2.67-.2 1.12v14.36c0 .45.07.82.2 1.12l8.05-8.3L4.2 3.7Zm9.12 9.4-2.06 2.12-6.1 6.28c.5.18 1.08.08 1.72-.28l9.06-5.15-2.62-2.97Zm3.8-4.02-9.07-5.15c-.64-.36-1.22-.46-1.72-.28l8.16 8.4 2.63-2.97Zm1.17.67-2.8 3.25 2.8 3.25c1.14.65 1.71.23 1.71-1.25v-4c0-1.48-.57-1.9-1.71-1.25Z" fill="currentColor"/>
            </svg>
            <span>
              <small>Disponível na</small>
              <strong>Google Play</strong>
            </span>
          </a>

          <a class="button button--secondary app-hero__support" href="{{ app.support_url | relative_url }}">Falar com o suporte</a>
        </div>

        <p class="app-hero__note">Gratuito para Android 6.0 ou superior.</p>
      </div>

      <div class="app-hero__visual" aria-label="Visualização do aplicativo Oratio">
        <div class="app-phone app-phone--hero" data-app-image-wrapper>
          <div class="app-phone__speaker" aria-hidden="true"></div>
          <img
            src="{{ app.hero.screenshot | relative_url }}"
            width="1080"
            height="2400"
            alt="{{ app.hero.screenshot_alt }}"
            fetchpriority="high"
            data-app-image
          >
          <div class="app-image-placeholder">
            <img src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}" width="72" height="72" alt="">
            <span>Visualização do Oratio</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="app-facts" aria-label="Informações principais do aplicativo">
  <div class="container container--large">
    <dl class="app-facts__grid">
      <div>
        <dt>Preço</dt>
        <dd>{% if app.free %}Gratuito{% else %}Consulte a loja{% endif %}</dd>
      </div>
      <div>
        <dt>Plataforma</dt>
        <dd>{{ app.platform }}</dd>
      </div>
      <div>
        <dt>Versão atual</dt>
        <dd>{{ app.current_version }}</dd>
      </div>
      <div>
        <dt>Requisito</dt>
        <dd>{{ app.minimum_android }}</dd>
      </div>
    </dl>
  </div>
</section>

<section class="app-section app-features" aria-labelledby="app-features-title">
  <div class="container container--large">
    <div class="app-section-heading app-section-heading--with-controls">
      <div>
        <p class="app-eyebrow">Conheça o aplicativo</p>
        <h2 id="app-features-title">Um auxílio completo para sua vida espiritual</h2>
        <p>Oração, liturgia, Sagradas Escrituras, formação e devoção reunidas em uma experiência simples, organizada e sempre disponível.</p>
      </div>

      <div class="app-carousel__controls" aria-label="Controles do carrossel">
        <button class="app-carousel__button" type="button" data-carousel-prev aria-label="Ver recurso anterior">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="app-carousel__button" type="button" data-carousel-next aria-label="Ver próximo recurso">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>

    <div class="app-carousel" data-app-carousel-root>
      <div class="app-carousel__track" data-app-carousel tabindex="0" aria-label="Principais recursos do Oratio">
        {% for feature in site.data.app_features %}
          <article class="app-feature-card" id="recurso-{{ feature.id }}">
            <div class="app-feature-card__visual" data-app-image-wrapper>
              <div class="app-phone app-phone--card">
                <div class="app-phone__speaker" aria-hidden="true"></div>
                <img
                  src="{{ feature.image | relative_url }}"
                  width="1080"
                  height="2400"
                  alt="{{ feature.alt }}"
                  loading="lazy"
                  decoding="async"
                  data-app-image
                >
                <div class="app-image-placeholder">
                  <img src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}" width="56" height="56" alt="">
                  <span>{{ feature.title }}</span>
                </div>
              </div>
            </div>
            <div class="app-feature-card__content">
              <p class="app-feature-card__category">{{ feature.category }}</p>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </article>
        {% endfor %}
      </div>

      <div class="app-carousel__meta" aria-live="polite">
        <span data-carousel-status>1 de {{ site.data.app_features | size }}</span>
        <span>Deslize para conhecer mais recursos</span>
      </div>
    </div>
  </div>
</section>

<section class="app-section app-purpose" aria-labelledby="app-purpose-title">
  <div class="container container--large app-purpose__grid">
    <div class="app-purpose__mark" aria-hidden="true">
      <img src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}" width="112" height="112" alt="">
    </div>
    <div class="app-purpose__content">
      <p class="app-eyebrow">Nossa proposta</p>
      <h2 id="app-purpose-title">Tecnologia a serviço da vida de oração</h2>
      <p>O Oratio não foi pensado para aumentar o tempo diante da tela, mas para ajudar cada pessoa a interromper a pressa cotidiana, encontrar um roteiro confiável e reservar um tempo sincero para Deus.</p>
      <p>Por isso, sua organização procura favorecer a leitura, o recolhimento e a constância, mantendo o conteúdo espiritual em primeiro lugar e permitindo que a tecnologia cumpra apenas o papel de servir.</p>
      <blockquote>“Uma só coisa é necessária. Maria escolheu a melhor parte, que não lhe será tirada.” <cite>Lc 10,42</cite></blockquote>
    </div>
  </div>
</section>

<section class="app-section app-testimonials" aria-labelledby="app-testimonials-title">
  <div class="container container--large">
    <div class="app-section-heading app-section-heading--centered">
      <p class="app-eyebrow">Avaliações da Google Play</p>
      <h2 id="app-testimonials-title">O Oratio na vida de quem reza</h2>
      <p>Experiências compartilhadas por pessoas que encontraram no aplicativo um auxílio para a oração, a formação e o crescimento na fé.</p>
    </div>

    <div class="app-testimonials__grid">
      {% for testimonial in site.data.app_testimonials %}
        <article class="app-testimonial">
          <div class="app-testimonial__stars" aria-label="{{ testimonial.rating }} de 5 estrelas">★★★★★</div>
          <blockquote>
            <p>“{{ testimonial.text }}”</p>
          </blockquote>
          <footer>
            <strong>{{ testimonial.name }}</strong>
            <time>{{ testimonial.date }}</time>
          </footer>
        </article>
      {% endfor %}
    </div>

    <p class="app-testimonials__source">Avaliações de cinco estrelas publicadas por usuários na Google Play.</p>
  </div>
</section>

<section class="app-section app-faq" aria-labelledby="app-faq-title">
  <div class="container">
    <div class="app-section-heading">
      <p class="app-eyebrow">Dúvidas sobre o aplicativo</p>
      <h2 id="app-faq-title">Perguntas frequentes</h2>
      <p>Encontre respostas para algumas das dúvidas mais comuns sobre o Oratio, seus recursos e a forma como o aplicativo pode acompanhar sua vida de oração.</p>
    </div>

    <div class="app-faq__list">
      {% for item in site.data.app_faq %}
        <details class="app-faq__item">
          <summary class="app-faq__question">
            <span>{{ item.question }}</span>
            <svg class="app-faq__icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </summary>
          <div class="app-faq__answer">
            {% for paragraph in item.answer %}
              <p>{{ paragraph }}</p>
            {% endfor %}
            {% if forloop.last %}
              <p><a href="{{ app.privacy_url | relative_url }}">Consulte a Política de Privacidade</a>.</p>
            {% endif %}
          </div>
        </details>
      {% endfor %}
    </div>
  </div>
</section>

<section class="app-section app-technical" aria-labelledby="app-technical-title">
  <div class="container container--large app-technical__grid">
    <div>
      <p class="app-eyebrow">Informações e suporte</p>
      <h2 id="app-technical-title">Tudo o que você precisa para começar</h2>
      <p>O Oratio está disponível gratuitamente na Google Play para aparelhos com Android 6.0 ou superior. Para dúvidas, correções ou sugestões, entre em contato pelos canais oficiais.</p>
    </div>

    <div class="app-technical__cards">
      <div class="app-technical__card">
        <span>Versão</span>
        <strong>{{ app.current_version }}</strong>
      </div>
      <div class="app-technical__card">
        <span>Sistema</span>
        <strong>{{ app.minimum_android }}</strong>
      </div>
      <a class="app-technical__link" href="{{ app.support_url | relative_url }}">Suporte e contato</a>
      <a class="app-technical__link" href="{{ app.privacy_url | relative_url }}">Política de Privacidade</a>
    </div>
  </div>
</section>

<section class="app-final-cta" id="download" aria-labelledby="app-download-title" data-app-final-cta>
  <div class="container app-final-cta__content">
    <img src="{{ '/assets/images/branding/oratio-symbol.svg' | relative_url }}" width="72" height="72" alt="">
    <p class="app-eyebrow">Leve o Oratio com você</p>
    <h2 id="app-download-title">Que Seu nome nunca se afaste dos seus lábios</h2>
    <p>Seja dentro de uma igreja, em seu quarto ou durante uma viagem, o Oratio permanece disponível para ajudar você a encontrar um momento de oração e voltar o coração para Deus.</p>
    <a class="button app-store-button app-store-button--light" href="{{ download_url }}" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4.2 3.7c-.13.3-.2.67-.2 1.12v14.36c0 .45.07.82.2 1.12l8.05-8.3L4.2 3.7Zm9.12 9.4-2.06 2.12-6.1 6.28c.5.18 1.08.08 1.72-.28l9.06-5.15-2.62-2.97Zm3.8-4.02-9.07-5.15c-.64-.36-1.22-.46-1.72-.28l8.16 8.4 2.63-2.97Zm1.17.67-2.8 3.25 2.8 3.25c1.14.65 1.71.23 1.71-1.25v-4c0-1.48-.57-1.9-1.71-1.25Z" fill="currentColor"/>
      </svg>
      <span>
        <small>Disponível na</small>
        <strong>Google Play</strong>
      </span>
    </a>
  </div>
</section>

<aside class="app-mobile-download" aria-label="Baixar o aplicativo Oratio" data-app-mobile-download>
  <div>
    <strong>Oratio</strong>
    <span>Gratuito para Android</span>
  </div>
  <a href="{{ download_url }}" target="_blank" rel="noopener noreferrer">Baixar</a>
</aside>
