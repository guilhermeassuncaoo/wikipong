/**
 * WikiPong · Saídas para as lojas — o número que abre conversa de parceria
 * ------------------------------------------------------------------------------
 * Esta aba não modera nada. Está aqui porque é a única tela do site protegida por
 * `admins`, e o que ela mostra é a carta do fundador na mesa de negociação: quanta
 * gente o WikiPong manda para cada loja, e a partir de quais produtos.
 *
 * A UNIDADE é "saída encaminhada" e a tela repete isso em voz alta, porque a
 * tentação de chamar de "usuário" existe e infla o número sem nenhum dado novo.
 * Ver o cabeçalho de `src/logica/cliques.ts` para o que é contado e o que não é.
 *
 * A FRASE PRONTA no fim de cada loja é o produto final desta tela. Ela existe
 * para o fundador copiar e mandar para a loja sem ter que redigir o número — e
 * para que a redação seja sempre a mesma, conferível, sem adjetivo.
 *
 * Sem estado próprio, como as outras abas: quem carrega é a tela de moderação.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { porLoja, totalDeSaidas, noPeriodo, diasAtras, type Clique } from '@/src/logica/cliques';
import { materialPorId } from '@/componentes/dados-materiais';
import { nomeComMarca } from '@/componentes/formato';
import estilos from './moderacao.module.css';

/** Os recortes que uma conversa de parceria usa. "Tudo" é o argumento acumulado. */
const PERIODOS = [
  { id: '30', rotulo: 'últimos 30 dias', dias: 30 },
  { id: '90', rotulo: 'últimos 90 dias', dias: 90 },
  { id: 'tudo', rotulo: 'desde o começo', dias: null },
] as const;

type PeriodoId = (typeof PERIODOS)[number]['id'];

const numero = (n: number) => n.toLocaleString('pt-BR');

const diaLegivel = (dia: string) =>
  new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/**
 * A frase que vai para a loja. Sem adjetivo e sem arredondamento: cada número
 * dela sai direto da contagem, e a própria frase diz como foi contado — se a
 * loja não puder conferir o método, o número não vale nada para ela.
 */
function fraseParaALoja(
  loja: string,
  saidas: number,
  materiais: number,
  dias: number,
  de: string,
  ate: string,
): string {
  return (
    `Entre ${diaLegivel(de)} e ${diaLegivel(ate)}, o WikiPong encaminhou ${numero(saidas)} ` +
    `${saidas === 1 ? 'saída' : 'saídas'} para a ${loja}, a partir de ${numero(materiais)} ` +
    `${materiais === 1 ? 'material diferente' : 'materiais diferentes'}, em ${numero(dias)} ` +
    `${dias === 1 ? 'dia' : 'dias'} distintos. Contamos uma saída por aba, por produto e por ` +
    `dia: atualizar a página não conta de novo. Não é "visitantes únicos", é quantas vezes ` +
    `alguém saiu daqui para o site de vocês.`
  );
}

