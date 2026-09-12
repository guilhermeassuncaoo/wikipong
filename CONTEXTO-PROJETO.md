# CONTEXTO-PROJETO.md

Retrato do WikiPong para quem chega agora — pessoa ou assistente.
Escrito para ser colado inteiro num chat, sem precisar de nenhum outro arquivo.

Todos os números aqui foram apurados dos dados do repositório em **12 de setembro de 2026**, não digitados de memória. Quando o dado mudar, este documento envelhece — trate os números como "na data acima".

---

## 1. O que é o WikiPong

Enciclopédia brasileira de equipamentos de tênis de mesa, em português do Brasil (www.wikipong.com). Fichas padronizadas de lâminas, borrachas, raquetes e bolas, com métrica própria, quiz de perfil, comparação lado a lado, conjuntos montados, guias, glossário e uma camada de comunidade.

Feito por **uma pessoa só**: Guilherme, que também gere a academia FitPong. Está começando a programar e é estudante de Ciência da Computação.

**A promessa editorial, que governa tudo:** *"feito pra explicar, não pra empurrar"*. Fórmula aberta, opinião sempre rotulada, "maior não quer dizer melhor".

### O problema que o site existe para resolver

Cada fabricante mede velocidade, efeito, controle e dureza **numa régua própria**, e esses números não se comparam entre marcas. 40° de dureza chinesa não é 40° europeu. O WikiPong padroniza o que dá para padronizar e **diz na cara quando não dá**.

Isso não é um detalhe de implementação: é o produto. Quase toda decisão difícil do projeto sai daí.

---

## 2. Estado atual, em números

| O quê | Quanto |
|---|---|
| Materiais catalogados | **953** — 555 lâminas, 395 borrachas, 2 raquetes, 1 bola |
| Marcas | 16 |
| Páginas geradas no build | **1.010** (996 URLs no sitemap) |
| Fichas com fonte declarada | 953 de 953 |
| Fichas com nota de procedência | 941 |
| Borrachas com dureza | **301 de 395** (199 convertidas para ESN, 104 com grau cru, 2 com as duas leituras) |
| Lâminas com construção descrita | **553 de 555** (as 2 restantes explicam por que não) |
| Materiais com desempenho da comunidade | 363 |
| Materiais com números de régua de loja | 259 |
| Materiais sem número de desempenho | 329 |
| Ofertas reais (links de loja) | 669, em 7 lojas |
| Lojas no diretório | 5 |
| Guias em `/aprender` | 11 |
| Verbetes do glossário | 34 |
| Conjuntos montados | 7 |
| Competições no calendário | 23 |
| Profissionais com setup | 5 |
| Migrações de banco | 17 |
| Decisões registradas (ADR) | 22 (D-01 a D-22) |
| **Asserções no teste** | **5.155** |

**Nenhum parceiro comercial hoje:** 0 de 669 ofertas e 0 de 5 lojas. O site não recebe comissão de ninguém.

---

## 3. Stack e restrições

- **Next.js 15 (App Router) + React 19 + TypeScript**, com **export estático** (`output: 'export'`, `trailingSlash: true`). Deploy do `out/` na Vercel.
- **Não existe servidor próprio.** Nada de route handlers, nada de server actions. Rota de metadata (`sitemap.ts`, `robots.ts`) e rota de arquivo (`llms.txt`) precisam de `export const dynamic = 'force-static'`.
- Dados em **JSON estático versionado no repositório** — o catálogo não mora em banco.
- **Supabase** só para a camada de comunidade (contas, avaliações, discussões, estante, saídas para lojas).
- Dependências de produção: só `next`, `react`, `react-dom`. Nenhum framework de CSS, nenhum ORM, **nenhum SDK do Supabase** — a conversa com o banco é `fetch` puro.
- Comandos: `npm run dev` · `npm run build` (gera `out/`) · `npm test` (= `tsx testes/rodar.ts`).

---

## 4. Como o repositório é organizado

```
app/            rotas do Next (App Router)
componentes/    componentes React + as "pontes" de dados (dados-*.ts)
src/logica/     módulos PUROS de regra de negócio — sem DOM, sem framework
dados/          os JSON versionados (a fonte da verdade do conteúdo)
supabase/       as 17 migrações SQL + PASSO-A-PASSO.md
testes/rodar.ts arquivo único com as 5.155 asserções
scripts/        automações (colheita, histórico de preço, notícias)
prototipos/     HTML antigo, referência de LÓGICA apenas (ver D-15)
```

