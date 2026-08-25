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
export const posicaoJogador = pgEnum("posicao_jogador", [
  "GOLEIRO",
  "FIXO",
  "ALA",
  "PIVO",
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
  "cartao_vermelho",
  "falta_direta",
  "inicio_tempo",
  "fim_tempo",
  "intervalo",
  "chance_perdida",
  "disputa_penaltis",
  "penalti_convertido",
  "penalti_perdido",
]);
export const statusTorneio = pgEnum("status_torneio", [
  "lobby",
  "em_andamento",
  "finalizado",
]);
export const statusChave = pgEnum("status_chave", [
  "aguardando",
  "pronta",
  "concluida",
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
    // posição natural do jogador (define em qual vaga do squad ele pode entrar, ver
    // src/lib/draft/positionOrder.ts e src/lib/squad/formSquad.ts). Nullable: alunos
    // importados antes dessa coluna existir ficam fora do sorteio de squad até um
    // admin definir a posição em /admin/alunos.
    posicao: posicaoJogador("posicao"),
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
export const squads = pgTable(
  "squads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // dono é ou um profile (conta real) ou um visitante identificado só por
    // cookie (guestId) — nunca os dois, ver check squads_owner_xor.
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    guestId: text("guest_id"),
    nome: text("nome").notNull().default("Meu Time"),
    // tática do time: formação de futsal ("1-2-1", "2-2", "3-1", "4-0") e
    // postura ("defensivo" | "equilibrado" | "ofensivo"). Ambas entram no
    // cálculo de força em src/lib/simulation/attributes.ts. Squads criados
    // antes das formações reais gravaram "classica" em formacao — ler sempre
    // via parseFormacao/parseEstilo (src/types/domain.ts).
    formacao: text("formacao").notNull().default("1-2-1"),
    estilo: text("estilo").notNull().default("equilibrado"),
    draftConcluido: boolean("draft_concluido").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "squads_owner_xor",
      sql`(${table.userId} is not null) <> (${table.guestId} is not null)`
    ),
  ]
);

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
    .references(() => squads.id, { onDelete: "cascade" }),
  tipo: tipoDesafiado("tipo").notNull(),
  challengedUserId: uuid("challenged_user_id").references(() => profiles.id),
  challengedSquadId: uuid("challenged_squad_id").references(() => squads.id, {
    onDelete: "cascade",
  }),
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
    .references(() => squads.id, { onDelete: "cascade" }),
  squadAwayId: uuid("squad_away_id")
    .notNull()
    .references(() => squads.id, { onDelete: "cascade" }),
  isBotMatch: boolean("is_bot_match").notNull().default(false),
  status: statusPartida("status").notNull().default("agendada"),
  seed: bigint("seed", { mode: "bigint" }).notNull(),
  placarHome: smallint("placar_home").notNull().default(0),
  placarAway: smallint("placar_away").notNull().default(0),
  /** Só preenchido quando o tempo normal termina empatado — ver disputa de pênaltis
   * em src/lib/simulation/simulateMatch.ts. */
  placarPenaltiHome: smallint("placar_penalti_home"),
  placarPenaltiAway: smallint("placar_penalti_away"),
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
    squadId: uuid("squad_id").references(() => squads.id, { onDelete: "cascade" }),
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
// TORNEIOS (mata-mata)
// ==========================================================
export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // dono/anfitrião do torneio: conta ou visitante, nunca os dois (mesmo
    // padrão de squads.userId/guestId, ver src/lib/auth/guards.ts).
    hostUserId: uuid("host_user_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    hostGuestId: text("host_guest_id"),
    bracketSize: smallint("bracket_size").notNull(),
    status: statusTorneio("status").notNull().default("lobby"),
    // código de 6 caracteres pra convidar um amigo; só válido enquanto
    // status = "lobby" (ver src/lib/tournament/actions.ts).
    lobbyCode: text("lobby_code").unique(),
    rodadaAtual: smallint("rodada_atual").notNull().default(1),
    // FK solta (sem .references) pra tournament_entries.id: evita ciclo de
    // declaração entre as duas tabelas — a constraint de verdade é criada
    // na migration manual (ver supabase/migrations).
    vencedorEntryId: uuid("vencedor_entry_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    iniciadoEm: timestamp("iniciado_em", { withTimezone: true }),
    finalizadoEm: timestamp("finalizado_em", { withTimezone: true }),
  },
  (table) => [
    check(
      "tournaments_host_xor",
      sql`(${table.hostUserId} is not null) <> (${table.hostGuestId} is not null)`
    ),
    check(
      "tournaments_bracket_size",
      sql`${table.bracketSize} in (8, 16, 32)`
    ),
  ]
);

