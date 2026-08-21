import {
  CircleDot,
  Crosshair,
  Flag,
  Hand,
  Pause,
  Play,
  RectangleVertical,
  Square,
  TrendingDown,
  type LucideIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import type { TipoEventoPartida } from "@/types/domain";

/** Ícone + cor por tipo de evento. Cartão amarelo e vermelho usam o mesmo
 * glifo (retângulo) e se distinguem só pela cor, como no jogo real. */
const ESTILO_TIPO: Record<TipoEventoPartida, { Icone: LucideIcon; cor: string }> = {
  gol: { Icone: CircleDot, cor: "text-destaque" },
  defesa: { Icone: Hand, cor: "text-primary" },
  falta: { Icone: Flag, cor: "text-muted-foreground" },
  cartao: { Icone: RectangleVertical, cor: "text-alerta" },
  cartao_vermelho: { Icone: RectangleVertical, cor: "text-destructive" },
  falta_direta: { Icone: Crosshair, cor: "text-destaque" },
  chance_perdida: { Icone: TrendingDown, cor: "text-muted-foreground" },
  inicio_tempo: { Icone: Play, cor: "text-muted-foreground" },
  fim_tempo: { Icone: Square, cor: "text-muted-foreground" },
  intervalo: { Icone: Pause, cor: "text-muted-foreground" },
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
        const { Icone, cor } = ESTILO_TIPO[e.tipo];
        return (
          <li
            key={e.ordem}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm",
              e.tipo === "gol" && "border-destaque/45 bg-destaque/5 font-medium",
              isNeutro && "justify-center border-dashed bg-transparent text-muted-foreground"
            )}
          >
            {!isNeutro && (
              <span className="num w-8 shrink-0 text-xs text-muted-foreground">
                {e.minutoJogo}&apos;
              </span>
            )}
            <Icone className={cn("size-4 shrink-0", cor)} aria-hidden />
            <span className={cn("flex-1", !isNeutro && !isHome && "text-right")}>{e.descricao}</span>
          </li>
        );
      })}
    </ol>
  );
}
