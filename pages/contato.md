---
layout: page
title: "Contato e suporte"
description: "Entre em contato com a equipe Oratio para suporte, sugestões e colaboração."
permalink: /contato/
kicker: "Fale conosco"
---

## Atendimento

O endereço configurado atualmente é **{{ site.data.contact.support_email }}** e serve como exemplo. Substitua-o pelo contato oficial em `_data/contact.yml` e `_data/site.yml` antes de publicar o portal.

<p><a class="button button--primary" href="mailto:{{ site.data.contact.support_email }}">Enviar e-mail</a></p>

{{ site.data.contact.response_note }}

## Redes sociais

Os perfis preenchidos em `_data/social.yml` aparecem automaticamente na toolbar lateral e no rodapé. Campos vazios não geram links, impedindo que o projeto publique endereços inventados.

## Formulário opcional

O GitHub Pages não processa formulários por conta própria. O modelo abaixo só é exibido quando `form_enabled: true` e `form_action` recebe o endpoint de um serviço escolhido pelo responsável.

{% if site.data.contact.form_enabled and site.data.contact.form_action != empty %}
<form class="stack" action="{{ site.data.contact.form_action }}" method="{{ site.data.contact.form_method }}">
  <div class="field-group"><label for="contact-name">Nome</label><input id="contact-name" name="name" autocomplete="name" required></div>
  <div class="field-group"><label for="contact-email">E-mail</label><input id="contact-email" name="email" type="email" autocomplete="email" required></div>
  <div class="field-group"><label for="contact-subject">Assunto</label><input id="contact-subject" name="subject" required></div>
  <div class="field-group"><label for="contact-message">Mensagem</label><textarea id="contact-message" name="message" rows="7" required></textarea></div>
  <button class="button button--primary" type="submit">Enviar mensagem</button>
</form>
{% else %}
<aside class="notice notice--warning"><strong>Formulário desativado</strong><p>O restante do site funciona normalmente. Consulte o guia de implementação para configurar um endpoint externo opcional.</p></aside>
{% endif %}

