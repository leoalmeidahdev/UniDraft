import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { alunos, turmas } from "@/lib/db/schema";

export async function listAlunosComTurma() {
  return db.query.alunos.findMany({
    with: { turma: true },
    orderBy: [desc(alunos.createdAt)],
  });
}

export async function getAlunoComTurma(alunoId: string) {
  return db.query.alunos.findFirst({
    where: eq(alunos.id, alunoId),
    with: { turma: true },
  });
}

export { alunos, turmas };