export function PainelLojas({
  cliques,
  erro,
  somenteLocal,
}: {
  cliques: Clique[] | null;
  erro: string | null;
  somenteLocal: boolean;
}) {
  const [periodo, setPeriodo] = useState<PeriodoId>('30');
  const [aberta, setAberta] = useState<string | null>(null);
  const [copiada, setCopiada] = useState<string | null>(null);

  if (erro) return <p className={estilos.vazio}>{erro}</p>;
  if (!cliques) return <p className={estilos.carregando}>Carregando as saídas…</p>;

  const escolhido = PERIODOS.find((p) => p.id === periodo) ?? PERIODOS[0];
  const hoje = new Date().toISOString().slice(0, 10);
  const desde = escolhido.dias === null ? '0000-01-01' : diasAtras(escolhido.dias);
  const doPeriodo = noPeriodo(cliques, desde, hoje);
  const linhas = porLoja(doPeriodo);

  return (
    <>
      {/* O rótulo do que isto é vem ANTES do número. Um painel de métrica sem a
          definição da métrica é onde "cliques" vira "usuários" em três semanas. */}
      <p className={estilos.nota}>
        <strong>Saídas encaminhadas</strong>: quantas vezes alguém clicou daqui para o site de uma
        loja. Uma aba, num produto, num dia conta <strong>uma vez</strong> — atualizar a página não
        conta de novo. Não são visitantes únicos, e chamar de visitante infla o número sem nenhum
        dado novo. Nada aqui identifica ninguém: não guardamos conta, IP nem cookie.
      </p>

      {somenteLocal && (
        <p className={estilos.impedida}>
          <strong className={estilos.impedidaTitulo}>Isto é só este navegador.</strong> O Supabase
          não está configurado, então as saídas estão sendo guardadas no seu próprio navegador e não
          valem como medição. Para contar de verdade, rode a migração{' '}
          <span className="mono">supabase/017-cliques-de-saida.sql</span> e configure as variáveis
          do projeto.
        </p>
      )}

      <div className={estilos.filtros}>
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${estilos.chip} ${periodo === p.id ? estilos.chipAtivo : ''}`}
            onClick={() => setPeriodo(p.id)}
          >
            {p.rotulo}
          </button>
        ))}
        <span className={`mono ${estilos.contagem}`}>
          {numero(totalDeSaidas(doPeriodo))} {totalDeSaidas(doPeriodo) === 1 ? 'saída' : 'saídas'}
          {linhas.length > 0 && ` · ${linhas.length} ${linhas.length === 1 ? 'loja' : 'lojas'}`}
        </span>
      </div>

      {linhas.length === 0 ? (
        <p className={estilos.vazio}>
          Nenhuma saída registrada neste período. Se a migração 017 acabou de rodar, é o esperado:
          a contagem começa do zero no dia em que ela sobe, e não tem como recuperar o que passou.
        </p>
      ) : (
        <ul className={estilos.lista}>
          {linhas.map((l) => {
            const frase = fraseParaALoja(
              l.loja,
              l.saidas,
              l.materiais,
              l.dias,
              l.primeiroDia,
              l.ultimoDia,
            );
            return (
              <li key={l.loja} className={estilos.item}>
                <div className={estilos.cabecalho}>
                  <span className={estilos.autor}>{l.loja}</span>
                  <span className={`mono ${estilos.direita}`}>
                    {numero(l.saidas)} {l.saidas === 1 ? 'saída' : 'saídas'}
                  </span>
                </div>

                <p className={estilos.sobre}>
                  {numero(l.deOferta)} por link direto de produto · {numero(l.deDiretorio)} pelo
                  diretório · {numero(l.materiais)}{' '}
                  {l.materiais === 1 ? 'material' : 'materiais'} · {numero(l.dias)}{' '}
                  {l.dias === 1 ? 'dia' : 'dias'} com saída · de {diaLegivel(l.primeiroDia)} a{' '}
                  {diaLegivel(l.ultimoDia)}
                </p>

                <div className={estilos.acoes}>
                  <button
                    type="button"
                    className={estilos.linkAcao}
                    onClick={() => setAberta(aberta === l.loja ? null : l.loja)}
                  >
                    {aberta === l.loja ? 'Esconder' : 'Ver'} os materiais que levam até ela
                  </button>
                  <button
                    type="button"
                    className={estilos.linkAcao}
                    onClick={() => {
                      void navigator.clipboard?.writeText(frase);
                      setCopiada(l.loja);
                    }}
                  >
                    {copiada === l.loja ? 'Copiada ✓' : 'Copiar a frase para a loja'}
                  </button>
                </div>

                {aberta === l.loja && (
                  <>
                    <ul className={estilos.tags}>
                      {l.topMateriais.map((t) => {
                        const m = materialPorId(t.materialId);
                        return (
                          <li key={t.materialId}>
                            {m ? (
                              <Link href={`/materiais/${m.id}/`}>{nomeComMarca(m.marca, m.nome)}</Link>
                            ) : (
                              /* Id que não existe mais no catálogo: o material
                                 saiu ou foi renomeado depois do clique. Some da
                                 ficha, não do histórico — apagar a linha seria
                                 mexer numa contagem que ninguém pode mexer. */
                              <span className="mono">{t.materialId}</span>
                            )}{' '}
                            <span className="mono">{numero(t.saidas)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className={estilos.texto}>{frase}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
