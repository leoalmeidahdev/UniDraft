import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, matchEvents, profiles, squads } from "@/lib/db/schema";
import { getSquadFull } from "@/lib/db/queries/squads";
import { simulateMatch, type SquadSimulado } from "@/lib/simulation/simulateMatch";
import type { BotDificuldade } from "@/types/domain";

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

  return { id: squad.id, titulares };
}

export async function getBotSquadId(dificuldade: BotDificuldade): Promise<string> {
  const username = `bot_${dificuldade}`;
  const [profile] = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
  if (!profile) {
    throw new Error(`Bot "${dificuldade}" ainda não configurado. Peça a um admin para rodar "npm run seed:bots".`);
  }
  const [squad] = await db.select().from(squads).where(eq(squads.userId, profile.id)).limit(1);
  if (!squad) {
    throw new Error(`Bot "${dificuldade}" ainda sem time. Peça a um admin para rodar "npm run seed:bots".`);
  }
  return squad.id;
}

/** Simula a partida inteira de uma vez e grava placar + eventos, prontos para playback sincronizado no client. */
export async function createMatchFromChallenge(params: {
  challengeId: string;
  squadHomeId: string;
  squadAwayId: string;
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
        challengeId: params.challengeId,
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
