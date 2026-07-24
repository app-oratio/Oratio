---
title: "[Exemplo técnico] Oração com seções, idiomas e contagem"
slug: "oracao-universal-demonstrativa"
description: "Arquivo demonstrativo para testar os recursos universais em uma oração comum."
category: "Demonstração"
image: "/assets/images/placeholders/template-landscape.svg"
image_alt: "Capa demonstrativa de uma oração organizada em seções"
sequence_title: "Roteiro universal demonstrativo"
default_language: "la"
demo: true
search: true
keywords:
  - seções de oração
  - português e latim
  - contagem
sections:
  - id: inicio
    kicker: "Abertura"
    title: "Preparar o coração"
    prayers:
      - id: sinal
        common_prayer: "sinal-da-cruz"
        count: 1
      - id: espirito-santo
        common_prayer: "vinde-espirito-santo"
  - id: suplica
    kicker: "Oração principal"
    title: "Súplica demonstrativa"
    content: |-
      Esta seção combina uma explicação editorial com uma oração repetida, mostrando que nem todo item precisa utilizar contagem.
    prayers:
      - id: invocacao
        label: "Invocação pela fidelidade"
        label-latin: "Invocatio pro fidelitate"
        prayer: |-
          Senhor, tornai nosso coração fiel nas pequenas decisões de cada dia.
        prayer-latin: |-
          Domine, cor nostrum fidele fac in parvis consiliis uniuscuiusque diei.
        count: 3
      - id: gloria
        common_prayer: "gloria-ao-pai"
        count: 1
---

Este texto introdutório permanece em Markdown, enquanto as orações estruturadas são declaradas no front matter. O idioma inicial deste exemplo é o latim; ao remover `default_language`, o motor utilizará automaticamente o português.
