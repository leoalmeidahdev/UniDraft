"use server";

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { findFriendshipBetween } from "@/lib/db/queries/friendships";

export interface SocialActionState {
  error?: string;
  success?: string;
}

export async function sendFriendRequestAction(
  _prevState: SocialActionState,
  formData: FormData
): Promise<SocialActionState> {
  const user = await requireUser();
  const targetUserId = String(formData.get("targetUserId") ?? "");
  if (!targetUserId || targetUserId === user.id) {
    return { error: "Usuário inválido." };
  }

  const existente = await findFriendshipBetween(user.id, targetUserId);
  if (existente) {
    if (existente.status === "aceito") return { error: "Vocês já são amigos." };
    if (existente.status === "pendente" && existente.requestedBy === targetUserId) {
      // o outro já tinha me chamado: aceitar direto
      await db
        .update(friendships)
        .set({ status: "aceito" })
        .where(eq(friendships.id, existente.id));
      revalidatePath("/amigos");
      return { success: "Vocês agora são amigos!" };
    }
    return { error: "Já existe um pedido entre vocês." };
  }

  await db.insert(friendships).values({
    userId: user.id,
    friendId: targetUserId,
    requestedBy: user.id,
    status: "pendente",
  });

  revalidatePath("/amigos");
  return { success: "Pedido de amizade enviado." };
}

export async function respondFriendRequestAction(formData: FormData) {
  const user = await requireUser();
  const friendshipId = String(formData.get("friendshipId") ?? "");
  const aceitar = formData.get("aceitar") === "true";
  if (!friendshipId) return;

  const [row] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        or(eq(friendships.userId, user.id), eq(friendships.friendId, user.id))
      )
    )
    .limit(1);
  if (!row || row.status !== "pendente" || row.requestedBy === user.id) return;

  await db
    .update(friendships)
    .set({ status: aceitar ? "aceito" : "recusado" })
    .where(eq(friendships.id, friendshipId));

  revalidatePath("/amigos");
}

export async function removeFriendshipAction(formData: FormData) {
  const user = await requireUser();
  const friendshipId = String(formData.get("friendshipId") ?? "");
  if (!friendshipId) return;

  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        or(eq(friendships.userId, user.id), eq(friendships.friendId, user.id))
      )
    );

  revalidatePath("/amigos");
}
