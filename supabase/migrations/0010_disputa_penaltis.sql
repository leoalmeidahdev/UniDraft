-- ==========================================================
-- 0010_disputa_penaltis
--
-- Partida empatada no tempo normal (90min) agora vai pra disputa de
-- pênaltis (ver gerarDisputaPenaltis em src/lib/simulation/simulateMatch.ts):
-- alternando cobranças, 5 rodadas + morte súbita. placar_penalti_home/away
-- ficam NULL quando a partida não empatou (não precisou de pênaltis).
--
-- Idempotente: ADD VALUE IF NOT EXISTS e ADD COLUMN IF NOT EXISTS não falham
-- se já rodado antes.
-- ==========================================================

ALTER TYPE "public"."tipo_evento_partida" ADD VALUE IF NOT EXISTS 'disputa_penaltis';
--> statement-breakpoint

ALTER TYPE "public"."tipo_evento_partida" ADD VALUE IF NOT EXISTS 'penalti_convertido';
--> statement-breakpoint

ALTER TYPE "public"."tipo_evento_partida" ADD VALUE IF NOT EXISTS 'penalti_perdido';
--> statement-breakpoint

ALTER TABLE "matches"
  ADD COLUMN IF NOT EXISTS "placar_penalti_home" smallint;
--> statement-breakpoint

ALTER TABLE "matches"
  ADD COLUMN IF NOT EXISTS "placar_penalti_away" smallint;
