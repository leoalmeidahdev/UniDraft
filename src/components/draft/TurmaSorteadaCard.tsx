import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSICAO_LABEL, nomeTurma, type PosicaoFutsal, type SerieEnsino } from "@/types/domain";

export function TurmaSorteadaCard({
  turma,
  posicaoAlvo,
}: {
  turma: { anoLetivo: number; serie: SerieEnsino; letra: string };
  posicaoAlvo: PosicaoFutsal;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>Turma sorteada: {nomeTurma(turma)}</span>
          <Badge>{POSICAO_LABEL[posicaoAlvo]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Escolha um colega dessa turma para escalar como {POSICAO_LABEL[posicaoAlvo]}.
      </CardContent>
    </Card>
  );
}
