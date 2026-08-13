import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { challenges, profiles, squads, matches } from "@/lib/db/schema";

export async function listChallengesForUser(userId: string) {
  const challengerProfile = alias(profiles, "challenger_profile");
  const challengedProfile = alias(profiles, "challenged_profile");

  const rows = await db
    .select({
      id: challenges.id,
      tipo: challenges.tipo,
      status: challenges.status,
      botDificuldade: challenges.botDificuldade,
      createdAt: challenges.createdAt,
      challengerUserId: challenges.challengerUserId,
      challengedUserId: challenges.challengedUserId,
      challenger: { id: challengerProfile.id, displayName: challengerProfile.displayName },
      challenged: { id: challengedProfile.id, displayName: challengedProfile.displayName },
      matchId: matches.id,
    })
    .from(challenges)
    .innerJoin(challengerProfile, eq(challengerProfile.id, challenges.challengerUserId))
    .leftJoin(challengedProfile, eq(challengedProfile.id, challenges.challengedUserId))
    .leftJoin(matches, eq(matches.challengeId, challenges.id))
    .where(or(eq(challenges.challengerUserId, userId), eq(challenges.challengedUserId, userId)))
    .orderBy(desc(challenges.createdAt));

  return rows;
}

export async function getChallengeForUser(challengeId: string, userId: string) {
  const [row] = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.id, challengeId),
        or(eq(challenges.challengerUserId, userId), eq(challenges.challengedUserId, userId))
      )
    )
    .limit(1);
  return row ?? null;
}

export { challenges, profiles, squads };
