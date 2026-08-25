"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { criarTorneioAction, type TournamentActionState } from "@/lib/tournament/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const INITIAL_STATE: TournamentActionState = {};

const TAMANHOS = [
  { valor: 8, titulo: "8 times", descricao: "3 rodadas até a final." },
  { valor: 16, titulo: "16 times", descricao: "4 rodadas até a final." },
  { valor: 32, titulo: "32 times", descricao: "5 rodadas até a final — mais vaga pra chamar a galera." },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Criando..." : "Criar torneio"}
    </Button>
  );
}

export function CriarTorneioForm() {
  const [state, formAction] = useActionState(criarTorneioAction, INITIAL_STATE);
  const [bracketSize, setBracketSize] = useState<8 | 16 | 32>(8);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="bracketSize" value={bracketSize} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div>
        <label htmlFor="nome-torneio" className="mb-1.5 block text-sm font-medium">
          Nome do seu time nessa sala
        </label>
        <Input id="nome-torneio" name="nome" placeholder="Meu Time" maxLength={40} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {TAMANHOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => setBracketSize(t.valor)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              bracketSize === t.valor ? "border-primary bg-primary/5" : "hover:bg-muted"
            )}
          >
            <div className="font-semibold">{t.titulo}</div>
            <div className="mt-1 text-sm text-muted-foreground">{t.descricao}</div>
          </button>
        ))}
      </div>
      <SubmitButton />
    </form>
  );
}
