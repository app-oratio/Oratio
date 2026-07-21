---
layout: app-page
title: "Aplicativo Oratio"
description: "Conheça o aplicativo católico Oratio, seus recursos, sua versão e as formas de download."
permalink: /aplicativo/
---

<section class="novena-hero">
  <div class="image-shell image-shell--portrait" data-image-shell>
    <img src="{{ '/assets/images/app/hero-app-screen.webp' | relative_url }}" width="720" height="1440" alt="Tela principal do Oratio" data-fallback-image>
    <span class="image-placeholder" hidden><span>✢</span><small>Print do aplicativo</small></span>
  </div>
  <div>
    <p class="eyebrow">{{ site.data.app.platform }}</p>
    <h2>Um auxílio para sua vida de oração</h2>
    <p>{{ site.data.app.short_description }} O aplicativo organiza liturgia, orações, devoções, música e formação em uma interface criada para favorecer o recolhimento.</p>
    <dl class="content-facts"><div><dt>Versão atual</dt><dd>{{ site.data.app.current_version }}</dd></div><div><dt>Plataforma</dt><dd>{{ site.data.app.platform }}</dd></div><div><dt>Preço</dt><dd>{% if site.data.app.free %}Gratuito{% else %}Consulte a loja{% endif %}</dd></div><div><dt>Android mínimo</dt><dd>{{ site.data.app.minimum_android }}</dd></div></dl>
  </div>
</section>

## Recursos disponíveis

O Oratio foi concebido como uma biblioteca espiritual organizada, na qual o usuário encontra liturgia diária, Liturgia das Horas, Santo Rosário, novenas, devocionários, histórias dos santos, formações, músicas e lembretes de oração. Consulte a [página completa de recursos]({{ '/recursos/' | relative_url }}) para conhecer a estrutura prevista.

<section id="download" class="support-card">
  <div><p class="eyebrow">Download</p><h2>Configure o link oficial da Google Play</h2><p>O botão definitivo aparecerá aqui quando o campo <code>play_store_url</code> for preenchido em <code>_data/app.yml</code>. Enquanto isso, esta chamada permanece dentro do próprio site e não conduz a um endereço inexistente.</p></div>
  <div class="hero__actions">{% if site.data.app.play_store_url != empty %}<a class="button button--primary" href="{{ site.data.app.play_store_url }}">Abrir na Google Play</a>{% else %}<a class="button button--tonal" href="{{ '/contato/' | relative_url }}">Pedir o link à equipe</a>{% endif %}{% if site.data.app.apk_url != empty %}<a class="button button--text" href="{{ site.data.app.apk_url }}">Baixar APK oficial</a>{% endif %}</div>
</section>

## Requisitos e suporte

O campo de versão mínima do Android está marcado como “A definir” para impedir que o site apresente uma informação técnica não confirmada. Atualize esse dado junto com a versão, o link da loja e as notas de atualização sempre que houver um novo lançamento. Para suporte, utilize a [página de contato]({{ site.data.app.support_url | relative_url }}).

