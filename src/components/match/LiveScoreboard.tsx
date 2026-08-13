import { Badge } from "@/components/ui/badge";

export function LiveScoreboard({
  squadHome,
  squadAway,
  placarHome,
  placarAway,
  minutoAtual,
  finalizado,
}: {
  squadHome: { nome: string; ownerNome: string };
  squadAway: { nome: string; ownerNome: string };
  placarHome: number;
  placarAway: number;
  minutoAtual: number;
  finalizado: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/20 p-6">
      <Badge variant={finalizado ? "secondary" : "default"} className={finalizado ? "" : "animate-pulse"}>
        {finalizado ? "Finalizada" : `Ao vivo — ${minutoAtual}'`}
      </Badge>
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <div className="font-semibold">{squadHome.nome}</div>
          <div className="text-xs text-muted-foreground">{squadHome.ownerNome}</div>
        </div>
        <div className="text-3xl font-bold tabular-nums">
          {placarHome} <span className="text-muted-foreground">x</span> {placarAway}
        </div>
        <div className="text-left">
          <div className="font-semibold">{squadAway.nome}</div>
          <div className="text-xs text-muted-foreground">{squadAway.ownerNome}</div>
        </div>
      </div>
    </div>
  );
}
