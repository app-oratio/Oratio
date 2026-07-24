---
title: "[Exemplo técnico] Itinerário com domingos excluídos"
slug: "itinerario-demonstrativo"
description: "Modelo reduzido que demonstra o cálculo de datas quando o domingo não entra na contagem."
image: "/assets/images/placeholders/template-square.svg"
image_alt: "Capa demonstrativa do itinerário com domingos excluídos"
days: 4
category: "Demonstração"
devotion_type: "Quaresma"
calendar:
  # Em 2024, os quatro dias anteriores a 20 de agosto, sem contar
  # o domingo, são 15, 16, 17 e 19 de agosto.
  base_month: 8
  base_day: 20
  skip_weekdays:
    - 0
demo: true
search: true
keywords:
  - calendário com exceções
  - domingos excluídos
---

Este conteúdo breve existe somente para demonstrar a estrutura técnica dos itinerários que não contam determinados dias da semana. O calendário oficial parte do dia-base definido no arquivo, enquanto uma data particular escolhida pelo usuário inicia uma nova sequência e aplica as mesmas exceções.

## Regra demonstrada

O valor `0` em `skip_weekdays` representa o domingo. Os demais números e os nomes aceitos estão explicados no guia do sistema devocional.
