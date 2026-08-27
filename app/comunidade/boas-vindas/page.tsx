import type { Metadata } from 'next';
import { BoasVindasCliente } from './boas-vindas-cliente';
import { Pagina } from '@/componentes/Pagina';

export const metadata: Metadata = {
  title: 'Boas-vindas · WikiPong',
  description: 'Monte seu perfil de jogador em quatro passos.',
  /* Fluxo de onboarding, todo client-side — sem h1 no HTML estático. Não é
     conteúdo de busca, é passo a passo de quem já entrou. */
  robots: { index: false, follow: false },
};

export default function PaginaBoasVindas() {
  return (
    <Pagina semRodape>
      <BoasVindasCliente />
    </Pagina>
  );
}
