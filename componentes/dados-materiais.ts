/**
 * Ponte tipada entre o JSON estático (D-17) e o tipo canônico Material (filtros.ts).
 * `simples` (tag + "pra quem é") é conteúdo de exibição do modo Simples (D-08),
 * por isso estende Material aqui na UI em vez de poluir o módulo puro.
 *
 * ── DUREZA UNIFICADA É DERIVADA, NÃO DIGITADA (D-09) ──────────────────────────
 * Havia duas fontes para o mesmo conceito: o campo `durezaUnificada` do JSON
 * (proposta v1 digitada à mão, sem derivação rastreável) e a ficha do FABRICANTE
 * (grau + régua, com fonte e data em fabricantes.json). Duas fontes discordavam —
 * e o pior caso não dependia da tabela de conversão: a semente dizia que a
 * Dignics 05 (40° na régua Butterfly) era MAIS MACIA que a Tenergy 05 (36° na
 * mesma régua), invertendo a ordem que o próprio fabricante publica.
 *
 * Resolução: onde o fabricante declara grau E régua, `durezaUnificada` passa a
 * ser CALCULADA (ficha → conversão → ESN-equivalente). Onde não declara, o valor
 * da semente continua valendo como estimativa — e `origemDureza` diz qual é o
 * caso, para a UI poder ser honesta sobre a procedência.
 */
import type { Material } from '@/src/logica/filtros';
import dados from '@/dados/materiais.json';
import { fabricantePorId } from './dados-fabricante';
import { escalaDoTexto, grauRepresentativo, paraESN, reguaSemConversao } from '@/src/logica/escalas';
import { MOEDAS, type Moeda } from '@/src/logica/moedas';
import type { Specs } from '@/src/logica/metricas';
import { notaBayesiana, mediaDoCatalogo } from '@/src/logica/popularidade';
import { pontosDeUso } from './dados-uso-atual';

export type OrigemDureza = 'fabricante' | 'semente';

/**
 * De onde vêm velocidade/efeito/controle:
 *  · 'comunidade' — médias do Revspin, na mesma escala 0–10, com amostra e URL
 *  · 'semente'    — proposta do protótipo, sem fonte rastreável (A VALIDAR)
 * As duas não valem o mesmo, e a ficha diz qual é qual (D-16).
 */
export type OrigemSpecs = 'comunidade' | 'semente';

export interface MaterialCatalogo extends Material {
  simples: { tag: string; frase: string };
  /** De onde veio a `durezaUnificada`: convertida da ficha do fabricante, ou
   *  estimativa-semente porque o fabricante não declara grau/régua. */
  origemDureza: OrigemDureza;
  /** O que o fabricante publica, quando publica — para a UI mostrar a origem. */
  durezaFabricante?: { grau: number; escala: string };
  /**
   * O grau que o fabricante PUBLICA quando NÃO diz em que régua ele foi medido.
   *
   * É um terceiro caso, e não um jeito de dizer "não tem": a Victas publica
   * "47,5° ± 3" em toda ficha e não nomeia a régua em nenhuma; a Yasaka
   * publica "40° a 45°" da Mark V do mesmo jeito. O número existe, é da marca,
   * e mesmo assim não pode ser convertido — sem saber a régua, 47,5 de uma não
   * é comparável com 47,5 de outra. Sem este campo a tela dizia "o fabricante
   * não publica a régua", que é verdade e esconde metade do fato.
   *
   * É o GRAU lido, não a linha crua: seis fichas guardam o número dentro de uma
   * frase ("Lisa clássica, esponja 35°") e a frase inteira não cabe no meio de
   * uma sentença. A linha crua continua à vista, logo acima, na ficha do modo
   * Técnico — nada se perde.
   *
   * `regua` vem preenchida quando a fonte NOMEIA a régua e este site não a
   * converte (a DHS declara "Shore C" na linha GoldArc). Sem ela, a fonte não
   * disse régua nenhuma. São coisas diferentes e a tela fala diferente de cada
   * uma — ver REGUAS_SEM_CONVERSAO em src/logica/escalas.ts.
   */
  grauSemRegua?: { grau: number; regua?: string };
  /** Ausente = 'semente' (os materiais antigos, anteriores a esta distinção). */
  origemSpecs?: OrigemSpecs;
}

/**
 * Três desfechos, não dois — e a diferença entre os dois últimos é o ponto:
 *  · 'convertida' — a ficha traz grau E régua: dá pra converter, e a origem é o fabricante.
 *  · 'semRegua'   — a ficha traz o GRAU e nenhuma régua. O dado existe, é da marca,
 *                   e ainda assim não converte — a tela mostra o grau e diz que a régua falta.
 *  · null         — não há linha de dureza nenhuma.
 */
type LeituraDeDureza =
  | { tipo: 'convertida'; unificada: number; grau: number; escala: string }
  | { tipo: 'semRegua'; grau: number; regua?: string }
  | null;

