import { POSICAO_LABEL, type Formacao, type PosicaoFutsal } from "@/types/domain";
import { cn } from "@/lib/utils";

type PosicaoLinha = Exclude<PosicaoFutsal, "GOLEIRO">;

const GOLEIRO_COORD = { top: "92%", left: "50%" };

/**
 * Coordenadas esquemáticas (não são as posições reais de jogo, ver
 * FutsalCourt em src/components/squad/FutsalCourt.tsx pra isso) — só pra dar
 * uma ideia visual rápida do formato de cada formação a quem não conhece
 * futsal. Curadas à mão pra desenhar de fato o apelido de cada uma: Diamante
 * (1-2-1), Quadrado (2-2), Pinha — três atrás e um isolado (3-1), Sem pivô —
 * quatro numa linha só, sem ninguém isolado na frente (4-0).
 */
const COORDENADAS: Record<Formacao, Record<PosicaoLinha, { top: string; left: string }>> = {
  "1-2-1": {
    PIVO: { top: "14%", left: "50%" },
    ALA_1: { top: "46%", left: "18%" },
    ALA_2: { top: "46%", left: "82%" },
    FIXO: { top: "74%", left: "50%" },
  },
  "2-2": {
    ALA_2: { top: "24%", left: "30%" },
    PIVO: { top: "24%", left: "70%" },
    FIXO: { top: "66%", left: "30%" },
    ALA_1: { top: "66%", left: "70%" },
  },
  "3-1": {
    PIVO: { top: "12%", left: "50%" },
    ALA_1: { top: "58%", left: "22%" },
    ALA_2: { top: "58%", left: "78%" },
    FIXO: { top: "64%", left: "50%" },
  },
  "4-0": {
    ALA_1: { top: "38%", left: "14%" },
    FIXO: { top: "44%", left: "38%" },
    PIVO: { top: "44%", left: "62%" },
    ALA_2: { top: "38%", left: "86%" },
  },
};

const ORDEM_DESENHO: PosicaoFutsal[] = ["GOLEIRO", "FIXO", "ALA_1", "ALA_2", "PIVO"];

/**
 * Desenho esquemático da formação: quadra em miniatura com os 4 jogadores de
 * linha + goleiro nas posições que dão a forma do apelido (Diamante,
 * Quadrado, Pinha, Sem pivô). Puramente decorativo — o texto ao lado já
 * explica a formação, então fica aria-hidden.
 */
export function TaticaDiagram({
  formacao,
  className,
}: {
  formacao: Formacao;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-quadra-linha bg-quadra",
        className
      )}
    >
      <div className="absolute inset-2 rounded-md border border-quadra-linha/70" />
      <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-quadra-linha/70" />
      <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 bg-quadra-linha/70" />
      <div className="absolute left-1/2 top-2 h-6 w-14 -translate-x-1/2 rounded-b-full border border-t-0 border-quadra-linha/70" />

      {ORDEM_DESENHO.map((posicao) => {
        const coord = posicao === "GOLEIRO" ? GOLEIRO_COORD : COORDENADAS[formacao][posicao];
        return (
          <div
            key={posicao}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: coord.top, left: coord.left }}
          >
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-bold sm:h-7 sm:w-7",
                posicao === "GOLEIRO"
                  ? "border-white/70 bg-white/80 text-quadra"
                  : "border-white bg-white text-quadra"
              )}
            >
              {POSICAO_LABEL[posicao].slice(0, 3).toUpperCase()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
