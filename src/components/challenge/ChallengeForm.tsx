"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createChallengeAction, type ChallengeActionState } from "@/lib/challenge/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INITIAL_STATE: ChallengeActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Desafiando..." : "Desafiar"}
    </Button>
  );
}

/** Desafio de amigo — partida vs bot agora vive em /meu-time (jogarContraBotAction,
 * ver src/lib/match/actions.ts), sem passar pela tabela challenges. */
export function ChallengeForm({
  amigos,
}: {
  amigos: { id: string; displayName: string }[];
}) {
  const [state, formAction] = useActionState(createChallengeAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tipo" value="amigo" />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

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

      <SubmitButton />
    </form>
  );
}
