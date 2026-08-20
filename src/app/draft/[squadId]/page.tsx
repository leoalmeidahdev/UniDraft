import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getSquadFull, getTurmaComAlunos } from "@/lib/db/queries/squads";
import { FutsalCourt } from "@/components/draft/FutsalCourt";
import { TurmaSorteadaCard } from "@/components/draft/TurmaSorteadaCard";
import { AlunoPickList } from "@/components/draft/AlunoPickList";
import { ORDEM_POSICOES, posicoesJogadorAbertas } from "@/lib/draft/positionOrder";

export default async function DraftRoundPage({
  params,
}: PageProps<"/draft/[squadId]">) {
  const { squadId } = await params;
  const user = await requireUser();

  const squad = await getSquadFull(squadId);
  if (!squad || squad.userId !== user.id) {
    notFound();
  }
  if (squad.draftConcluido || !squad.draftSession) {
    redirect("/meu-time");
  }

  const rodadas = squad.draftSession.rounds;
  const rodadaAtual = rodadas.find((r) => !r.alunoEscolhidoId);
  if (!rodadaAtual) {
    // estado inconsistente (não deveria acontecer): tudo escolhido mas sessão não fechada
    redirect("/meu-time");
  }

  const turma = await getTurmaComAlunos(rodadaAtual.turmaSorteadaId);
  const posicoesPreenchidas = squad.slots.filter((s) => s.alunoId).map((s) => s.posicao);

  const courtSlots = ORDEM_POSICOES.map((posicao) => {
    const slot = squad.slots.find((s) => s.posicao === posicao);
    return {
      posicao,
      aluno: slot?.aluno
        ? {
            nome: slot.aluno.nome,
            apelido: slot.aluno.apelido,
            overall: slot.aluno.overall,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Rodada {rodadaAtual.rodadaNumero} de 5
      </h1>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
        <FutsalCourt slots={courtSlots} />

        <div className="flex flex-col gap-4">
          <TurmaSorteadaCard
            turma={{
              anoLetivo: turma!.anoLetivo,
              serie: turma!.serie,
              letra: turma!.letra,
            }}
            posicoesJogadorAbertas={posicoesJogadorAbertas(posicoesPreenchidas)}
          />

          {turma!.alunos.length === 0 ? (
            <p className="text-muted-foreground">
              Essa turma ainda não tem colegas cadastrados. Peça a um admin
              para completar o cadastro em /admin/alunos.
            </p>
          ) : (
            <AlunoPickList
              alunos={turma!.alunos}
              posicoesPreenchidas={posicoesPreenchidas}
              squadId={squad.id}
              draftRoundId={rodadaAtual.id}
              modo={squad.draftSession!.modo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
