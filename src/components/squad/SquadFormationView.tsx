import { SlotCard } from "@/components/squad/SlotCard";
import type { PosicaoFutsal } from "@/types/domain";

export interface SlotComAluno {
  posicao: PosicaoFutsal;
  aluno: { nome: string; apelido: string | null; overall: number | null } | null;
}

export function SquadFormationView({
  squadId,
  slots,
}: {
  squadId: string;
  slots: SlotComAluno[];
}) {
  const posicoesPreenchidas = slots.filter((s) => s.aluno).map((s) => s.posicao);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:p-6">
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
  );
}
