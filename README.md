# RAÍZES — História Afrocentrada Brasileira

Uma apresentação escolar interativa sobre o protagonismo africano e afro-brasileiro na formação do Brasil. A narrativa percorre sociedades africanas, escravidão, resistência, cultura, abolição, legado e a memória de Zumbi dos Palmares.

O projeto foi criado para funcionar como uma experiência de leitura no celular e uma apresentação em tela cheia no computador. A paleta escura, os tons terrosos, os títulos editoriais e as imagens históricas acompanham o conteúdo sem exigir bibliotecas de interface.

## Tecnologias

- HTML5 semântico, CSS3 e JavaScript puro.
- Fontes gratuitas Cormorant Garamond e Inter, armazenadas localmente com as licenças OFL.
- Imagens locais em WebP, com versões menores para celular.
- APIs nativas: IntersectionObserver, requestAnimationFrame, ResizeObserver, Dialog e Fullscreen.
- Sem frameworks, instalação obrigatória, compilação ou serviços externos de aplicação.

## Executar

Abra `index.html` em um navegador moderno. O conteúdo, as imagens e os controles usam caminhos relativos.

Para testar por HTTP com Node.js instalado:

```sh
node tools/serve.cjs
```

Abra `http://127.0.0.1:4173`. Encerre o servidor com `Ctrl+C`. Ele é apenas uma ferramenta local, não faz parte da hospedagem.

## Publicar no GitHub Pages

1. Crie um repositório e envie `index.html`, `css`, `js`, `assets` e este README, preservando a estrutura.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione sua branch principal e a pasta **/ (root)**. Salve.
5. Aguarde a publicação e abra o endereço informado pelo GitHub.

Não é necessário configurar bundler, Node no servidor ou domínio próprio. Os caminhos relativos também funcionam em `https://usuario.github.io/nome-do-repositorio/`. As pastas `.qa` e `.asset-staging` são auxiliares locais e não devem ser publicadas.

## Estrutura

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── fonts/           # Fontes locais e licenças OFL
│   ├── images/          # WebP, versões pequenas e créditos
│   └── icons/           # Marca do projeto
├── tools/
│   ├── serve.cjs        # Prévia HTTP opcional
│   └── qa.cjs           # Verificação opcional com Playwright
├── .gitignore
└── README.md
```

## Navegação e apresentação

- Role naturalmente para ler ou use o menu dos capítulos.
- No celular, o menu ocupa a tela e fecha após selecionar um capítulo.
- **Apresentar** solicita tela cheia e exibe controles de navegação. Se a API não estiver disponível, os controles continuam funcionando na janela normal.
- **↓ / PageDown** e **↑ / PageUp** avançam ou retornam. Em seções longas, percorrem o conteúdo antes de mudar de momento.
- **Home** volta à abertura; **End** vai ao encerramento.
- **Esc** fecha o menu ou sai da apresentação.
- Os atalhos não substituem o comportamento de links, botões e campos que estejam com foco.
- Fontes e créditos ficam disponíveis ao final da página.

## Responsividade

A base do CSS foi escrita para telas pequenas, com ampliação das composições em breakpoints de conteúdo. Foram contempladas as larguras 320, 360, 375, 390, 412, 430, 768, 1024, 1366 e 1920 px.

- Hero com tipografia fluida e gradiente de leitura.
- Cartões compactos de origens no celular e tríptico no desktop.
- Linha do tempo vertical no celular e horizontal em telas amplas.
- Bento de cultura reorganizado conforme o espaço disponível.
- Retrato de Zumbi antes do texto no celular.
- Seções sem altura fixa obrigatória; o conteúdo pode crescer.
- `svh`/`dvh`, áreas seguras e modo horizontal considerados.

As simulações de navegador não substituem testes em aparelhos físicos de fabricantes diferentes. Taxa de quadros e comportamento da tela cheia dependem do navegador e do dispositivo.

## Acessibilidade e movimento

- Idioma `pt-BR`, regiões semânticas, hierarquia de títulos e textos alternativos.
- Link para pular ao conteúdo, foco visível e menu com diálogo nativo.
- Botões principais com área de toque de pelo menos 44 × 44 px.
- `prefers-reduced-motion` reduz o movimento e dispensa a introdução animada.
- Nenhum conteúdo depende exclusivamente de hover.
- Conteúdo histórico permanece no HTML e pode ser lido sem JavaScript.
- Rolagem nativa de toque, sem interceptação de `touchmove`.

As animações compartilham um único listener passivo de rolagem com atualização por `requestAnimationFrame`. Os reveals usam IntersectionObserver e deixam de ser observados quando aparecem. O encerramento tem uma sequência finita, sem loop permanente. O loader é uma introdução visual breve, não uma medição de bytes baixados; não bloqueia a rolagem e possui limite de segurança.

## Conteúdo e fontes

A apresentação é uma síntese didática. As sociedades africanas são tratadas como plurais, e a resistência negra acompanha a narrativa. Os detalhes pouco documentados da infância de Zumbi são identificados como relatos tradicionais. A frase “Liberdade não era negociável” é um recurso narrativo, não uma citação literal.

Principais referências, também disponíveis no site:

- [UNESCO — História Geral da África](https://www.unesco.org/en/general-history-africa)
- [UNESCO — Tumba de Askia](https://whc.unesco.org/en/list/1139/)
- [UNESCO — Mbanza Kongo](https://whc.unesco.org/en/list/1511/)
- [Arquivo Nacional — Legislação abolicionista no Império](https://www.gov.br/arquivonacional/pt-br/sites_eventos/sites-tematicos-1/brasil-oitocentista/temas-oitocentistas/legislacao-abolicionista-no-imperio)
- [Fundação Cultural Palmares / Iphan — Dossiê Serra da Barriga](https://www.gov.br/palmares/pt-br/midias/dossieserradabarriga.pdf)
- [Iphan — Roda de Capoeira](https://bcr.iphan.gov.br/bens-culturais/roda-de-capoeira/)
- [Toda Matéria — Zumbi dos Palmares](https://www.todamateria.com.br/zumbi-dos-palmares/)
- [Lei 14.759/2023](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14759.htm)

O retrato de Zumbi, de Antônio Parreiras (1927), é uma representação póstuma. As obras de Rugendas e Dapper refletem olhares europeus de seus períodos. A foto de Djenné é contemporânea e não deve ser confundida com um registro intacto do período medieval.

As atribuições, links originais e licenças estão em `assets/images/credits.json` e no rodapé. Fotografias sob Creative Commons mantêm suas licenças; redimensionamento, conversão para WebP e apresentação por CSS são declarados. Preserve os créditos ao reutilizar os arquivos.

## Verificação opcional

`tools/qa.cjs` usa Playwright e Chrome instalados no ambiente de desenvolvimento. Não é uma dependência do site. Ele verifica larguras, imagens, erros de console, menu, loader, navegação, apresentação e movimento reduzido; salva resultados e capturas em `.qa/`.

```sh
node --check js/script.js
node tools/qa.cjs
```

Execute o segundo comando com o servidor local ativo e o pacote `playwright` disponível no ambiente Node. Capturas e relatórios locais não são incluídos na publicação.
