"use client";

import { Check, UserPlus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { POSICAO_JOGADOR_LABEL, POSICAO_LABEL, type PosicaoFutsal } from "@/types/domain";
import type { AlunoSala } from "@/lib/squad/actions";

const ATRIBUTOS: {
  chave: "ataque" | "defesa" | "tecnica" | "velocidade" | "fisico";
  label: string;
  barra: string;
}[] = [
  { chave: "ataque", label: "ATA", barra: "bg-chart-1" },
  { chave: "defesa", label: "DEF", barra: "bg-chart-2" },
  { chave: "tecnica", label: "TEC", barra: "bg-chart-3" },
  { chave: "velocidade", label: "VEL", barra: "bg-chart-4" },
  { chave: "fisico", label: "FIS", barra: "bg-chart-5" },
];

/** Card de um aluno da sala sorteada, com atributos e um botão pra escalar
 * na vaga aberta compatível. Puramente controlado pelo pai (MontagemStep):
 * não sabe nada sobre o resto do draft além do que recebe via props. */
export function AlunoCard({
  aluno,
  slotsAbertosCompativeis,
  jaEscalado,
  onEscalar,
}: {
  aluno: AlunoSala;
  slotsAbertosCompativeis: PosicaoFutsal[];
  jaEscalado: boolean;
  onEscalar: () => void;
}) {
  const podeEscalar = !jaEscalado && slotsAbertosCompativeis.length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold leading-tight">{aluno.nome}</div>
          {aluno.apelido && (
            <div className="truncate text-xs text-muted-foreground">&quot;{aluno.apelido}&quot;</div>
          )}
          <Badge variant="outline" className="mt-1">
            {POSICAO_JOGADOR_LABEL[aluno.posicao]}
          </Badge>
        </div>
        {aluno.overall != null && (
          <span className="num shrink-0 text-xl font-bold text-destaque">{aluno.overall}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {ATRIBUTOS.map(({ chave, label, barra }) => (
          <div key={chave} className="flex items-center gap-2 text-[11px]">
            <span className="w-8 shrink-0 text-muted-foreground">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${barra}`}
                style={{ width: `${Math.max(0, Math.min(100, aluno[chave]))}%` }}
              />
            </div>
            <span className="num w-5 shrink-0 text-right text-muted-foreground">
              {aluno[chave]}
            </span>
          </div>
        ))}
      </div>

      {jaEscalado ? (
        <Badge variant="secondary" className="w-fit">
          <Check aria-hidden="true" />
          Já escalado
        </Badge>
      ) : podeEscalar ? (
        <Button type="button" size="sm" onClick={onEscalar}>
          <UserPlus aria-hidden="true" />
          Escalar {POSICAO_LABEL[slotsAbertosCompativeis[0]]}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Sem vaga compatível</span>
      )}
    </div>
  );
}
