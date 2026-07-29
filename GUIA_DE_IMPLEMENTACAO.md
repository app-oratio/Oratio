# Manual único de criação e inclusão de conteúdos devocionais no Oratio

Este documento é a referência editorial e técnica para todos os conteúdos de oração do site do Oratio. Ele descreve o sistema efetivamente implementado no repositório e deve ser consultado antes da criação de orações, novenas, quaresmas, trintenas, devoções mensais, trezenas, tríduos, terços, rosários, coroas e devocionários.

O princípio central do sistema é simples: os arquivos de conteúdo declaram dados e textos, enquanto layouts, includes e JavaScript oferecem capa, leitura, idiomas, contagem, progresso, calendário, intenções, busca e navegação. Um conteúdo novo não deve exigir alterações na infraestrutura quando respeita os contratos deste manual.

## Sumário

1. [Regras fundamentais](#1-regras-fundamentais)
2. [Arquitetura do sistema](#2-arquitetura-do-sistema)
3. [Escolha da coleção](#3-escolha-da-coleção)
4. [Nomes, slugs e URLs](#4-nomes-slugs-e-urls)
5. [Front matter e Markdown](#5-front-matter-e-markdown)
6. [Campos gerais](#6-campos-gerais)
7. [Motor universal de oração](#7-motor-universal-de-oração)
8. [Contagem explícita](#8-contagem-explícita)
9. [Português e latim por oração](#9-português-e-latim-por-oração)
10. [Catálogo de orações comuns](#10-catálogo-de-orações-comuns)
11. [Orações independentes](#11-orações-independentes)
12. [Terços, rosários e coroas](#12-terços-rosários-e-coroas)
13. [Devocionários](#13-devocionários)
14. [Novenas e demais itinerários](#14-novenas-e-demais-itinerários)
15. [Arquivos dos dias](#15-arquivos-dos-dias)
16. [Calendário devocional](#16-calendário-devocional)
17. [Imagens de capa](#17-imagens-de-capa)
18. [Intenções e progresso local](#18-intenções-e-progresso-local)
19. [Busca, SEO e sitemap](#19-busca-seo-e-sitemap)
20. [Ferramentas de leitura e acessibilidade](#20-ferramentas-de-leitura-e-acessibilidade)
21. [Validação e testes](#21-validação-e-testes)
22. [Publicação](#22-publicação)
23. [Erros frequentes](#23-erros-frequentes)
24. [Modelos rápidos](#24-modelos-rápidos)
25. [Checklist final](#25-checklist-final)

## 1. Regras fundamentais

As seguintes regras são obrigatórias para qualquer conteúdo novo:

1. A contagem de uma oração é opcional e só existe quando a própria ocorrência declara `count` com um inteiro positivo.
2. A ausência de `count` nunca equivale a `count: 1`, nem mesmo em terços, rosários ou coroas.
3. Português e latim são capacidades opcionais de cada oração individual, não uma propriedade inseparável do roteiro inteiro.
4. Cada unidade pode usar `label`, `label-latin`, `prayer`, `prayer-latin` e `count`.
5. Quando `label-latin` estiver ausente ou vazio, o sistema reutiliza `label`.
6. Quando `prayer-latin` estiver ausente ou vazio, o sistema reutiliza `prayer`.
7. A página principal de uma novena, quaresma ou outro itinerário diário contém exclusivamente a apresentação da devoção. Nenhuma oração deve ficar nela.
8. Todas as orações de um itinerário diário, inclusive as comuns a todos os dias, devem estar dentro de cada arquivo diário em que serão rezadas.
9. Todos os dias de qualquer itinerário ficam em `_dias_novena/{slug}/dia-N.md`.
10. A capa declarada na página principal é aplicada automaticamente a todos os dias. Os arquivos diários não repetem `image` nem `image_alt`.
11. A página principal acompanha apenas o progresso dos dias. Ela não possui contagem de orações nem ferramentas de ajuste do texto da oração.
12. Os textos tradicionais reutilizados devem vir de `_data/common_prayers.yml`, mediante `common_prayer`.
13. Cada conteúdo deve possuir `slug` estável, pois URLs, intenções e progresso local dependem dele.
14. Um arquivo novo deve passar pelo validador antes da publicação.

## 2. Arquitetura do sistema

### 2.1 Pastas de conteúdo

| Caminho | Conteúdo |
| --- | --- |
| `_oracoes` | Orações independentes |
| `_novenas` | Páginas principais de novenas |
| `_quaresmas` | Páginas principais de quaresmas |
| `_trintenas` | Páginas principais de trintenas |
| `_devocoes_mensais` | Páginas principais de devoções mensais |
| `_trezenas` | Páginas principais de trezenas |
| `_triduos` | Páginas principais de tríduos |
| `_dias_novena/{slug}` | Dias de todas as devoções com estrutura diária |
| `_tercos` | Terços e coroinhas |
| `_rosarios` | Rosários |
| `_coroas` | Coroas |
| `_devocionarios` | Devocionários e roteiros independentes |
| `_data/common_prayers.yml` | Catálogo compartilhado de orações recorrentes |

Não crie novamente `_dias_devocao`. A única coleção diária é `dias_novena`, embora ela atenda todas as famílias de itinerários.

### 2.2 Arquivos de infraestrutura

| Arquivo | Responsabilidade |
| --- | --- |
| `_layouts/prayer.html` | Página de oração independente |
| `_layouts/novena.html` | Página principal de itinerário |
| `_layouts/novena-day.html` | Página de cada dia |
| `_layouts/counted-prayer.html` | Terços, rosários e coroas |
| `_layouts/devotional.html` | Devocionários |
| `_includes/devotional-prayer-unit.html` | Uma oração individual, seus idiomas e seu contador opcional |
| `_includes/devotional-sequence.html` | Seções, unidades e progresso contável |
| `_includes/reading-tools.html` | Tamanho do texto, cópia e impressão |
| `_includes/devotional-cover.html` | Capa e fallback visual |
| `assets/js/counted-prayer.js` | Idioma individual, contagem e progresso das unidades |
| `assets/js/novena-navigation.js` | Datas, progresso diário, backup e navegação |
| `assets/js/main.js` | Ajuste e indicação do tamanho do texto |
| `search/index.json` | Índice da busca interna |
| `sitemap.xml` | URLs destinadas aos mecanismos externos |
| `tools/validate_project.py` | Verificação estrutural do conteúdo |

Não edite esses arquivos para cadastrar uma devoção comum. Eles só devem mudar quando o próprio motor receber um recurso novo.

## 3. Escolha da coleção

| Tipo editorial | Pasta | URL gerada |
| --- | --- | --- |
| Oração | `_oracoes` | `/oracoes/{slug}/` |
| Novena | `_novenas` | `/novenas/{slug}/` |
| Quaresma | `_quaresmas` | `/quaresmas/{slug}/` |
| Trintena | `_trintenas` | `/trintenas/{slug}/` |
| Devoção mensal | `_devocoes_mensais` | `/devocoes-mensais/{slug}/` |
| Trezena | `_trezenas` | `/trezenas/{slug}/` |
| Tríduo | `_triduos` | `/triduos/{slug}/` |
| Dia de qualquer itinerário | `_dias_novena/{slug}` | Definida por `permalink` |
| Terço | `_tercos` | `/tercos/{slug}/` |
| Rosário | `_rosarios` | `/rosarios/{slug}/` |
| Coroa | `_coroas` | `/coroas/{slug}/` |
| Devocionário | `_devocionarios` | `/devocionarios/{slug}/` |

Use `_oracoes` quando o conteúdo puder ser rezado como uma unidade independente. Use `_tercos`, `_rosarios` ou `_coroas` quando uma sequência de etapas constituir a forma da devoção. Use uma coleção de itinerário quando o conteúdo for dividido em dias e necessitar de calendário, continuidade e conclusão diária.

## 4. Nomes, slugs e URLs

### 4.1 Arquivos principais

O nome do arquivo e o `slug` devem coincidir sempre que possível:

```text
_oracoes/oracao-de-exemplo.md
slug: "oracao-de-exemplo"
```

```text
_novenas/novena-de-exemplo.md
slug: "novena-de-exemplo"
```

Use somente letras minúsculas, números e hífens. Não use espaços, acentos, sublinhados ou letras maiúsculas.

### 4.2 Arquivos diários

O caminho diário é rígido:

```text
_dias_novena/{slug-da-pagina-principal}/dia-{numero}.md
```

Exemplo:

```text
_novenas/novena-de-sao-bento.md
_dias_novena/novena-de-sao-bento/dia-1.md
_dias_novena/novena-de-sao-bento/dia-2.md
_dias_novena/novena-de-sao-bento/dia-9.md
```

O validador rejeita nomes como `novena-de-sao-bento-dia-1.md`, pastas diferentes do `slug` e dias guardados diretamente na raiz de `_dias_novena`.

### 4.3 Estabilidade

Não altere um `slug` depois da publicação sem planejar redirecionamentos e migração de armazenamento local. O `slug` participa das URLs, das intenções e das chaves de progresso do navegador.

## 5. Front matter e Markdown

Todo arquivo `.md` começa com front matter YAML:

```yaml
---
title: "Título visível"
slug: "slug-estavel"
description: "Descrição editorial objetiva."
---
```

O conteúdo Markdown começa depois do segundo `---`.

Regras importantes:

- use espaços, nunca tabulação;
- mantenha a mesma indentação dentro das listas;
- coloque textos com dois-pontos entre aspas;
- use `|-` para textos longos;
- represente listas com hífens;
- não duplique chaves;
- use valores booleanos sem aspas, como `true` e `false`;
- use números sem aspas em `count`, `days`, `base_month` e `base_day`.

Exemplo de texto longo:

```yaml
prayer: |-
  Primeiro parágrafo da oração.

  Segundo parágrafo da oração.
```

## 6. Campos gerais

| Campo | Função | Regra |
| --- | --- | --- |
| `title` | Título da página | Obrigatório |
| `slug` | Identificador e parte da URL | Obrigatório nos arquivos principais |
| `description` | Resumo editorial e de busca | Obrigatório nos arquivos principais |
| `category` | Categoria exibida | Recomendado |
| `image` | Caminho da capa | Obrigatório nos conteúdos devocionais |
| `image_alt` | Descrição da capa | Obrigatório editorialmente |
| `duration` | Tempo aproximado | Opcional |
| `source` | Fonte ou tradição | Opcional e recomendada quando aplicável |
| `featured` | Destaque em listagens | Opcional |
| `order` | Ordenação editorial | Opcional |
| `keywords` | Termos auxiliares da busca | Opcional |
| `related` | Slugs relacionados | Opcional |
| `search` | Inclusão na busca interna | Use `false` nos dias |
| `demo` | Marca conteúdo demonstrativo | Use somente em exemplos técnicos |
| `default_language` | Idioma inicial das unidades | `pt` ou `la`; se ausente, usa `pt` |

Exemplo:

```yaml
---
title: "Oração de exemplo"
slug: "oracao-de-exemplo"
description: "Descrição breve do propósito desta oração."
category: "Orações para o cotidiano"
image: "/assets/images/prayers/oracao-de-exemplo.webp"
image_alt: "Descrição objetiva da imagem de capa"
duration: "Cerca de 3 minutos"
source: "Fonte editorial"
default_language: "pt"
search: true
keywords:
  - oração
  - exemplo
---
```

## 7. Motor universal de oração

O motor aceita conteúdo simples em Markdown e conteúdo estruturado. Contagem, tradução latina e seções são recursos opcionais. O controle Português/Latim pertence sempre à oração individual; quando não existe tradução, o lado latino reutiliza o conteúdo português.

### 7.1 Conteúdo simples

Uma oração composta apenas pelo corpo Markdown não precisa de `sections`:

```yaml
---
title: "Oração simples"
slug: "oracao-simples"
description: "Descrição da oração."
category: "Orações para o cotidiano"
image: "/assets/images/prayers/oracao-simples.webp"
image_alt: "Descrição da capa"
---

Escreva aqui o texto integral da oração.
```

Esse modo recebe capa, tamanho de texto com indicação percentual, cópia, impressão, intenções e compartilhamento. O corpo é tratado como uma única oração: o seletor individual Português/Latim aparece normalmente e, como não há `prayer-latin`, os dois lados exibem o mesmo texto em português. Ele não cria contador enquanto `count` não for declarado.

### 7.2 Conteúdo estruturado

Use `sections` quando o conteúdo possuir várias etapas ou várias orações:

```yaml
sections:
  - id: preparacao
    kicker: "Abertura"
    title: "Preparação"
    theme: "Recolher o coração"
    meditation: "Texto opcional de meditação."
    content: |-
      Orientação opcional da seção.
    prayers:
      - id: invocacao
        label: "Invocação"
        label-latin: "Invocatio"
        prayer: |-
          Texto em português.
        prayer-latin: |-
          Textus latinus.
        count: 3
```

### 7.3 Campos de uma seção

| Campo | Função |
| --- | --- |
| `id` | Identificador estável da seção |
| `kicker` | Pequena indicação acima do título |
| `title` | Título da seção |
| `theme` | Tema espiritual |
| `meditation` | Meditação em Markdown |
| `content` | Orientação adicional em Markdown |
| `prayers` | Lista de orações individuais |

### 7.4 Campos de uma oração individual

| Campo | Função |
| --- | --- |
| `id` | Identificador estável da ocorrência |
| `label` | Nome em português |
| `label-latin` | Nome em latim, com fallback para `label` |
| `prayer` | Texto em português |
| `prayer-latin` | Texto em latim, com fallback para `prayer` |
| `common_prayer` | Chave do catálogo central |
| `count` | Quantidade explícita de marcações |
| `note` | Orientação curta |
| `prayer_url` | Link opcional para uma página própria |
| `default_language` | Idioma inicial desta ocorrência |

O `id` deve permanecer estável, pois ele identifica a contagem salva no navegador. Não use a posição visual como único identificador de um item que poderá ser reordenado no futuro.

### 7.5 Compatibilidade legada

O motor ainda reconhece:

- `texts.pt` e `texts.la`;
- `groups` no lugar de `prayers`;
- `common-prayer` no lugar de `common_prayer`;
- `default-language` no lugar de `default_language`;
- `prayer: "pai-nosso"` como referência antiga, quando o valor corresponde exatamente a uma chave do catálogo.

Não use esses formatos em arquivos novos. O formato canônico é `prayers`, `common_prayer`, `prayer`, `prayer-latin` e `default_language`.

## 8. Contagem explícita

### 8.1 Regra de ativação

O contador só é renderizado quando a ocorrência declara `count`:

```yaml
- id: ave-maria
  common_prayer: "ave-maria"
  count: 10
```

Uma oração marcada uma única vez também precisa ser explícita:

```yaml
- id: pai-nosso
  common_prayer: "pai-nosso"
  count: 1
```

Sem `count`, o texto e o seletor individual de idioma permanecem visíveis, mas não aparecem botões, valor contado, barra da unidade, progresso contável nem ação de continuidade vinculada àquela ocorrência:

```yaml
- id: oferecimento
  label: "Oferecimento"
  prayer: |-
    Texto do oferecimento.
```

Quando `count` está presente e possui um inteiro positivo, o cartão mostra a instrução em destaque dourado e negrito, como `10 vezes`, além do progresso dinâmico `0 de 10`. Esse destaque também depende da chave explícita e nunca é criado por padrão.

### 8.2 Valores válidos

Use somente inteiros positivos:

```yaml
count: 1
count: 3
count: 10
count: 33
```

São inválidos:

```yaml
count: 0
count: -1
count: "dez"
count: 2.5
```

### 8.3 Local da quantidade

`count` pertence à ocorrência, não ao catálogo central. A mesma Ave-Maria pode aparecer uma vez em uma abertura, três vezes em uma preparação e dez vezes em uma dezena.

## 9. Português e latim por oração

### 9.1 Alternância individual

Cada unidade estruturada possui seu próprio controle Português/Latim. Alterar o idioma de uma oração não modifica as demais unidades da página.

Exemplo completo:

```yaml
- id: gloria
  label: "Glória ao Pai"
  label-latin: "Gloria Patri"
  prayer: |-
    Texto em português.
  prayer-latin: |-
    Textus latinus.
  count: 1
```

### 9.2 Fallback obrigatório

Se a tradução ainda não existir, omita a chave:

```yaml
- id: suplica
  label: "Súplica"
  prayer: |-
    Texto somente em português.
```

Também é permitido manter o campo vazio durante uma migração:

```yaml
- id: suplica
  label: "Súplica"
  label-latin: ""
  prayer: |-
    Texto somente em português.
  prayer-latin: ""
```

Nos dois casos, a opção Latim reutiliza `label` e `prayer`. Não escreva traduções provisórias ou automáticas apenas para evitar o fallback.

### 9.3 Idioma inicial

O padrão é português:

```yaml
default_language: "pt"
```

Para iniciar em latim:

```yaml
default_language: "la"
```

Uma unidade pode substituir o padrão do documento:

```yaml
- id: gloria
  common_prayer: "gloria-ao-pai"
  default_language: "la"
  count: 1
```

Mesmo quando o padrão é `la`, uma oração sem tradução utiliza seu texto português por fallback.

### 9.4 Revisão linguística

Revise separadamente texto e rótulo. Verifique ortografia, acentuação, pontuação, tradição textual, fonte e direitos de uso. O motor garante a apresentação e o fallback, não a correção teológica ou linguística da tradução.

## 10. Catálogo de orações comuns

### 10.1 Finalidade

`_data/common_prayers.yml` centraliza textos repetidos, como Sinal da Cruz, Pai-Nosso, Ave-Maria, Glória ao Pai e ladainhas. Uma correção feita no catálogo vale para todos os roteiros que usam aquela chave.

### 10.2 Entrada do catálogo

O formato atual do catálogo aceita `title`, `label-latin`, `default_language`, `url` e `texts`:

```yaml
oracao-de-exemplo:
  title: "Oração de exemplo"
  label-latin: "Oratio exempli"
  default_language: "pt"
  url: "/oracoes/oracao-de-exemplo/"
  texts:
    pt: |-
      Texto em português.
    la: |-
      Textus latinus.
```

A chave deve usar apenas letras minúsculas, números e hífens.

### 10.3 Referência canônica

Use `common_prayer`:

```yaml
- id: ave-maria
  common_prayer: "ave-maria"
  count: 10
```

Não use `prayer` para novas referências ao catálogo, pois `prayer` agora representa o texto português escrito diretamente no arquivo.

### 10.4 Rótulo local

Uma ocorrência pode adaptar o rótulo sem duplicar o texto:

```yaml
- id: sinal-inicial
  label: "Sinal da Cruz inicial"
  label-latin: "Signum Crucis initiale"
  common_prayer: "sinal-da-cruz"
  count: 1
```

Se `label-latin` for omitido nesse exemplo, o fallback será `Sinal da Cruz inicial`, porque um `label` local sempre tem prioridade sobre o rótulo latino do catálogo.

### 10.5 Página própria

Uma oração do catálogo pode possuir uma página em `_oracoes`:

```yaml
---
title: "Pai-Nosso"
slug: "pai-nosso"
description: "Oração ensinada por Jesus aos discípulos."
category: "Orações fundamentais"
image: "/assets/images/prayers/pai-nosso.webp"
image_alt: "Descrição da capa"
common_prayer: "pai-nosso"
---
```

## 11. Orações independentes

### 11.1 Oração simples

Crie `_oracoes/oracao-de-exemplo.md`:

```yaml
---
title: "Oração de exemplo"
slug: "oracao-de-exemplo"
description: "Descrição breve."
category: "Orações para o cotidiano"
image: "/assets/images/prayers/oracao-de-exemplo.webp"
image_alt: "Descrição da capa"
duration: "Cerca de 2 minutos"
source: "Fonte editorial"
search: true
---

Texto integral da oração.
```

### 11.2 Oração única bilíngue e contável

```yaml
---
title: "Invocação de exemplo"
slug: "invocacao-de-exemplo"
description: "Descrição breve."
category: "Invocações"
image: "/assets/images/prayers/invocacao-de-exemplo.webp"
image_alt: "Descrição da capa"
label: "Invocação"
label-latin: "Invocatio"
prayer: |-
  Texto em português.
prayer-latin: |-
  Textus latinus.
count: 7
---
```

### 11.3 Oração com seções

```yaml
---
title: "Oração com etapas"
slug: "oracao-com-etapas"
description: "Descrição breve."
category: "Roteiros de oração"
image: "/assets/images/prayers/oracao-com-etapas.webp"
image_alt: "Descrição da capa"
sequence_title: "Etapas"
default_language: "pt"
sections:
  - id: abertura
    title: "Abertura"
    prayers:
      - id: sinal
        common_prayer: "sinal-da-cruz"
        count: 1
  - id: suplica
    title: "Súplica"
    prayers:
      - id: invocacao
        label: "Invocação"
        prayer: |-
          Texto em português.
        prayer-latin: |-
          Textus latinus.
        count: 3
---

Introdução opcional ao roteiro.
```

## 12. Terços, rosários e coroas

### 12.1 Campos principais

```yaml
title: "Terço de exemplo"
slug: "terco-de-exemplo"
description: "Descrição do terço."
category: "Terços"
prayer_beads_type: "Terço"
sequence_title: "Mistérios e orações"
image: "/assets/images/tercos/terco-de-exemplo.webp"
image_alt: "Descrição da capa"
default_language: "pt"
```

Use `prayer_beads_type` com `Terço`, `Rosário`, `Coroa` ou outro nome editorial adequado. `mystery_set` é opcional.

### 12.2 Modelo de terço

```yaml
---
title: "Terço de exemplo"
slug: "terco-de-exemplo"
description: "Descrição do terço."
category: "Terços"
prayer_beads_type: "Terço"
sequence_title: "Mistérios e orações"
image: "/assets/images/tercos/terco-de-exemplo.webp"
image_alt: "Descrição da capa"
default_language: "pt"
sections:
  - id: abertura
    kicker: "Preparação"
    title: "Orações iniciais"
    prayers:
      - id: sinal-inicial
        label: "Sinal da Cruz inicial"
        common_prayer: "sinal-da-cruz"
        count: 1
      - id: oferecimento
        label: "Oferecimento"
        prayer: |-
          Texto do oferecimento.
  - id: primeiro-misterio
    kicker: "Primeiro mistério"
    title: "Título do mistério"
    meditation: "Meditação do mistério."
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
  - id: conclusao
    title: "Conclusão"
    prayers:
      - id: sinal-final
        label: "Sinal da Cruz final"
        common_prayer: "sinal-da-cruz"
        count: 1
---

Introdução e orientações gerais.
```

O oferecimento do exemplo não possui `count`, portanto ele mostra o texto e o idioma sem participar da contagem.

### 12.3 Rosário

Use `_rosarios`, altere `prayer_beads_type` para `Rosário` e inclua todas as seções necessárias. O motor não presume cinco, quinze ou vinte mistérios e não cria quantidades automaticamente.

### 12.4 Coroa ou coroinha

Use `_coroas` para coroas e `_tercos` para coroinhas quando essa classificação estiver de acordo com a navegação editorial. Quantidades como 3, 7, 12, 33 ou outras são aceitas desde que cada ocorrência declare seu próprio `count`.

### 12.5 Texto dentro dos cartões

Cada item deve trazer texto direto ou `common_prayer`. `prayer_url` pode complementar a unidade, mas não deve ser o único recurso quando o usuário precisa rezar o texto dentro do roteiro.

## 13. Devocionários

### 13.1 Devocionário simples

```yaml
---
title: "Devocionário de exemplo"
slug: "devocionario-de-exemplo"
description: "Descrição do propósito."
category: "Vida de oração"
image: "/assets/images/devocionarios/devocionario-de-exemplo.webp"
image_alt: "Descrição da capa"
duration: "Cerca de 15 minutos"
---

## Preparação

Texto.

## Meditação

Texto.

## Oração

Texto.
```

### 13.2 Devocionário estruturado

```yaml
---
title: "Devocionário estruturado"
slug: "devocionario-estruturado"
description: "Descrição do propósito."
category: "Vida de oração"
image: "/assets/images/devocionarios/devocionario-estruturado.webp"
image_alt: "Descrição da capa"
sequence_title: "Exercícios e orações"
default_language: "pt"
sections:
  - id: preparacao
    title: "Preparação"
    content: |-
      Orientação inicial.
    prayers:
      - id: sinal
        common_prayer: "sinal-da-cruz"
        count: 1
      - id: invocacao
        common_prayer: "vinde-espirito-santo"
  - id: exercicio
    title: "Exercício principal"
    prayers:
      - id: jaculatoria
        label: "Invocação breve"
        label-latin: "Invocatio brevis"
        prayer: |-
          Texto em português.
        prayer-latin: |-
          Textus latinus.
        count: 5
---

Introdução do devocionário.
```

Devocionários recebem capa, tamanho de texto indicado em porcentagem, cópia, impressão, seções opcionais, idioma individual, contagem explícita, progresso contável, intenções, compartilhamento e relacionados.

## 14. Novenas e demais itinerários

### 14.1 Estrutura obrigatória

Um itinerário possui:

1. uma página principal na coleção correspondente;
2. uma pasta própria dentro de `_dias_novena`;
3. um arquivo para cada dia;
4. uma imagem de capa declarada somente na página principal.

Exemplo:

```text
_quaresmas/quaresma-de-exemplo.md
_dias_novena/quaresma-de-exemplo/dia-1.md
_dias_novena/quaresma-de-exemplo/dia-2.md
...
```

### 14.2 Função exclusiva da página principal

A página principal apresenta a história, a finalidade, a orientação e o contexto da devoção. Ela também mostra:

- capa;
- duração;
- calendário oficial e particular;
- progresso dos dias;
- ação para começar, continuar ou rezar novamente;
- lista dos dias;
- intenções particulares;
- exportação e importação do progresso.

Ela não mostra:

- oração;
- seções de oração;
- contador de orações;
- percentual de orações;
- bloco “Orações comuns”;
- ajuste do tamanho do texto da oração.

São proibidos na página principal os campos `sections`, `sequence_title`, `count`, `common_prayer`, `texts`, `prayer`, `prayer-latin`, `label` e equivalentes. O validador impede sua publicação.

### 14.3 Modelo da página principal

```yaml
---
title: "Novena de exemplo"
slug: "novena-de-exemplo"
description: "Apresentação resumida da novena."
image: "/assets/images/novenas/novena-de-exemplo/cover.webp"
image_alt: "Descrição da capa"
saint: "Nome do santo, quando aplicável"
days: 9
category: "Novenas"
calendar:
  base_month: 1
  base_day: 10
  skip_weekdays: []
search: true
keywords:
  - novena
  - exemplo
---

Apresente aqui a origem, a finalidade e as orientações da novena, sem inserir nenhuma oração.

## Organização

Explique como os dias estão estruturados e informe o que for necessário para a participação consciente do usuário.
```

### 14.4 Outras famílias

O mesmo modelo vale para:

| Família | Pasta principal | URL |
| --- | --- | --- |
| Quaresma | `_quaresmas` | `/quaresmas/{slug}/` |
| Trintena | `_trintenas` | `/trintenas/{slug}/` |
| Devoção mensal | `_devocoes_mensais` | `/devocoes-mensais/{slug}/` |
| Trezena | `_trezenas` | `/trezenas/{slug}/` |
| Tríduo | `_triduos` | `/triduos/{slug}/` |

Todos os dias continuam em `_dias_novena/{slug}/`.

## 15. Arquivos dos dias

### 15.1 Modelo simples

Crie `_dias_novena/novena-de-exemplo/dia-1.md`:

```yaml
---
title: "Primeiro dia da Novena de exemplo"
theme: "Tema do dia"
devotion: "novena-de-exemplo"
day: 1
description: "Descrição específica do primeiro dia."
permalink: /novenas/novena-de-exemplo/dia-1/
search: false
---

## Intenção do dia

Texto da intenção.

## Meditação

Texto da meditação.

## Oração inicial

Texto integral da oração comum a todos os dias.

## Oração do dia

Texto específico do dia.

## Oração final

Texto integral da oração comum a todos os dias.
```

Se uma oração é comum aos nove dias, ela deve aparecer nos nove arquivos. Não a transfira para a página principal.

### 15.2 Dia estruturado

```yaml
---
title: "Primeiro dia da Novena de exemplo"
theme: "Tema do dia"
devotion: "novena-de-exemplo"
day: 1
description: "Descrição do dia."
permalink: /novenas/novena-de-exemplo/dia-1/
default_language: "pt"
sequence_title: "Orações do primeiro dia"
search: false
sections:
  - id: abertura
    title: "Orações iniciais"
    prayers:
      - id: sinal
        common_prayer: "sinal-da-cruz"
        count: 1
      - id: suplica
        label: "Súplica"
        label-latin: "Supplicatio"
        prayer: |-
          Texto em português.
        prayer-latin: |-
          Textus latinus.
        count: 3
  - id: conclusao
    title: "Conclusão"
    prayers:
      - id: gloria
        common_prayer: "gloria-ao-pai"
        count: 1
---

Meditação e explicações deste dia.
```

### 15.3 Relacionamento

`devotion` deve ser idêntico ao `slug` da página principal, independentemente da família. Não use mais a chave `novena`.

O validador exige:

- pasta igual ao `slug`;
- arquivo chamado `dia-N.md`;
- `day` inteiro correspondente a `N`;
- sequência completa de `1` até `days`;
- `permalink` explícito;
- página principal existente;
- ausência de `image` e `image_alt` no dia.

### 15.4 Capa herdada

O sistema localiza a página principal por `devotion` e usa a imagem dela no cabeçalho e nos metadados sociais de cada dia. Uma alteração em `image` ou `image_alt` na página principal passa automaticamente a valer em todos os dias, inclusive em `og:image`, `og:image:secure_url`, `og:image:alt`, `twitter:image` e `twitter:image:alt`.

Não copie `image` nem `image_alt` para os arquivos diários. Além de duplicar informação editorial, isso é recusado pelo validador porque a página principal deve permanecer como fonte única da capa.

## 16. Calendário devocional

### 16.1 Data-base

`base_month` e `base_day` representam o dia seguinte ao último dia contado. Uma novena que termina em 9 de janeiro usa:

```yaml
calendar:
  base_month: 1
  base_day: 10
  skip_weekdays: []
```

Uma novena de nove dias produzirá 1º a 9 de janeiro.

### 16.2 Dias excluídos

Use números de `0` a `6`:

| Número | Dia |
| --- | --- |
| `0` | Domingo |
| `1` | Segunda-feira |
| `2` | Terça-feira |
| `3` | Quarta-feira |
| `4` | Quinta-feira |
| `5` | Sexta-feira |
| `6` | Sábado |

Exemplo que não conta domingos:

```yaml
calendar:
  base_month: 8
  base_day: 20
  skip_weekdays:
    - 0
```

A mesma exclusão se aplica ao calendário oficial e à data particular escolhida pelo usuário.

### 16.3 Data particular

O visitante pode selecionar outra data de início. Essa escolha fica no navegador e não altera o arquivo editorial nem o calendário de outros usuários.

### 16.4 Configuração obrigatória

Toda página principal deve possuir `calendar` com data-base válida. O sistema ainda reconhece `start_month` e `start_day` por compatibilidade, mas arquivos novos devem usar `base_month` e `base_day`.

## 17. Imagens de capa

### 17.1 Obrigatoriedade

Orações, terços, rosários, coroas, devocionários e páginas principais de itinerários devem declarar:

```yaml
image: "/assets/images/categoria/arquivo.webp"
image_alt: "Descrição objetiva da imagem"
```

Os dias não declaram esses campos, pois herdam a capa da página principal.

### 17.2 Organização sugerida

```text
assets/images/prayers/{slug}.webp
assets/images/tercos/{slug}.webp
assets/images/rosarios/{slug}.webp
assets/images/coroas/{slug}.webp
assets/images/devocionarios/{slug}.webp
assets/images/novenas/{slug}/cover.webp
assets/images/quaresmas/{slug}/cover.webp
```

### 17.3 Formato

- prefira WebP ou AVIF para fotografias e ilustrações;
- use SVG somente em gráficos vetoriais confiáveis;
- comprima o arquivo;
- confirme direitos de uso;
- evite texto indispensável dentro da imagem;
- use uma capa quadrada para itinerários, idealmente com pelo menos `1000 x 1000`;
- use proporção próxima de `16:10` nos demais conteúdos.

### 17.4 Texto alternativo

Descreva a imagem, não a interface:

```yaml
image_alt: "São Bento segurando a Regra diante de um mosteiro"
```

Evite:

```yaml
image_alt: "Imagem da novena"
```

## 18. Intenções e progresso local

### 18.1 Intenções

As intenções são salvas somente no navegador. Uma oração, terço ou devocionário possui seu próprio conjunto.

A página principal e todos os dias do mesmo itinerário compartilham a mesma chave, portanto uma intenção registrada na apresentação permanece acessível dentro dos dias.

### 18.2 Contagem de orações

O estado contável usa:

```text
oratio:devotional-sequence:v2:{collection}:{slug}
```

Cada `id` de oração identifica uma entrada. Alterar o `id` faz aquela ocorrência parecer nova para o navegador.

### 18.3 Progresso dos dias

O progresso diário usa:

```text
oratio:devotion-progress:v2:{collection}:{slug}
```

Ele armazena dias concluídos, data particular e última atualização. A página principal mostra somente esse progresso.

### 18.4 Exportação e importação

No desktop, as ações aparecem diretamente. No mobile, elas ficam dentro de “Gerenciar progresso”. O arquivo JSON restaura progresso e data particular, mas não transfere intenções.

## 19. Busca, SEO e sitemap

### 19.1 Busca interna

A busca indexa:

- corpo Markdown;
- `label` e `label-latin`;
- `prayer` e `prayer-latin`;
- `texts.pt` e `texts.la` legados;
- títulos, temas, meditações e conteúdos das seções;
- orações trazidas por `common_prayer`;
- texto de todos os dias dentro do resultado da página principal.

Os dias usam `search: false`, pois não devem aparecer como resultados internos separados. Uma frase presente apenas no nono dia pode localizar a página principal.

### 19.2 Google e sitemap

Cada dia continua sendo uma página HTML individual, com URL própria no sitemap. `search: false` afeta somente a busca interna e não cria `noindex`.

### 19.3 Capa dos dias

A capa é herdada automaticamente da página principal tanto na interface quanto no SEO social de cada dia. O arquivo `_includes/head.html` encontra a devoção relacionada pelo campo `devotion` e publica a URL absoluta da capa em `og:image` e `twitter:image`, juntamente com os campos de texto alternativo. Dessa forma, serviços que leem Open Graph, como o WhatsApp, podem exibir a mesma imagem da novena ao compartilhar a URL de qualquer dia.

A página principal permanece como fonte editorial única. Para trocar simultaneamente a capa dela e de todos os dias, altere apenas:

```yaml
image: "/assets/images/novenas/novena-de-exemplo/cover.webp"
image_alt: "Descrição objetiva da capa"
```

Depois da publicação, teste a URL pública de pelo menos um dia. Aplicativos de mensagem podem manter em cache uma prévia antiga por algum tempo, mesmo quando o HTML já contém a imagem correta.

## 20. Ferramentas de leitura e acessibilidade

Orações, dias, terços, rosários, coroas e devocionários exibem ferramentas de leitura. O controle de tamanho apresenta o valor atual, como `90%`, `100%` ou `120%`, persiste a preferência localmente e ajusta simultaneamente os textos das orações e os blocos `meditation` das seções. A meditação conserva seu tamanho-base próprio, enquanto o percentual representa a mesma proporção aplicada a todos esses blocos.

A página principal de um itinerário não possui esse controle, pois seu corpo é apresentação e não área de oração.

Ao revisar:

- teste teclado;
- confira foco visível;
- verifique contraste nos temas claro e escuro;
- confirme `image_alt`;
- confira títulos em ordem lógica;
- teste Português/Latim separadamente em cada unidade;
- confirme que o fallback mantém o texto legível;
- verifique a página em `320 px`;
- teste impressão.

## 21. Validação e testes

### 21.1 Validador estrutural

Execute na raiz:

```bash
python3 tools/validate_project.py
```

Ele verifica, entre outros pontos:

- YAML;
- arquivos obrigatórios;
- imagens de capa;
- idiomas;
- `count` positivo;
- unidades sem texto;
- chaves do catálogo;
- IDs duplicados;
- páginas principais sem campos de oração;
- relação entre página principal e dias;
- pastas `_dias_novena/{slug}`;
- nomes `dia-N.md`;
- sequência completa dos dias;
- ausência de capas repetidas nos dias;
- calendários;
- assets referenciados;
- equilíbrio básico dos blocos Liquid.

### 21.2 Compilação Jekyll

```bash
bundle install
bundle exec jekyll build
```

Para servir localmente:

```bash
bundle exec jekyll serve
```

Abra o endereço informado pelo Jekyll e respeite o `baseurl`.

### 21.3 JavaScript

```bash
node --check assets/js/main.js
node --check assets/js/counted-prayer.js
node --check assets/js/novena-navigation.js
```

### 21.4 Testes manuais mínimos

1. Oração sem `count`, confirmando ausência total do contador.
2. Oração com `count: 1`, confirmando o destaque “1 vez”.
3. Oração com quantidade maior, confirmando o destaque dourado “X vezes”.
4. Duas unidades com idiomas escolhidos de forma independente.
5. `label-latin` e `prayer-latin` preenchidos.
6. Campos latinos omitidos.
7. Campos latinos vazios.
8. Indicador percentual do tamanho do texto, confirmando o ajuste simultâneo da oração e da meditação.
9. Página principal sem ferramentas de oração.
10. Capa igual na página principal e nos dias.
11. Calendário com e sem dia excluído.
12. Progresso, exportação e importação.
13. Busca por uma frase existente somente em um dia.
14. Navegação anterior e seguinte.

## 22. Publicação

### 22.1 Conjunto coerente

Publique um itinerário com:

- página principal;
- pasta completa dos dias;
- capa;
- eventuais entradas novas no catálogo.

Não publique `days: 9` com apenas alguns dias disponíveis.

### 22.2 Git

Exemplo:

```bash
git add \
  _novenas/novena-de-exemplo.md \
  _dias_novena/novena-de-exemplo \
  assets/images/novenas/novena-de-exemplo/cover.webp
```

Depois:

```bash
python3 tools/validate_project.py
bundle exec jekyll build
git status
git commit -m "Adiciona Novena de exemplo"
git push
```

Revise `git status` antes do commit e não envie `_site`, `vendor` ou arquivos temporários.

## 23. Erros frequentes

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| Contador aparece sem intenção editorial | `count` foi copiado indevidamente | Remova `count` |
| Contador não aparece | A ocorrência não declara `count` | Adicione um inteiro positivo |
| O dia não aparece | `devotion` difere do `slug` | Copie o slug exatamente |
| Validador rejeita o caminho diário | Pasta ou nome fora do padrão | Use `_dias_novena/{slug}/dia-N.md` |
| Capa não aparece no dia | A página principal não tem `image` válido | Corrija a página principal e o asset |
| Link de um dia não mostra capa ao compartilhar | A página principal não possui `image`, o asset ainda não foi publicado ou a prévia está em cache | Confira a capa na página principal, valide a URL pública e aguarde a renovação do cache do serviço |
| Validador rejeita `image` no dia | A capa foi duplicada | Remova `image` e `image_alt` do dia |
| O latim mostra português | O campo latino está ausente ou vazio | Esse é o fallback esperado; adicione tradução revisada quando disponível |
| Todos os cartões mudam juntos | JavaScript antigo em cache | Recarregue os assets publicados e limpe o cache de desenvolvimento |
| O título latino não muda | `label-latin` ausente | Adicione-o ou aceite o fallback de `label` |
| O catálogo não é localizado | Chave incorreta | Confira `_data/common_prayers.yml` |
| A página principal mostra oração | O texto foi escrito no arquivo-mãe | Mova-o para todos os dias correspondentes |
| A busca cria vários resultados do mesmo itinerário | `search: false` ausente nos dias | Adicione o campo |
| O progresso desaparece após edição | Um `id` ou `slug` mudou | Restaure os identificadores estáveis |
| O tamanho não mostra valor | Include ou JavaScript desatualizado | Atualize `reading-tools.html` e `main.js` juntos |

## 24. Modelos rápidos

### 24.1 Unidade direta mínima

```yaml
- id: suplica
  label: "Súplica"
  prayer: |-
    Texto em português.
```

### 24.2 Unidade direta bilíngue e contável

```yaml
- id: suplica
  label: "Súplica"
  label-latin: "Supplicatio"
  prayer: |-
    Texto em português.
  prayer-latin: |-
    Textus latinus.
  count: 3
```

### 24.3 Unidade do catálogo

```yaml
- id: ave-maria
  common_prayer: "ave-maria"
  count: 10
```

### 24.4 Seção mínima

```yaml
sections:
  - id: abertura
    title: "Abertura"
    prayers:
      - id: sinal
        common_prayer: "sinal-da-cruz"
        count: 1
```

### 24.5 Página principal mínima

```yaml
---
title: "Novena de exemplo"
slug: "novena-de-exemplo"
description: "Apresentação da novena."
image: "/assets/images/novenas/novena-de-exemplo/cover.webp"
image_alt: "Descrição da capa"
days: 9
calendar:
  base_month: 1
  base_day: 10
  skip_weekdays: []
---

Texto exclusivamente introdutório.
```

### 24.6 Dia mínimo

```yaml
---
title: "Primeiro dia da Novena de exemplo"
devotion: "novena-de-exemplo"
day: 1
permalink: /novenas/novena-de-exemplo/dia-1/
search: false
---

Todas as orações do primeiro dia.
```

Caminho:

```text
_dias_novena/novena-de-exemplo/dia-1.md
```

### 24.7 Entrada mínima do catálogo

```yaml
oracao-de-exemplo:
  title: "Oração de exemplo"
  label-latin: "Oratio exempli"
  default_language: "pt"
  texts:
    pt: |-
      Texto em português.
    la: |-
      Textus latinus.
```

## 25. Checklist final

### 25.1 Todo conteúdo

- [ ] O arquivo está na coleção correta.
- [ ] O nome usa minúsculas e hífens.
- [ ] `slug` é estável e único.
- [ ] `title` e `description` estão revisados.
- [ ] A fonte e os direitos de uso foram conferidos.
- [ ] A capa existe.
- [ ] `image_alt` descreve a capa.
- [ ] Links usam caminhos compatíveis com o site.
- [ ] O YAML está corretamente indentado.
- [ ] O validador foi executado.
- [ ] O build Jekyll foi executado quando disponível.

### 25.2 Conteúdo estruturado

- [ ] Cada seção possui `id` e `title`.
- [ ] Cada oração possui `id`.
- [ ] Texto direto usa `prayer`.
- [ ] Catálogo usa `common_prayer`.
- [ ] `label-latin` e `prayer-latin` foram revisados ou deixados para fallback.
- [ ] Cada contador desejado possui `count` explícito.
- [ ] Nenhuma unidade recebeu `count` apenas por estar em terço, rosário ou coroa.
- [ ] Os idiomas alternam individualmente.

### 25.3 Itinerário

- [ ] A página principal contém somente apresentação.
- [ ] A página principal não possui campos de oração.
- [ ] `days` corresponde à quantidade real.
- [ ] `calendar` possui data-base válida.
- [ ] A capa está somente na página principal.
- [ ] Todos os dias estão em `_dias_novena/{slug}/dia-N.md`.
- [ ] Todos os dias usam `devotion`.
- [ ] Todos os dias possuem `permalink`.
- [ ] Todos os dias usam `search: false`.
- [ ] Orações comuns foram repetidas nos dias necessários.
- [ ] A capa aparece na página principal, nos dias e na prévia de compartilhamento de uma URL diária.
- [ ] Uma frase exclusiva de um dia localiza a página principal na busca.

### 25.4 Publicação

- [ ] O conjunto está completo na mesma branch.
- [ ] Não há arquivos temporários.
- [ ] A página foi testada em mobile e desktop.
- [ ] Tema claro e escuro foram conferidos.
- [ ] Teclado, impressão e leitor de tela foram considerados.
- [ ] Progresso, idioma, contador, intenções e calendário funcionam conforme o conteúdo.

Quando os arquivos respeitam esses contratos, toda a camada devocional permanece coerente: a apresentação fica separada da oração, cada dia é organizado em sua pasta, a capa é herdada corretamente, a contagem aparece somente por decisão explícita e cada oração controla seu próprio idioma com fallback seguro para o português.
