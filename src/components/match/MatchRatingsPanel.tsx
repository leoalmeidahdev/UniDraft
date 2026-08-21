import { RectangleVertical, Star, Trophy } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { POSICAO_LABEL } from "@/types/domain";
import type { PlayerRating } from "@/lib/match/ratings";

/** Faixas de nota (0-10): boa em verde, mediana em neutro, fraca em vermelho —
 * a nota em si sempre leva .num pra não "dançar" a coluna. */
function corNota(nota: number): string {
  if (nota >= 7) return "text-sucesso";
  if (nota >= 5) return "text-foreground";
  return "text-destructive";
}

function JogadorLinha({ rating, isMvp }: { rating: PlayerRating; isMvp: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
        isMvp ? "border-destaque/50 bg-destaque/10" : "bg-card"
      )}
    >
      {isMvp ? (
        <Star className="size-4 shrink-0 fill-destaque text-destaque" aria-hidden />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{rating.nome}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{POSICAO_LABEL[rating.posicao]}</span>
          {rating.gols > 0 && (
            <span>
              · {rating.gols} gol{rating.gols > 1 ? "s" : ""}
            </span>
          )}
          {rating.cartaoAmarelo && (
            <RectangleVertical className="size-3 fill-alerta text-alerta" aria-label="Cartão amarelo" />
          )}
          {rating.cartaoVermelho && (
            <RectangleVertical
              className="size-3 fill-destructive text-destructive"
              aria-label="Cartão vermelho"
            />
          )}
        </div>
      </div>
      <span className={cn("num text-base font-bold", corNota(rating.nota))}>
        {rating.nota.toFixed(1)}
      </span>
    </li>
  );
}

/** Painel de notas + melhor jogador da partida (Item 7) — presentational, sem estado
 * próprio; o pai (MatchPlaybackController) decide quando revelar (partida finalizada). */
export function MatchRatingsPanel({
  ratings,
  mvp,
  squadHomeId,
  squadAwayId,
}: {
  ratings: PlayerRating[];
  mvp: PlayerRating | null;
  squadHomeId: string;
  squadAwayId: string;
}) {
  const ratingsHome = ratings.filter((r) => r.squadId === squadHomeId);
  const ratingsAway = ratings.filter((r) => r.squadId === squadAwayId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas da partida</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mvp && (
          <div className="flex items-center gap-3 rounded-xl border border-destaque/50 bg-destaque/10 px-4 py-3">
            <Trophy className="size-6 shrink-0 text-destaque" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-muted-foreground">Melhor jogador da partida</div>
              <div className="truncate font-semibold">{mvp.nome}</div>
            </div>
            <span className="num text-xl font-bold text-destaque">{mvp.nota.toFixed(1)}</span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ol className="flex flex-col gap-2">
            {ratingsHome.map((r) => (
              <JogadorLinha key={r.alunoId} rating={r} isMvp={mvp?.alunoId === r.alunoId} />
            ))}
          </ol>
          <ol className="flex flex-col gap-2">
            {ratingsAway.map((r) => (
              <JogadorLinha key={r.alunoId} rating={r} isMvp={mvp?.alunoId === r.alunoId} />
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
