"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { jogarContraBotAction, type MatchActionState } from "@/lib/match/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INITIAL_STATE: MatchActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Simulando..." : "Jogar contra uma turma sorteada"}
    </Button>
  );
}

/**
 * Dispara jogarContraBotAction (src/lib/match/actions.ts) — partida imediata
 * contra o bot, sem exigir conta. Visível pra visitante e usuário logado por
 * igual (só o desafio de amigo continua exigindo conta). O adversário é
 * sempre uma turma real da escola sorteada na hora, sem seleção de
 * dificuldade.
 */
export function BotMatchForm() {
  const [state, formAction] = useActionState(jogarContraBotAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
