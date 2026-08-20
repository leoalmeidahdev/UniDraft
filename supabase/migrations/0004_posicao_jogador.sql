-- ==========================================================
-- 0004_posicao_jogador
--
-- Adiciona a posição natural do jogador (GOLEIRO/FIXO/ALA/PIVO), usada pelo
-- draft pra restringir em qual vaga do squad cada aluno pode entrar. Nula
-- por enquanto: alunos já importados precisam ser revisados em
-- /admin/alunos (ou reimportados via CSV com a nova coluna `posicao`) antes
-- de aparecerem como elegíveis no draft.
--
-- Também relaxa draft_rounds.posicao_alvo pra NULL: a vaga preenchida numa
-- rodada só é conhecida depois da escolha (é a posição natural do aluno
-- escolhido), não mais decidida de antemão pelo número da rodada.
-- ==========================================================

CREATE TYPE "public"."posicao_jogador" AS ENUM('GOLEIRO', 'FIXO', 'ALA', 'PIVO');
--> statement-breakpoint

ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "posicao" "posicao_jogador";
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_alunos_posicao ON alunos(posicao);
--> statement-breakpoint

ALTER TABLE "draft_rounds" ALTER COLUMN "posicao_alvo" DROP NOT NULL;
