import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { alunos, squads, squadSlots, turmas } from "@/lib/db/schema";
import type { PlayerIdentity } from "@/lib/auth/guards";
import { sortearTurma } from "@/lib/draft/drawTurma";
import { ORDEM_POSICOES, SLOTS_POR_POSICAO_JOGADOR } from "@/lib/draft/positionOrder";
import {
  POSICOES_JOGADOR,
  type EstiloTatico,
  type Formacao,
  type PosicaoFutsal,
  type PosicaoJogador,
} from "@/types/domain";

/** Quantos titulares de cada posição natural o squad precisa pra estar
 * completo (goleiro, fixo, 2 alas, pivô — as 5 vagas de src/lib/draft/positionOrder.ts). */
const MINIMO_POR_POSICAO: Record<PosicaoJogador, number> = {
  GOLEIRO: 1,
  FIXO: 1,
  ALA: 2,
  PIVO: 1,
};

/** Vaga do squad -> posição natural do jogador que a preenche (inverso de
 * SLOTS_POR_POSICAO_JOGADOR). */
const SLOT_PARA_POSICAO_JOGADOR: Record<PosicaoFutsal, PosicaoJogador> = Object.fromEntries(
  POSICOES_JOGADOR.flatMap((pj) => SLOTS_POR_POSICAO_JOGADOR[pj].map((slot) => [slot, pj]))
) as Record<PosicaoFutsal, PosicaoJogador>;

/**
 * A turma tem alunos ativos suficientes pra formar um squad inteiro numa
 * tacada só: pelo menos 1 goleiro, 1 fixo, 2 alas e 1 pivô. Usado pra decidir
 * se uma turma sorteada "serve" pra uma rodada rápida (ver
 * sortearTurmaComElencoCompleto abaixo).
 */
export async function turmaTemElencoCompleto(turmaId: string): Promise<boolean> {
  const contagens = await db
    .select({ posicao: alunos.posicao, total: sql<number>`count(*)::int` })
    .from(alunos)
    .where(and(eq(alunos.turmaId, turmaId), eq(alunos.ativo, true)))
    .groupBy(alunos.posicao);

  const porPosicao = new Map(contagens.map((c) => [c.posicao, c.total]));
  return (Object.keys(MINIMO_POR_POSICAO) as PosicaoJogador[]).every(
    (posicao) => (porPosicao.get(posicao) ?? 0) >= MINIMO_POR_POSICAO[posicao]
  );
}

/**
 * Sorteia uma turma ativa cujo elenco cobre as 5 vagas do squad de uma vez
 * (goleiro, fixo, 2 alas, pivô) — adaptado de sortearTurmaElegivel
 * (src/lib/draft/drawTurma.ts, hoje removida), mas exigindo cobertura
 * completa das posições em vez de "pelo menos uma vaga aberta". Redesenha
 * turmas incompletas automaticamente, sem expor isso ao jogador — só a
 * turma "boa" vira uma rodada de verdade.
 */
export async function sortearTurmaComElencoCompleto(excluir: string[] = []) {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(turmas)
    .where(eq(turmas.ativa, true));

  const tentadas = new Set(excluir);
  // +1 turnos de folga cobre o caso de sortearTurma já ter que repetir turma
  // (todas excluídas) antes de esgotarmos de verdade as opções distintas.
  const maxTentativas = total + 1;

  for (let i = 0; i < maxTentativas; i++) {
    const candidata = await sortearTurma([...tentadas]);
    if (await turmaTemElencoCompleto(candidata.id)) return candidata;
    tentadas.add(candidata.id);
  }

  throw new Error(
    "Nenhuma turma tem elenco completo (goleiro, fixo, 2 alas e pivô) no momento. Peça a um admin para completar o cadastro de posições em /admin/alunos."
  );
}

/**
 * Forma um squad novo e totalmente preenchido a partir do elenco de uma
 * turma — escala o melhor aluno disponível em cada vaga (por overall
 * descendente; goleiro pelo atributo `goleiro`, ver
 * src/lib/simulation/attributes.ts). Nunca reusa ou muta um squad existente:
 * cada rodada é sempre um INSERT novo (squads antigos ficam como histórico
 * inerte, ver src/lib/db/queries/squads.ts). Retorna o id do squad criado.
 *
 * Assume que a turma tem elenco completo (chame turmaTemElencoCompleto ou
 * sortearTurmaComElencoCompleto antes) — lança erro caso contrário.
 */
export async function formarSquadDaTurma(
  identity: PlayerIdentity,
  turmaId: string
): Promise<string> {
  const alunosDaTurma = await db
    .select()
    .from(alunos)
    .where(and(eq(alunos.turmaId, turmaId), eq(alunos.ativo, true)));

  const candidatosPorPosicao = new Map<PosicaoJogador, typeof alunosDaTurma>();
  for (const pj of POSICOES_JOGADOR) {
    const candidatos = alunosDaTurma
      .filter((a) => a.posicao === pj)
      .sort((a, b) =>
        pj === "GOLEIRO" ? b.goleiro - a.goleiro : (b.overall ?? -1) - (a.overall ?? -1)
      );
    candidatosPorPosicao.set(pj, candidatos);
  }

  const usados = new Map<PosicaoJogador, number>();
  const alunoIdPorSlot = new Map<PosicaoFutsal, string>();

  for (const slot of ORDEM_POSICOES) {
    const posicaoJogador = SLOT_PARA_POSICAO_JOGADOR[slot];
    const indice = usados.get(posicaoJogador) ?? 0;
    const candidato = candidatosPorPosicao.get(posicaoJogador)?.[indice];
    if (!candidato) {
      throw new Error(
        `Turma sem elenco completo: falta jogador de posição ${posicaoJogador} para a vaga ${slot}.`
      );
    }
    alunoIdPorSlot.set(slot, candidato.id);
    usados.set(posicaoJogador, indice + 1);
  }

  return inserirSquadComSlots(identity, alunoIdPorSlot);
}

/**
 * Insere um squad novo + suas 5 vagas (squad_slots) numa única transaction —
 * núcleo comum entre formarSquadDaTurma (rodada rápida, elenco de uma turma
 * só) e o draft manual de /jogar (aluno escolhido vaga a vaga, cada um
 * possivelmente de uma sala/turma diferente — ver sortearSalaAction e
 * finalizarDraftAction em src/lib/squad/actions.ts). Nunca reusa/muta um
 * squad existente: cada chamada é sempre um INSERT novo. `tatica` é opcional
 * — quando omitida, squads.formacao/estilo ficam no default da coluna (ver
 * migration 0009_tatica_formacao_estilo.sql).
 */
export async function inserirSquadComSlots(
  identity: PlayerIdentity,
  alunoIdPorSlot: Map<PosicaoFutsal, string>,
  tatica?: { formacao: Formacao; estilo: EstiloTatico }
): Promise<string> {
  return db.transaction(async (tx) => {
    const [squad] = await tx
      .insert(squads)
      .values({
        ...(identity.kind === "user" ? { userId: identity.id } : { guestId: identity.id }),
        ...(tatica ? { formacao: tatica.formacao, estilo: tatica.estilo } : {}),
        draftConcluido: true,
      })
      .returning({ id: squads.id });

    await tx.insert(squadSlots).values(
      ORDEM_POSICOES.map((posicao) => ({
        squadId: squad.id,
        posicao,
        alunoId: alunoIdPorSlot.get(posicao)!,
        preenchidaEm: new Date(),
      }))
    );

    return squad.id;
  });
}
