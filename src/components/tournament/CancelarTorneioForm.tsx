"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelarTorneioAction, type TournamentActionState } from "@/lib/tournament/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INITIAL_STATE: TournamentActionState = {};

function CancelarButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? "Cancelando..." : "Cancelar torneio"}
    </Button>
  );
}

export function CancelarTorneioForm({ tournamentId }: { tournamentId: string }) {
  const [state, action] = useActionState(cancelarTorneioAction, INITIAL_STATE);

  return (
    <div className="flex flex-col items-end gap-2">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <form action={action}>
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <CancelarButton />
      </form>
    </div>
  );
}
