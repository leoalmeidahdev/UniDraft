import { cn } from "@/lib/utils";
import type { TipoEventoPartida } from "@/types/domain";

const ICONE_TIPO: Record<TipoEventoPartida, string> = {
  gol: "⚽",
  defesa: "🧤",
  falta: "🟨",
  cartao: "🟥",
  chance_perdida: "😬",
  inicio_tempo: "▶️",
  fim_tempo: "⏹️",
};

export interface EventoTimeline {
  ordem: number;
  minutoJogo: number;
  tipo: TipoEventoPartida;
  squadId: string | null;
  descricao: string;
}

export function EventTimeline({
  eventos,
  squadHomeId,
}: {
  eventos: EventoTimeline[];
  squadHomeId: string;
}) {
  const ordenadosRecentesPrimeiro = [...eventos].sort((a, b) => b.ordem - a.ordem);

  return (
    <ol className="flex flex-col gap-2">
      {ordenadosRecentesPrimeiro.map((e) => {
        const isHome = e.squadId === squadHomeId;
        const isNeutro = !e.squadId;
        return (
          <li
            key={e.ordem}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
              e.tipo === "gol" && "border-primary/40 bg-primary/5 font-medium",
              isNeutro && "justify-center text-muted-foreground"
            )}
          >
            {!isNeutro && (
              <span className="w-8 shrink-0 text-xs text-muted-foreground">{e.minutoJogo}&apos;</span>
            )}
            <span>{ICONE_TIPO[e.tipo]}</span>
            <span className={cn("flex-1", !isNeutro && !isHome && "text-right")}>{e.descricao}</span>
          </li>
        );
      })}
    </ol>
  );
}
