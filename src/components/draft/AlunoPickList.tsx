import { AlunoPickCard } from "@/components/draft/AlunoPickCard";
import { slotDisponivelParaAluno } from "@/lib/draft/positionOrder";
import type { ModoDraft, PosicaoFutsal, PosicaoJogador } from "@/types/domain";

interface AlunoParaEscolha {
  id: string;
  nome: string;
  apelido: string | null;
  ataque: number;
  defesa: number;
  tecnica: number;
  velocidade: number;
  fisico: number;
  goleiro: number;
  overall: number | null;
  posicao: PosicaoJogador | null;
}

export function AlunoPickList({
  alunos,
  posicoesPreenchidas,
  squadId,
  draftRoundId,
  modo,
}: {
  alunos: AlunoParaEscolha[];
  posicoesPreenchidas: PosicaoFutsal[];
  squadId: string;
  draftRoundId: string;
  modo: ModoDraft;
}) {
  const comElegibilidade = alunos.map((aluno) => {
    const slot = slotDisponivelParaAluno(aluno.posicao, posicoesPreenchidas);
    return {
      aluno,
      elegivel: slot !== null,
      motivoIndisponivel: !aluno.posicao
        ? "Posição ainda não definida por um admin."
        : slot === null
          ? "A vaga dessa posição já foi preenchida."
          : undefined,
    };
  });

  comElegibilidade.sort((a, b) => {
    if (a.elegivel !== b.elegivel) return a.elegivel ? -1 : 1;
    const ratingA = (a.aluno.posicao === "GOLEIRO" ? a.aluno.goleiro : a.aluno.overall) ?? -1;
    const ratingB = (b.aluno.posicao === "GOLEIRO" ? b.aluno.goleiro : b.aluno.overall) ?? -1;
    return ratingB - ratingA;
  });

  return (
    <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
      {comElegibilidade.map(({ aluno, elegivel, motivoIndisponivel }) => (
        <AlunoPickCard
          key={aluno.id}
          aluno={aluno}
          squadId={squadId}
          draftRoundId={draftRoundId}
          modo={modo}
          elegivel={elegivel}
          motivoIndisponivel={motivoIndisponivel}
        />
      ))}
    </ul>
  );
}
