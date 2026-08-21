"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { getSquadByIdentity } from "@/lib/db/queries/squads";
import { findFriendshipBetween } from "@/lib/db/queries/friendships";
import { getChallengeForUser } from "@/lib/db/queries/challenges";
import { createMatchFromChallenge } from "@/lib/challenge/matchmaking";
import type { TipoDesafiado } from "@/types/domain";

export interface ChallengeActionState {
  error?: string;
}

/**
 * /desafios é só desafio de amigo — partida vs bot não passa mais por aqui
 * nem pela tabela challenges (ver src/lib/match/actions.ts): amizade é ligada
 * a conta (friendships.userId/friendId são FK NOT NULL pra profiles), então
 * essa rota continua exigindo requireUser() corretamente.
 */
export async function createChallengeAction(
  _prevState: ChallengeActionState,
  formData: FormData
): Promise<ChallengeActionState> {
  const user = await requireUser();

  const meuSquad = await getSquadByIdentity({ kind: "user", id: user.id });
  if (!meuSquad || !meuSquad.draftConcluido) {
    return { error: "Complete seu time no draft antes de desafiar alguém." };
  }

  const tipo = String(formData.get("tipo") ?? "") as TipoDesafiado;

  if (tipo === "amigo") {
    const targetUserId = String(formData.get("challengedUserId") ?? "");
    if (!targetUserId) return { error: "Escolha um amigo para desafiar." };

    const amizade = await findFriendshipBetween(user.id, targetUserId);
    if (!amizade || amizade.status !== "aceito") {
      return { error: "Vocês precisam ser amigos para se desafiar." };
    }

    const squadAmigo = await getSquadByIdentity({ kind: "user", id: targetUserId });
    if (!squadAmigo || !squadAmigo.draftConcluido) {
      return { error: "Esse amigo ainda não completou o time dele." };
    }

    await db.insert(challenges).values({
      challengerUserId: user.id,
      challengerSquadId: meuSquad.id,
      tipo: "amigo",
      challengedUserId: targetUserId,
      status: "pendente",
    });

    revalidatePath("/desafios");
    redirect("/desafios");
  }

  return { error: "Tipo de desafio inválido." };
}

export async function acceptChallengeAction(formData: FormData) {
  const user = await requireUser();
  const challengeId = String(formData.get("challengeId") ?? "");
  if (!challengeId) return;

  const challenge = await getChallengeForUser(challengeId, user.id);
  if (!challenge || challenge.challengedUserId !== user.id || challenge.status !== "pendente") {
    return;
  }

  const meuSquad = await getSquadByIdentity({ kind: "user", id: user.id });
  if (!meuSquad || !meuSquad.draftConcluido) return;

  await db
    .update(challenges)
    .set({ challengedSquadId: meuSquad.id, status: "aceito", respondidoEm: new Date() })
    .where(eq(challenges.id, challengeId));

  const matchId = await createMatchFromChallenge({
    challengeId: challenge.id,
    squadHomeId: challenge.challengerSquadId,
    squadAwayId: meuSquad.id,
    isBotMatch: false,
  });

  redirect(`/partida/${matchId}`);
}

export async function declineChallengeAction(formData: FormData) {
  const user = await requireUser();
  const challengeId = String(formData.get("challengeId") ?? "");
  if (!challengeId) return;

  const challenge = await getChallengeForUser(challengeId, user.id);
  if (!challenge || challenge.challengedUserId !== user.id || challenge.status !== "pendente") {
    return;
  }

  await db
    .update(challenges)
    .set({ status: "recusado", respondidoEm: new Date() })
    .where(eq(challenges.id, challengeId));

  revalidatePath("/desafios");
}
