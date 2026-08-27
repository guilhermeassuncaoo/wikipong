/**
 * WikiPong · Perfil público de um jogador
 * ------------------------------------------------------------------------------
 * POR QUE `?p=` E NÃO `/jogador/<apelido>/`: o site é export estático (D-17), e
 * rota dinâmica em export só emite os caminhos que `generateStaticParams`
 * devolve NO BUILD. Perfil nasce depois do build — quem se cadastrasse depois do
 * último push cairia em 404 até a próxima publicação. Uma seção da comunidade
 * que só funciona pra quem chegou antes do último `git push` não é uma seção da
 * comunidade.
 *
 * Uma página só, que lê o apelido da query. Mesmo padrão do /catalogo, e de
 * acordo com o D-12: estado navegável vive na URL.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JogadorCliente } from './jogador-cliente';
import { Pagina } from '@/componentes/Pagina';

export const metadata: Metadata = {
  title: 'Perfil de jogador · WikiPong',
  description:
    'Estilo, equipamento e contribuições de quem participa da comunidade da WikiPong.',
  /* O jogador vem da query string e o conteúdo é montado no cliente: o HTML
     estático desta rota não tem nem h1. Indexar isso seria pôr uma casca
     vazia no índice em nome de um perfil que ela não contém. */
  robots: { index: false, follow: false },
};

export default function PaginaJogador() {
  return (
    <Pagina>
      {/* `useSearchParams` exige Suspense no App Router — sem ele o build quebra. */}
      <Suspense fallback={<p>Carregando…</p>}>
        <JogadorCliente />
      </Suspense>
    </Pagina>
  );
}
