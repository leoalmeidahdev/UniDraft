import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { turmas, alunos } from "@/lib/db/schema";
import type { AlunoCsvRow } from "@/lib/csv/parseAlunosCsv";

export interface ImportSummary {
  turmasCriadas: number;
  alunosCriados: number;
  alunosParaRevisar: number;
}

/** Upsert de turmas + insert de alunos a partir de linhas de CSV já validadas. */
export async function importAlunosRows(
  rows: AlunoCsvRow[],
  createdBy?: string
): Promise<ImportSummary> {
  const turmaIdCache = new Map<string, string>();
  const resumo: ImportSummary = { turmasCriadas: 0, alunosCriados: 0, alunosParaRevisar: 0 };

  for (const row of rows) {
    const chaveTurma = `${row.anoLetivo}-${row.serie}-${row.letra}`;
    let turmaId = turmaIdCache.get(chaveTurma);

    if (!turmaId) {
      const [existente] = await db
        .select({ id: turmas.id })
        .from(turmas)
        .where(
          and(
            eq(turmas.anoLetivo, row.anoLetivo),
            eq(turmas.serie, row.serie),
            eq(turmas.letra, row.letra)
          )
        )
        .limit(1);

      if (existente) {
        turmaId = existente.id;
      } else {
        const [criada] = await db
          .insert(turmas)
          .values({ anoLetivo: row.anoLetivo, serie: row.serie, letra: row.letra })
          .returning({ id: turmas.id });
        turmaId = criada.id;
        resumo.turmasCriadas++;
      }
      turmaIdCache.set(chaveTurma, turmaId);
    }

    await db.insert(alunos).values({
      turmaId,
      nome: row.nome,
      apelido: row.apelido,
      posicao: row.posicao,
      ativo: !row.precisaRevisao,
      ataque: row.ataque,
      defesa: row.defesa,
      tecnica: row.tecnica,
      velocidade: row.velocidade,
      fisico: row.fisico,
      goleiro: row.goleiro,
      createdBy,
    });
    resumo.alunosCriados++;
    if (row.precisaRevisao) resumo.alunosParaRevisar++;
  }

  return resumo;
}
