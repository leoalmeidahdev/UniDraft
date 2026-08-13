"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTurmaAction, type AdminActionState } from "@/lib/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERIES_ENSINO, SERIE_LABEL, LETRAS_TURMA } from "@/types/domain";

const INITIAL_STATE: AdminActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar turma"}
    </Button>
  );
}

export function TurmaForm() {
  const [state, formAction] = useActionState(createTurmaAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="anoLetivo">Ano letivo</Label>
        <Input
          id="anoLetivo"
          name="anoLetivo"
          type="number"
          defaultValue={new Date().getFullYear()}
          className="w-28"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="serie">Série</Label>
        <Select name="serie" defaultValue="1">
          <SelectTrigger id="serie" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERIES_ENSINO.map((s) => (
              <SelectItem key={s} value={s}>
                {SERIE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="letra">Letra</Label>
        <Select name="letra" defaultValue="A">
          <SelectTrigger id="letra" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LETRAS_TURMA.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SubmitButton />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">{state.success}</p>}
    </form>
  );
}
