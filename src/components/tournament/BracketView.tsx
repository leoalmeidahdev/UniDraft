import Link from "next/link";
import { GraduationCap } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { jogarPartidaTorneioAction } from "@/lib/tournament/actions";

export interface EntryVM {
  id: string;
  nome: string;
  isBot: boolean;
  souEu: boolean;
}

export interface ChaveVM {
  id: string;
  rodada: number;
  posicaoNaRodada: number;
  status: "aguardando" | "pronta" | "concluida";
  matchId: string | null;
  vencedorEntryId: string | null;
  entryHome: EntryVM | null;
  entryAway: EntryVM | null;
}

function LadoChave({ entry, venceu }: { entry: EntryVM | null; venceu: boolean }) {
  if (!entry) {
    return <div className="px-3 py-2 text-sm text-muted-foreground">A definir</div>;
  }
  return (
    <div className={cn("flex items-center justify-between gap-2 px-3 py-2 text-sm", venceu && "font-semibold")}>
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        {entry.isBot && (
          <GraduationCap
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <span className="truncate">{entry.nome}</span>
      </span>
      {entry.souEu && <Badge variant="secondary">Você</Badge>}
    </div>
  );
}

export function BracketView({ chaves }: { chaves: ChaveVM[] }) {
  const rodadas = Array.from(new Set(chaves.map((c) => c.rodada))).sort((a, b) => a - b);
  const ultimaRodada = rodadas[rodadas.length - 1];

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rodadas.map((rodada) => (
        <div key={rodada} className="flex w-64 shrink-0 flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {rodada === ultimaRodada ? "Final" : `Rodada ${rodada}`}
          </h2>
          {chaves
            .filter((c) => c.rodada === rodada)
            .sort((a, b) => a.posicaoNaRodada - b.posicaoNaRodada)
            .map((chave) => {
              const podeJogar =
                chave.status === "pronta" && Boolean(chave.entryHome?.souEu || chave.entryAway?.souEu);
              return (
                <div key={chave.id} className="overflow-hidden rounded-lg border">
                  <LadoChave entry={chave.entryHome} venceu={chave.vencedorEntryId === chave.entryHome?.id} />
                  <div className="border-t" />
                  <LadoChave entry={chave.entryAway} venceu={chave.vencedorEntryId === chave.entryAway?.id} />
                  {chave.status === "concluida" && chave.matchId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-none border-t"
                      render={<Link href={`/partida/${chave.matchId}`} />}
                    >
                      Ver partida
                    </Button>
                  )}
                  {podeJogar && (
                    <form action={jogarPartidaTorneioAction}>
                      <input type="hidden" name="tournamentMatchId" value={chave.id} />
                      <Button type="submit" size="sm" className="w-full rounded-none border-t">
                        Jogar
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
