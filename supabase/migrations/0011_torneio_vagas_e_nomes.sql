-- ==========================================================
-- 0011_torneio_vagas_e_nomes
--
-- Duas queixas do torneio online com amigos:
--
-- 1. bracket_size só aceitava 8/16 — poucas vagas pra um grupo maior de
--    amigos. Adiciona 32.
-- 2. tournament_entries não tinha nome próprio: a sala/chaveamento sempre
--    mostrava squads.nome, e como quase todo squad humano fica com o
--    default "Meu Time" (nunca renomeado em lugar nenhum do app), todo
--    mundo aparecia com o mesmo nome. nome_exibicao é opcional — cada
--    dono escolhe o dele ao criar ou entrar na sala (ver
--    src/lib/tournament/actions.ts); sem isso cai no squads.nome de
--    sempre (ver src/app/torneio/[id]/page.tsx).
--
-- Idempotente: DROP/ADD CONSTRAINT e ADD COLUMN IF NOT EXISTS não falham
-- se já rodado antes.
-- ==========================================================

ALTER TABLE "tournaments" DROP CONSTRAINT IF EXISTS "tournaments_bracket_size";
--> statement-breakpoint

ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_bracket_size" CHECK (bracket_size in (8, 16, 32));
--> statement-breakpoint

ALTER TABLE "tournament_entries"
  ADD COLUMN IF NOT EXISTS "nome_exibicao" text;
