# Vasques e Torrubia Advogados — Landing pages

Duas LPs para campanhas de Meta Ads no Rio de Janeiro, com identidade visual compartilhada e composições próprias.

| Rota | Frente | Responsável |
|---|---|---|
| `/direito-a-saude` | Direito à Saúde (planos de saúde) | Dra. Vanessa Vasques |
| `/direitos-da-pessoa-com-deficiencia` | Direitos da Pessoa com Deficiência | Dra. Carolina Torrubia |
| `/` | Página de escolha entre as frentes | — |

Cada frente tem sua página de obrigado (`/…/obrigado`), que abre o WhatsApp oficial (21) 96963-9667 após ~3 s com mensagem própria.

## Estrutura

```
index.html                         escolha entre as frentes
direito-a-saude/                   LP 1 + obrigado/
direitos-da-pessoa-com-deficiencia/ LP 2 + obrigado/
assets/css/base.css                identidade compartilhada (cores em variáveis no topo)
assets/css/saude.css | pcd.css     composição de cada LP
assets/js/lead.js                  validação, envio e redirecionamento do formulário
assets/js/obrigado.js              redirecionamento para o WhatsApp
assets/js/tracking.js              Pixel Meta / Google Ads — preparados e DESATIVADOS
assets/img/                        logo oficial vetorizado (tinta e branco) e favicon
api/lead.js                        função Vercel que recebe e repassa o lead
```

Site estático (HTML/CSS/JS), sem etapa de build.

## Leads

O formulário pede apenas **nome e WhatsApp** e envia para `/api/lead` com a frente (`direito_saude` ou `direitos_pcd`), a página de origem e as UTMs/fbclid/gclid. A função repassa o lead em JSON para a URL definida em:

- `LEAD_WEBHOOK_URL` — destino (CRM, automação, planilha). **Obrigatória.**
- `LEAD_WEBHOOK_TOKEN` — opcional, enviado como `Authorization: Bearer`.

Sem `LEAD_WEBHOOK_URL`, a função responde 503 e o visitante vê uma mensagem de erro — o redirecionamento só acontece quando o lead é confirmado.

## Rastreamento

Preencha `metaPixelId` (e, no futuro, `googleAdsId`) em `assets/js/tracking.js`. Vazio = nada carrega.

## Incluir um novo serviço na LP de PcD

Copie um bloco `<section class="pc-tema">` inteiro em `direitos-da-pessoa-com-deficiencia/index.html`, troque `id`, número e textos, e acrescente o link no índice `<nav class="pc-index">`.

## Pendências

- Copy final da seção do formulário (textos atuais são provisórios)
- Destino dos leads (`LEAD_WEBHOOK_URL`)
- Fotos definitivas (hoje: Freepik, servidas pelo CDN do Freepik)
- Domínio do escritório
- OAB, endereço e avaliações liberadas para uso público
- Lista completa de serviços da Dra. Carolina
