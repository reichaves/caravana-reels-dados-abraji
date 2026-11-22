# Onde está o dado da sua pauta

Site do guia de fontes abertas para as pautas da **Caravana Abraji/IDEM de Jornalismo em Reels**, da II Oficina de Comunicação Popular Rede Wayuri / Mapa da Mina (Belém, 21 a 25 de novembro de 2026).

Para cada uma das 16 pautas, o site mostra:
- onde está a informação;
- como baixar e usar o dado;
- o que pode limitar a reportagem.

Também traz o passo a passo das bases de dados, os cuidados para usar dados em reels, uma lista de checagem, o glossário e todos os links. Tem busca, filtros por estado e tema, botão para compartilhar pela WhatsApp, lista de checagem que fica salva no celular e modo escuro.

É um site estático: HTML, CSS e JavaScript puro, sem dependências, pensado primeiro para o celular.

## Publicar no GitHub Pages

1. Crie um repositório **público** no GitHub, por exemplo `guia-fontes-reels`.
2. Envie o conteúdo desta pasta para a raiz do repositório:
   ```bash
   cd site_bases
   git init -b main
   git add .
   git commit -m "Site do guia de fontes"
   git remote add origin https://github.com/USUARIO/guia-fontes-reels.git
   git push -u origin main
   ```
3. No GitHub, abra **Settings → Pages** e, em *Build and deployment*, escolha **Deploy from a branch**, com a branch `main` e a pasta `/ (root)`.
4. Em alguns minutos o site fica em `https://USUARIO.github.io/guia-fontes-reels/`.

O arquivo `.nojekyll` faz o GitHub servir os arquivos como estão. Todos os links são relativos, então o site funciona em qualquer subpasta.

### Prévia do link no WhatsApp

Para a prévia com imagem aparecer quando alguém compartilhar o link, é preciso pôr o endereço final do site no gerador e gerar de novo. Veja a seção abaixo.

Com `SITE_URL` preenchido, o gerador também:
- cria o `sitemap.xml` e põe o endereço dele no `robots.txt`;
- deixa o link do botão de WhatsApp pronto, sem depender de JavaScript.

Sem `SITE_URL`, a página 404 descobre sozinha a pasta do repositório quando o site está em `usuario.github.io/nome-do-repo/`. Se o site ficar num domínio próprio ou em `usuario.github.io` sem subpasta, preencha `SITE_URL`.

## Como o site é gerado

As páginas não são editadas à mão. Elas são geradas a partir do mesmo conteúdo do guia em PDF e Word (`guia_pautas_reels_conteudo.json`), no projeto de origem:

```bash
python3 guia_build/build_conteudo.py guia_pautas_reels_conteudo.json   # se o conteúdo do guia mudou
python3 guia_build/build_site.py                                       # gera as páginas em site_bases/
```

- Para a prévia no WhatsApp, preencha `SITE_URL` em `guia_build/build_site.py` com o endereço final, terminado em `/`.
- As imagens e fontes de `assets/` são preparadas uma vez por `guia_build/preparar_assets_site.py`, que precisa de Pillow e `pdfimages`.
- Depois de gerar, copie o conteúdo de `site_bases/` para o repositório do site e faça o push.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | Início: busca, filtros e cards das 16 pautas |
| `pautas/4-1/` … `pautas/4-16/` | Uma página por pauta |
| `bases/` | Como baixar e usar as bases (3.1 a 3.12), dados de crime e violência com e sem coordenadas (3.13), camadas e operações no QGIS (3.14) e do dado ao reel (3.15) |
| `cuidados/` | Seis cuidados antes de começar |
| `checagem/` | Por que checar, lista de checagem e contato |
| `glossario/` | Glossário e todos os endereços |
| `assets/` | CSS, JS, índice de busca, fontes Nunito, logos e o guia em PDF |

## Créditos

- **Conteúdo:** Abraji, para a Caravana Abraji/IDEM.
- **Identidade visual:** Rede Wayuri.
- **Realização:** ISA, Rede Wayuri e FOIRN.
- **Apoio:** IDEM Institute, Cooperação Alemã e Gordon and Betty Moore Foundation.
- **Parceria:** Abraji, Justiça nos Trilhos, Laborejo e EsTrema.

As pautas aparecem pelo tema e pelo lugar, sem o nome de quem as propôs.
