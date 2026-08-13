"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { pickAlunoAction, type DraftActionState } from "@/lib/draft/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ModoDraft } from "@/types/domain";

const INITIAL_STATE: DraftActionState = {};

const ATRIBUTOS: { chave: "ataque" | "defesa" | "tecnica" | "velocidade" | "fisico"; label: string }[] = [
  { chave: "ataque", label: "ATA" },
  { chave: "defesa", label: "DEF" },
  { chave: "tecnica", label: "TEC" },
  { chave: "velocidade", label: "VEL" },
  { chave: "fisico", label: "FIS" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Escalando..." : "Escalar"}
    </Button>
  );
}

export function AlunoPickCard({
  aluno,
  squadId,
  draftRoundId,
  modo,
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
    overall: number | null;
  };
  squadId: string;
  draftRoundId: string;
  modo: ModoDraft;
}) {
  const [state, formAction] = useActionState(pickAlunoAction, INITIAL_STATE);
  const mostrarAtributos = modo === "classico";

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Avatar>
          <AvatarFallback>{aluno.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-base">{aluno.nome}</CardTitle>
          {aluno.apelido && (
            <p className="text-xs text-muted-foreground">&quot;{aluno.apelido}&quot;</p>
          )}
        </div>
        {mostrarAtributos && (
          <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-sm font-bold">
            {aluno.overall}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {mostrarAtributos && (
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            {ATRIBUTOS.map((a) => (
              <div key={a.chave}>
                <div className="font-semibold">{aluno[a.chave]}</div>
                <div className="text-muted-foreground">{a.label}</div>
              </div>
            ))}
          </div>
        )}
        <form action={formAction}>
          <input type="hidden" name="squadId" value={squadId} />
          <input type="hidden" name="draftRoundId" value={draftRoundId} />
          <input type="hidden" name="alunoId" value={aluno.id} />
          <SubmitButton />
        </form>
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}
