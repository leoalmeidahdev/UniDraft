import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { turmas, alunos } from "@/lib/db/schema";
import { turmaTemElencoCompleto } from "@/lib/squad/formSquad";

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

export async function getTurma(turmaId: string) {
  const [turma] = await db.select().from(turmas).where(eq(turmas.id, turmaId)).limit(1);
  return turma ?? null;
}

/** Filtra uma lista de turmas candidatas às que têm elenco completo (ver
 * turmaTemElencoCompleto, src/lib/squad/formSquad.ts) — só essas servem de
 * destino pra uma troca de squad, já que formarSquadDaTurma exige cobertura
 * das 5 vagas. */
async function filtrarComElencoCompleto(candidatas: (typeof turmas.$inferSelect)[]) {
  const resultados = await Promise.all(
    candidatas.map(async (turma) => ({
      turma,
      completo: await turmaTemElencoCompleto(turma.id),
    }))
  );
  return resultados.filter((r) => r.completo).map((r) => r.turma);
}

/**
 * Turmas ativas de mesma série+letra, mas de outro ano letivo (eixo "trocar
 * ano" — mesma sala ao longo dos anos, ex: 9ºA de 2024 e 9ºA de 2025). Só
 * retorna as que têm elenco completo.
 */
export async function turmaComMesmoSerieELetraOutroAno(turmaId: string) {
  const turmaAtual = await getTurma(turmaId);
  if (!turmaAtual) return [];

  const candidatas = await db
    .select()
    .from(turmas)
    .where(
      and(
        eq(turmas.ativa, true),
        eq(turmas.serie, turmaAtual.serie),
        eq(turmas.letra, turmaAtual.letra),
        ne(turmas.anoLetivo, turmaAtual.anoLetivo)
      )
    );

  return filtrarComElencoCompleto(candidatas);
}

/**
 * Turmas ativas do mesmo ano letivo, mas de série ou letra diferente (eixo
 * "trocar turma" — outra sala do mesmo ano). Só retorna as que têm elenco
 * completo.
 */
export async function turmaComMesmoAnoOutraSerieLetra(turmaId: string) {
  const turmaAtual = await getTurma(turmaId);
  if (!turmaAtual) return [];

  const candidatas = await db
    .select()
    .from(turmas)
    .where(
      and(
        eq(turmas.ativa, true),
        eq(turmas.anoLetivo, turmaAtual.anoLetivo),
        or(ne(turmas.serie, turmaAtual.serie), ne(turmas.letra, turmaAtual.letra))
      )
    );

  return filtrarComElencoCompleto(candidatas);
}

/**
 * Turmas ativas de mesma letra, mas de série diferente (eixo "outra série"
 * do draft manual em /jogar — 2º J vira 1º J ou 3º J).
 *
 * NÃO restringe por ano letivo de propósito. Nos dados reais cada série de
 * uma letra vive num ano letivo próprio (a letra J, por exemplo, é 1º J em
 * 2024, 2º J em 2025 e 3º J em 2026 — a mesma turma subindo de ano). Exigir
 * o mesmo ano letivo derrubava a cobertura de 25 pra 9 das 28 turmas ativas
 * e deixava justamente o caso do J sem nenhuma candidata.
 *
 * Diferente das duas buscas acima, também NÃO filtra por elenco completo:
 * aquela régua é da troca de squad inteiro (/meu-time), que exige as 5
 * posições de uma vez via formarSquadDaTurma. Aqui (src/lib/squad/actions.ts,
 * trocarSalaSerieAction) o draft só precisa que a sala tenha alguém pra uma
 * vaga ainda aberta — filtrar por elenco completo descartaria salas válidas.
 */
export async function turmaComMesmaLetraOutraSerie(turmaId: string) {
  const turmaAtual = await getTurma(turmaId);
  if (!turmaAtual) return [];

  return db
    .select()
    .from(turmas)
    .where(
      and(
        eq(turmas.ativa, true),
        eq(turmas.letra, turmaAtual.letra),
        ne(turmas.serie, turmaAtual.serie)
      )
    );
}
