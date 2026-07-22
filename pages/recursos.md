---
layout: resources-page
title: "Recursos do Oratio"
description: "Conheça todos os recursos do aplicativo Oratio e consulte o catálogo completo de rosários, terços, novenas, ladainhas, meditações e orações disponíveis na aba Oração."
permalink: /recursos/
image: /assets/images/social/og-default.webp
---

{% assign app = site.data.app %}
{% assign download_url = app.play_store_url | default: '/aplicativo/#download' %}
{% assign prayer_catalog = site.data.prayer_catalog %}
{% assign prayer_total = 0 %}
{% for category in prayer_catalog.categories %}
  {% assign category_size = category.items | size %}
  {% assign prayer_total = prayer_total | plus: category_size %}
{% endfor %}

<section class="resources-hero">
  <div class="container container--wide">
    {% include breadcrumb.html %}

    <div class="resources-hero__grid">
      <div class="resources-hero__content">
        <p class="eyebrow">Tudo o que o Oratio reúne</p>
        <h1>Recursos para acompanhar toda a vida de oração</h1>
        <p class="resources-hero__lead">Liturgia, Sagradas Escrituras, novenas, santos, livros, música sacra e uma ampla biblioteca de oração reunidos em uma experiência serena, organizada e gratuita.</p>

        <div class="resources-hero__actions">
          <a class="button button--primary" href="#catalogo-oracao">Explorar a aba Oração</a>
          <a class="button button--tonal" href="{{ download_url }}">Baixar o Oratio</a>
        </div>

        <p class="resources-hero__note">Conteúdo disponível gratuitamente no aplicativo para Android, sem transformar a oração em uma experiência apressada ou cheia de distrações.</p>
      </div>

      <dl class="resources-stats" aria-label="Resumo dos recursos do Oratio">
        <div class="resources-stat">
          <dt>{{ site.data.app_features | size }}</dt>
          <dd>grandes áreas do aplicativo</dd>
        </div>
        <div class="resources-stat">
          <dt>{{ prayer_total }}</dt>
          <dd>conteúdos reunidos na aba Oração</dd>
        </div>
        <div class="resources-stat">
          <dt>100%</dt>
          <dd>gratuito para rezar e aprender</dd>
        </div>
        <div class="resources-stat">
          <dt>1</dt>
          <dd>aplicativo para acompanhar diferentes momentos da vida espiritual</dd>
        </div>
      </dl>
    </div>
  </div>
</section>

<section class="section resources-overview" aria-labelledby="recursos-principais">
  <div class="container container--wide">
    <div class="resources-section-heading">
      <div>
        <p class="eyebrow">Uma experiência completa</p>
        <h2 id="recursos-principais">Conheça as principais áreas do aplicativo</h2>
      </div>
      <p>O Oratio reúne conteúdos para a oração pessoal, a participação na vida litúrgica da Igreja, o estudo da fé e a criação de uma rotina espiritual mais constante.</p>
    </div>

    <div class="resources-feature-grid">
      {% for feature in site.data.app_features %}
        <article class="resources-feature-card">
          <div class="resources-feature-card__topline">
            <span class="resources-feature-card__number" aria-hidden="true">{{ forloop.index }}</span>
            <span class="chip">{{ feature.category }}</span>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          {% if feature.id == 'oracoes-tercos-rosarios' %}
            <a class="resources-feature-card__link" href="#catalogo-oracao">Ver catálogo completo</a>
          {% elsif feature.id == 'novenas' %}
            <a class="resources-feature-card__link" href="{{ '/novenas/' | relative_url }}">Conhecer as novenas</a>
          {% elsif feature.id == 'santos' %}
            <a class="resources-feature-card__link" href="{{ '/santos/' | relative_url }}">Conhecer os santos</a>
          {% elsif feature.id == 'livros' %}
            <a class="resources-feature-card__link" href="{{ '/formacoes/' | relative_url }}">Explorar a formação</a>
          {% endif %}
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="section section--surface resources-principles" aria-labelledby="experiencia-oratio">
  <div class="container container--wide">
    <div class="resources-section-heading">
      <div>
        <p class="eyebrow">Tecnologia que permanece em seu lugar</p>
        <h2 id="experiencia-oratio">Feito para servir à oração, não para interrompê-la</h2>
      </div>
      <p>A organização do aplicativo procura tornar os conteúdos fáceis de encontrar sem transformar a vida espiritual em uma sequência de estímulos, metas ou distrações.</p>
    </div>

    <div class="resources-principles__grid">
      <article>
        <strong>Conteúdo em primeiro lugar</strong>
        <p>Leitura confortável, hierarquia clara e navegação simples ajudam a manter a atenção na oração e no texto espiritual.</p>
      </article>
      <article>
        <strong>Liberdade para rezar</strong>
        <p>O usuário encontra diferentes formas de oração e escolhe o roteiro que melhor corresponde ao momento que está vivendo.</p>
      </article>
      <article>
        <strong>Organização sem excesso</strong>
        <p>Categorias, busca e acompanhamento local tornam a experiência prática, preservando a sobriedade própria de um aplicativo de oração.</p>
      </article>
    </div>
  </div>
