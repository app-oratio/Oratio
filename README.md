<div align="center">

<img src="assets/images/branding/oratio-logo.png" alt="Logotipo do Oratio" width="300">

# Oratio

### App católico de oração, liturgia e formação espiritual

**“Que Seu nome nunca se afaste dos seus lábios”**

[Site oficial](https://app-oratio.github.io/Oratio/) •
[Aplicativo para Android](https://app-oratio.github.io/Oratio/aplicativo/) •
[Documentação de implementação](GUIA_DE_IMPLEMENTACAO.md)

</div>

## Sobre o projeto

O **Oratio** é um projeto católico independente criado para reunir, em um ambiente gratuito, organizado e acessível, recursos que auxiliem a vida de oração, o acompanhamento da liturgia e o estudo da fé católica.

Este repositório contém o portal oficial do Oratio, desenvolvido como um site estático e responsivo com **Jekyll**, publicado pelo **GitHub Pages** e integrado ao aplicativo gratuito disponível para dispositivos Android. A arquitetura foi preparada para manter um amplo acervo de conteúdos em Markdown e YAML, sem depender de banco de dados, servidor próprio ou framework pesado de interface.

O projeto é idealizado e desenvolvido por **Paulo Ricardo Alves**, fundador do Oratio.

## Principais recursos

O portal reúne diferentes áreas da vida espiritual e formativa, entre as quais estão:

- **Liturgia diária**, com celebração, leituras, salmos e demais textos próprios de cada dia;
- **Liturgia das Horas**, organizada de acordo com as Horas canônicas e com destaque para o Ofício mais apropriado ao momento;
- **Calendário litúrgico**, com tempos, semanas, solenidades, festas, memórias e cores litúrgicas;
- **Orações**, organizadas por categorias, idiomas, intenções e modos de leitura;
- **Novenas, quaresmas, trintenas, trezenas, tríduos e devoções mensais**, com navegação diária, calendário e acompanhamento de progresso;
- **Terços, rosários e coroas**, com estrutura própria para mistérios, repetições e contagens;
- **Devocionários**, com conteúdos extensos organizados em seções;
- **Santos**, com calendário, biografias, cronologias, informações biográficas e celebrações;
- **Meditações espirituais**, incluindo a coleção de meditações de Santo Afonso de Ligório;
- **Sagrada Escritura**, apresentada em páginas próprias para livros e capítulos;
- **Catecismo da Igreja Católica**, estruturado para leitura contínua e navegação interna;
- **Formações e artigos**, destinados ao aprofundamento da fé e da vida cristã;
- **Busca interna**, que permite localizar conteúdos publicados em diferentes coleções;
- **Tema claro e escuro**, interface responsiva, recursos de acessibilidade e suporte à instalação como aplicação web.

## Aplicativo para Android

O Oratio também está disponível como aplicativo gratuito para Android, permitindo acessar orações, liturgia, Bíblias, terços, novenas, músicas e outros recursos espirituais em uma experiência preparada especialmente para dispositivos móveis.

A página oficial do aplicativo pode ser acessada em:

**https://app-oratio.github.io/Oratio/aplicativo/**

## Tecnologias utilizadas

O portal foi construído com uma arquitetura estática, simples de hospedar e adequada ao GitHub Pages:

- **Jekyll 4.4**
- **Ruby 3.3** no fluxo de publicação
- **HTML5 semântico**
- **CSS responsivo**
- **JavaScript puro**
- **Markdown**
- **YAML**
- **Liquid**
- **GitHub Actions**
- **GitHub Pages**
- **Jekyll SEO Tag**
- **Jekyll Feed**

O projeto não utiliza banco de dados nem backend tradicional, pois os conteúdos são processados durante a compilação e publicados como páginas estáticas.

## Estrutura do repositório

```text
Oratio/
├── .github/workflows/       # Compilação e publicação automática
├── _biblia/                 # Livros e capítulos da Sagrada Escritura
├── _catecismo/              # Conteúdos do Catecismo
├── _coroas/                 # Coroas devocionais
├── _data/                   # Dados globais, menus, configurações e catálogos
├── _devocionarios/          # Devocionários
├── _devocoes_mensais/       # Devoções organizadas por mês
├── _dias_novena/            # Páginas diárias dos itinerários devocionais
├── _formacoes/              # Conteúdos de formação
├── _includes/               # Componentes reutilizáveis em Liquid
├── _layouts/                # Modelos das páginas
├── _meditacoes/             # Meditações espirituais
├── _novenas/                # Novenas
├── _oracoes/                # Orações
├── _plugins/                # Extensões locais do Jekyll
├── _posts/                  # Artigos e publicações do blog
├── _quaresmas/              # Itinerários de quarenta dias
├── _rosarios/               # Rosários
├── _santos/                 # Biografias e celebrações dos santos
├── _tercos/                 # Terços
├── _trezenas/               # Trezenas
├── _triduos/                # Tríduos
├── _trintenas/              # Trintenas
├── assets/                  # CSS, JavaScript, imagens, ícones e identidade visual
├── content/liturgia/        # Fontes utilizadas na geração da liturgia
├── liturgia/                # Estrutura pública da Liturgia das Horas
├── pages/                   # Páginas institucionais e índices
├── search/                  # Índice estático da pesquisa
├── tools/                   # Scripts de geração, sincronização e validação
├── _config.yml              # Configuração principal do Jekyll
├── GUIA_DE_IMPLEMENTACAO.md # Manual editorial e técnico
├── Gemfile                  # Dependências Ruby
├── index.html               # Página inicial
└── manifest.webmanifest     # Configuração da aplicação web
```

## Como executar localmente

### Requisitos

Antes de iniciar, instale os seguintes programas:

- Git;
- Ruby;
- Bundler;
- Node.js, utilizado por algumas ferramentas de sincronização;
- Python 3, utilizado pelo validador do projeto.

### Instalação

Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/app-oratio/Oratio.git
cd Oratio
```

Instale o Bundler e as dependências do Jekyll:

```bash
gem install bundler
bundle install
```

Inicie o servidor local:

```bash
bundle exec jekyll serve --livereload
```

Como o projeto está configurado com o endereço-base `/Oratio`, o portal normalmente ficará disponível em:

```text
http://127.0.0.1:4000/Oratio/
```

Para executar localmente na raiz do servidor, também é possível utilizar:

```bash
bundle exec jekyll serve --livereload --baseurl ""
```

Nesse caso, o endereço será:

```text
http://127.0.0.1:4000/
```

## Compilação e validação

Para gerar o site estático sem iniciar o servidor, execute:

```bash
bundle exec jekyll build
```

O resultado será criado na pasta `_site/`.

Antes de enviar alterações importantes, recomenda-se executar também o validador do projeto:

```bash
python3 tools/validate_project.py
```

A sincronização do calendário litúrgico pode ser executada pelo script correspondente, informando o ano desejado:

```bash
node tools/sync-liturgical-calendar.mjs 2026
```

O ano deve ser alterado conforme o período que estiver sendo preparado para publicação.

## Publicação no GitHub Pages

O arquivo `.github/workflows/jekyll.yml` contém o fluxo responsável pela publicação automática. Sempre que uma alteração é enviada à branch `main`, o GitHub Actions realiza as seguintes etapas:

1. baixa os arquivos do repositório;
2. sincroniza o calendário litúrgico configurado;
3. prepara o Ruby e as dependências;
4. executa a auditoria dos conteúdos;
5. compila o portal com o Jekyll;
6. envia o resultado para o GitHub Pages.

Para utilizar o fluxo em outro repositório, acesse **Settings > Pages** e selecione **GitHub Actions** como fonte de publicação.

## Inclusão de novos conteúdos

Os conteúdos editoriais devem ser criados nas coleções correspondentes e precisam respeitar os campos, estruturas, convenções de nomes, idiomas, contagens, calendários e relacionamentos definidos pelo projeto.

Antes de adicionar ou alterar orações, novenas, quaresmas, trintenas, devoções mensais, trezenas, tríduos, terços, rosários, coroas ou devocionários, consulte obrigatoriamente:

**[GUIA_DE_IMPLEMENTACAO.md](GUIA_DE_IMPLEMENTACAO.md)**

O princípio central da arquitetura é manter os textos e dados nos arquivos de conteúdo, enquanto os layouts, componentes e scripts fornecem automaticamente recursos como capa, navegação, alternância de idiomas, progresso, contagem, calendário, intenções, pesquisa e metadados sociais.

## Convenções importantes

Ao colaborar com o projeto:

- preserve a codificação UTF-8 e os caracteres da língua portuguesa;
- utilize nomes de arquivos e slugs consistentes, preferencialmente em letras minúsculas e separados por hífen;
- não altere layouts ou componentes globais para resolver um problema restrito a um único conteúdo;
- não duplique orações comuns quando o sistema de referências já puder fornecê-las;
- teste os links considerando o `baseurl` do GitHub Pages;
- execute a compilação local antes de enviar alterações;
- não adicione textos, traduções, imagens ou outros materiais protegidos sem verificar a permissão de uso;
- mantenha a fidelidade doutrinal, litúrgica e editorial dos conteúdos católicos publicados.

## Contribuições

Contribuições técnicas, correções de conteúdo e sugestões de melhoria são bem-vindas, desde que respeitem a identidade, a finalidade e a arquitetura do Oratio.

Para contribuir:

1. crie um fork do repositório;
2. abra uma branch para a alteração;
3. faça mudanças pequenas, claras e compatíveis com a estrutura existente;
4. valide e compile o projeto localmente;
5. envie um pull request explicando o problema e a solução adotada.

Em mudanças extensas, especialmente aquelas que alterem coleções, URLs, layouts, mecanismos litúrgicos ou estruturas de dados, recomenda-se abrir primeiro uma issue para que a proposta possa ser analisada antes da implementação.

## Licença e direitos de uso

O código-fonte do projeto é distribuído sob a **Licença MIT**, conforme estabelecido no arquivo [LICENSE](LICENSE).

A licença do código não concede automaticamente autorização para reutilizar a marca **Oratio**, seus logotipos, sua identidade visual, seus textos editoriais, suas compilações devocionais, suas imagens ou materiais pertencentes a terceiros. Cada elemento deve ser utilizado de acordo com sua origem, sua licença específica e a legislação aplicável.

## Contato

Informações institucionais, canais oficiais e formas de colaborar com o projeto estão disponíveis no próprio portal:

**https://app-oratio.github.io/Oratio/**

---

<div align="center">

**Oratio**

Um projeto católico independente a serviço da oração, da liturgia e da formação espiritual.

</div>
