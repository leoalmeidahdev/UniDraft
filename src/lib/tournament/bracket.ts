import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments, tournamentEntries, tournamentMatches, matches } from "@/lib/db/schema";
import { simularEPersistirPartida } from "@/lib/challenge/matchmaking";

export function numRodadas(bracketSize: number): number {
  return Math.round(Math.log2(bracketSize));
}

function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Distribui os slots do chaveamento: humanos e bots (cada um já um time de
 * turma real, sem grau de dificuldade) entram em posições aleatórias.
 */
export function atribuirSlots(params: {
  bracketSize: number;
  humanos: string[]; // tournamentEntries.id
  bots: string[]; // tournamentEntries.id
}): Map<string, number> {
  const { bracketSize, humanos, bots } = params;
  const slots = embaralhar(Array.from({ length: bracketSize }, (_, i) => i));
  const atribuicao = new Map<string, number>();

  const slotsHumanos = slots.splice(0, humanos.length);
  humanos.forEach((entryId, i) => atribuicao.set(entryId, slotsHumanos[i]));

  bots.forEach((entryId, i) => atribuicao.set(entryId, slots[i]));

  return atribuicao;
}

/** Handle de banco aceito pelas funções que precisam rodar dentro da mesma transação do chamador. */
type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Cria o esqueleto de tournament_matches de todas as rodadas a partir dos slots já atribuídos. */
export async function criarChavesIniciais(
  tx: Executor,
  params: {
    tournamentId: string;
    bracketSize: number;
    slotParaEntryId: Map<number, string>;
  }
): Promise<void> {
  const { tournamentId, bracketSize, slotParaEntryId } = params;
  const totalRodadas = numRodadas(bracketSize);
  const linhas: (typeof tournamentMatches.$inferInsert)[] = [];

  const numMatchesRodada1 = bracketSize / 2;
  for (let p = 0; p < numMatchesRodada1; p++) {
    linhas.push({
      tournamentId,
      rodada: 1,
      posicaoNaRodada: p,
      entryHomeId: slotParaEntryId.get(2 * p) ?? null,
      entryAwayId: slotParaEntryId.get(2 * p + 1) ?? null,
      status: "pronta",
    });
  }

  for (let r = 2; r <= totalRodadas; r++) {
    const numMatches = bracketSize / 2 ** r;
    for (let p = 0; p < numMatches; p++) {
      linhas.push({ tournamentId, rodada: r, posicaoNaRodada: p, status: "aguardando" });
    }
  }

  await tx.insert(tournamentMatches).values(linhas);
}

/** Empate no tempo normal é decidido pela disputa de pênaltis já simulada e gravada
 * junto com a partida (ver gerarDisputaPenaltis em simulateMatch.ts). */
function decidirVencedorEntry(params: {
  entryHomeId: string;
  entryAwayId: string;
  placarHome: number;
  placarAway: number;
  placarPenaltiHome: number | null;
  placarPenaltiAway: number | null;
}): string {
  if (params.placarHome !== params.placarAway) {
    return params.placarHome > params.placarAway ? params.entryHomeId : params.entryAwayId;
  }
  return (params.placarPenaltiHome ?? 0) > (params.placarPenaltiAway ?? 0)
    ? params.entryHomeId
    : params.entryAwayId;
}

