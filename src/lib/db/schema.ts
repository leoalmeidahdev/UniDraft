import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ==========================================================
// ENUMS
// ==========================================================
export const userRole = pgEnum("user_role", ["comum", "admin"]);
export const serieEnsino = pgEnum("serie_ensino", ["1", "2", "3"]);
export const posicaoFutsal = pgEnum("posicao_futsal", [
  "GOLEIRO",
  "FIXO",
  "ALA_1",
  "ALA_2",
  "PIVO",
]);
export const modoDraft = pgEnum("modo_draft", ["classico", "as_cegas"]);
export const statusDraft = pgEnum("status_draft", [
  "em_andamento",
  "concluido",
  "abandonado",
]);
export const statusAmizade = pgEnum("status_amizade", [
  "pendente",
  "aceito",
  "recusado",
  "bloqueado",
]);
export const tipoDesafiado = pgEnum("tipo_desafiado", ["amigo", "bot"]);
export const statusDesafio = pgEnum("status_desafio", [
  "pendente",
  "aceito",
  "recusado",
  "cancelado",
  "em_andamento",
  "finalizado",
]);
export const statusPartida = pgEnum("status_partida", [
  "agendada",
  "ao_vivo",
  "finalizada",
]);
export const tipoEventoPartida = pgEnum("tipo_evento_partida", [
  "gol",
  "defesa",
  "falta",
  "cartao",
  "inicio_tempo",
  "fim_tempo",
  "chance_perdida",
]);

// ==========================================================
// PROFILES (estende auth.users do Supabase)
// ==========================================================
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id (FK criada via SQL de migration)
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRole("role").notNull().default("comum"),
  avatarUrl: text("avatar_url"),
  isBot: boolean("is_bot").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ==========================================================
// TURMAS
// ==========================================================
export const turmas = pgTable(
  "turmas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    anoLetivo: integer("ano_letivo").notNull(),
    serie: serieEnsino("serie").notNull(),
    letra: char("letra", { length: 1 }).notNull(),
    ativa: boolean("ativa").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("turmas_ano_serie_letra_key").on(
      table.anoLetivo,
      table.serie,
      table.letra
    ),
  ]
);

// ==========================================================
// ALUNOS (jogadores)
// ==========================================================
export const alunos = pgTable(
  "alunos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    turmaId: uuid("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    apelido: text("apelido"),
    fotoUrl: text("foto_url"),
    ativo: boolean("ativo").notNull().default(true),
    ataque: smallint("ataque").notNull(),
    defesa: smallint("defesa").notNull(),
    tecnica: smallint("tecnica").notNull(),
    velocidade: smallint("velocidade").notNull(),
    fisico: smallint("fisico").notNull(),
    goleiro: smallint("goleiro").notNull().default(20),
    // overall: gerado no banco (STORED GENERATED COLUMN, ver migration 0001)
    overall: smallint("overall").generatedAlwaysAs(
      sql`((ataque + defesa + tecnica + velocidade + fisico) / 5)`
    ),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("alunos_ataque_range", sql`${table.ataque} between 0 and 99`),
    check("alunos_defesa_range", sql`${table.defesa} between 0 and 99`),
    check("alunos_tecnica_range", sql`${table.tecnica} between 0 and 99`),
    check(
      "alunos_velocidade_range",
      sql`${table.velocidade} between 0 and 99`
    ),
    check("alunos_fisico_range", sql`${table.fisico} between 0 and 99`),
    check("alunos_goleiro_range", sql`${table.goleiro} between 0 and 99`),
  ]
);

// ==========================================================
// SQUADS
// ==========================================================
export const squads = pgTable("squads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  nome: text("nome").notNull().default("Meu Time"),
  formacao: text("formacao").notNull().default("classica"),
  draftConcluido: boolean("draft_concluido").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const squadSlots = pgTable(
  "squad_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    squadId: uuid("squad_id")
      .notNull()
      .references(() => squads.id, { onDelete: "cascade" }),
    posicao: posicaoFutsal("posicao").notNull(),
    alunoId: uuid("aluno_id").references(() => alunos.id),
    preenchidaEm: timestamp("preenchida_em", { withTimezone: true }),
  },
  (table) => [
    unique("squad_slots_squad_posicao_key").on(table.squadId, table.posicao),
  ]
);

// ==========================================================
// DRAFT
// ==========================================================
export const draftSessions = pgTable(
  "draft_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    squadId: uuid("squad_id")
      .notNull()
      .references(() => squads.id, { onDelete: "cascade" }),
    modo: modoDraft("modo").notNull().default("classico"),
    status: statusDraft("status").notNull().default("em_andamento"),
    iniciadoEm: timestamp("iniciado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    concluidoEm: timestamp("concluido_em", { withTimezone: true }),
  },
  (table) => [unique("draft_sessions_squad_key").on(table.squadId)]
);