/** Converte a ficha do fabricante em grau ESN-equivalente. null quando não dá. */
function durezaDaFicha(id: string): LeituraDeDureza {
  const ficha = fabricantePorId(id)?.ficha;
  /* ── O LEITOR OLHAVA SÓ O RÓTULO (conserto de 2026-08-22) ──────────────────
     Ele procurava uma linha chamada "Dureza da esponja". Só que 33 fichas
     trazem o grau DENTRO de outra linha — "Superfície: Lisa, tensionada,
     esponja 50° na régua europeia". O dado estava colhido, com fonte e data, e
     o site não o lia: não entrava na dureza unificada, não aparecia no modo
     Técnico e não alimentava o /escalas.

     Era dado invisível, não dado faltando — e reescrever 33 fichas seria
     consertar o sintoma. A busca agora tem duas etapas: o rótulo primeiro
     (mais específico), e só então o valor de uma linha que fale de ESPONJA com
     grau. A exigência da palavra "esponja" é o que impede pegar um grau que
     seja de outra coisa. */
  const linha =
    ficha?.find((l) => /dureza/i.test(l.rotulo)) ??
    ficha?.find((l) => /esponja/i.test(l.valor) && /\d\s*°/.test(l.valor));
  if (!linha) return null;
  const grau = grauRepresentativo(linha.valor);
  if (grau === null) return null;
  const escala = escalaDoTexto(linha.valor);
  /* Grau sim, régua não. Antes isto devolvia null junto com "não tem dureza
     nenhuma", e a tela tratava os dois casos com a mesma frase. */
  if (escala === null) return { tipo: 'semRegua', grau, regua: reguaSemConversao(linha.valor) ?? undefined };
  const faixa = paraESN(grau, escala);
  return {
    tipo: 'convertida',
    // Centro da faixa, arredondado: a régua unificada trabalha em graus inteiros.
    unificada: Math.round((faixa.min + faixa.max) / 2),
    grau,
    escala,
  };
}

/* A lista vive em src/logica/moedas.ts — uma moeda nova se declara lá, e este
   arquivo e o formatador passam a conhecê-la juntos. */

/**
 * `moeda` do JSON de volta ao tipo estreito — ou um erro que quebra o build.
 *
 * Um código errado aqui não pode passar calado: ou a página vai tentar formatar
 * uma moeda que não existe e quebrar longe da causa, ou — pior — o valor sai
 * como se fosse real, e o leitor lê US$ 800 como R$ 800. Falhar no build é a
 * hora certa de descobrir isso.
 */
function moedaDo(m: { id: string; moeda?: string }): Moeda | undefined {
  if (m.moeda === undefined) return undefined;
  const achada = MOEDAS.find((c) => c === m.moeda);
  if (!achada) {
    throw new Error(
      `Material "${m.id}": moeda "${m.moeda}" não é uma das conhecidas (${MOEDAS.join(', ')}).`,
    );
  }
  return achada;
}

/**
 * `specs` do JSON de volta ao tipo estreito — ou um erro que quebra o build.
 *
 * Mesma razão da `moedaDo`: o JSON infere `regua` como string, e uma régua que o
 * código não conhece não pode passar calado. Publicar 118 como se fosse a régua
 * 0–10 é o defeito exato que este campo existe para impedir, e ele só é útil se
 * um valor errado falhar AQUI, e não silenciosamente numa tabela.
 */
function specsDe(m: { id: string; specs?: { velocidade: number; spin?: number; controle: number; regua?: string } }) {
  if (!m.specs) return undefined;
  const { regua, ...resto } = m.specs;
  if (regua === undefined) return resto as Specs;
  const achada = REGUAS.find((r) => r === regua);
  if (!achada) {
    throw new Error(
      `Material "${m.id}": régua "${regua}" não é uma das conhecidas (${REGUAS.join(', ')}).`,
    );
  }
  return { ...resto, regua: achada } as Specs;
}

const REGUAS = ['semente', 'megaspin'] as const;

function resolver(m: (typeof dados.materiais)[number]): MaterialCatalogo {
  /* O JSON infere `origemSpecs` como string; aqui ela volta ao tipo estreito.
     Ausente = 'semente' (os materiais anteriores a esta distinção). */
  const origemSpecs = ((m as { origemSpecs?: string }).origemSpecs ?? 'semente') as OrigemSpecs;
  const base = { ...m, origemSpecs, moeda: moedaDo(m), specs: specsDe(m) };

  const doFabricante = durezaDaFicha(m.id);
  if (!doFabricante) return { ...base, origemDureza: 'semente' };
  /* Grau publicado sem régua NÃO carimba origem 'fabricante': a dureza unificada
     que sobra é a da semente, e dizer que ela veio do fabricante seria emprestar
     ao chute a autoridade da marca. O grau cru vai junto pra tela poder mostrar
     o que a marca publica ao lado da estimativa, sem misturar os dois. */
  if (doFabricante.tipo === 'semRegua') {
    return {
      ...base,
      origemDureza: 'semente',
      grauSemRegua: { grau: doFabricante.grau, regua: doFabricante.regua },
    };
  }
  return {
    ...base,
    durezaUnificada: doFabricante.unificada,
    origemDureza: 'fabricante',
    durezaFabricante: { grau: doFabricante.grau, escala: doFabricante.escala },
  };
}

const CRUS: MaterialCatalogo[] = dados.materiais.map(resolver);

/**
 * A média das notas QUE TÊM AMOSTRA — nota de material sem avaliação nenhuma
 * não vota nela. É o âncora da média bayesiana: sem amostra, a nota de um
 * material vira esta média em vez do 4.5 de preenchimento que ele carrega.
 */
export const MEDIA_DO_CATALOGO = mediaDoCatalogo(CRUS);

/**
 * Uso atual e nota ponderada entram AQUI, na ponte, e não no JSON: os dois são
 * derivados (um de outra fonte, outro do catálogo inteiro), e dado derivado que
 * se digita à mão é dado que diverge da derivação no primeiro descuido — foi a
 * lição da `durezaUnificada`, logo acima.
 */
export const MATERIAIS: MaterialCatalogo[] = CRUS.map((m) => ({
  ...m,
  usoAtual: pontosDeUso(m.id),
  notaPonderada: notaBayesiana(m, MEDIA_DO_CATALOGO),
}));

/** Aviso A VALIDAR do arquivo de dados (exibido junto das derivadas — D-09/D-16). */
export const AVISO_DADOS: string = dados.aviso;

export const materialPorId = (id: string): MaterialCatalogo | undefined =>
  MATERIAIS.find((m) => m.id === id);