/** Simula a partida de uma chave e resolve o vencedor. Idempotente sob corrida (dois cliques simultâneos). */
export async function resolverPartidaChave(
  tournamentMatchId: string,
  entryHome: { id: string; squadId: string; isBot: boolean },
  entryAway: { id: string; squadId: string; isBot: boolean }
): Promise<string | null> {
  const matchId = await simularEPersistirPartida({
    squadHomeId: entryHome.squadId,
    squadAwayId: entryAway.squadId,
    isBotMatch: entryHome.isBot && entryAway.isBot,
  });

  const [match] = await db
    .select({
      placarHome: matches.placarHome,
      placarAway: matches.placarAway,
      placarPenaltiHome: matches.placarPenaltiHome,
      placarPenaltiAway: matches.placarPenaltiAway,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  const vencedorEntryId = decidirVencedorEntry({
    entryHomeId: entryHome.id,
    entryAwayId: entryAway.id,
    placarHome: match.placarHome,
    placarAway: match.placarAway,
    placarPenaltiHome: match.placarPenaltiHome,
    placarPenaltiAway: match.placarPenaltiAway,
  });

  const [atualizada] = await db
    .update(tournamentMatches)
    .set({ matchId, vencedorEntryId, status: "concluida", updatedAt: new Date() })
    .where(and(eq(tournamentMatches.id, tournamentMatchId), eq(tournamentMatches.status, "pronta")))
    .returning({
      id: tournamentMatches.id,
      tournamentId: tournamentMatches.tournamentId,
      rodada: tournamentMatches.rodada,
    });

  // outra chamada concorrente já resolveu essa chave antes da nossa
  if (!atualizada) return null;

  await avancarBracket(atualizada.tournamentId, atualizada.rodada);
  return matchId;
}

/**
 * Propaga os vencedores de uma rodada concluída para a próxima, finaliza o
 * torneio se era a última rodada, e resolve sozinho todo confronto
 * bot-vs-bot que ficar pronto na rodada seguinte — recursivo até travar num
 * confronto com pelo menos um humano (que só avança quando o próprio
 * jogador chamar jogarPartidaTorneioAction) ou o torneio acabar.
 */
export async function avancarBracket(tournamentId: string, rodadaConcluida: number): Promise<void> {
  const matchesRodada = await db
    .select()
    .from(tournamentMatches)
    .where(
      and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.rodada, rodadaConcluida))
    );

  if (matchesRodada.length === 0 || matchesRodada.some((m) => m.status !== "concluida")) {
    return;
  }

  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  if (!tournament) return;

  const totalRodadas = numRodadas(tournament.bracketSize);

  if (rodadaConcluida >= totalRodadas) {
    await db
      .update(tournaments)
      .set({
        status: "finalizado",
        finalizadoEm: new Date(),
        vencedorEntryId: matchesRodada[0].vencedorEntryId,
      })
      .where(eq(tournaments.id, tournamentId));
    return;
  }

  const proximaRodada = rodadaConcluida + 1;
  const ordenadas = [...matchesRodada].sort((a, b) => a.posicaoNaRodada - b.posicaoNaRodada);

  for (let i = 0; i < ordenadas.length; i += 2) {
    await db
      .update(tournamentMatches)
      .set({
        entryHomeId: ordenadas[i].vencedorEntryId,
        entryAwayId: ordenadas[i + 1].vencedorEntryId,
        status: "pronta",
      })
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.rodada, proximaRodada),
          eq(tournamentMatches.posicaoNaRodada, i / 2)
        )
      );
  }

  await db.update(tournaments).set({ rodadaAtual: proximaRodada }).where(eq(tournaments.id, tournamentId));

  await resolverBotVsBotProntos(tournamentId, proximaRodada);
}

/**
 * Resolve automaticamente todo confronto bot-vs-bot já pronto (ambas as
 * entries conhecidas) de uma rodada — usado tanto pela rodada 1 assim que o
 * torneio começa quanto por avancarBracket ao liberar a rodada seguinte.
 */
export async function resolverBotVsBotProntos(tournamentId: string, rodada: number): Promise<void> {
  const matchesRodada = await db
    .select()
    .from(tournamentMatches)
    .where(and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.rodada, rodada)));

  const entryIds = matchesRodada.flatMap((m) => [m.entryHomeId, m.entryAwayId]).filter((id): id is string => !!id);
  const entries = entryIds.length
    ? await db.select().from(tournamentEntries).where(inArray(tournamentEntries.id, entryIds))
    : [];
  const entryById = new Map(entries.map((e) => [e.id, e]));

  for (const m of matchesRodada) {
    if (m.status !== "pronta" || !m.entryHomeId || !m.entryAwayId) continue;
    const home = entryById.get(m.entryHomeId);
    const away = entryById.get(m.entryAwayId);
    if (!home?.isBot || !away?.isBot) continue;
    await resolverPartidaChave(m.id, home, away);
  }
}
