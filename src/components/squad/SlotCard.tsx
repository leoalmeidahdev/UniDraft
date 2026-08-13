"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { swapSlotsAction, type SquadActionState } from "@/lib/squad/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { POSICAO_LABEL, type PosicaoFutsal } from "@/types/domain";

const INITIAL_STATE: SquadActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Trocando..." : "Trocar"}
    </Button>
  );
}

export function SlotCard({
  squadId,
  posicao,
  aluno,
  outrasPosicoesPreenchidas,
}: {
  squadId: string;
  posicao: PosicaoFutsal;
  aluno: {
    nome: string;
    apelido: string | null;
    overall: number | null;
  } | null;
  outrasPosicoesPreenchidas: PosicaoFutsal[];
}) {
  const [state, formAction] = useActionState(swapSlotsAction, INITIAL_STATE);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {POSICAO_LABEL[posicao]}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {aluno ? (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{aluno.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{aluno.nome}</div>
              {aluno.apelido && (
                <div className="text-xs text-muted-foreground">&quot;{aluno.apelido}&quot;</div>
              )}
            </div>
            {aluno.overall != null && (
              <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-sm font-bold">
                {aluno.overall}
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Vaga aberta</div>
        )}

        {aluno && outrasPosicoesPreenchidas.length > 0 && (
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="squadId" value={squadId} />
            <input type="hidden" name="posicaoA" value={posicao} />
            <select
              name="posicaoB"
              className="h-8 flex-1 rounded-md border bg-background px-2 text-sm"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Trocar com...
              </option>
              {outrasPosicoesPreenchidas.map((p) => (
                <option key={p} value={p}>
                  {POSICAO_LABEL[p]}
                </option>
              ))}
            </select>
            <SubmitButton />
          </form>
        )}
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}
