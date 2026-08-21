import { SlotCard } from "@/components/squad/SlotCard";
import { FutsalCourt } from "@/components/squad/FutsalCourt";
import { FORMACAO_PADRAO, type Formacao, type PosicaoFutsal } from "@/types/domain";

export interface SlotComAluno {
  posicao: PosicaoFutsal;
  aluno: { nome: string; apelido: string | null; overall: number | null } | null;
}

export function SquadFormationView({
  squadId,
  slots,
  formacao = FORMACAO_PADRAO,
}: {
  squadId: string;
  slots: SlotComAluno[];
  formacao?: Formacao;
}) {
  const posicoesPreenchidas = slots.filter((s) => s.aluno).map((s) => s.posicao);

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-start">
      <FutsalCourt slots={slots} formacao={formacao} />
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:p-6">
        {slots.map((slot) => (
          <SlotCard
            key={slot.posicao}
            squadId={squadId}
            posicao={slot.posicao}
            aluno={slot.aluno}
            outrasPosicoesPreenchidas={posicoesPreenchidas.filter((p) => p !== slot.posicao)}
          />
        ))}
      </div>
    </div>
  );
}
