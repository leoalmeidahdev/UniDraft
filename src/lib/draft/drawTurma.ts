import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { turmas, alunos } from "@/lib/db/schema";
import { slotDisponivelParaAluno } from "@/lib/draft/positionOrder";
import type { PosicaoFutsal } from "@/types/domain";

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

/**
 * Sorteia uma turma que tenha pelo menos um aluno elegível para as vagas
 * ainda abertas do squad (posição natural do aluno bate com alguma vaga
 * livre). Redesenha automaticamente turmas sem ninguém elegível, sem expor
 * isso ao jogador — só a turma "boa" vira uma rodada de verdade.
 */
export async function sortearTurmaElegivel(
  turmasExcluidasIds: string[],
  posicoesPreenchidas: readonly PosicaoFutsal[]
) {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(turmas)
    .where(eq(turmas.ativa, true));

  const tentadas = new Set(turmasExcluidasIds);
  // +1 turnos de folga cobre o caso de sortearTurma já ter que repetir turma
  // (todas excluídas) antes de esgotarmos de verdade as opções distintas.
  const maxTentativas = total + 1;

  for (let i = 0; i < maxTentativas; i++) {
    const candidata = await sortearTurma([...tentadas]);

    const alunosDaTurma = await db
      .select({ posicao: alunos.posicao })
      .from(alunos)
      .where(and(eq(alunos.turmaId, candidata.id), eq(alunos.ativo, true)));

    const temElegivel = alunosDaTurma.some(
      (a) => slotDisponivelParaAluno(a.posicao, posicoesPreenchidas) !== null
    );
    if (temElegivel) return candidata;

    tentadas.add(candidata.id);
  }

  throw new Error(
    "Nenhum aluno com posição definida está disponível para as vagas que faltam. Peça a um admin para definir a posição dos alunos em /admin/alunos."
  );
}
