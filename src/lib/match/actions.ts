"use server";

import { redirect } from "next/navigation";
import { requirePlayerIdentity } from "@/lib/auth/guards";
import { getSquadByIdentity } from "@/lib/db/queries/squads";
import { getBotSquadIdAleatorio, simularEPersistirPartida } from "@/lib/challenge/matchmaking";

export interface MatchActionState {
  error?: string;
}

/**
 * Joga uma partida imediata contra o bot, disponível pra qualquer identidade
 * (conta ou visitante) — não passa pela tabela challenges: o ciclo
 * aceitar/recusar não faz sentido pra bot, e challenges.challengerUserId é FK
 * NOT NULL pra profiles, então um visitante nem teria como inserir uma linha
 * lá. Chama simularEPersistirPartida direto (src/lib/challenge/matchmaking.ts).
 * O adversário é sempre uma turma sorteada — não há mais seleção de
 * dificuldade.
 */
export async function jogarContraBotAction(
  _prevState: MatchActionState,
  _formData: FormData
): Promise<MatchActionState> {
  const identity = await requirePlayerIdentity();

  const meuSquad = await getSquadByIdentity(identity);
  if (!meuSquad) {
    return { error: "Forme seu time antes de jogar contra o computador." };
  }

  let botSquadId: string;
  try {
    botSquadId = await getBotSquadIdAleatorio();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar o bot." };
  }

  const matchId = await simularEPersistirPartida({
    squadHomeId: meuSquad.id,
    squadAwayId: botSquadId,
    isBotMatch: true,
  });

  redirect(`/partida/${matchId}`);
}
