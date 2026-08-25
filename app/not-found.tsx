/**
 * WikiPong · 404 — a página que não existe
 * ==============================================================================
 * POR QUE ISTO EXISTE: porque não existia. Até 2026-08-23 o site servia o 404
 * PADRÃO DO NEXT — "404 · This page could not be found" —, em inglês, sem
 * cabeçalho, sem rodapé e sem um único caminho de volta. Numa enciclopédia
 * PT-BR com 953 páginas de material, a pessoa que erra uma letra na URL ou
 * chega por um link antigo caía numa tela de sistema em outro idioma.
 *
 * Foi achado numa auditoria de TELA — varrendo o que cada rota publica de fato,
 * e não o que o código deveria fazer. Nenhum teste apontaria isto: não há nada
 * quebrado. Só não havia nada.
 *
 * O QUE ESTA PÁGINA ASSUME sobre quem chega nela. Neste site, link morto quase
 * sempre é UMA de três coisas:
 *   · um id de material digitado errado ou colado pela metade;
 *   · um endereço antigo, de quando o material tinha outro id;
 *   · alguém tentando adivinhar uma URL que nunca existiu.
 * Nos três casos a resposta útil é a mesma — levar ao catálogo, que é onde a
 * busca mora — e por isso ele é a ação principal, não um link no meio do texto.
 *
 * O QUE ELA NÃO FAZ: prometer busca aqui dentro. O site é export estático; uma
 * caixa de busca nesta página teria de carregar o catálogo inteiro para
 * funcionar, e uma caixa que não busca é pior que nenhuma (D-16).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagina } from '@/componentes/Pagina';
import { MATERIAIS } from '@/componentes/dados-materiais';
import estilos from './nao-encontrada.module.css';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  /* Tela de erro não entra no índice: ela não é conteúdo, é desvio. */
  robots: { index: false, follow: true },
};

/** As portas que resolvem de verdade, na ordem em que costumam resolver. */
const SAIDAS = [
  {
    href: '/catalogo/',
    titulo: 'Catálogo',
    texto: 'Todos os materiais, com busca por nome e filtros por tipo, marca, nível e preço.',
  },
  {
    href: '/aprender/',
    titulo: 'Aprender',
    texto: 'Os guias: como escolher borracha, o que a dureza muda, madeira contra carbono.',
  },
  {
    href: '/glossario/',
    titulo: 'Glossário',
    texto: 'Se você veio atrás de uma palavra — catapulta, tensor, ALC — ela está explicada aqui.',
  },
  {
    href: '/quiz/',
    titulo: 'Quiz de perfil',
    texto: 'Não sabe o que procurar? Sete perguntas e uma recomendação com o porquê.',
  },
];

export default function NaoEncontrada() {
  return (
    <Pagina className={estilos.pagina}>
      {/* O código vem antes do título e em mono: quem entende de web reconhece
          na hora o que aconteceu e economiza a leitura do resto. */}
      <p className={`mono ${estilos.codigo}`}>Erro 404</p>
      <h1 className={estilos.titulo}>Esta página não existe</h1>
      <p className={estilos.lede}>
        O endereço que você abriu não corresponde a nada no WikiPong. Quase sempre é uma letra
        a mais no link, um endereço colado pela metade, ou a página de um material que mudou de
        lugar. O catálogo tem <strong>{MATERIAIS.length} materiais</strong> e uma busca por
        nome — é o caminho mais curto para achar o que você procurava.
      </p>

      <Link href="/catalogo/" className={`botao-primario ${estilos.acao}`}>
        Ir para o catálogo →
      </Link>

      <ul className={estilos.saidas}>
        {SAIDAS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className={estilos.cartao}>
              <span className={estilos.cartaoTitulo}>{s.titulo}</span>
              <span className={estilos.cartaoTexto}>{s.texto}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Fecho honesto: se o link veio do próprio site, o erro é nosso, e a
          pessoa precisa saber que dizer isso serve pra alguma coisa. */}
      <p className={estilos.rodape}>
        Chegou aqui clicando em algo <em>dentro</em> do WikiPong? Então o link quebrado é nosso,
        não seu — e vale avisar pela{' '}
        <Link href="/comunidade/">página da comunidade</Link>, para que ele seja consertado.
      </p>
    </Pagina>
  );
}
