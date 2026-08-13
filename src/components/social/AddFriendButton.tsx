"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendFriendRequestAction, type SocialActionState } from "@/lib/social/actions";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: SocialActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Enviando..." : "Adicionar"}
    </Button>
  );
}

export function AddFriendButton({ targetUserId }: { targetUserId: string }) {
  const [state, formAction] = useActionState(sendFriendRequestAction, INITIAL_STATE);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="targetUserId" value={targetUserId} />
        <SubmitButton />
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="text-xs text-primary">{state.success}</p>}
    </div>
  );
}
