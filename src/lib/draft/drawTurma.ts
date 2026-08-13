import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { turmas } from "@/lib/db/schema";

/**
 * Sorteia uma turma ativa, evitando repetir turmas já sorteadas na mesma
 * sessão de draft (regra de variedade). Se todas as turmas ativas já foram
 * sorteadas, permite repetir.
 */
export async function sortearTurma(turmasExcluidasIds: string[]) {
  const condicoes = [eq(turmas.ativa, true)];
  if (turmasExcluidasIds.length > 0) {
    condicoes.push(notInArray(turmas.id, turmasExcluidasIds));
  }

  const [turmaSorteada] = await db
    .select()
    .from(turmas)
    .where(and(...condicoes))
    .orderBy(sql`random()`)
    .limit(1);

  if (turmaSorteada) return turmaSorteada;

  // todas já sorteadas nesta sessão: permite repetir
  const [qualquerTurma] = await db
    .select()
    .from(turmas)
    .where(eq(turmas.ativa, true))
    .orderBy(sql`random()`)
    .limit(1);

  if (!qualquerTurma) {
    throw new Error("Nenhuma turma ativa cadastrada. Peça a um admin para cadastrar turmas.");
  }

  return qualquerTurma;
}