**A regra de camadas, que é levada a sério:**
- `src/logica/*.ts` — regra de negócio pura. Testável sem navegador. É onde mora a conta.
- `componentes/dados-*.ts` — a ponte tipada entre um JSON e o resto. Deriva o que precisa ser derivado.
- `app/**` — só montagem de tela. Não decide regra.

Tabelas de consulta (limiares, conversões, pesos) são **configuração exportada num lugar só**, para poderem ser revistas sem caçar número espalhado pelo código.

### Os arquivos de governança

| Arquivo | Para que serve |
|---|---|
| `CLAUDE.md` | Orientação para assistentes. Aponta para os outros |
| `DECISOES.md` | **É a lei do projeto.** Em conflito com qualquer outra fonte, ele vence |
| `PRODUCT.md` | Estratégia: usuários, personalidade, anti-referências |
| `DESIGN.md` | Sistema visual "A Mesa Oficial": tokens, regras nomeadas |
| `supabase/PASSO-A-PASSO.md` | Como rodar as migrações, com os erros conhecidos |
| `CONTEXTO-PERFIL.md` | Plano da área de conta/assinatura (**ainda não implementado** — ver §11) |

---

## 5. A ideia central: procedência

Esta é a parte que um assistente **precisa** entender para não escrever besteira neste projeto.

### A regra do fundador (2026-08-09)

> Dado verdadeiro, específico e com procedência. Nada de campo vazio, nada de resumo genérico.

Quando falta um número, a ordem é:
1. **Buscar na fonte** — campo vazio quase sempre é colheita preguiçosa, não dado inexistente.
2. Se a fonte não publica, **dizer o que não se sabe e por quê**, no lugar do traço mudo.
3. **Nunca** preencher com número inventado ou convertido sem régua declarada.

### Os tipos que carregam a procedência

```ts
type Confianca   = 'oficial' | 'revendedor' | 'pendente';
type OrigemDureza = 'fabricante' | 'semente';
type OrigemSpecs  = 'comunidade' | 'loja' | 'semente';
type Escala       = 'esn' | 'dhs' | 'butterfly';
type Regua        = 'semente' | 'megaspin';
```

`OrigemSpecs` é **derivada** de `specs.regua`, nunca digitada à mão. Isso foi deliberado: origem digitada é origem que mente quando alguém esquece de atualizar.

### As três formas de mostrar dureza

1. **Convertida para ESN** — o fabricante declarou grau *e* régua. Mostra a faixa equivalente.
2. **Crua, sem régua** — a marca publica o grau e cala a régua. Mostra o número sem converter.
3. **Crua, com régua nomeada e não conversível** — Shore C, Shore A, Shore O, escala japonesa. Existe `REGUAS_SEM_CONVERSAO` para isso.

O exemplo que mais dá errado: a **DHS GoldArc publica 47,5° em Shore C**, que não é o mesmo 47,5° de uma esponja ESN. Tratar os dois como o mesmo número é o erro que o site inteiro existe para evitar.

### A escala 0 a 10 é nossa, e só vale entre quem a usa

`paraPalavra()` e `paraBolinhas()` recebem a régua como **parâmetro obrigatório** e devolvem `null` fora da nossa régua. Isso nasceu de um defeito real: 294 páginas ganharam a palavra do topo em todos os eixos porque a tabela 0–10 foi aplicada a números de uma loja que vão a 120. Uma borracha chamada *Defense* apareceu como "Muito rápida".

A lição virou código: **a função pura recusa, em vez de a tela lembrar.**

---

## 6. As páginas

**Catálogo e descoberta:** `/catalogo` (filtros facetados, estado na URL), `/quiz` (7 perguntas), `/comparar`, `/escalas` (tradutor de durezas), `/montar`, `/conjuntos`, `/top-borrachas`, `/marcas`, `/marcas/[marca]`.

**Ficha:** `/materiais/[id]` — 953 páginas. Estrutura fixa: ficha técnica (fato) → "Em português claro" (tradução) → Onde comprar (ação) → comunidade (opinião, rotulada, por último). A ordem é a **D-14** e não se mistura.

**Aprender:** `/aprender` + 11 guias, `/glossario` (34 verbetes).

**Cenário brasileiro:** `/profissionais`, `/competicoes`, `/noticias`.

**Comunidade:** `/comunidade`, `/comunidade/discussoes`, `/comunidade/perfil`, `/comunidade/jogador`, `/comunidade/entrar`, `/comunidade/nova-senha`, `/comunidade/boas-vindas`, `/comunidade/moderacao` (só admin).

