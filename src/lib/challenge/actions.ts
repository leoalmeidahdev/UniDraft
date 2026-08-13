"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { getUserSquad } from "@/lib/db/queries/squads";
import { findFriendshipBetween } from "@/lib/db/queries/friendships";
import { getChallengeForUser } from "@/lib/db/queries/challenges";
import { createMatchFromChallenge, getBotSquadId } from "@/lib/challenge/matchmaking";
import type { BotDificuldade, TipoDesafiado } from "@/types/domain";

export interface ChallengeActionState {
  error?: string;
}

const DIFICULDADES: BotDificuldade[] = ["facil", "medio", "dificil"];

export async function createChallengeAction(
  _prevState: ChallengeActionState,
  formData: FormData
): Promise<ChallengeActionState> {
  const user = await requireUser();

  const meuSquad = await getUserSquad(user.id);
  if (!meuSquad || !meuSquad.draftConcluido) {
    return { error: "Complete seu time no draft antes de desafiar alguém." };
  }

  const tipo = String(formData.get("tipo") ?? "") as TipoDesafiado;

  if (tipo === "bot") {
    const dificuldade = String(formData.get("botDificuldade") ?? "") as BotDificuldade;
    if (!DIFICULDADES.includes(dificuldade)) {
      return { error: "Escolha uma dificuldade válida." };
    }

    let botSquadId: string;
    try {
      botSquadId = await getBotSquadId(dificuldade);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Erro ao buscar o bot." };
    }

    const [challenge] = await db
      .insert(challenges)
      .values({
        challengerUserId: user.id,
        challengerSquadId: meuSquad.id,
        tipo: "bot",
        botDificuldade: dificuldade,
        challengedSquadId: botSquadId,
        status: "aceito",
        respondidoEm: new Date(),
      })
      .returning({ id: challenges.id });

    const matchId = await createMatchFromChallenge({
      challengeId: challenge.id,
      squadHomeId: meuSquad.id,
      squadAwayId: botSquadId,
      isBotMatch: true,
    });

    redirect(`/partida/${matchId}`);
  }

  if (tipo === "amigo") {
    const targetUserId = String(formData.get("challengedUserId") ?? "");
    if (!targetUserId) return { error: "Escolha um amigo para desafiar." };

    const amizade = await findFriendshipBetween(user.id, targetUserId);
    if (!amizade || amizade.status !== "aceito") {
      return { error: "Vocês precisam ser amigos para se desafiar." };
    }

    const squadAmigo = await getUserSquad(targetUserId);
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

  const meuSquad = await getUserSquad(user.id);
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
