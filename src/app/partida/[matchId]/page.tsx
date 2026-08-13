import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getMatchFull } from "@/lib/db/queries/matches";
import { MatchPlaybackController, type MatchPlaybackData } from "@/components/match/MatchPlaybackController";

export default async function PartidaPage({
  params,
}: PageProps<"/partida/[matchId]">) {
  const { matchId } = await params;
  const user = await requireUser();

  const match = await getMatchFull(matchId);
  if (!match || !match.iniciadaEm) notFound();

  const souHome = match.squadHome.userId === user.id;
  const souAway = match.squadAway.userId === user.id;
  if (!souHome && !souAway) notFound();

  const data: MatchPlaybackData = {
    iniciadaEmISO: match.iniciadaEm.toISOString(),
    duracaoPlaybackSeg: match.duracaoPlaybackSeg,
    squadHome: {
      id: match.squadHome.id,
      nome: match.squadHome.nome,
      ownerNome: match.squadHome.user.isBot ? "🤖 Bot" : match.squadHome.user.displayName,
    },
    squadAway: {
      id: match.squadAway.id,
      nome: match.squadAway.nome,
      ownerNome: match.squadAway.user.isBot ? "🤖 Bot" : match.squadAway.user.displayName,
    },
    placarFinalHome: match.placarHome,
    placarFinalAway: match.placarAway,
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
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <MatchPlaybackController data={data} />
    </div>
  );
}