**Infra:** `/ir` (saída para loja, `noindex`), `404` em PT-BR, `sitemap.xml`, `robots.txt`, `llms.txt`.

---

## 7. A camada de comunidade e o banco

**Tabelas:** `perfis`, `avaliacoes`, `topicos`, `respostas`, `admins`, `pedidos_de_pauta`, `noticias_recebidas`, `estante`, `estante_motivos`, `cliques_loja`.
**Funções:** `eh_admin()`, `marcar_resposta_util()`.

**Login:** duas portas — link no e-mail (`/auth/v1/otp`) e senha. Mora em `src/logica/sessao.ts`, por `fetch` puro. Quem decide o que é senha aceitável é o Supabase, não código nosso.

**O padrão repositório**, usado por sete módulos: cada um tem uma implementação local (`localStorage`) e uma Supabase, e um `repositorioX()` escolhe pela variável de ambiente. Nada na UI sabe qual está em uso. É o que faz o site funcionar sem banco nenhum configurado.

**Conta é opcional, sempre.** A home promete "sem cadastro" e a comunidade promete "escrever não exige conta". `avaliacoes.usuario_id` é opcional justamente por isso.

---

## 8. Segurança — as regras que não se quebram

1. **`SUPABASE_SERVICE_KEY` (a chave `service_role`) ignora toda a RLS.** Vive **só** nos secrets do GitHub. Nunca em `.env.local`, nunca no bundle, nunca commitada.
2. **A chave anônima está no bundle, à vista de qualquer um.** Toda a segurança mora na RLS, nunca no cliente.
3. **Toda tabela nova nasce com `enable row level security`.**
4. **Toda política leva `to` explícito.** Política sem `to` também se aplica ao `anon` e devolve `401` em vez de "nada" — isso quebrou a comunidade inteira uma vez, e a migração **007** existe só para consertar.
5. **`SECURITY DEFINER` só quando não houver alternativa**, e sempre com `set search_path`. A migração **004** tirou o DEFINER da `eh_admin` por ser desnecessário.
6. **A RLS das migrações 001–017 não se afrouxa.**
7. `noticias_recebidas` não tem política de INSERT: só o CI escreve.
8. `estante_motivos`: o insert força `status = 'pendente'`, e o dono nunca ganha UPDATE.
9. `cliques_loja` **não tem política de UPDATE nem de DELETE** — nem para o dono do site. Grants por coluna deixam `dia` e `criado_em` de fora, para só o banco carimbar a data.
10. **Nenhuma senha, token ou chave entra no repositório.**

---

## 9. Os testes

Arquivo único: `testes/rodar.ts`. Roda com `npx tsx testes/rodar.ts`. Uma função: `afirma(condicao, mensagem)`.

**São 5.155 asserções, e elas não testam só matemática.** Boa parte lê **o código-fonte como texto** para impedir que uma regra volte atrás:

- toda rota do sitemap tem que estar na home e no `llms.txt`;
- `/_next/` não pode voltar para o `Disallow` do robots (é onde moram o CSS e o JS que o Google precisa renderizar);
- a seção "Onde comprar" não pode voltar a mostrar preço;
- a migração 017 não pode ganhar política de UPDATE ou DELETE;
- rota `noindex` não pode ser bloqueada no robots (bloqueada, o robô nunca lê o `noindex`).

**Prática obrigatória: teste de mutação antes de commitar qualquer guarda.** Quebra-se de propósito o que ele protege e confirma-se que a asserção falha. Guarda que não falha quando deve não é guarda — e já aconteceu de um `\b` de regex virar byte de backspace, deixando uma asserção negativa silenciosamente morta.

---

## 10. Convenções

- **PT-BR em tudo**: arquivos, funções, variáveis, comentários, mensagens de commit.
- **Comentário explica o PORQUÊ, não o quê.** O padrão do repo é comentário longo no topo do arquivo contando a decisão e o defeito que ela evita. Quem chegar depois precisa entender por que não é do jeito óbvio.
- Estado navegável vive na **URL** (D-12).
- Nada de `A VALIDAR` carimbado na tela: o selo prometia um aval sem data nem responsável.
- **Commit sempre com `git commit -F <arquivo>`**, nunca `-m` com crase — a crase no `-m` vira substituição de comando no bash e come a palavra. Já aconteceu três vezes.
- **`git add <arquivo específico>`**, nunca `-A`.
- Em português, **travessão de aparte** foi trocado por vírgula, dois-pontos ou ponto no site inteiro: texto cheio de travessão lê como texto de IA.

