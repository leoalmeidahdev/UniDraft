import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getSquadFull, getTurmaComAlunos } from "@/lib/db/queries/squads";
import { DraftProgressBar } from "@/components/draft/DraftProgressBar";
import { TurmaSorteadaCard } from "@/components/draft/TurmaSorteadaCard";
import { AlunoPickCard } from "@/components/draft/AlunoPickCard";

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
  const posicoesPreenchidas = rodadas
    .filter((r) => r.alunoEscolhidoId)
    .map((r) => r.posicaoAlvo);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Rodada {rodadaAtual.rodadaNumero} de 5
        </h1>
        <DraftProgressBar
          posicoesPreenchidas={posicoesPreenchidas}
          posicaoAtual={rodadaAtual.posicaoAlvo}
        />
      </div>

      <div className="mb-8">
        <TurmaSorteadaCard
          turma={{
            anoLetivo: turma!.anoLetivo,
            serie: turma!.serie,
            letra: turma!.letra,
          }}
          posicaoAlvo={rodadaAtual.posicaoAlvo}
        />
      </div>

      {turma!.alunos.length === 0 ? (
        <p className="text-muted-foreground">
          Essa turma ainda não tem colegas cadastrados. Peça a um admin para
          completar o cadastro em /admin/alunos.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {turma!.alunos.map((aluno) => (
            <AlunoPickCard
              key={aluno.id}
              aluno={aluno}
              squadId={squad.id}
              draftRoundId={rodadaAtual.id}
              modo={squad.draftSession!.modo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
