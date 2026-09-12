-- WikiPong · 017 · cliques de saida: quantas pessoas o site manda pra cada loja
-- ----------------------------------------------------------------------------
-- PARA QUE SERVE: pra conversar com loja. Parceria sem numero e' pedido de
-- favor; com numero e' proposta. O site ja' encaminha gente todo dia e nunca
-- contou.
--
-- A UNIDADE E' "SAIDA ENCAMINHADA", nunca "usuario unico". O indice unico la'
-- embaixo e' quem define isso: (sessao, loja, material_id, dia). A mesma aba, no
-- mesmo produto, no mesmo dia, conta UMA vez por mais que a pessoa atualize a
-- pagina. E' o numero que uma loja quer ("quantas visitas voces me mandaram em
-- agosto") e o unico que este site pode afirmar sem inventar identidade.
--
-- ─────────────────── POR QUE O NUMERO E' DEFENSAVEL ────────────────────────
-- Um relatorio que o interessado pode editar e' um relatorio que o outro lado
-- nao tem por que acreditar. Entao:
--
--   1. NAO EXISTE politica de UPDATE. Nem pro dono do site.
--   2. NAO EXISTE politica de DELETE. Nem pro dono do site.
--      (pelo painel do Supabase, com a service_role, da' -- e tem que dar, pra
--       poder consertar erro. O que nao da' e' pelo navegador, com a chave que
--       esta' no bundle.)
--   3. `dia` e `criado_em` NAO sao insertaveis: o grant e' por COLUNA, e essas
--      duas ficam de fora. Quem carimba e' o default, no banco. Data vinda do
--      cliente e' data que o cliente escolhe.
--   4. Pra inflar a contagem de uma loja e' preciso forjar uma SESSAO NOVA por
--      clique. Atualizar a pagina nao adianta -- o indice unico engole.
--
-- ─────────────────── O QUE NAO SE GUARDA ───────────────────────────────────
-- Nem nome, nem e-mail, nem usuario_id, nem IP, nem cookie, nem nada que
-- atravesse pra outro site. `sessao` e' um numero aleatorio que nasce quando a
-- aba abre e morre quando ela fecha (sessionStorage), e serve so' pra nao
-- contar o mesmo clique duas vezes.
--
-- NAO ha' FK pra auth.users DE PROPOSITO. Amarrar clique a conta transformaria
-- uma contagem anonima num historico de navegacao com dono, que e' outra coisa
-- e o site nao quer ter.

create table if not exists public.cliques_loja (
  id          uuid primary key default gen_random_uuid(),
  loja        text not null check (char_length(trim(loja)) between 1 and 60),
  -- Id de material, nao FK: o catalogo mora em JSON versionado no repo (D-17).
  material_id text not null check (char_length(trim(material_id)) between 1 and 80),
  origem      text not null check (origem in ('oferta', 'diretorio')),
  sessao      text not null check (char_length(sessao) between 4 and 40),
  dia         date        not null default (now() at time zone 'utc')::date,
  criado_em   timestamptz not null default now()
);

-- O INDICE QUE DEFINE A UNIDADE. Nao e' otimizacao: e' a regra de contagem.
create unique index if not exists cliques_loja_uma_por_sessao_e_dia
  on public.cliques_loja (sessao, loja, material_id, dia);

-- O relatorio quase sempre olha um periodo recente.
create index if not exists cliques_loja_por_dia
  on public.cliques_loja (dia desc);

alter table public.cliques_loja enable row level security;

-- ───────────────────────── GRANTS POR COLUNA ─────────────────────────
-- Isto e' metade da seguranca desta tabela, e nao da' pra fazer com RLS: a RLS
-- filtra LINHA, nao COLUNA (mesma pedra das migracoes 010 e 015). O `revoke`
-- vem primeiro porque o Supabase ja' concede tudo em `public` por default.
--
-- Consequencia pratica no cliente: sem SELECT pro anon, o INSERT precisa vir com
-- `Prefer: return=minimal`. Com `return=representation` (o padrao do PostgREST)
-- o banco recusaria -- ele teria que devolver a linha que a pessoa nao pode ler.
revoke all on public.cliques_loja from anon, authenticated;
grant insert (loja, material_id, origem, sessao) on public.cliques_loja to anon, authenticated;
grant select on public.cliques_loja to authenticated;

-- ───────────────────────── RLS ─────────────────────────
-- UMA POLITICA POR PAPEL, sempre com `to` explicito. Politica sem `to` tambem
-- se aplica ao anon e devolve 401 -- foi o que quebrou a leitura publica na 007.

-- Escrever: qualquer visitante. Num site estatico nao ha' servidor pra logar o
-- clique, entao quem registra e' o navegador de quem clicou. O que limita o
-- estrago nao e' a politica, sao os grants por coluna, os CHECKs da tabela e o
-- indice unico -- todos acima, todos no banco.
drop policy if exists "qualquer um registra a propria saida" on public.cliques_loja;
create policy "qualquer um registra a propria saida"
  on public.cliques_loja for insert to anon with check (true);

drop policy if exists "quem esta logado registra a propria saida" on public.cliques_loja;
create policy "quem esta logado registra a propria saida"
  on public.cliques_loja for insert to authenticated with check (true);

-- Ler: so' administrador. O numero de saidas e' a carta do fundador na mesa de
-- negociacao; publicar pra qualquer um seria mostrar a carta antes de sentar.
-- Quem nao e' admin recebe lista vazia, nao erro -- e' assim que a RLS funciona.
drop policy if exists "so admin le as saidas" on public.cliques_loja;
create policy "so admin le as saidas"
  on public.cliques_loja for select to authenticated
  using (public.eh_admin());

-- ───────────────────────── QUANDO ISTO CRESCER ─────────────────────────
-- A tela de moderacao le' as linhas e agrega NO NAVEGADOR, de proposito: a conta
-- mora num so' lugar (src/logica/cliques.ts, com teste), e duas implementacoes
-- da mesma soma sao duas coisas que podem discordar.
--
-- O teto disso e' o `limit=50000` do repositorio. Passou disso, o caminho e' uma
-- view agregada aqui (`create view ... with (security_invoker = true)`, pra RLS
-- continuar valendo) e a tela passando a ler a view. Fica registrado pra quem
-- chegar nesse dia nao precisar redescobrir.
