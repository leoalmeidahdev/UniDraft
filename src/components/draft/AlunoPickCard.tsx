"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { pickAlunoAction, type DraftActionState } from "@/lib/draft/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { POSICAO_JOGADOR_LABEL, type ModoDraft, type PosicaoJogador } from "@/types/domain";

const INITIAL_STATE: DraftActionState = {};

const ATRIBUTOS: { chave: "ataque" | "defesa" | "tecnica" | "velocidade" | "fisico"; label: string }[] = [
  { chave: "ataque", label: "ATA" },
  { chave: "defesa", label: "DEF" },
  { chave: "tecnica", label: "TEC" },
  { chave: "velocidade", label: "VEL" },
  { chave: "fisico", label: "FIS" },
];

function PickRowButton({
  aluno,
  mostrarAtributos,
  rating,
  elegivel,
}: {
  aluno: {
    nome: string;
    apelido: string | null;
    ataque: number;
    defesa: number;
    tecnica: number;
    velocidade: number;
    fisico: number;
  };
  mostrarAtributos: boolean;
  rating: number | null;
  elegivel: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || !elegivel}
      className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors enabled:hover:border-primary enabled:hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback>{aluno.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium leading-tight">{aluno.nome}</div>
        {aluno.apelido && (
          <div className="truncate text-xs text-muted-foreground">&quot;{aluno.apelido}&quot;</div>
        )}
      </div>
      {mostrarAtributos && (
        <div className="hidden shrink-0 grid-cols-5 gap-2 text-center text-[11px] sm:grid">
          {ATRIBUTOS.map((a) => (
            <div key={a.chave}>
              <div className="font-semibold">{aluno[a.chave]}</div>
              <div className="text-muted-foreground">{a.label}</div>
            </div>
          ))}
        </div>
      )}
      {mostrarAtributos && rating != null && (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-sm font-bold">
          {rating}
        </span>
      )}
    </button>
  );
}

export function AlunoPickCard({
  aluno,
  squadId,
  draftRoundId,
  modo,
  elegivel,
  motivoIndisponivel,
}: {
  aluno: {
    id: string;
    nome: string;
    apelido: string | null;
    ataque: number;
    defesa: number;
    tecnica: number;
    velocidade: number;
    fisico: number;
    goleiro: number;
    overall: number | null;
    posicao: PosicaoJogador | null;
  };
  squadId: string;
  draftRoundId: string;
  modo: ModoDraft;
  /** true se a posição natural do aluno tem uma vaga aberta agora */
  elegivel: boolean;
  /** por que não dá pra escalar, exibido quando !elegivel */
  motivoIndisponivel?: string;
}) {
  const [state, formAction] = useActionState(pickAlunoAction, INITIAL_STATE);
  const mostrarAtributos = modo === "classico";
  const rating = aluno.posicao === "GOLEIRO" ? aluno.goleiro : aluno.overall;

  return (
    <li>
      <div className="mb-1 flex items-center gap-1.5">
        {aluno.posicao ? (
          <Badge variant="outline" className="text-[10px]">
            {POSICAO_JOGADOR_LABEL[aluno.posicao]}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Sem posição
          </Badge>
        )}
      </div>
      <form action={formAction}>
        <input type="hidden" name="squadId" value={squadId} />
        <input type="hidden" name="draftRoundId" value={draftRoundId} />
        <input type="hidden" name="alunoId" value={aluno.id} />
        <PickRowButton
          aluno={aluno}
          mostrarAtributos={mostrarAtributos}
          rating={rating}
          elegivel={elegivel}
        />
      </form>
      {!elegivel && motivoIndisponivel && (
        <p className="mt-1 text-xs text-muted-foreground">{motivoIndisponivel}</p>
      )}
      {state.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
    </li>
  );
}
