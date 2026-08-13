CREATE TYPE "public"."modo_draft" AS ENUM('classico', 'as_cegas');--> statement-breakpoint
CREATE TYPE "public"."posicao_futsal" AS ENUM('GOLEIRO', 'FIXO', 'ALA_1', 'ALA_2', 'PIVO');--> statement-breakpoint
CREATE TYPE "public"."serie_ensino" AS ENUM('1', '2', '3');--> statement-breakpoint
CREATE TYPE "public"."status_amizade" AS ENUM('pendente', 'aceito', 'recusado', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."status_desafio" AS ENUM('pendente', 'aceito', 'recusado', 'cancelado', 'em_andamento', 'finalizado');--> statement-breakpoint
CREATE TYPE "public"."status_draft" AS ENUM('em_andamento', 'concluido', 'abandonado');--> statement-breakpoint
CREATE TYPE "public"."status_partida" AS ENUM('agendada', 'ao_vivo', 'finalizada');--> statement-breakpoint
CREATE TYPE "public"."tipo_desafiado" AS ENUM('amigo', 'bot');--> statement-breakpoint
CREATE TYPE "public"."tipo_evento_partida" AS ENUM('gol', 'defesa', 'falta', 'cartao', 'inicio_tempo', 'fim_tempo', 'chance_perdida');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('comum', 'admin');--> statement-breakpoint
CREATE TABLE "alunos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turma_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"apelido" text,
	"foto_url" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"ataque" smallint NOT NULL,
	"defesa" smallint NOT NULL,
	"tecnica" smallint NOT NULL,
	"velocidade" smallint NOT NULL,
	"fisico" smallint NOT NULL,
	"goleiro" smallint DEFAULT 20 NOT NULL,
	"overall" smallint GENERATED ALWAYS AS (((ataque + defesa + tecnica + velocidade + fisico) / 5)) STORED,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alunos_ataque_range" CHECK ("alunos"."ataque" between 0 and 99),
	CONSTRAINT "alunos_defesa_range" CHECK ("alunos"."defesa" between 0 and 99),
	CONSTRAINT "alunos_tecnica_range" CHECK ("alunos"."tecnica" between 0 and 99),
	CONSTRAINT "alunos_velocidade_range" CHECK ("alunos"."velocidade" between 0 and 99),
	CONSTRAINT "alunos_fisico_range" CHECK ("alunos"."fisico" between 0 and 99),
	CONSTRAINT "alunos_goleiro_range" CHECK ("alunos"."goleiro" between 0 and 99)
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenger_user_id" uuid NOT NULL,
	"challenger_squad_id" uuid NOT NULL,
	"tipo" "tipo_desafiado" NOT NULL,
	"challenged_user_id" uuid,
	"challenged_squad_id" uuid,
	"bot_dificuldade" text,
	"status" "status_desafio" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"respondido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "draft_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_session_id" uuid NOT NULL,
	"rodada_numero" smallint NOT NULL,
	"turma_sorteada_id" uuid NOT NULL,
	"posicao_alvo" "posicao_futsal" NOT NULL,
	"aluno_escolhido_id" uuid,
	"sorteado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"escolhido_em" timestamp with time zone,
	CONSTRAINT "draft_rounds_session_rodada_key" UNIQUE("draft_session_id","rodada_numero"),
	CONSTRAINT "draft_rounds_rodada_range" CHECK ("draft_rounds"."rodada_numero" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "draft_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"squad_id" uuid NOT NULL,
	"modo" "modo_draft" DEFAULT 'classico' NOT NULL,
	"status" "status_draft" DEFAULT 'em_andamento' NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"concluido_em" timestamp with time zone,
	CONSTRAINT "draft_sessions_squad_key" UNIQUE("squad_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"status" "status_amizade" DEFAULT 'pendente' NOT NULL,
	"requested_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_user_friend_key" UNIQUE("user_id","friend_id"),
	CONSTRAINT "friendships_no_self" CHECK ("friendships"."user_id" <> "friendships"."friend_id")
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"minuto_jogo" smallint NOT NULL,
	"offset_playback_ms" integer NOT NULL,
	"tipo" "tipo_evento_partida" NOT NULL,
	"squad_id" uuid,
	"aluno_id" uuid,
	"descricao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_events_match_ordem_key" UNIQUE("match_id","ordem")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid,
	"squad_home_id" uuid NOT NULL,
	"squad_away_id" uuid NOT NULL,
	"is_bot_match" boolean DEFAULT false NOT NULL,
	"status" "status_partida" DEFAULT 'agendada' NOT NULL,
	"seed" bigint NOT NULL,
	"placar_home" smallint DEFAULT 0 NOT NULL,
	"placar_away" smallint DEFAULT 0 NOT NULL,
	"duracao_playback_seg" integer DEFAULT 90 NOT NULL,
	"iniciada_em" timestamp with time zone,
	"finalizada_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"role" "user_role" DEFAULT 'comum' NOT NULL,
	"avatar_url" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "squad_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"squad_id" uuid NOT NULL,
	"posicao" "posicao_futsal" NOT NULL,
	"aluno_id" uuid,
	"preenchida_em" timestamp with time zone,
	CONSTRAINT "squad_slots_squad_posicao_key" UNIQUE("squad_id","posicao")
);
--> statement-breakpoint
CREATE TABLE "squads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nome" text DEFAULT 'Meu Time' NOT NULL,
	"formacao" text DEFAULT 'classica' NOT NULL,
	"draft_concluido" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turmas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ano_letivo" integer NOT NULL,
	"serie" "serie_ensino" NOT NULL,
	"letra" char(1) NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "turmas_ano_serie_letra_key" UNIQUE("ano_letivo","serie","letra")
);
--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenger_user_id_profiles_id_fk" FOREIGN KEY ("challenger_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenger_squad_id_squads_id_fk" FOREIGN KEY ("challenger_squad_id") REFERENCES "public"."squads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenged_user_id_profiles_id_fk" FOREIGN KEY ("challenged_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenged_squad_id_squads_id_fk" FOREIGN KEY ("challenged_squad_id") REFERENCES "public"."squads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_rounds" ADD CONSTRAINT "draft_rounds_draft_session_id_draft_sessions_id_fk" FOREIGN KEY ("draft_session_id") REFERENCES "public"."draft_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_rounds" ADD CONSTRAINT "draft_rounds_turma_sorteada_id_turmas_id_fk" FOREIGN KEY ("turma_sorteada_id") REFERENCES "public"."turmas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_rounds" ADD CONSTRAINT "draft_rounds_aluno_escolhido_id_alunos_id_fk" FOREIGN KEY ("aluno_escolhido_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_sessions" ADD CONSTRAINT "draft_sessions_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_profiles_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_squad_home_id_squads_id_fk" FOREIGN KEY ("squad_home_id") REFERENCES "public"."squads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_squad_away_id_squads_id_fk" FOREIGN KEY ("squad_away_id") REFERENCES "public"."squads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad_slots" ADD CONSTRAINT "squad_slots_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad_slots" ADD CONSTRAINT "squad_slots_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squads" ADD CONSTRAINT "squads_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;