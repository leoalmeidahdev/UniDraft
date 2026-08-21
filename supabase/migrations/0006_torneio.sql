-- ==========================================================
-- 0006_torneio
--
-- Campeonato mata-mata (bracket eliminatório de 8 ou 16 times) contra
-- squads de bot, com lobby opcional por código pra um amigo entrar no
-- mesmo chaveamento. Ver src/lib/tournament/*.
--
-- Também corrige matches/challenges para apagar em cascata quando um squad
-- é apagado (hoje é RESTRICT, o que travava "Criar novo time" com um erro
-- cru assim que o squad tivesse jogado qualquer partida).
-- ==========================================================

CREATE TYPE "public"."status_chave" AS ENUM('aguardando', 'pronta', 'concluida');
CREATE TYPE "public"."status_torneio" AS ENUM('lobby', 'em_andamento', 'finalizado');

CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_user_id" uuid,
	"host_guest_id" text,
	"bracket_size" smallint NOT NULL,
	"status" "status_torneio" DEFAULT 'lobby' NOT NULL,
	"lobby_code" text,
	"rodada_atual" smallint DEFAULT 1 NOT NULL,
	"vencedor_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"iniciado_em" timestamp with time zone,
	"finalizado_em" timestamp with time zone,
	CONSTRAINT "tournaments_lobby_code_unique" UNIQUE("lobby_code"),
	CONSTRAINT "tournaments_host_xor" CHECK (("tournaments"."host_user_id" is not null) <> ("tournaments"."host_guest_id" is not null)),
	CONSTRAINT "tournaments_bracket_size" CHECK ("tournaments"."bracket_size" in (8, 16))
);

CREATE TABLE "tournament_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"squad_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"owner_guest_id" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"slot" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_entries_squad_key" UNIQUE("tournament_id","squad_id"),
	CONSTRAINT "tournament_entries_slot_key" UNIQUE("tournament_id","slot"),
	CONSTRAINT "tournament_entries_owner_xor" CHECK ("tournament_entries"."is_bot" or (("tournament_entries"."owner_user_id" is not null) <> ("tournament_entries"."owner_guest_id" is not null)))
);

CREATE TABLE "tournament_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"rodada" smallint NOT NULL,
	"posicao_na_rodada" smallint NOT NULL,
	"entry_home_id" uuid,
	"entry_away_id" uuid,
	"match_id" uuid,
	"vencedor_entry_id" uuid,
	"status" "status_chave" DEFAULT 'aguardando' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_matches_posicao_key" UNIQUE("tournament_id","rodada","posicao_na_rodada")
);

ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_host_user_id_profiles_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_vencedor_entry_id_tournament_entries_id_fk" FOREIGN KEY ("vencedor_entry_id") REFERENCES "public"."tournament_entries"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_entry_home_id_tournament_entries_id_fk" FOREIGN KEY ("entry_home_id") REFERENCES "public"."tournament_entries"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_entry_away_id_tournament_entries_id_fk" FOREIGN KEY ("entry_away_id") REFERENCES "public"."tournament_entries"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_vencedor_entry_id_tournament_entries_id_fk" FOREIGN KEY ("vencedor_entry_id") REFERENCES "public"."tournament_entries"("id") ON DELETE set null ON UPDATE no action;

-- ----------------------------------------------------------
-- Squads apagados agora levam junto o histórico de partidas/desafios
-- deles, em vez de travar o delete com um erro de FK (RESTRICT).
-- Idempotente: DROP CONSTRAINT IF EXISTS antes de recriar.
-- ----------------------------------------------------------
ALTER TABLE "challenges" DROP CONSTRAINT IF EXISTS "challenges_challenger_squad_id_squads_id_fk";
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenger_squad_id_squads_id_fk" FOREIGN KEY ("challenger_squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "challenges" DROP CONSTRAINT IF EXISTS "challenges_challenged_squad_id_squads_id_fk";
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenged_squad_id_squads_id_fk" FOREIGN KEY ("challenged_squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_squad_home_id_squads_id_fk";
ALTER TABLE "matches" ADD CONSTRAINT "matches_squad_home_id_squads_id_fk" FOREIGN KEY ("squad_home_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_squad_away_id_squads_id_fk";
ALTER TABLE "matches" ADD CONSTRAINT "matches_squad_away_id_squads_id_fk" FOREIGN KEY ("squad_away_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;

-- match_events.squad_id também referencia squads diretamente (não só via
-- match_id -> matches), então precisa do mesmo cascade — sem isso, apagar um
-- squad que já jogou qualquer partida falha com um erro cru de FK aqui.
ALTER TABLE "match_events" DROP CONSTRAINT IF EXISTS "match_events_squad_id_squads_id_fk";
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;

-- ----------------------------------------------------------
-- Realtime: lobby (entradas) e progresso do bracket (partidas prontas).
-- ----------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tournament_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournament_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tournament_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
  END IF;
END $$;
