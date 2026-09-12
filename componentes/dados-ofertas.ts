/**
 * Ponte tipada para dados/ofertas.json — ofertas reais por material (D-13).
 *
 * Duas regras do D-13 vivem AQUI, no código, para não dependerem de disciplina:
 *   · `ofertasDoMaterial` devolve SEMPRE ordenado por preço — nunca por parceiro.
 *     Dinheiro pode decidir quem entra na lista; a posição é do preço.
 *   · `precoMedio` é DERIVADO (média das ofertas), nunca digitado.
 *
 * Enquanto não houver oferta real, `precoMedio` devolve null — e a UI mostra o
 * preço-semente rotulado como estimativa, em vez de fingir um preço apurado.
 */
import dados from '@/dados/ofertas.json';
import dadosLojas from '@/dados/lojas.json';

export interface Oferta {
  materialId: string;
  loja: string;
  /** OPCIONAL: só existe quando um preço foi realmente conferido. Sem preço
   *  conferido, a oferta ainda vale como link — mas nunca se inventa número. */
  preco?: number;
  url: string;
  /** Data REAL da checagem (ISO). Nunca fingir frescor — D-16. */
  atualizadoEm: string;
  /** Loja com acordo comercial: exige tag PARCEIRO visível. */
  parceiro?: boolean;
  /** Cupom de desconto do acordo. Só existe junto com `parceiro`. Hoje: nenhum. */
  cupom?: string;
  /** Ressalva da checagem (variante, origem do preço, pegadinha de modelo). */
  nota?: string;
}

/** Loja do diretório: onde PROCURAR. Não afirma estoque nem preço do item. */
export interface Loja {
  id: string;
  nome: string;
  url: string;
  /** Template de busca com {q} — só onde o padrão é confiável. */
  buscaTemplate?: string;
  nota?: string;
  /** Mesma dupla da oferta: loja do diretório também pode virar parceira. */
  parceiro?: boolean;
  cupom?: string;
}

export const LOJAS = dadosLojas.lojas as Loja[];
export const AVISO_LOJAS: string = dadosLojas.aviso;

/** URL de busca da loja para um termo, quando ela tem template; senão, a loja. */
export function urlDeBusca(loja: Loja, termo: string): string {
  if (!loja.buscaTemplate) return loja.url;
  const q = termo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return loja.buscaTemplate.replace('{q}', q);
}

const OFERTAS = dados.ofertas as Oferta[];

export const AVISO_OFERTAS: string = dados.aviso;

/** Ofertas de um material, SEMPRE da mais barata para a mais cara (D-13).
 *  Ofertas sem preço conferido vão para o fim — nunca ganham posição por serem
 *  de parceiro, e nunca fingem ser a mais barata. */
export function ofertasDoMaterial(materialId: string): Oferta[] {
  return OFERTAS.filter((o) => o.materialId === materialId).sort((a, b) => {
    if (a.preco === undefined && b.preco === undefined) return 0;
    if (a.preco === undefined) return 1;
    if (b.preco === undefined) return -1;
    return a.preco - b.preco;
  });
}

/** Média das ofertas COM preço conferido — o "preço médio" do D-13.
 *  null quando nenhuma oferta tem preço: aí a UI mostra estimativa, não média. */
export function precoMedio(materialId: string): number | null {
  const comPreco = ofertasDoMaterial(materialId).filter(
    (o): o is Oferta & { preco: number } => typeof o.preco === 'number',
  );
  if (comPreco.length === 0) return null;
  return comPreco.reduce((soma, o) => soma + o.preco, 0) / comPreco.length;
}

