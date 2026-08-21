-- ==========================================================
-- 0007_regras_de_jogo
--
-- Partida passa de 40min corridos pra 90min em 2 tempos de 45 (ver
-- DURACAO_JOGO_MIN/MINUTOS_POR_TEMPO em src/lib/simulation/simulateMatch.ts),
-- e a simulação passa a gerar cartão vermelho (2º amarelo ou direto) e falta
-- direta (6ª+ falta do time no tempo). "cartao" já existia no enum e é
-- reaproveitado como amarelo; os dois valores abaixo são novos, junto com o
-- evento de intervalo entre os tempos.
--
-- Idempotente: ADD VALUE IF NOT EXISTS não falha se já rodado antes.
-- ==========================================================

ALTER TYPE "public"."tipo_evento_partida" ADD VALUE IF NOT EXISTS 'cartao_vermelho';
--> statement-breakpoint

ALTER TYPE "public"."tipo_evento_partida" ADD VALUE IF NOT EXISTS 'falta_direta';
--> statement-breakpoint

ALTER TYPE "public"."tipo_evento_partida" ADD VALUE IF NOT EXISTS 'intervalo';
