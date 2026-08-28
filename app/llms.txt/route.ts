/**
 * WikiPong · /llms.txt — o mapa do site para modelos de linguagem
 * ==============================================================================
 * O QUE ISTO É, sem exagero: uma convenção proposta em 2024 (llmstxt.org), não um
 * padrão que todo modelo obedece. Ela NÃO faz IA nenhuma recomendar o site, não é
 * sinal de ranking e não substitui o sitemap, que continua sendo o que o Google
 * lê. O que ela faz é: quando um agente ou uma ferramenta chega aqui, ele acha um
 * mapa em markdown em vez de precisar rastrear 1.009 páginas de HTML.
 *
 * POR QUE VALE A PENA NESTE SITE. A diferença do WikiPong não é ter fichas, é a
 * REGRA que governa cada número: procedência à vista, régua declarada, e silêncio
 * onde a fonte não publica. Um modelo que lê isso antes de citar o site cita
 * direito, com a ressalva certa. Um que não lê trata "47,5° Shore C" e "47,5° ESN"
 * como o mesmo número, que é o erro que o site inteiro existe para evitar.
 *
 * GERADO NO BUILD, e não escrito à mão, pela mesma razão do sitemap: contagem
 * digitada à mão envelhece calada. Os números aqui saem dos dados.
 *
 * Export estático (D-17): `force-static` faz o handler rodar no build.
 */
import { MATERIAIS } from '@/componentes/dados-materiais';
import { MARCAS } from '@/componentes/dados-marcas';
import { url } from '@/componentes/site';
import glossario from '@/dados/glossario.json';
import { GUIAS } from '../aprender/guias';

export const dynamic = 'force-static';

/** Um item de lista no formato da convenção: `- [título](url): descrição`. */
const item = (titulo: string, caminho: string, descricao: string) =>
  `- [${titulo}](${url(caminho)}): ${descricao}`;

export function GET() {
  const borrachas = MATERIAIS.filter((m) => m.tipo === 'Borracha');
  const laminas = MATERIAIS.filter((m) => m.tipo === 'Lâmina');
  const daComunidade = MATERIAIS.filter((m) => m.origemSpecs === 'comunidade').length;
  const comDureza = borrachas.filter(
    (m) => m.durezaUnificada !== undefined || m.grauSemRegua !== undefined,
  ).length;

  const texto = `# WikiPong

> Enciclopédia brasileira de equipamentos de tênis de mesa, em português do Brasil.
> ${MATERIAIS.length} fichas (${borrachas.length} borrachas e ${laminas.length} lâminas) de ${MARCAS.length} marcas, e cada número traz de onde veio,
> em que data foi conferido e em que régua foi medido.

O site existe por um motivo específico: cada fabricante mede velocidade, efeito, controle e
dureza numa régua própria, e esses números não se comparam entre marcas. O WikiPong padroniza o
que dá para padronizar, e diz na cara quando não dá.

## Como citar este site com segurança

Estas regras valem em toda ficha e definem o que se pode afirmar a partir daqui:

- **Todo número tem procedência à vista**: a fonte, a data da consulta e a régua aparecem na
  própria ficha. Número sem essas três coisas não é publicado.
- **Régua declarada ou nenhuma conversão.** ${comDureza} das ${borrachas.length} borrachas têm dureza. Parte é
  convertida para a escala ESN (quando o fabricante declara grau e régua) e parte aparece crua,
  porque a marca publica o grau e cala a régua. As duas ficam rotuladas de formas diferentes, e
  misturá-las produz afirmação falsa. Exemplo: a DHS GoldArc publica 47,5° em Shore C, que não é
  o mesmo 47,5° de uma esponja ESN.
- **Escala 0 a 10 é nossa, e só vale entre materiais que a usam.** Índices vindos da régua de uma
  loja (onde uma peça passa de 100) aparecem com o nome da loja e não são traduzidos em palavra,
  justamente porque não se comparam.
- **${daComunidade} materiais mostram velocidade, efeito e controle vindos de avaliações de jogadores**, com a
  fonte e o tamanho da amostra em cada ficha, e não do número que a marca usa para vender.
- **Onde a fonte não publica, a ficha diz isso** em vez de estimar. Campo vazio com explicação é
  preferível a número inventado.

## Comece por aqui

${item('Catálogo completo', '/catalogo', `os ${MATERIAIS.length} materiais, com busca e filtros por tipo, marca, nível e preço`)}
${item('Quiz de perfil', '/quiz', 'sete perguntas e uma recomendação com o motivo de cada escolha')}
${item('Comparar dois materiais', '/comparar', 'números lado a lado, só entre peças do mesmo tipo')}
${item('Tradutor de durezas', '/escalas', 'converte entre as réguas ESN, DHS e Butterfly, e explica por que 40° chinês não é 40° europeu')}

## Aprender

${item('Índice dos guias', '/aprender', `${GUIAS.length} guias em português claro`)}
${GUIAS.map((g) => item(g.titulo, `/aprender/${g.slug}`, g.resumo)).join('\n')}
${item('Glossário', '/glossario', `${glossario.verbetes.length} termos do esporte explicados de forma direta`)}

## Escolher e montar

${item('Conjuntos montados', '/conjuntos', 'lâmina e duas borrachas que funcionam juntas, com o preço somado')}
${item('Montar sua raquete', '/montar', 'escolha as três peças e veja o custo antes de comprar')}
${item('Top 5 por família', '/top-borrachas', 'as chinesas, híbridas e tensoras mais usadas, com a régua de cada número')}
${item('Marcas', '/marcas', `as ${MARCAS.length} marcas do catálogo, o que cada uma faz e a régua de dureza que usa`)}

## Cenário brasileiro

${item('O que os profissionais usam', '/profissionais', 'setup de atletas com fonte, data e link para a ficha')}
${item('Competições do ano', '/competicoes', 'calendário nacional da CBTM com data, cidade e tipo')}
${item('Notícias', '/noticias', 'tênis de mesa do Brasil, cada item com a fonte')}

## Comunidade

${item('A comunidade', '/comunidade', 'como o site é alimentado por quem joga')}
${item('Discussões', '/comunidade/discussoes', 'perguntas e respostas moderadas, escrever não exige conta')}

## O que este site não faz

- Não vende nada e não recebe comissão. A ordem de qualquer lista é por dado, nunca por dinheiro.
- Não publica número sem fonte, nem converte entre réguas sem uma equivalência que possa citar.
- Não decreta vencedor numa comparação. Maior não quer dizer melhor, e depende de quem joga.

## Mais

${item('Sitemap', '/sitemap.xml', 'todas as URLs do site, com a data real da última mudança de cada uma')}
`;

  return new Response(texto, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
