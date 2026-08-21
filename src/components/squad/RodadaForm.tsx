"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { SquadActionState } from "@/lib/squad/actions";
import { Button, type buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VariantProps } from "class-variance-authority";

const INITIAL_STATE: SquadActionState = {};

function SubmitButton({
  label,
  pendingLabel,
  size,
  variant,
}: {
  label: string;
  pendingLabel: string;
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} variant={variant} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * Dispara uma rodada rápida (iniciarRodadaAction/novaRodadaAction, ver
 * src/lib/squad/actions.ts): sorteia uma turma com elenco completo e forma
 * um squad novo. Sem inputs — o form só existe pra dar useActionState
 * (erro + estado pendente) a uma server action sem argumentos do usuário.
 */
export function RodadaForm({
  action,
  label,
  pendingLabel,
  size,
  variant,
}: {
  action: (
    state: SquadActionState,
    formData: FormData
  ) => Promise<SquadActionState>;
  label: string;
  pendingLabel: string;
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton label={label} pendingLabel={pendingLabel} size={size} variant={variant} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