</section>

<section class="section resources-catalog-section" id="catalogo-oracao" aria-labelledby="catalogo-oracao-titulo">
  <div class="container container--wide">
    <div class="resources-catalog-intro">
      <div>
        <p class="eyebrow">Biblioteca de oração</p>
        <h2 id="catalogo-oracao-titulo">{{ prayer_catalog.title }}</h2>
        <p>{{ prayer_catalog.description }}</p>
      </div>
      <p class="resources-catalog-intro__count"><strong>{{ prayer_total }}</strong> títulos organizados em <strong>{{ prayer_catalog.categories | size }}</strong> categorias.</p>
    </div>

    <div class="resources-catalog-controls" data-catalog-controls>
      <div class="resources-search">
        <label for="resources-search-input">Pesquisar no catálogo</label>
        <div class="resources-search__field">
          <svg class="icon" width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="m20.4 21.8-6.3-6.3a7.5 7.5 0 1 1 1.4-1.4l6.3 6.3-1.4 1.4ZM9.5 15A5.5 5.5 0 1 0 9.5 4a5.5 5.5 0 0 0 0 11Z"/>
          </svg>
          <input id="resources-search-input" type="search" placeholder="Ex.: São José, Rosário, Espírito Santo..." autocomplete="off" spellcheck="false" data-resources-search>
          <button class="resources-search__clear" type="button" data-resources-clear hidden>Limpar</button>
        </div>
      </div>

      <div class="resources-filter-group">
        <span class="resources-filter-group__label">Filtrar por categoria</span>
        <div class="resources-filter-list" role="group" aria-label="Categorias do catálogo">
          <button class="resources-filter is-active" type="button" data-category-filter="all" aria-pressed="true">Todas</button>
          {% for category in prayer_catalog.categories %}
            <button class="resources-filter" type="button" data-category-filter="{{ category.id }}" aria-pressed="false">{{ category.title }}</button>
          {% endfor %}
        </div>
      </div>

      <div class="resources-catalog-actions">
        <p class="resources-results-status" aria-live="polite" data-results-status>{{ prayer_total }} conteúdos encontrados.</p>
        <div>
          <button class="button button--text button--small" type="button" data-expand-all>Expandir categorias</button>
          <button class="button button--text button--small" type="button" data-collapse-all>Recolher categorias</button>
        </div>
      </div>
    </div>

    <noscript>
      <p class="notice">O catálogo permanece disponível sem JavaScript. A busca e os filtros exigem JavaScript ativado no navegador.</p>
    </noscript>

    <div class="resources-catalog" data-resources-catalog>
      {% for category in prayer_catalog.categories %}
        {% assign category_size = category.items | size %}
        <details class="resources-category" id="{{ category.id }}" data-resource-category="{{ category.id }}"{% if forloop.first %} open{% endif %}>
          <summary>
            <span class="resources-category__summary">
              <span>
                <strong>{{ category.title }}</strong>
                <small>{{ category.description }}</small>
              </span>
              <span class="resources-category__count">{{ category_size }}</span>
              <svg class="resources-category__chevron" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="m7.4 8.6 4.6 4.6 4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z"/>
              </svg>
            </span>
          </summary>

          <ul class="resources-prayer-list">
            {% for item in category.items %}
              <li class="resources-prayer-item" data-resource-item>
                <span class="resources-prayer-item__marker" aria-hidden="true"></span>
                <span>{{ item }}</span>
              </li>
            {% endfor %}
          </ul>
        </details>
      {% endfor %}
    </div>

    <div class="resources-empty-state" data-resources-empty hidden>
      <span aria-hidden="true">⌕</span>
      <h3>Nenhum conteúdo encontrado</h3>
      <p>Tente pesquisar por outro santo, devoção, oração ou período litúrgico, ou volte a exibir todas as categorias.</p>
      <button class="button button--tonal" type="button" data-reset-catalog>Limpar pesquisa e filtros</button>
    </div>
  </div>
</section>

<section class="section section--surface resources-final" aria-labelledby="sempre-disponivel">
  <div class="container container--wide">
    <div class="resources-final__grid">
      <div>
        <p class="eyebrow">Que Seu nome nunca se afaste dos seus lábios</p>
        <h2 id="sempre-disponivel">Uma biblioteca espiritual sempre disponível</h2>
        <p>Seja dentro de uma igreja, em seu quarto ou durante uma viagem, o Oratio reúne caminhos de oração para ajudar você a interromper a pressa, recolher o coração e reservar um tempo sincero para Deus.</p>
      </div>
      <a class="button button--primary" href="{{ download_url }}">Disponível na Google Play</a>
    </div>
  </div>
</section>

<div class="container container--large">
  {% include app-download-banner.html %}
</div>
