import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { squads, squadSlots, draftSessions, draftRounds, alunos, turmas } from "@/lib/db/schema";

/** Squad mais recente do usuário (não há suporte a múltiplos squads simultâneos no MVP). */
export async function getUserSquad(userId: string) {
  const [squad] = await db
    .select()
    .from(squads)
    .where(eq(squads.userId, userId))
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
      draftSession: {
        with: {
          rounds: {
            with: {
              turmaSorteada: true,
              alunoEscolhido: true,
            },
            orderBy: (r, { asc }) => [asc(r.rodadaNumero)],
          },
        },
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

export { squads, squadSlots, draftSessions, draftRounds };
