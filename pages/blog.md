---
layout: default
title: "Blog do Oratio"
description: "Notícias, atualizações do aplicativo e artigos da equipe Oratio."
permalink: /blog/
---
<div class="container container--large page-shell">
  {% include breadcrumb.html %}
  <header class="page-header page-header--split"><div><p class="eyebrow">Notícias e artigos</p><h1>Blog do Oratio</h1><p class="page-lead">Acompanhe novidades do aplicativo, comunicados e conteúdos editoriais.</p></div><button class="button button--tonal" type="button" data-search-open>{% include icon.html name='search' %}<span>Buscar no blog</span></button></header>

  {% assign featured_posts = site.posts | where: 'featured', true %}
  {% if featured_posts.size > 0 %}<section aria-labelledby="featured-posts"><div class="section-heading"><div><p class="eyebrow">Em destaque</p><h2 id="featured-posts">Publicações selecionadas</h2></div></div><div class="card-grid card-grid--2">{% for post in featured_posts limit: 2 %}{% include post-card.html item=post featured=true %}{% endfor %}</div></section>{% endif %}

  <section class="archive section" data-archive data-page-size="9" aria-labelledby="all-posts">
    <div class="section-heading"><div><p class="eyebrow">Arquivo</p><h2 id="all-posts">Todas as publicações</h2></div></div>
    <div class="archive-toolbar"><div class="field-group"><label for="blog-filter">Filtrar por título, categoria ou tag</label><input id="blog-filter" type="search" data-archive-filter placeholder="Ex.: atualização, oração, versão"></div><p data-archive-count aria-live="polite">{{ site.posts.size }} publicações</p></div>
    <div class="card-grid card-grid--3" data-archive-grid>{% for post in site.posts %}<div data-archive-item data-search-text="{{ post.title | append: ' ' | append: post.description | append: ' ' | append: post.categories | append: ' ' | append: post.tags | downcase | escape }}">{% include post-card.html item=post %}</div>{% endfor %}</div>
    <div data-archive-empty hidden>{% include empty-state.html %}</div>
    {% include pagination.html %}
  </section>

  <section aria-labelledby="blog-taxonomy"><div class="section-heading"><h2 id="blog-taxonomy">Categorias e temas</h2></div><div class="hero__actions">{% assign search_base = '/busca/' | relative_url %}{% for category in site.categories %}<a class="chip" href="{{ search_base }}?q={{ category[0] | uri_escape }}">{{ category[0] }} ({{ category[1].size }})</a>{% endfor %}</div></section>
  {% include newsletter-placeholder.html %}
</div>
