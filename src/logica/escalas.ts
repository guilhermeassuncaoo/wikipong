/**
 * WikiPong · Tradução entre escalas de dureza de esponja
 * ------------------------------------------------------------------------------
 * O problema que este módulo resolve é a tese do produto em miniatura: "39°" não
 * quer dizer nada sem a régua. Uma Hurricane de 39° na escala DHS é MUITO mais
 * dura que uma europeia de 39° na escala ESN — são réguas diferentes, e nenhum
 * fabricante publica a conversão.
 *
 * ⚠️ A VALIDAR (D-07/D-09). Estes deslocamentos são REGRA COMUNITÁRIA de
 * aproximação, não medição de laboratório nem declaração de fabricante. Ficam
 * aqui como configuração exportada, com carimbo, até o especialista assinar.
 *
 * Por que devolvemos FAIXA e não número: a conversão varia com lote, temperatura
 * e método de medição. Publicar "51,0°" seria precisão fingida (D-16); publicar
 * "≈ 49–53°" é o que dá pra defender.
 */

export type Escala = 'esn' | 'dhs' | 'butterfly';

export interface EscalaInfo {
  id: Escala;
  nome: string;
  /** De onde vem a régua — ajuda o leitor a reconhecer no rótulo do produto. */
  origem: string;
  exemplos: string;
}

export const ESCALAS: readonly EscalaInfo[] = [
  {
    id: 'esn',
    nome: 'ESN (europeia)',
    origem: 'Alemanha, fábrica que produz para Tibhar, Andro, Xiom, Donic e outras',
    exemplos: 'Tibhar Evolution MX-P, Xiom Vega, Andro Rasanter',
  },
  {
    id: 'dhs',
    nome: 'DHS (chinesa)',
    origem: 'China, a régua das borrachas pegajosas',
    exemplos: 'DHS Hurricane 3 e variantes',
  },
  {
    id: 'butterfly',
    nome: 'Butterfly (japonesa)',
    origem: 'Japão, escala própria, revisada em fev/2023',
    exemplos: 'Tenergy, Dignics, Rozena',
  },
];

/**
 * Deslocamento aproximado ATÉ a escala ESN, que o WikiPong usa como régua comum.
 * A VALIDAR — v1, regra comunitária.
 *
 * Referência: uma Hurricane 3 de 39° DHS é largamente descrita como equivalente
 * a algo em torno de 51° ESN; daí o +12. A escala Butterfly fica entre as duas.
 */
export const DESLOCAMENTO_ATE_ESN: Readonly<Record<Escala, number>> = {
  esn: 0,
  dhs: 12,
  butterfly: 11,
};

/** Incerteza (± graus) que a conversão carrega. Vira a largura da faixa. */
export const INCERTEZA = 2;

export interface FaixaGraus {
  min: number;
  max: number;
}

/** Converte um grau de qualquer escala para a faixa ESN-equivalente. */
export function paraESN(valor: number, de: Escala): FaixaGraus {
  const centro = valor + DESLOCAMENTO_ATE_ESN[de];
  return { min: centro - INCERTEZA, max: centro + INCERTEZA };
}

/** Converte entre duas escalas quaisquer, passando pela ESN. */
export function converter(valor: number, de: Escala, para: Escala): FaixaGraus {
  const emESN = valor + DESLOCAMENTO_ATE_ESN[de];
  const centro = emESN - DESLOCAMENTO_ATE_ESN[para];
  return { min: centro - INCERTEZA, max: centro + INCERTEZA };
}

/** "49 a 53°" — leitura humana da faixa. Sem casas decimais: seria falsa precisão. */
export function faixaLegivel(f: FaixaGraus): string {
  return `${Math.round(f.min)} a ${Math.round(f.max)}°`;
}

/**
 * Onde o grau cai na experiência de jogo. Os limiares são os mesmos que o guia
 * "dureza da esponja" usa, na régua ESN.
 */
