'use client';

/**
 * Lê a saída pedida, mostra o destino e encaminha. O destino aparece ANTES de
 * sair: ninguém é redirecionado às cegas (D-16). Saída inexistente não vira erro
 * feio — vira caminho de volta.
 *
 * ── DUAS FORMAS DE CHEGAR AQUI, desde 2026-09-12 ─────────────────────────────
 *   · `?o=<idDaOferta>`        — link direto para a página do produto na loja.
 *   · `?loja=<id>&m=<material>` — diretório: busca ou site da loja.
 * A segunda é nova. Antes os links do diretório iam DIRETO para a loja, sem
 * passar por aqui, e por isso metade das saídas do site nunca foi contada. Um
 * caminho só significa uma medição só.
 *
 * ── O PREÇO SAIU DAQUI ───────────────────────────────────────────────────────
 * Esta tela mostrava "R$ 880 (checado em 01/08/2026)". Saiu junto com o preço da
 * seção "Onde comprar", pelo mesmo motivo: preço ao lado do nome de uma loja é
 * preço a favor daquela loja, e a checagem pode ser de semanas atrás. Quem diz
 * quanto custa, na hora de comprar, é a loja.
 *
 * ── A MEDIÇÃO ────────────────────────────────────────────────────────────────
 * O registro sai UMA vez, na montagem, e nunca atrasa nem bloqueia a ida à loja:
 * se o banco estiver fora, a pessoa sai do mesmo jeito. O que se conta e o que
 * NÃO se guarda estão explicados em `src/logica/cliques.ts` — e, em uma frase,
 * também nesta tela, porque contar às escondidas num site que cobra procedência
 * dos outros seria estranho.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ofertaPorId,
  LOJAS,
  urlDeBusca,
  termoDeBusca,
  type CartaoDeLoja,
} from '@/componentes/dados-ofertas';
import { materialPorId } from '@/componentes/dados-materiais';
import { repositorioCliques, type OrigemClique } from '@/src/logica/cliques';
import estilos from './ir.module.css';

/** Respeita quem prefere menos movimento: sem auto-redirect, só o botão. */
const ATRASO_MS = 1200;

/** O que esta tela precisa saber, venha a saída de uma oferta ou do diretório. */
interface Destino {
  loja: string;
  url: string;
  materialId: string;
  origem: OrigemClique;
  parceiro: boolean;
  cupom?: string;
  /** O que o link é, para a tela dizer para onde exatamente está indo. */
  tipo: CartaoDeLoja['tipo'];
}

export function IrCliente() {
  const parametros = useSearchParams();
  const destino = leDestino(parametros.get('o'), parametros.get('loja'), parametros.get('m'));
  const material = destino ? materialPorId(destino.materialId) : undefined;
  const [encaminhando, setEncaminhando] = useState(false);

  /* Em desenvolvimento o React monta duas vezes de propósito. Sem esta trava a
     saída seria registrada duas vezes — e o banco engoliria a segunda pelo
     índice único, mas contar com isso seria depender de sorte. */
  const jaRegistrou = useRef(false);

  useEffect(() => {
    if (!destino || jaRegistrou.current) return;
    jaRegistrou.current = true;
    void repositorioCliques().registrar({
      loja: destino.loja,
      materialId: destino.materialId,
      origem: destino.origem,
    });
  }, [destino]);

  useEffect(() => {
    if (!destino) return;
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzir) return; // quem pediu menos movimento clica no botão
    setEncaminhando(true);
    const t = setTimeout(() => window.location.replace(destino.url), ATRASO_MS);
    return () => clearTimeout(t);
  }, [destino]);

  if (!destino) {
    return (
      <main className={`container ${estilos.pagina}`}>
        <h1 className={estilos.titulo}>Loja não encontrada</h1>
        <p className={estilos.material}>
          Este link de saída não corresponde a nenhuma loja do site. Provavelmente o endereço veio
          incompleto, ou a oferta saiu do ar.
        </p>
        <Link href="/catalogo/" className="botao-primario">
          Ir para o catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className={`container ${estilos.pagina}`}>
      <p className={`mono ${estilos.status}`}>
        {encaminhando ? 'Levando você para a loja…' : 'Pronto para ir à loja'}
      </p>
      <h1 className={estilos.titulo}>{destino.loja}</h1>
      {material && (
        <p className={estilos.material}>
          {material.nome}, {material.marca}
          {destino.tipo !== 'produto' && (
            <>
              {' · '}
              <span className={estilos.checado}>
                {destino.tipo === 'busca'
                  ? 'busca no site da loja'
                  : 'site da loja, para procurar lá dentro'}
              </span>
            </>
          )}
        </p>
      )}

      <a href={destino.url} className="botao-primario" rel="nofollow sponsored noopener">
        Continuar para {destino.loja} ↗
      </a>

      <p className={estilos.destino}>
        Destino: <span className="mono">{destino.url}</span>
      </p>

      {destino.parceiro && (
        <p className={estilos.aviso}>
          Esta loja é <strong>parceira</strong>: se você comprar, recebemos comissão. Isso não muda
          a ordem em que as lojas aparecem na ficha nem o conteúdo da ficha técnica, que é
          independente.
          {destino.cupom && (
            <>
              {' '}
              Cupom de desconto: <span className="mono">{destino.cupom}</span>.
            </>
          )}
        </p>
      )}

      {/* Dito aqui e não escondido numa política: o site conta as saídas, e a
          pessoa que está saindo tem o direito de saber disso na hora em que
          acontece. A frase diz também o que NÃO se guarda, porque "contamos
          cliques" sem isso soa pior do que a coisa é. */}
      <p className={estilos.medicao}>
        Contamos esta saída para saber quanta gente o WikiPong manda para cada loja — é o número
        que abre conversa de parceria. Sem cookie, sem conta, sem saber quem é você: fica
        registrado a loja, o material e o dia, e nada mais.
      </p>

      <p className={estilos.voltar}>
        {material ? (
          <Link href={`/materiais/${material.id}/`}>← Voltar para a ficha</Link>
        ) : (
          <Link href="/catalogo/">← Voltar para o catálogo</Link>
        )}
      </p>
    </main>
  );
}

/**
 * Resolve a query string nas duas formas. Devolve `null` quando nada bate — e
 * `null` é tela de volta, nunca erro: quem chegou aqui com link torto queria
 * comprar alguma coisa, e merece um caminho, não um código de erro.
 */
function leDestino(
  idDaOferta: string | null,
  idDaLoja: string | null,
  materialId: string | null,
): Destino | null {
  if (idDaOferta) {
    const o = ofertaPorId(idDaOferta);
    if (!o) return null;
    return {
      loja: o.loja,
      url: o.url,
      materialId: o.materialId,
      origem: 'oferta',
      parceiro: o.parceiro === true,
      cupom: o.cupom,
      tipo: 'produto',
    };
  }

  if (!idDaLoja || !materialId) return null;
  const loja = LOJAS.find((l) => l.id === idDaLoja);
  const material = materialPorId(materialId);
  /* Exige o material EXISTIR, e não só vir na URL: sem ele não há termo de busca
     e a contagem ganharia um id inventado por quem montou o link. */
  if (!loja || !material) return null;
  return {
    loja: loja.nome,
    url: urlDeBusca(loja, termoDeBusca(material.marca, material.nome)),
    materialId: material.id,
    origem: 'diretorio',
    parceiro: loja.parceiro === true,
    cupom: loja.cupom,
    tipo: loja.buscaTemplate ? 'busca' : 'site',
  };
}
