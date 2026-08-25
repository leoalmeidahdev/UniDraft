"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { iniciarTorneioAction, type TournamentActionState } from "@/lib/tournament/actions";
import { CancelarTorneioForm } from "@/components/tournament/CancelarTorneioForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INITIAL_STATE: TournamentActionState = {};

function IniciarButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Começando..." : "Começar torneio"}
    </Button>
  );
}

export function IniciarTorneioForm({ tournamentId }: { tournamentId: string }) {
  const [state, action] = useActionState(iniciarTorneioAction, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <form action={action}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <IniciarButton />
        </form>
        <CancelarTorneioForm tournamentId={tournamentId} />
      </div>
    </div>
  );
}
