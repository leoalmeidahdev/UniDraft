import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { requirePlayerIdentity, type PlayerIdentity } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { tournamentMatches, tournamentEntries } from "@/lib/db/schema";
import { getMatchFull } from "@/lib/db/queries/matches";
import { MatchPlaybackController, type MatchPlaybackData } from "@/components/match/MatchPlaybackController";
import { computeRatings, pickMvp } from "@/lib/match/ratings";

type MatchFull = NonNullable<Awaited<ReturnType<typeof getMatchFull>>>;

function ehDono(
  squad: { userId: string | null; guestId: string | null },
  identity: PlayerIdentity
): boolean {
  return identity.kind === "user" ? squad.userId === identity.id : squad.guestId === identity.id;
}

/** Dono de um dos dois times, ou participante do torneio a que essa partida pertence (espectador). */
async function podeAssistir(match: MatchFull, identity: PlayerIdentity): Promise<boolean> {
  if (ehDono(match.squadHome, identity) || ehDono(match.squadAway, identity)) return true;

  const [chave] = await db
    .select({ tournamentId: tournamentMatches.tournamentId })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.matchId, match.id))
    .limit(1);
  if (!chave) return false;

  const [minhaEntry] = await db
    .select({ id: tournamentEntries.id })
    .from(tournamentEntries)
    .where(
      and(
        eq(tournamentEntries.tournamentId, chave.tournamentId),
        identity.kind === "user"
          ? eq(tournamentEntries.ownerUserId, identity.id)
          : eq(tournamentEntries.ownerGuestId, identity.id)
      )
    )
    .limit(1);
  return !!minhaEntry;
}

/**
 * O bot é uma turma real da escola — seu perfil já tem `displayName` igual
 * ao nome curto da turma (ex.: "2º J 2025"), então basta devolvê-lo sem
 * distinguir bot de humano aqui.
 */
function nomeDono(squad: { user: { isBot: boolean; displayName: string } | null }): string {
  if (!squad.user) return "Visitante";
  return squad.user.displayName;
}

export default async function PartidaPage({
  params,
}: PageProps<"/partida/[matchId]">) {
  const { matchId } = await params;
  const identity = await requirePlayerIdentity();

  const match = await getMatchFull(matchId);
  if (!match || !match.iniciadaEm) notFound();
  if (!(await podeAssistir(match, identity))) notFound();

  // Server-side, determinístico e barato (mesma fonte de dados que já dá o placar via
  // filtro de eventos) — calculado sempre que os dados persistidos existem, ainda que o
  // client-side playback só revele o painel quando `finalizado` (Item 7 do overhaul).
  const ratings = computeRatings({
    events: match.events,
    squadHome: match.squadHome,
    squadAway: match.squadAway,
    placarHome: match.placarHome,
    placarAway: match.placarAway,
  });
  const mvp = pickMvp(ratings, match.seed);

  const data: MatchPlaybackData = {
    iniciadaEmISO: match.iniciadaEm.toISOString(),
    duracaoPlaybackSeg: match.duracaoPlaybackSeg,
    squadHome: {
      id: match.squadHome.id,
      nome: match.squadHome.nome,
      ownerNome: nomeDono(match.squadHome),
    },
    squadAway: {
      id: match.squadAway.id,
      nome: match.squadAway.nome,
      ownerNome: nomeDono(match.squadAway),
    },
    placarFinalHome: match.placarHome,
    placarFinalAway: match.placarAway,
    placarPenaltiHome: match.placarPenaltiHome,
    placarPenaltiAway: match.placarPenaltiAway,
    eventos: match.events.map((e) => ({
      ordem: e.ordem,
      minutoJogo: e.minutoJogo,
      offsetPlaybackMs: e.offsetPlaybackMs,
      tipo: e.tipo,
      squadId: e.squadId,
      descricao: e.descricao,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <MatchPlaybackController data={data} ratings={ratings} mvp={mvp} />
    </div>
  );
}
