# Uni Draft

Simulador de draft inspirado no [7a0](https://7a0.com.br/), adaptado para colegas de
escola: em vez de sortear seleções de Copa do Mundo, o Uni Draft sorteia **turmas**
(ano letivo, série e letra) e você monta um time de **futsal 5x5** escolhendo colegas
dessas turmas. Times prontos podem desafiar amigos ou bots para partidas simuladas e
assistidas em tempo real.

Ver `/sobre` e `/como-jogar` no site para as regras completas.

## Stack

Next.js 16 (App Router, TypeScript) + Supabase (Postgres, Auth, Realtime) + Drizzle ORM
+ Tailwind + shadcn/ui (Base UI). Hospedagem pensada para o free tier (Vercel + Supabase).

## Configurar um projeto Supabase (obrigatório antes de rodar de verdade)

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — em Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — mesma página (nunca expor no client).
   - `DATABASE_URL` — Project Settings → Database → Connection string → URI (modo "Session" ou "Transaction pooler").
3. Rode as migrations em `supabase/migrations/` na ordem numérica (`0000_init_schema.sql`,
   `0001_auth_and_rls.sql`, `0002_realtime.sql`) — mais simples é colar cada uma, em ordem,
   no SQL Editor do dashboard. Quem preferir a Supabase CLI pode usar `supabase db push`
   depois de `supabase link`.
4. (Opcional, recomendado) Gere os tipos reais do banco, substituindo o placeholder:
   ```bash
   npx supabase gen types typescript --project-id <id-do-projeto> > src/types/database.types.ts
   ```
5. No dashboard, em Authentication → Providers, confirme se e-mail/senha está habilitado
   (é o método usado pelo app). Se quiser pular a confirmação por e-mail durante os testes,
   desative "Confirm email" em Authentication → Settings.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Populando turmas e alunos

1. Prepare um CSV no formato de `supabase/seed/alunos_seed_template.csv`
   (`ano_letivo,serie,letra,nome_aluno,apelido,ataque,defesa,tecnica,velocidade,fisico,goleiro`).
2. Importe via script (usa `DATABASE_URL`, direto no Postgres):
   ```bash
   npm run seed:import -- caminho/para/seu-arquivo.csv
   ```
   Ou peça para um usuário com papel `admin` importar pela própria interface em
   `/admin/importar`. Para tornar um usuário admin, atualize manualmente `profiles.role`
   para `'admin'` no SQL Editor do Supabase (não há como se auto-promover pelo app).
3. Depois de ter pelo menos alguns alunos cadastrados, crie os times de bot (fácil/médio/difícil):
   ```bash
   npm run seed:bots
   ```

## Scripts

- `npm run dev` / `npm run build` / `npm run start` — Next.js.
- `npm run lint` — ESLint.
- `npm test` — testes do motor de simulação (Vitest).
- `npm run db:generate` — gera uma nova migration SQL a partir de mudanças em `src/lib/db/schema.ts`.
- `npm run db:studio` — abre o Drizzle Studio para inspecionar o banco.
- `npm run seed:import -- <arquivo.csv>` — importa turmas/alunos.
- `npm run seed:bots` — cria os 3 perfis e times de bot.

## Estrutura

Ver o plano de implementação original para o desenho completo (schema, motor de
simulação, fases). Pontos de entrada principais:

- `src/lib/db/schema.ts` — schema Drizzle (fonte de verdade do modelo de dados).
- `src/lib/simulation/simulateMatch.ts` — motor de simulação de partida (determinístico por seed).
- `src/lib/draft/actions.ts`, `src/lib/squad/actions.ts`, `src/lib/challenge/actions.ts`,
  `src/lib/social/actions.ts`, `src/lib/admin/actions.ts` — Server Actions de cada fluxo.
- `src/proxy.ts` — proteção de rotas por sessão (defesa em profundidade; cada Server
  Action também valida com `requireUser`/`requireAdmin` de `src/lib/auth/guards.ts`).
