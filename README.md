# Oratio | App Católico

Portal estático e responsivo do aplicativo Oratio, construído com Jekyll para apresentar o app e publicar blog, orações, novenas, quaresmas, outros itinerários devocionais, terços, rosários, coroas, santos, formações e páginas institucionais no GitHub Pages.

## Tecnologias

Jekyll 4, HTML5 semântico, CSS moderno, JavaScript puro, Markdown, YAML e Liquid, sem banco de dados, backend ou framework pesado de interface.

## Estrutura resumida

- `_data/`: dados institucionais, menus, rodapé, redes e destaques.
- `_includes/`: toolbar, drawer, rodapé, busca e cards reutilizáveis.
- `_layouts/`: modelos das páginas e collections.
- `_posts/` e collections: conteúdos editáveis em Markdown.
- `pages/`: páginas institucionais e arquivos de conteúdo.
- `assets/`: estilos, scripts, imagens, ícones e fontes opcionais.
- `search/index.json`: índice estático criado pelo Liquid.
- `GUIA_DE_IMPLEMENTACAO.md`: modelos completos de orações, calendários, dias e orações contadas.

## Instalação rápida

Instale Ruby, Bundler e Git, abra o terminal na raiz do projeto e execute:

```bash
gem install bundler
bundle install
bundle exec jekyll serve
```

O portal ficará disponível em `http://localhost:4000`. Para compilar sem iniciar o servidor, execute `bundle exec jekyll build`.

## Personalização essencial

Antes de publicar, ajuste `url` e `baseurl` em `_config.yml`, substitua os dados de exemplo em `_data/`, troque os placeholders da pasta `assets/images/` e revise todos os conteúdos marcados com `demo: true`.

## Publicação

O fluxo `.github/workflows/jekyll.yml` compila e publica automaticamente cada alteração enviada à branch `main`. Nas configurações do repositório, abra **Settings > Pages** e selecione **GitHub Actions** como fonte.

## Documentação

Consulte [GUIA_DE_IMPLEMENTACAO.md](GUIA_DE_IMPLEMENTACAO.md) para instruções completas de instalação, criação dos conteúdos, configuração dos calendários, armazenamento local, busca, publicação e domínio próprio.

## Licença

O código deste modelo utiliza a licença MIT. A licença não concede direitos automáticos sobre a marca Oratio, imagens, conteúdos editoriais ou materiais de terceiros.
