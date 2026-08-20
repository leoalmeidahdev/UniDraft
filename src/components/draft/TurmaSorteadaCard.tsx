import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSICAO_JOGADOR_LABEL, nomeTurma, type PosicaoJogador, type SerieEnsino } from "@/types/domain";

export function TurmaSorteadaCard({
  turma,
  posicoesJogadorAbertas,
}: {
  turma: { anoLetivo: number; serie: SerieEnsino; letra: string };
  posicoesJogadorAbertas: PosicaoJogador[];
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-xl">Turma sorteada: {nomeTurma(turma)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          Escolha qualquer colega dessa turma — ele entra automaticamente na
          vaga da posição dele, se ainda estiver aberta.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span>Vagas em aberto:</span>
          {posicoesJogadorAbertas.map((p) => (
            <Badge key={p} variant="secondary">
              {POSICAO_JOGADOR_LABEL[p]}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
