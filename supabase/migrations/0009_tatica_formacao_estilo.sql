-- ==========================================================
-- 0009_tatica_formacao_estilo
--
-- Antes de montar o time, o jogador escolhe a tática: uma formação real de
-- futsal ("1-2-1", "2-2", "3-1", "4-0" — a notação omite o goleiro) e uma
-- postura ("defensivo" | "equilibrado" | "ofensivo"). As duas entram no
-- cálculo de força da simulação (src/lib/simulation/attributes.ts), então
-- precisam ficar gravadas no squad, não só na tela.
--
-- squads.formacao já existia com default "classica" (rótulo do modo de
-- draft antigo, que não descrevia formação nenhuma). O default passa a ser
-- "1-2-1"; linhas antigas mantêm "classica" no banco e são normalizadas na
-- leitura por parseFormacao (src/types/domain.ts), sem UPDATE destrutivo.
--
-- Idempotente: pode ser re-executado sem erro.
-- ==========================================================

ALTER TABLE "squads"
  ADD COLUMN IF NOT EXISTS "estilo" text NOT NULL DEFAULT 'equilibrado';
--> statement-breakpoint

ALTER TABLE "squads"
  ALTER COLUMN "formacao" SET DEFAULT '1-2-1';