---

## 11. As 22 decisões (ADR)

`DECISOES.md` é a lei. Resumo de uma linha cada:

| # | Decisão |
|---|---|
| D-01 | Fonte da verdade |
| D-02 | Posicionamento e copy |
| D-03 | Arquitetura de navegação |
| D-04 | Tipografia |
| D-05 | Marca |
| D-06 | Modelo de negócio |
| D-07 | Especialista |
| D-08 | Modo Simples ↔ Técnico |
| D-09 | Métricas derivadas |
| D-10 | Assistente IA |
| D-11 | Avaliações da comunidade |
| D-12 | Estado na URL |
| D-13 | Dados de ofertas e afiliados |
| D-14 | Separação editorial (fato × opinião) |
| D-15 | Colheita dos protótipos HTML |
| D-16 | Lançamento honesto |
| D-17 | Stack técnica (export estático) |
| D-18 | Liberdade de design na implementação |
| D-19 | Camada de comunidade |
| D-20 | Ferramentas derivadas |
| D-21 | O site é a fonte da verdade visual |
| D-22 | "Onde comprar" mostra lojas, não preços — e conta as saídas |

---

## 12. O que existe, o que não existe, e o que vem

### Já no ar
Catálogo completo com procedência, quiz, comparação, tradutor de durezas, 11 guias, glossário, conjuntos, montador, top 5 por família, marcas, profissionais, competições, notícias, discussões moderadas, estante, perfil de jogador, login por senha e por link, moderação, 404 em PT-BR, sitemap, robots, `llms.txt`, e a medição de saídas para lojas.

### Não existe ainda
- **Contas com assinatura.** `CONTEXTO-PERFIL.md` tem o plano (tabela `assinaturas`, função `eh_premium`, gatilho `criar_perfil` para o perfil nascer sozinho). **Nada disso foi implementado** — foi adiado pelo fundador em 12/09/2026. Ao retomar, atenção: o documento descreve `lib/supabase.js` com o SDK e uma página `/entrar` nova, mas o repositório já tem login funcionando por `fetch` puro em `src/logica/sessao.ts` e a tela `/comunidade/entrar`. O plano precisa ser adaptado ao que existe, não construído em paralelo.
- **Videoaulas.** Sem professor gravado ainda.
- **Assistente de IA no site.** O `@anthropic-ai/sdk` só é usado por um script de bastidor (`scripts/resumir-noticia.mjs`), não pelo site.
- Pinos e anti-spin estão **fora do catálogo por decisão do fundador**.
- 329 materiais sem número de desempenho e 259 em régua de loja não conversível — todos verificados individualmente: a fonte não publica.

### Próximos passos declarados pelo fundador (12/09/2026)
1. **Etiquetas para os usuários da comunidade.** Duas famílias, e a distinção importa: *credibilidade* (Atacante, Avançado, nº de avaliações) aparece em tudo, inclusive ao lado de avaliações, porque ajuda a interpretar a nota. *Assinante* aparece só no perfil e nas discussões — selo de quem paga ao lado de uma nota de material cria exatamente a dúvida que o site existe para não ter.
2. **Achar o professor** para gravar as videoaulas.
3. **Integrar a IA** ao site.

---

## 13. Se você é um assistente ajudando neste projeto

Sete coisas que evitam os erros mais caros já cometidos aqui:

1. **Leia `DECISOES.md` antes de propor qualquer coisa.** Ele vence qualquer outra fonte, inclusive este documento.
2. **Não invente número.** Se a fonte não publica, a resposta certa é dizer que não publica. Um número plausível é pior que um campo vazio explicado.
3. **Não misture réguas.** Antes de comparar dois números, pergunte se vieram da mesma régua. Quase sempre não vieram.
4. **Regra de negócio vai em `src/logica/`, pura.** Se a tela precisa lembrar de uma regra para não errar, a regra está no lugar errado.
5. **Guarda novo, teste de mutação.** Quebre de propósito o que ele protege e confirme que falha.
6. **Export estático.** Se a solução pede servidor, ela está errada para este projeto — a exceção permitida é Edge Function do Supabase.
7. **Comentário conta o porquê e o defeito que a decisão evita.** Código óbvio que não precisa de comentário não precisa de comentário; código que parece errado e está certo precisa de um parágrafo.

E a regra que resume todas: **este site cobra procedência dos outros, então ele não pode afirmar nada que não consiga mostrar de onde veio.**
