import { notFound } from "next/navigation";
import { requirePlayerIdentity, type PlayerIdentity } from "@/lib/auth/guards";
import { getTournamentFull } from "@/lib/db/queries/tournaments";
import { LobbyView } from "@/components/tournament/LobbyView";
import { BracketView, type ChaveVM } from "@/components/tournament/BracketView";
import { TournamentRealtimeListener } from "@/components/tournament/TournamentRealtimeListener";
import { CancelarTorneioForm } from "@/components/tournament/CancelarTorneioForm";

function souDono(
  entry: { ownerUserId: string | null; ownerGuestId: string | null },
  identity: PlayerIdentity
): boolean {
  return identity.kind === "user" ? entry.ownerUserId === identity.id : entry.ownerGuestId === identity.id;
}

export default async function TorneioDetailPage({
  params,
}: PageProps<"/torneio/[id]">) {
  const { id } = await params;
  const identity = await requirePlayerIdentity();

  const tournament = await getTournamentFull(id);
  if (!tournament) notFound();

  const souHost =
    identity.kind === "user" ? tournament.hostUserId === identity.id : tournament.hostGuestId === identity.id;
  const souParticipante = souHost || tournament.entries.some((e) => souDono(e, identity));
  if (!souParticipante) notFound();

  if (tournament.status === "lobby") {
    const participantes = tournament.entries.map((e) => ({
      id: e.id,
      nome: e.nomeExibicao ?? e.squad.nome,
      souEu: souDono(e, identity),
    }));

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <TournamentRealtimeListener tournamentId={tournament.id} />
        <LobbyView
          tournamentId={tournament.id}
          bracketSize={tournament.bracketSize}
          lobbyCode={tournament.lobbyCode!}
          participantes={participantes}
          souHost={souHost}
        />
      </div>
    );
  }

  const chaves: ChaveVM[] = tournament.matches.map((m) => ({
    id: m.id,
    rodada: m.rodada,
    posicaoNaRodada: m.posicaoNaRodada,
    status: m.status,
    matchId: m.matchId,
    vencedorEntryId: m.vencedorEntryId,
    entryHome: m.entryHome
      ? {
          id: m.entryHome.id,
          nome: m.entryHome.nomeExibicao ?? m.entryHome.squad.nome,
          isBot: m.entryHome.isBot,
          souEu: souDono(m.entryHome, identity),
        }
      : null,
    entryAway: m.entryAway
      ? {
          id: m.entryAway.id,
          nome: m.entryAway.nomeExibicao ?? m.entryAway.squad.nome,
          isBot: m.entryAway.isBot,
          souEu: souDono(m.entryAway, identity),
        }
      : null,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <TournamentRealtimeListener tournamentId={tournament.id} />
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Torneio de {tournament.bracketSize} times
          {tournament.status === "finalizado" ? " — finalizado" : ""}
        </h1>
        {souHost && tournament.status === "em_andamento" && (
          <CancelarTorneioForm tournamentId={tournament.id} />
        )}
      </div>
      <BracketView chaves={chaves} />
    </div>
  );
}
