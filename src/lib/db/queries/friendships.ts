import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { friendships, profiles } from "@/lib/db/schema";

export async function searchProfilesByUsername(query: string, excludeUserId: string) {
  if (query.trim().length < 2) return [];
  return db
    .select({ id: profiles.id, username: profiles.username, displayName: profiles.displayName })
    .from(profiles)
    .where(and(ilike(profiles.username, `%${query.trim()}%`), ne(profiles.id, excludeUserId)))
    .limit(10);
}

export async function findFriendshipBetween(userAId: string, userBId: string) {
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, userAId), eq(friendships.friendId, userBId)),
        and(eq(friendships.userId, userBId), eq(friendships.friendId, userAId))
      )
    )
    .limit(1);
  return row ?? null;
}

export interface FriendshipRow {
  id: string;
  status: "pendente" | "aceito" | "recusado" | "bloqueado";
  requestedBy: string;
  createdAt: Date;
  otherUser: { id: string; username: string; displayName: string };
  souEuQuemPediu: boolean;
}

/** Todas as relações (aceitas + pendentes, nos dois sentidos) do usuário, já resolvidas para "o outro usuário". */
export async function listFriendshipsForUser(userId: string): Promise<FriendshipRow[]> {
  const userProfile = alias(profiles, "user_profile");
  const friendProfile = alias(profiles, "friend_profile");

  const rows = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      requestedBy: friendships.requestedBy,
      createdAt: friendships.createdAt,
      userId: friendships.userId,
      friendId: friendships.friendId,
      userProfile: { id: userProfile.id, username: userProfile.username, displayName: userProfile.displayName },
      friendProfile: { id: friendProfile.id, username: friendProfile.username, displayName: friendProfile.displayName },
    })
    .from(friendships)
    .innerJoin(userProfile, eq(userProfile.id, friendships.userId))
    .innerJoin(friendProfile, eq(friendProfile.id, friendships.friendId))
    .where(or(eq(friendships.userId, userId), eq(friendships.friendId, userId)))
    .orderBy(desc(friendships.createdAt));

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    requestedBy: r.requestedBy,
    createdAt: r.createdAt,
    otherUser: r.userId === userId ? r.friendProfile : r.userProfile,
    souEuQuemPediu: r.requestedBy === userId,
  }));
}
