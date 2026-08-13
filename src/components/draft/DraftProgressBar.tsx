import { POSICAO_LABEL, type PosicaoFutsal } from "@/types/domain";
import { ORDEM_POSICOES } from "@/lib/draft/positionOrder";
import { cn } from "@/lib/utils";

export function DraftProgressBar({
  posicoesPreenchidas,
  posicaoAtual,
}: {
  posicoesPreenchidas: PosicaoFutsal[];
  posicaoAtual: PosicaoFutsal;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {ORDEM_POSICOES.map((posicao, i) => {
        const preenchida = posicoesPreenchidas.includes(posicao);
        const atual = posicao === posicaoAtual;
        return (
          <li
            key={`${posicao}-${i}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              preenchida && "border-primary/30 bg-primary/10 text-primary",
              atual && !preenchida && "border-primary bg-primary text-primary-foreground",
              !preenchida && !atual && "text-muted-foreground"
            )}
          >
            <span>{i + 1}.</span>
            <span>{POSICAO_LABEL[posicao]}</span>
          </li>
        );
      })}
    </ol>
  );
}
