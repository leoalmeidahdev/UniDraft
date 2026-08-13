import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { turmas, alunos } from "@/lib/db/schema";

export async function listTurmasComContagem() {
  return db
    .select({
      id: turmas.id,
      anoLetivo: turmas.anoLetivo,
      serie: turmas.serie,
      letra: turmas.letra,
      ativa: turmas.ativa,
      totalAlunos: sql<number>`count(${alunos.id})::int`,
    })
    .from(turmas)
    .leftJoin(alunos, eq(alunos.turmaId, turmas.id))
    .groupBy(turmas.id)
    .orderBy(desc(turmas.anoLetivo), turmas.serie, turmas.letra);
}

export async function listAllTurmasOrdenadas() {
  return db.select().from(turmas).orderBy(desc(turmas.anoLetivo), turmas.serie, turmas.letra);
}

export async function listTurmasAtivas() {
  return db.select().from(turmas).where(eq(turmas.ativa, true)).orderBy(
    desc(turmas.anoLetivo),
    turmas.serie,
    turmas.letra
  );
}

export async function getTurmaComAlunosAdmin(turmaId: string) {
  return db.query.turmas.findFirst({
    where: eq(turmas.id, turmaId),
    with: { alunos: { orderBy: (a, { asc }) => [asc(a.nome)] } },
  });
}
