import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, matchEvents, profiles, squads } from "@/lib/db/schema";
import { getSquadFull } from "@/lib/db/queries/squads";
import { simulateMatch, type SquadSimulado } from "@/lib/simulation/simulateMatch";
import { parseEstilo, parseFormacao } from "@/types/domain";

export async function squadFullToSimulado(squadId: string): Promise<SquadSimulado> {
  const squad = await getSquadFull(squadId);
  if (!squad) throw new Error("Time não encontrado.");

  const titulares = squad.slots
    .filter((s) => s.aluno)
    .map((s) => ({
      posicao: s.posicao,
      jogador: {
        id: s.aluno!.id,
        nome: s.aluno!.nome,
        ataque: s.aluno!.ataque,
        defesa: s.aluno!.defesa,
        tecnica: s.aluno!.tecnica,
        velocidade: s.aluno!.velocidade,
        fisico: s.aluno!.fisico,
        goleiro: s.aluno!.goleiro,
      },
    }));

  if (titulares.length !== 5) {
    throw new Error("Esse time ainda não está completo.");
  }

  return {
    id: squad.id,
    titulares,
    formacao: parseFormacao(squad.formacao),
    estilo: parseEstilo(squad.estilo),
  };
}

/** Squad de um bot de turma aleatório, com draft já concluído (um por turma, ver scripts/seed-bots.ts). */
export async function getBotSquadIdAleatorio(): Promise<string> {
  const candidatos = await db
    .select({ squadId: squads.id })
    .from(profiles)
    .innerJoin(squads, eq(squads.userId, profiles.id))
    .where(
      and(
        like(profiles.username, "bot_turma_%"),
        eq(squads.draftConcluido, true)
      )
    );

  if (candidatos.length === 0) {
    throw new Error('Nenhum bot de turma configurado ainda. Peça a um admin para rodar "npm run seed:bots".');
  }
  return candidatos[Math.floor(Math.random() * candidatos.length)].squadId;
}

/** Simula a partida inteira de uma vez e grava placar + eventos, prontos para playback sincronizado no client. */
export async function simularEPersistirPartida(params: {
  squadHomeId: string;
  squadAwayId: string;
  challengeId?: string;
  isBotMatch: boolean;
}): Promise<string> {
  const [squadHome, squadAway] = await Promise.all([
    squadFullToSimulado(params.squadHomeId),
    squadFullToSimulado(params.squadAwayId),
  ]);

  const seed = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  const duracaoPlaybackSeg = 90;
  const resultado = simulateMatch({ squadHome, squadAway, seed, duracaoPlaybackSeg });
  const iniciadaEm = new Date();

  return db.transaction(async (tx) => {
    const [match] = await tx
      .insert(matches)
      .values({
        challengeId: params.challengeId ?? null,
        squadHomeId: params.squadHomeId,
        squadAwayId: params.squadAwayId,
        isBotMatch: params.isBotMatch,
        status: "ao_vivo",
        seed,
        placarHome: resultado.placarHome,
        placarAway: resultado.placarAway,
        duracaoPlaybackSeg,
        iniciadaEm,
      })
      .returning({ id: matches.id });

    await tx.insert(matchEvents).values(
      resultado.eventos.map((e) => ({
        matchId: match.id,
        ordem: e.ordem,
        minutoJogo: e.minutoJogo,
        offsetPlaybackMs: e.offsetPlaybackMs,
        tipo: e.tipo,
        squadId: e.squadId,
        alunoId: e.alunoId,
        descricao: e.descricao,
      }))
    );

    return match.id;
  });
}

/** Compatibilidade com o fluxo de desafios (src/lib/challenge/actions.ts). */
export async function createMatchFromChallenge(params: {
  challengeId: string;
  squadHomeId: string;
  squadAwayId: string;
  isBotMatch: boolean;
}): Promise<string> {
  return simularEPersistirPartida(params);
}