export const draftRounds = pgTable(
  "draft_rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    draftSessionId: uuid("draft_session_id")
      .notNull()
      .references(() => draftSessions.id, { onDelete: "cascade" }),
    rodadaNumero: smallint("rodada_numero").notNull(),
    turmaSorteadaId: uuid("turma_sorteada_id")
      .notNull()
      .references(() => turmas.id),
    posicaoAlvo: posicaoFutsal("posicao_alvo").notNull(),
    alunoEscolhidoId: uuid("aluno_escolhido_id").references(() => alunos.id),
    sorteadoEm: timestamp("sorteado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    escolhidoEm: timestamp("escolhido_em", { withTimezone: true }),
  },
  (table) => [
    unique("draft_rounds_session_rodada_key").on(
      table.draftSessionId,
      table.rodadaNumero
    ),
    check(
      "draft_rounds_rodada_range",
      sql`${table.rodadaNumero} between 1 and 5`
    ),
  ]
);

// ==========================================================
// AMIZADES
// ==========================================================
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    friendId: uuid("friend_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: statusAmizade("status").notNull().default("pendente"),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("friendships_user_friend_key").on(table.userId, table.friendId),
    check("friendships_no_self", sql`${table.userId} <> ${table.friendId}`),
  ]
);

// ==========================================================
// DESAFIOS
// ==========================================================
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengerUserId: uuid("challenger_user_id")
    .notNull()
    .references(() => profiles.id),
  challengerSquadId: uuid("challenger_squad_id")
    .notNull()
    .references(() => squads.id),
  tipo: tipoDesafiado("tipo").notNull(),
  challengedUserId: uuid("challenged_user_id").references(() => profiles.id),
  challengedSquadId: uuid("challenged_squad_id").references(() => squads.id),
  botDificuldade: text("bot_dificuldade"),
  status: statusDesafio("status").notNull().default("pendente"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  respondidoEm: timestamp("respondido_em", { withTimezone: true }),
});

// ==========================================================
// PARTIDAS
// ==========================================================
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").references(() => challenges.id),
  squadHomeId: uuid("squad_home_id")
    .notNull()
    .references(() => squads.id),
  squadAwayId: uuid("squad_away_id")
    .notNull()
    .references(() => squads.id),
  isBotMatch: boolean("is_bot_match").notNull().default(false),
  status: statusPartida("status").notNull().default("agendada"),
  seed: bigint("seed", { mode: "bigint" }).notNull(),
  placarHome: smallint("placar_home").notNull().default(0),
  placarAway: smallint("placar_away").notNull().default(0),
  duracaoPlaybackSeg: integer("duracao_playback_seg").notNull().default(90),
  iniciadaEm: timestamp("iniciada_em", { withTimezone: true }),
  finalizadaEm: timestamp("finalizada_em", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matchEvents = pgTable(
  "match_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull(),
    minutoJogo: smallint("minuto_jogo").notNull(),
    offsetPlaybackMs: integer("offset_playback_ms").notNull(),
    tipo: tipoEventoPartida("tipo").notNull(),
    squadId: uuid("squad_id").references(() => squads.id),
    alunoId: uuid("aluno_id").references(() => alunos.id),
    descricao: text("descricao").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("match_events_match_ordem_key").on(table.matchId, table.ordem),
  ]
);

// ==========================================================
// RELATIONS (para queries aninhadas via Drizzle query API)
// ==========================================================
export const turmasRelations = relations(turmas, ({ many }) => ({
  alunos: many(alunos),
}));

export const alunosRelations = relations(alunos, ({ one }) => ({
  turma: one(turmas, { fields: [alunos.turmaId], references: [turmas.id] }),
}));

export const squadsRelations = relations(squads, ({ one, many }) => ({
  user: one(profiles, { fields: [squads.userId], references: [profiles.id] }),
  slots: many(squadSlots),
  draftSession: one(draftSessions),
}));

export const squadSlotsRelations = relations(squadSlots, ({ one }) => ({
  squad: one(squads, {
    fields: [squadSlots.squadId],
    references: [squads.id],
  }),
  aluno: one(alunos, {
    fields: [squadSlots.alunoId],
    references: [alunos.id],
  }),
}));

export const draftSessionsRelations = relations(
  draftSessions,
  ({ one, many }) => ({
    squad: one(squads, {
      fields: [draftSessions.squadId],
      references: [squads.id],
    }),
    rounds: many(draftRounds),
  })
);

export const draftRoundsRelations = relations(draftRounds, ({ one }) => ({
  session: one(draftSessions, {
    fields: [draftRounds.draftSessionId],
    references: [draftSessions.id],
  }),
  turmaSorteada: one(turmas, {
    fields: [draftRounds.turmaSorteadaId],
    references: [turmas.id],
  }),
  alunoEscolhido: one(alunos, {
    fields: [draftRounds.alunoEscolhidoId],
    references: [alunos.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  squadHome: one(squads, {
    fields: [matches.squadHomeId],
    references: [squads.id],
  }),
  squadAway: one(squads, {
    fields: [matches.squadAwayId],
    references: [squads.id],
  }),
  events: many(matchEvents),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, {
    fields: [matchEvents.matchId],
    references: [matches.id],
  }),
  aluno: one(alunos, { fields: [matchEvents.alunoId], references: [alunos.id] }),
}));
