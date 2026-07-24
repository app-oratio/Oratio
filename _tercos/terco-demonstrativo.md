---
title: "[Exemplo técnico] Terço com motor universal"
slug: "terco-demonstrativo"
description: "Roteiro reduzido para demonstrar capa, textos centralizados, idiomas, seções e contagem discreta."
category: "Demonstração"
prayer_beads_type: "Terço"
sequence_title: "Etapas do roteiro demonstrativo"
image: "/assets/images/placeholders/template-landscape.svg"
image_alt: "Capa demonstrativa do terço"
default_language: "pt"
demo: true
search: true
sections:
  - id: abertura
    kicker: "Preparação"
    title: "Orações iniciais"
    theme: "Recolher o coração"
    prayers:
      - id: sinal-inicial
        label: "Sinal da Cruz inicial"
        common_prayer: "sinal-da-cruz"
        count: 1
      - id: oferecimento
        label: "Oferecimento"
        label-latin: "Oblatio"
        note: "Esta unidade não declara count e, por isso, exibe o texto sem qualquer contador."
        prayer: |-
          Senhor, recebei este tempo de oração e as intenções que trazemos no coração. Conduzi-nos com serenidade e confiança. Amém.
        prayer-latin: |-
          Domine, suscipe hoc tempus orationis et intentiones quas in corde gerimus. Duc nos cum serenitate et fiducia. Amen.
  - id: primeiro-misterio
    kicker: "Primeiro mistério"
    title: "Mistério demonstrativo"
    theme: "Permanecer na presença de Deus"
    meditation: "Leia a meditação correspondente antes de iniciar a contagem das orações."
    prayers:
      - id: pai-nosso
        common_prayer: "pai-nosso"
        count: 1
      - id: ave-maria
        common_prayer: "ave-maria"
        count: 10
      - id: gloria
        common_prayer: "gloria-ao-pai"
        count: 1
  - id: encerramento
    kicker: "Conclusão"
    title: "Oração final"
    prayers:
      - id: sinal-final
        label: "Sinal da Cruz final"
        common_prayer: "sinal-da-cruz"
        count: 1
---

Este roteiro reduzido demonstra como um mesmo arquivo pode combinar orações do catálogo central, textos próprios, português e latim, seções temáticas e quantidades diferentes, sem exigir alterações no layout ou no JavaScript.
