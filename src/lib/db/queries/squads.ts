import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { squads, squadSlots, alunos, turmas } from "@/lib/db/schema";

/** Dono de um squad: uma conta (profile) ou um visitante (cookie). */
export type SquadOwnerRef = { kind: "user" | "guest"; id: string };

/** Squad mais recente do dono (não há suporte a múltiplos squads simultâneos no MVP). */
export async function getSquadByIdentity(owner: SquadOwnerRef) {
  const [squad] = await db
    .select()
    .from(squads)
    .where(
      owner.kind === "user"
        ? eq(squads.userId, owner.id)
        : eq(squads.guestId, owner.id)
    )
    .orderBy(desc(squads.createdAt))
    .limit(1);
  return squad ?? null;
}

export async function getSquadFull(squadId: string) {
  const squad = await db.query.squads.findFirst({
    where: eq(squads.id, squadId),
    with: {
      slots: {
        with: { aluno: { with: { turma: true } } },
      },
    },
  });
  return squad ?? null;
}

export async function getTurmaComAlunos(turmaId: string) {
  const turma = await db.query.turmas.findFirst({
    where: eq(turmas.id, turmaId),
    with: {
      alunos: {
        where: eq(alunos.ativo, true),
      },
    },
  });
  return turma ?? null;
}

export { squads, squadSlots };
