import { and, eq, like, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments, tournamentEntries, profiles, squads } from "@/lib/db/schema";
import type { SquadOwnerRef } from "@/lib/db/queries/squads";

function filtroDono(owner: SquadOwnerRef) {
  return owner.kind === "user"
    ? eq(tournamentEntries.ownerUserId, owner.id)
    : eq(tournamentEntries.ownerGuestId, owner.id);
}

/** Torneio não-finalizado em que a identidade já tem uma entry, se houver. */
export async function getActiveTournamentForIdentity(owner: SquadOwnerRef) {
  const [entry] = await db
    .select({ tournamentId: tournamentEntries.tournamentId })
    .from(tournamentEntries)
    .innerJoin(tournaments, eq(tournaments.id, tournamentEntries.tournamentId))
    .where(and(filtroDono(owner), ne(tournaments.status, "finalizado")))
    .limit(1);
  return entry ? getTournamentFull(entry.tournamentId) : null;
}

export async function getTournamentFull(tournamentId: string) {
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
    with: {
      entries: { with: { squad: true } },
      matches: {
        with: {
          entryHome: { with: { squad: true } },
          entryAway: { with: { squad: true } },
        },
        orderBy: (m, { asc }) => [asc(m.rodada), asc(m.posicaoNaRodada)],
      },
    },
  });
  return tournament ?? null;
}

export async function getTournamentByLobbyCode(codigo: string) {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.lobbyCode, codigo), eq(tournaments.status, "lobby")))
    .limit(1);
  return tournament ?? null;
}

/** Squad ids de bot (um por turma, ver scripts/seed-bots.ts) disponíveis pra
 * preencher vagas do chaveamento. */
export async function getBotSquadPool(): Promise<string[]> {
  const rows = await db
    .select({ squadId: squads.id })
    .from(squads)
    .innerJoin(profiles, eq(squads.userId, profiles.id))
    .where(
      and(
        eq(profiles.isBot, true),
        eq(squads.draftConcluido, true),
        like(profiles.username, "bot_turma_%")
      )
    );

  return rows.map((row) => row.squadId);
}
