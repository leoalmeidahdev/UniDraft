"use client";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";
import { POSICAO_JOGADOR_LABEL } from "@/types/domain";
import type { AlunoSala } from "@/lib/squad/actions";

/** Linha compacta de um aluno da sala, pra lista lateral estilo "7a0":
 * nome + posição + overall, clicável pra escalar direto. Sem barras de
 * atributo — quem quer o detalhe clica e vê o AlunoCard expandido
 * (mantido em telas maiores ou como alternativa, se for o caso). */
export function AlunoListRow({
  aluno,
  podeEscalar,
  jaEscalado,
  onEscalar,
}: {
  aluno: AlunoSala;
  podeEscalar: boolean;
  jaEscalado: boolean;
  onEscalar: () => void;
}) {
  const clicavel = podeEscalar && !jaEscalado;

  return (
    <button
      type="button"
      disabled={!clicavel}
      onClick={onEscalar}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
        clicavel
          ? "cursor-pointer hover:border-primary hover:bg-primary/5"
          : "cursor-default opacity-60"
      )}
    >
      <span className="w-8 shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">
        {POSICAO_JOGADOR_LABEL[aluno.posicao]}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {aluno.apelido || aluno.nome}
      </span>
      {jaEscalado ? (
        <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      ) : (
        aluno.overall != null && (
          <span className="num shrink-0 text-sm font-bold text-destaque">
            {aluno.overall}
          </span>
        )
      )}
    </button>
  );
}