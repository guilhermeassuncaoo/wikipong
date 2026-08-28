/**
 * WikiPong · robots.txt (gerado no build).
 *
 * Postura: o site QUER ser indexado. É uma enciclopédia, e distribuição é busca
 * (D-17). Então libera tudo, com UMA exceção que não é conteúdo:
 *
 *  · `/ir/` é o interstitial de saída pra loja. 669 páginas linkam pra ele com
 *    uma query string diferente cada uma (`/ir/?o=<material>--<loja>`), e sem
 *    este bloqueio o robô rastrearia 669 variantes da MESMA página de
 *    redirecionamento. É o único lugar do site onde o orçamento de rastreio
 *    pesa mais que a regra da seção abaixo, e por isso ele acumula as três
 *    proteções de propósito: `Disallow` aqui, `noindex` na página e
 *    `rel="nofollow sponsored"` em cada link que aponta pra ele.
 *
 * ── POR QUE `/_next/` SAIU DAQUI (conserto de 2026-08-25) ────────────────────
 * O arquivo bloqueava `/_next/` com a intenção de esconder "assets internos do
 * framework". Só que é ali que moram os 25 CSS e os 60 JS do site inteiro.
 *
 * O Google RENDERIZA a página pra avaliá-la. Sem folha de estilo ele vê um site
 * sem layout; sem script ele não vê nada que o cliente monte. E o catálogo é
 * exatamente esse caso: o HTML estático traz 60 materiais e a lista completa
 * entra com o JS. Bloquear CSS/JS é coisa que o Google desaconselha
 * explicitamente desde 2014, e aqui não havia nada a proteger: bundle .js não
 * vira resultado de busca.
 *
 * ── DISALLOW NÃO É NOINDEX, E MISTURAR OS DOIS SAI PELA CULATRA ──────────────
 * As telas de conta (/comunidade/entrar, /perfil, /jogador, /boas-vindas,
 * /moderacao, /nova-senha) NÃO entram na lista abaixo, e isso é deliberado.
 * Elas se declaram `noindex` na própria página. Se também fossem bloqueadas
 * aqui, o robô não poderia buscá-las e portanto nunca leria o `noindex` — e uma
 * URL bloqueada ainda pode aparecer no resultado, só que sem título nem resumo.
 * Ou se bloqueia o rastreamento, ou se pede pra não indexar. Nunca os dois.
 */
import type { MetadataRoute } from 'next';
import { url, URL_SITE } from '@/componentes/site';

/** Export estático (D-17) exige que rotas de metadata sejam geradas no build. */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/ir/'],
    },
    sitemap: `${URL_SITE}/sitemap.xml`,
    host: url('/').replace(/\/$/, ''),
  };
}
