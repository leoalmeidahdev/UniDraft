-- ==========================================================
-- 0008_salas_sem_draft
--
-- Remove o sistema de draft (draft_sessions/draft_rounds). "Rodada rápida"
-- substitui o draft: em vez de escolher jogador por jogador ao longo de
-- várias rodadas, o squad já nasce completo (5 posições preenchidas de uma
-- vez) a partir do elenco de uma turma sorteada, ver
-- src/lib/squad/formSquad.ts. Squads antigos formados pelo draft continuam
-- valendo como histórico — só as tabelas de progresso do draft em si somem.
--
-- Idempotente: pode ser re-executado sem erro.
-- ==========================================================

DROP TABLE IF EXISTS "draft_rounds";
--> statement-breakpoint

DROP TABLE IF EXISTS "draft_sessions";
--> statement-breakpoint

DROP TYPE IF EXISTS "public"."modo_draft";
--> statement-breakpoint

DROP TYPE IF EXISTS "public"."status_draft";
