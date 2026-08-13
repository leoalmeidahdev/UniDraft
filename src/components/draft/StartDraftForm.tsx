"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { startDraftAction, type DraftActionState } from "@/lib/draft/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ModoDraft } from "@/types/domain";

const INITIAL_STATE: DraftActionState = {};

const MODOS: { valor: ModoDraft; titulo: string; descricao: string }[] = [
  {
    valor: "classico",
    titulo: "Clássico",
    descricao: "Os atributos dos colegas ficam visíveis durante o draft.",
  },
  {
    valor: "as_cegas",
    titulo: "Às Cegas",
    descricao: "Os atributos ficam ocultos até você escalar o jogador.",
  },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Sorteando..." : "Começar draft"}
    </Button>
  );
}

export function StartDraftForm() {
  const [state, formAction] = useActionState(startDraftAction, INITIAL_STATE);
  const [modo, setModo] = useState<ModoDraft>("classico");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="modo" value={modo} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {MODOS.map((m) => (
          <button
            key={m.valor}
            type="button"
            onClick={() => setModo(m.valor)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              modo === m.valor ? "border-primary bg-primary/5" : "hover:bg-muted"
            )}
          >
            <div className="font-semibold">{m.titulo}</div>
            <div className="mt-1 text-sm text-muted-foreground">{m.descricao}</div>
          </button>
        ))}
      </div>
      <SubmitButton />
    </form>
  );
}
