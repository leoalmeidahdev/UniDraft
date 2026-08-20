import { POSICAO_LABEL, type PosicaoFutsal } from "@/types/domain";
import { cn } from "@/lib/utils";

export interface CourtSlot {
  posicao: PosicaoFutsal;
  aluno: { nome: string; apelido: string | null; overall: number | null } | null;
}

const COORDENADAS: Record<PosicaoFutsal, { top: string; left: string }> = {
  PIVO: { top: "13%", left: "50%" },
  ALA_1: { top: "38%", left: "18%" },
  ALA_2: { top: "38%", left: "82%" },
  FIXO: { top: "65%", left: "50%" },
  GOLEIRO: { top: "90%", left: "50%" },
};

export function FutsalCourt({ slots }: { slots: CourtSlot[] }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border bg-gradient-to-b from-emerald-600 to-emerald-700">
      <div className="absolute inset-3 rounded-md border-2 border-white/40" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 bg-white/40" />
      <div className="absolute left-1/2 top-3 h-14 w-32 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-white/40" />
      <div className="absolute bottom-3 left-1/2 h-14 w-32 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-white/40" />

      {slots.map((slot) => {
        const { top, left } = COORDENADAS[slot.posicao];
        return (
          <div
            key={slot.posicao}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ top, left }}
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border-2 text-xs font-bold sm:h-16 sm:w-16 sm:text-sm",
                slot.aluno
                  ? "border-white bg-white text-emerald-800 shadow-sm"
                  : "animate-pulse border-dashed border-white bg-white/20 text-white"
              )}
            >
              {slot.aluno
                ? slot.aluno.nome.slice(0, 2).toUpperCase()
                : POSICAO_LABEL[slot.posicao].slice(0, 3).toUpperCase()}
            </div>
            <span className="max-w-20 truncate rounded bg-black/40 px-1.5 py-0.5 text-center text-[10px] font-medium text-white">
              {slot.aluno
                ? slot.aluno.apelido ?? slot.aluno.nome.split(" ")[0]
                : POSICAO_LABEL[slot.posicao]}
            </span>
            {slot.aluno?.overall != null && (
              <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-emerald-800">
                {slot.aluno.overall}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
