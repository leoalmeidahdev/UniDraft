"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrarLobbyTorneioAction, type TournamentActionState } from "@/lib/tournament/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INITIAL_STATE: TournamentActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function EntrarLobbyForm() {
  const [state, formAction] = useActionState(entrarLobbyTorneioAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Input name="nome" placeholder="Nome do seu time nessa sala (opcional)" maxLength={40} />
      <div className="flex gap-2">
        <Input
          name="codigo"
          placeholder="Código da sala"
          maxLength={6}
          className="uppercase"
          required
        />
        <SubmitButton />
      </div>
    </form>
  );
}