export const tournamentEntries = pgTable(
  "tournament_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    squadId: uuid("squad_id")
      .notNull()
      .references(() => squads.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    ownerGuestId: text("owner_guest_id"),
    isBot: boolean("is_bot").notNull().default(false),
    // Nome que aparece na sala/chaveamento pra essa entry. Opcional — cada
    // dono escolhe o dele ao criar/entrar na sala; sem isso cai no
    // squads.nome (geralmente "Meu Time" pra todo mundo, ver torneio/[id]/page.tsx).
    nomeExibicao: text("nome_exibicao"),
    // null até o torneio começar (gerarPareamento define os slots de uma vez).
    slot: smallint("slot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("tournament_entries_squad_key").on(table.tournamentId, table.squadId),
    unique("tournament_entries_slot_key").on(table.tournamentId, table.slot),
    check(
      "tournament_entries_owner_xor",
      sql`${table.isBot} or ((${table.ownerUserId} is not null) <> (${table.ownerGuestId} is not null))`
    ),
  ]
);

export const tournamentMatches = pgTable(
  "tournament_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    // 1 = primeira rodada; a partida `p` da rodada seguinte é alimentada
    // pelas partidas `2p` e `2p+1` desta rodada (posicaoNaRodada 0-indexed).
    rodada: smallint("rodada").notNull(),
    posicaoNaRodada: smallint("posicao_na_rodada").notNull(),
    entryHomeId: uuid("entry_home_id").references(() => tournamentEntries.id, {
      onDelete: "set null",
    }),
    entryAwayId: uuid("entry_away_id").references(() => tournamentEntries.id, {
      onDelete: "set null",
    }),
    matchId: uuid("match_id").references(() => matches.id, {
      onDelete: "set null",
    }),
    vencedorEntryId: uuid("vencedor_entry_id").references(
      () => tournamentEntries.id,
      { onDelete: "set null" }
    ),
    status: statusChave("status").notNull().default("aguardando"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("tournament_matches_posicao_key").on(
      table.tournamentId,
      table.rodada,
      table.posicaoNaRodada
    ),
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

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  entries: many(tournamentEntries),
  matches: many(tournamentMatches),
}));

export const tournamentEntriesRelations = relations(
  tournamentEntries,
  ({ one }) => ({
    tournament: one(tournaments, {
      fields: [tournamentEntries.tournamentId],
      references: [tournaments.id],
    }),
    squad: one(squads, {
      fields: [tournamentEntries.squadId],
      references: [squads.id],
    }),
  })
);

export const tournamentMatchesRelations = relations(
  tournamentMatches,
  ({ one }) => ({
    tournament: one(tournaments, {
      fields: [tournamentMatches.tournamentId],
      references: [tournaments.id],
    }),
    entryHome: one(tournamentEntries, {
      fields: [tournamentMatches.entryHomeId],
      references: [tournamentEntries.id],
      relationName: "entryHome",
    }),
    entryAway: one(tournamentEntries, {
      fields: [tournamentMatches.entryAwayId],
      references: [tournamentEntries.id],
      relationName: "entryAway",
    }),
    match: one(matches, {
      fields: [tournamentMatches.matchId],
      references: [matches.id],
    }),
  })
);