export interface Sensacao {
  rotulo: string;
  descricao: string;
}

export function sensacao(esn: number): Sensacao {
  if (esn < 40)
    return {
      rotulo: 'Muito macia',
      descricao: 'A bola afunda e sai devagar. Perdoa muito, mas rende pouco no ataque forte.',
    };
  if (esn < 45)
    return {
      rotulo: 'Macia',
      descricao: 'Fácil de sentir a bola e de dar efeito sem força. A faixa clássica de quem está aprendendo.',
    };
  if (esn < 50)
    return {
      rotulo: 'Média',
      descricao: 'O meio-termo moderno: efeito bom e velocidade alta, ainda com controle utilizável.',
    };
  if (esn < 55)
    return {
      rotulo: 'Dura',
      descricao: 'Precisa de aceleração pra abrir. Quem tem técnica é premiado; quem não tem, sente a bola morrer.',
    };
  return {
    rotulo: 'Muito dura',
    descricao: 'Território chinês de ataque. Exige braço formado e toque ativo em toda bola.',
  };
}

/** Extrai o primeiro número de um texto de ficha ("46,7° a 47,7° (escala ESN)" → 46.7). */
export function primeiroGrau(texto: string): number | null {
  const m = texto.match(/(\d+(?:[.,]\d+)?)\s*°/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Grau REPRESENTATIVO de uma ficha. Fabricante costuma publicar faixa ("37° a
 * 41°") porque vende a mesma borracha em várias durezas; o ponto médio é o que
 * representa a linha sem privilegiar um extremo.
 *
 * Ignora número entre parênteses (ex.: o "≈ 42,5°" que já é um resumo nosso),
 * para não contar a mesma informação duas vezes.
 */
export function grauRepresentativo(texto: string): number | null {
  const semParenteses = texto.replace(/\([^)]*\)/g, ' ');
  /* Duas grafias de faixa convivem. A Butterfly repete o símbolo ("37° a 41°");
     a Tibhar publica "42,4 – 44,4°", com o grau só no fim. Exigir ° em cada
     número lia apenas o limite SUPERIOR da faixa da Tibhar e deixava toda a
     marca ~1° mais dura do que ela é. O primeiro número do par é opcional. */
  const PAR = /(?:(\d+(?:[.,]\d+)?)\s*°?\s*(?:–|—|-|a|to|até)\s*)?(\d+(?:[.,]\d+)?)\s*°/g;
  const graus = [...semParenteses.matchAll(PAR)]
    .flatMap((m) => [m[1], m[2]])
    .filter((s): s is string => s !== undefined)
    .map((s) => Number(s.replace(',', '.')))
    .filter((n) => Number.isFinite(n));
  if (graus.length === 0) return null;
  return (Math.min(...graus) + Math.max(...graus)) / 2;
}

/** Reconhece a escala citada num texto de ficha. Null quando a ficha não diz. */
export function escalaDoTexto(texto: string): Escala | null {
  const t = texto.toLowerCase();
  /* ── RÉGUA DECLARADA VENCE NOME DE MARCA (armadilha real, 2026-08-23) ───────
     A linha honesta da GoldArc é "47,5° (Shore C, régua declarada pela DHS)".
     Ela contém "DHS", e o teste abaixo lia isso como a régua chinesa: 47,5 na
     conversão DHS vira ~59° ESN, e o site publicaria uma tensora alemã como se
     fosse a esponja mais dura do catálogo. O erro nasceria de citar a FONTE
     dentro do campo — coisa que a procedência pede o tempo todo aqui.

     Quando a fonte nomeia uma régua que este módulo não converte, a resposta é
     null e ponto: o nome da régua é mais específico que uma marca solta no
     meio da frase, e não converter é sempre o desfecho seguro. */
  if (reguaSemConversao(t) !== null) return null;
  if (t.includes('dhs')) return 'dhs';
  if (t.includes('esn')) return 'esn';
  if (t.includes('butterfly')) return 'butterfly';
  /* "régua europeia" é como boa parte das fichas escreve a ESN — e é o nome que
     ESTE módulo já dá a ela na lista acima ("ESN (europeia)"). Reconhecer aqui
     aplica a definição que o arquivo já declara; não reconhecer deixava 20
     fichas da Gewo com o grau escrito e sem régua, o que descarta o grau
     inteiro (sem régua, um número de dureza não quer dizer nada — é a tese
     deste módulo). O mesmo vale para "alemã": a ESN é a fábrica alemã. */
  if (/europ|alem/.test(t)) return 'esn';
  /* E "escala chinesa" é como a Sanwei escreve a mesma régua que este módulo
     chama de "DHS (chinesa)" — o nome do arquivo é da marca que a popularizou,
     não uma exclusividade dela. Sem isto, uma ficha que diz "35° (escala
     chinesa)" perdia a régua e o grau inteiro junto, que é o oposto do que o
     módulo existe pra fazer.

     Conferido antes de entrar: nenhuma das linhas de dureza já publicadas muda
     de leitura com esta regra — ela só abre caminho pra colheita nova. */
  if (/chin/.test(t)) return 'dhs';
  return null;
}

/**
 * RÉGUAS QUE A FONTE NOMEIA E QUE ESTE SITE NÃO CONVERTE
 * ==============================================================================
 * `escalaDoTexto` devolve null em dois casos que NÃO são o mesmo:
 *
 *   1. a fonte não disse régua nenhuma  — a Victas publica "47,5±3" e pronto;
 *   2. a fonte DISSE, e a régua não está aqui — a DHS declara "Shore C
 *      hardness standard" para a linha GoldArc.
 *
 * Tratar os dois como um só faz a tela dizer "a DHS publica 47,5° e não diz em
 * que régua" numa borracha cuja fábrica diz exatamente qual é. É mentira
 * pequena e evitável, e a diferença importa pro leitor: no caso 1 não há a quem
 * recorrer; no caso 2 o nome da régua é a pista para procurar a conversão.
 *
 * Entrar nesta lista é dizer "reconheço o nome e não tenho conversão com
 * procedência". Converter sem régua declarada é o que a D-16 proíbe, e um
 * palpite de conversão aqui reapareceria como grau na coluna unificada.
 */
export const REGUAS_SEM_CONVERSAO: readonly { padrao: RegExp; nome: string }[] = [
  /* A DHS declara Shore C na linha GoldArc. Shore C é norma de durômetro, não
     a régua-de-catálogo chinesa que a `dhs` acima modela — e o próprio número
     mostra: 47,5 "Shore C" ao lado das Hurricane de 39°/40° não é a mesma
     conta. */
  { padrao: /shore\s*c/, nome: 'Shore C' },
  /* Shore A e Shore O aparecem em tabelas de terceiros (a Calibra da Stiga em
     Shore A, as medições de comunidade em Shore O). Nomeadas aqui pra que, se
     um dia entrarem numa ficha, entrem rotuladas em vez de viraram ESN. */
  { padrao: /shore\s*a/, nome: 'Shore A' },
  { padrao: /shore\s*o/, nome: 'Shore O' },
  /* A Nittaku publica as duas na Genextion: "42,5° (japonesa) / 52,5° (alemã)".
     Dez graus de diferença na MESMA esponja — prova, vinda do fabricante, de
     que a japonesa dela não é a europeia. Sem uma tabela de pares publicada,
     um deslocamento tirado de um caso só seria régua inventada. */
  { padrao: /japones|japonesa/, nome: 'japonesa' },
];

/** O nome da régua quando a fonte a declara e este site não a converte. */
export function reguaSemConversao(texto: string): string | null {
  const t = texto.toLowerCase();
  return REGUAS_SEM_CONVERSAO.find((r) => r.padrao.test(t))?.nome ?? null;
}
