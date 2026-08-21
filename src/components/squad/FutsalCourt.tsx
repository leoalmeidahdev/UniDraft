import { POSICAO_LABEL, FORMACAO_PADRAO, type Formacao, type PosicaoFutsal } from "@/types/domain";
import { cn } from "@/lib/utils";

export interface CourtSlot {
  posicao: PosicaoFutsal;
  aluno: { nome: string; apelido: string | null; overall: number | null } | null;
}

type Coordenada = { top: string; left: string };

/** Posição de cada vaga em campo, por formação. O goleiro nunca muda (defende
 * igual em qualquer formação — ver FORMACAO_INFO em src/types/domain.ts); o
 * que muda é como os 4 de linha se distribuem. */
const COORDENADAS_POR_FORMACAO: Record<Formacao, Record<PosicaoFutsal, Coordenada>> = {
  // Diamante: fixo recuado, dois alas abertos no meio, pivô isolado na frente.
  "1-2-1": {
    GOLEIRO: { top: "90%", left: "50%" },
    FIXO: { top: "66%", left: "50%" },
    ALA_1: { top: "40%", left: "18%" },
    ALA_2: { top: "40%", left: "82%" },
    PIVO: { top: "14%", left: "50%" },
  },
  // Quadrado: duas linhas paralelas, defesa e ataque lado a lado.
  "2-2": {
    GOLEIRO: { top: "90%", left: "50%" },
    FIXO: { top: "62%", left: "28%" },
    ALA_1: { top: "62%", left: "72%" },
    ALA_2: { top: "28%", left: "28%" },
    PIVO: { top: "28%", left: "72%" },
  },
  // Pinha: três de contenção atrás, pivô isolado sozinho na frente.
  "3-1": {
    GOLEIRO: { top: "90%", left: "50%" },
    FIXO: { top: "68%", left: "50%" },
    ALA_1: { top: "56%", left: "22%" },
    ALA_2: { top: "56%", left: "78%" },
    PIVO: { top: "13%", left: "50%" },
  },
  // Sem pivô: os quatro de linha rodam numa única faixa, sem referência fixa na frente.
  "4-0": {
    GOLEIRO: { top: "90%", left: "50%" },
    FIXO: { top: "55%", left: "15%" },
    ALA_1: { top: "40%", left: "38%" },
    ALA_2: { top: "40%", left: "62%" },
    PIVO: { top: "55%", left: "85%" },
  },
};

export function FutsalCourt({
  slots,
  formacao = FORMACAO_PADRAO,
}: {
  slots: CourtSlot[];
  formacao?: Formacao;
}) {
  const coordenadas = COORDENADAS_POR_FORMACAO[formacao];

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-quadra-linha bg-quadra shadow-inner">
      {/* Marcações da quadra */}
      <div className="absolute inset-3 rounded-md border-2 border-quadra-linha" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-quadra-linha" />
      <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 bg-quadra-linha" />
      <div className="absolute left-1/2 top-3 h-14 w-32 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-quadra-linha" />
      <div className="absolute bottom-3 left-1/2 h-14 w-32 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-quadra-linha" />

      {slots.map((slot) => {
        const { top, left } = coordenadas[slot.posicao];
        return (
          <div
            key={slot.posicao}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ top, left }}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold sm:h-14 sm:w-14 sm:text-sm",
                slot.aluno
                  ? "border-primary-foreground/50 bg-primary text-primary-foreground shadow-md"
                  : "animate-pulse border-dashed border-quadra-linha bg-quadra-linha/10 text-quadra-linha"
              )}
            >
              {slot.aluno
                ? slot.aluno.nome.slice(0, 2).toUpperCase()
                : POSICAO_LABEL[slot.posicao].slice(0, 3).toUpperCase()}
            </div>
            <span className="max-w-20 truncate rounded bg-marinho/80 px-1.5 py-0.5 text-center text-[10px] font-medium text-white">
              {slot.aluno
                ? slot.aluno.apelido ?? slot.aluno.nome.split(" ")[0]
                : POSICAO_LABEL[slot.posicao]}
            </span>
            {slot.aluno?.overall != null && (
              <span className="num rounded-full bg-destaque px-1.5 text-[10px] font-bold text-destaque-foreground">
                {slot.aluno.overall}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
