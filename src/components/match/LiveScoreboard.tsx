import { Circle } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DURACAO_JOGO_MIN, MINUTOS_POR_TEMPO } from "@/lib/simulation/simulateMatch";

/** minutoAtual é o relógio corrido (0-90); o intervalo em si não tem duração própria
 * na simulação (ver DURACAO_JOGO_MIN em simulateMatch.ts), então ele só aparece no
 * instante exato da virada de tempo — o resto do jogo é 1º ou 2º tempo. */
function faseAtual(minutoAtual: number, finalizado: boolean, emPenaltis: boolean): string {
  if (finalizado) return "Fim de jogo";
  if (emPenaltis) return "Disputa de pênaltis";
  if (minutoAtual === MINUTOS_POR_TEMPO) return "Intervalo";
  if (minutoAtual < MINUTOS_POR_TEMPO) return "1º tempo";
  return "2º tempo";
}

export function LiveScoreboard({
  squadHome,
  squadAway,
  placarHome,
  placarAway,
  placarPenaltiHome,
  placarPenaltiAway,
  minutoAtual,
  finalizado,
  emPenaltis = false,
}: {
  squadHome: { nome: string; ownerNome: string };
  squadAway: { nome: string; ownerNome: string };
  placarHome: number;
  placarAway: number;
  /** Só exibido quando o tempo normal termina empatado e a disputa já foi revelada. */
  placarPenaltiHome?: number | null;
  placarPenaltiAway?: number | null;
  minutoAtual: number;
  finalizado: boolean;
  /** Playback já passou do fim do tempo normal numa partida que foi pra pênaltis. */
  emPenaltis?: boolean;
}) {
  const mostrarPenaltis = finalizado && placarPenaltiHome != null && placarPenaltiAway != null;
  const minutoExibido = Math.min(minutoAtual, DURACAO_JOGO_MIN);

  return (
    <div className="bg-marinho-gradiente flex flex-col items-center gap-4 rounded-2xl p-6 text-white">
      <Badge
        variant={finalizado ? "secondary" : "default"}
        className={cn(
          "gap-1.5 border border-white/20 bg-white/10 text-white",
          !finalizado && "bg-destaque/90 text-destaque-foreground"
        )}
      >
        {!finalizado && <Circle className="size-2 animate-pulse fill-current" aria-hidden />}
        {finalizado ? "Finalizada" : faseAtual(minutoAtual, finalizado, emPenaltis)}
      </Badge>

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="min-w-0 text-right">
          <div className="truncate font-semibold text-white">{squadHome.nome}</div>
          <div className="truncate text-xs text-white/60">{squadHome.ownerNome}</div>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <div className="flex items-baseline gap-2">
            <span className="num text-4xl font-bold text-destaque sm:text-5xl">{placarHome}</span>
            <span className="text-lg text-white/40">x</span>
            <span className="num text-4xl font-bold text-destaque sm:text-5xl">{placarAway}</span>
          </div>
          {mostrarPenaltis && (
            <div className="num text-xs font-medium text-white/60">
              pênaltis {placarPenaltiHome} x {placarPenaltiAway}
            </div>
          )}
        </div>

        <div className="min-w-0 text-left">
          <div className="truncate font-semibold text-white">{squadAway.nome}</div>
          <div className="truncate text-xs text-white/60">{squadAway.ownerNome}</div>
        </div>
      </div>

      <div className="num text-sm font-medium text-white/70">
        {finalizado ? `${DURACAO_JOGO_MIN}'` : `${minutoExibido}'`}
      </div>
    </div>
  );
}
