"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createChallengeAction, type ChallengeActionState } from "@/lib/challenge/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { BotDificuldade, TipoDesafiado } from "@/types/domain";

const INITIAL_STATE: ChallengeActionState = {};

const DIFICULDADES: { valor: BotDificuldade; label: string }[] = [
  { valor: "facil", label: "Fácil" },
  { valor: "medio", label: "Médio" },
  { valor: "dificil", label: "Difícil" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Desafiando..." : "Desafiar"}
    </Button>
  );
}

export function ChallengeForm({
  amigos,
}: {
  amigos: { id: string; displayName: string }[];
}) {
  const [state, formAction] = useActionState(createChallengeAction, INITIAL_STATE);
  const [tipo, setTipo] = useState<TipoDesafiado>("bot");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tipo" value={tipo} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTipo("bot")}
          className={cn(
            "rounded-lg border p-4 text-left",
            tipo === "bot" ? "border-primary bg-primary/5" : "hover:bg-muted"
          )}
        >
          <div className="font-semibold">Bot</div>
          <div className="text-sm text-muted-foreground">Jogo imediato contra a máquina</div>
        </button>
        <button
          type="button"
          onClick={() => setTipo("amigo")}
          className={cn(
            "rounded-lg border p-4 text-left",
            tipo === "amigo" ? "border-primary bg-primary/5" : "hover:bg-muted"
          )}
        >
          <div className="font-semibold">Amigo</div>
          <div className="text-sm text-muted-foreground">Envia um desafio para aceitar</div>
        </button>
      </div>

      {tipo === "bot" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Dificuldade</span>
          <div className="flex gap-2">
            {DIFICULDADES.map((d) => (
              <label key={d.valor} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <input type="radio" name="botDificuldade" value={d.valor} defaultChecked={d.valor === "medio"} />
                {d.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {tipo === "amigo" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Escolha um amigo</span>
          {amigos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem amigos. Adicione alguém em /amigos primeiro.
            </p>
          ) : (
            <select
              name="challengedUserId"
              className="h-9 rounded-md border bg-background px-2 text-sm"
              required
            >
              {amigos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
