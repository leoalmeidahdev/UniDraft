"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { squads, squadSlots, draftSessions, draftRounds, alunos } from "@/lib/db/schema";
import { getUserSquad, getSquadFull } from "@/lib/db/queries/squads";
import { sortearTurma } from "@/lib/draft/drawTurma";
import { ORDEM_POSICOES, posicaoDaRodada } from "@/lib/draft/positionOrder";
import type { ModoDraft } from "@/types/domain";

export interface DraftActionState {
  error?: string;
}

export async function startDraftAction(
  _prevState: DraftActionState,
  formData: FormData
): Promise<DraftActionState> {
  const user = await requireUser();

  const existente = await getUserSquad(user.id);
  if (existente) {
    redirect(existente.draftConcluido ? "/meu-time" : `/draft/${existente.id}`);
  }

  const modoRaw = formData.get("modo");
  const modo: ModoDraft = modoRaw === "as_cegas" ? "as_cegas" : "classico";

  const turmaRodada1 = await sortearTurma([]);

  const squadId = await db.transaction(async (tx) => {
    const [squad] = await tx
      .insert(squads)
      .values({ userId: user.id })
      .returning({ id: squads.id });

    await tx.insert(squadSlots).values(
      ORDEM_POSICOES.map((posicao) => ({ squadId: squad.id, posicao }))
    );

    const [session] = await tx
      .insert(draftSessions)
      .values({ squadId: squad.id, modo })
      .returning({ id: draftSessions.id });

    await tx.insert(draftRounds).values({
      draftSessionId: session.id,
      rodadaNumero: 1,
      turmaSorteadaId: turmaRodada1.id,
      posicaoAlvo: posicaoDaRodada(1),
    });

    return squad.id;
  });

  redirect(`/draft/${squadId}`);
}

export async function pickAlunoAction(
  _prevState: DraftActionState,
  formData: FormData
): Promise<DraftActionState> {
  const user = await requireUser();

  const squadId = String(formData.get("squadId") ?? "");
  const draftRoundId = String(formData.get("draftRoundId") ?? "");
  const alunoId = String(formData.get("alunoId") ?? "");

  if (!squadId || !draftRoundId || !alunoId) {
    return { error: "Dados inválidos." };
  }

  const squad = await getSquadFull(squadId);
  if (!squad || squad.userId !== user.id) {
    return { error: "Time não encontrado." };
  }
  if (!squad.draftSession || squad.draftSession.status !== "em_andamento") {
    return { error: "Esse draft já foi concluído." };
  }

  const rodada = squad.draftSession.rounds.find((r) => r.id === draftRoundId);
  if (!rodada || rodada.alunoEscolhidoId) {
    return { error: "Essa rodada não está mais disponível." };
  }

  const [aluno] = await db
    .select()
    .from(alunos)
    .where(
      and(
        eq(alunos.id, alunoId),
        eq(alunos.turmaId, rodada.turmaSorteadaId),
        eq(alunos.ativo, true)
      )
    )
    .limit(1);

  if (!aluno) {
    return { error: "Esse aluno não pertence à turma sorteada." };
  }

  const proximaRodadaNumero = rodada.rodadaNumero + 1;
  const ehUltimaRodada = proximaRodadaNumero > ORDEM_POSICOES.length;

  await db.transaction(async (tx) => {
    await tx
      .update(draftRounds)
      .set({ alunoEscolhidoId: aluno.id, escolhidoEm: new Date() })
      .where(eq(draftRounds.id, rodada.id));

    await tx
      .update(squadSlots)
      .set({ alunoId: aluno.id, preenchidaEm: new Date() })
      .where(and(eq(squadSlots.squadId, squadId), eq(squadSlots.posicao, rodada.posicaoAlvo)));

    if (ehUltimaRodada) {
      await tx
        .update(draftSessions)
        .set({ status: "concluido", concluidoEm: new Date() })
        .where(eq(draftSessions.id, squad.draftSession!.id));
      await tx
        .update(squads)
        .set({ draftConcluido: true })
        .where(eq(squads.id, squadId));
    } else {
      const turmasJaSorteadas = squad.draftSession!.rounds.map((r) => r.turmaSorteadaId);
      const proximaTurma = await sortearTurma(turmasJaSorteadas);
      await tx.insert(draftRounds).values({
        draftSessionId: squad.draftSession!.id,
        rodadaNumero: proximaRodadaNumero,
        turmaSorteadaId: proximaTurma.id,
        posicaoAlvo: posicaoDaRodada(proximaRodadaNumero),
      });
    }
  });

  revalidatePath(`/draft/${squadId}`);
  if (ehUltimaRodada) {
    redirect("/meu-time");
  }
  return {};
}