/** id estável de uma oferta, usado na rota /ir/[id] (link no nosso domínio). */
export const idDaOferta = (o: Oferta): string =>
  `${o.materialId}--${o.loja.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

export const TODAS_AS_OFERTAS: Oferta[] = OFERTAS;

export const ofertaPorId = (id: string): Oferta | undefined =>
  OFERTAS.find((o) => idDaOferta(o) === id);


/* ───────────────────── Onde comprar: uma lista só, sem preço ─────────────────
   MUDANÇA DE 2026-09-12, a pedido do fundador. Antes esta seção eram DUAS
   listas: as ofertas conferidas, em ordem de preço e com o valor em destaque, e
   embaixo o diretório de lojas. O preço saiu e as duas viraram uma.

   POR QUE O PREÇO SAIU DAQUI. Preço em destaque transforma a seção num ranking,
   e ranking dá destaque à loja mais barata do dia da checagem — que pode ter
   mudado ontem. O site não é comparador de preço: é enciclopédia. A pergunta que
   esta seção responde é "onde eu acho isto à venda", não "onde está mais
   barato". O preço não sumiu do site: ele continua no alto da ficha, como preço
   MÉDIO das ofertas, que é orientação de quanto custa a peça e não recomendação
   de loja.

   A ORDEM, e ela precisa ser dizível numa frase: primeiro quem tem link direto
   para o produto, depois quem só tem o site; em ordem alfabética dentro de cada
   grupo. Não é por preço, não é por parceria, não é pela ordem do JSON. É por
   utilidade para quem lê, e está escrita na tela embaixo da lista.

   O DIA DA PARCERIA já cabe aqui: `parceiro` e `cupom` atravessam do dado até o
   cartão. Hoje são 0 de 669 ofertas e 0 de 5 lojas, então não renderizam nada —
   e nenhuma copy promete um programa que não existe (D-16). Quando a primeira
   parceria entrar no JSON, o selo e o cupom aparecem sozinhos. */

/** Um cartão da seção "Onde comprar" — loja, não oferta, e sem preço nenhum. */
export interface CartaoDeLoja {
  /** Chave estável: serve de `key` no React e de rótulo na medição de saídas. */
  id: string;
  nome: string;
  /** Sempre uma saída do NOSSO domínio (/ir/), nunca o link da loja direto.
   *  É o que permite contar quanta gente o site manda para cada loja. */
  href: string;
  /** O que este link é, dito sem enfeite. A tela mostra literalmente. */
  tipo: 'produto' | 'busca' | 'site';
  parceiro: boolean;
  cupom?: string;
}

const semAcento = (t: string): string =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');

/**
 * Todas as lojas onde procurar um material, numa lista só.
 *
 * Loja que aparece nas duas fontes entra UMA vez, pela oferta: o link direto
 * para o produto é sempre melhor que a página inicial da mesma loja.
 */
export function lojasOndeComprar(materialId: string, termoDeBusca: string): CartaoDeLoja[] {
  const ofertas = ofertasDoMaterial(materialId);
  const jaListadas = new Set(ofertas.map((o) => semAcento(o.loja)));

  const deOferta: CartaoDeLoja[] = ofertas.map((o) => ({
    id: idDaOferta(o),
    nome: o.loja,
    href: `/ir/?o=${idDaOferta(o)}`,
    tipo: 'produto',
    parceiro: o.parceiro === true,
    cupom: o.cupom,
  }));

  const doDiretorio: CartaoDeLoja[] = LOJAS.filter((l) => !jaListadas.has(semAcento(l.nome))).map(
    (l) => ({
      id: l.id,
      nome: l.nome,
      href: `/ir/?loja=${encodeURIComponent(l.id)}&m=${encodeURIComponent(materialId)}`,
      /* Só é "busca" quando a loja tem um padrão de URL de busca confiável.
         As outras caem na página inicial, e dizer "buscar" ali seria prometer
         uma busca que não vai acontecer. */
      tipo: l.buscaTemplate ? 'busca' : 'site',
      parceiro: l.parceiro === true,
      cupom: l.cupom,
    }),
  );

  const alfabetica = (a: CartaoDeLoja, b: CartaoDeLoja) => a.nome.localeCompare(b.nome, 'pt-BR');
  return [...deOferta.sort(alfabetica), ...doDiretorio.sort(alfabetica)];
}

/** O termo que vira busca na loja: é o nome do produto, do jeito que se procura. */
export const termoDeBusca = (marca: string, nome: string): string => `${marca} ${nome}`;

/** Data legível pt-BR a partir do ISO. */
export function dataLegivel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}
