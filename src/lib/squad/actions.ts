"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { squadSlots, squads } from "@/lib/db/schema";
import type { PosicaoFutsal } from "@/types/domain";

export interface SquadActionState {
  error?: string;
}

/** Troca a posição de dois colegas já escalados no mesmo squad. Nunca remove ninguém. */
export async function swapSlotsAction(
  _prevState: SquadActionState,
  formData: FormData
): Promise<SquadActionState> {
  const user = await requireUser();

  const squadId = String(formData.get("squadId") ?? "");
  const posicaoA = String(formData.get("posicaoA") ?? "") as PosicaoFutsal;
  const posicaoB = String(formData.get("posicaoB") ?? "") as PosicaoFutsal;

  if (!squadId || !posicaoA || !posicaoB || posicaoA === posicaoB) {
    return { error: "Selecione duas posições diferentes para trocar." };
  }

  const [squad] = await db.select().from(squads).where(eq(squads.id, squadId)).limit(1);
  if (!squad || squad.userId !== user.id) {
    return { error: "Time não encontrado." };
  }

  const slots = await db
    .select()
    .from(squadSlots)
    .where(eq(squadSlots.squadId, squadId));

  const slotA = slots.find((s) => s.posicao === posicaoA);
  const slotB = slots.find((s) => s.posicao === posicaoB);

  if (!slotA?.alunoId || !slotB?.alunoId) {
    return { error: "As duas posições precisam já estar escaladas." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(squadSlots)
      .set({ alunoId: slotB.alunoId })
      .where(eq(squadSlots.id, slotA.id));
    await tx
      .update(squadSlots)
      .set({ alunoId: slotA.alunoId })
      .where(eq(squadSlots.id, slotB.id));
  });

  revalidatePath("/meu-time");
  return {};
}
