"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importCsvAction, type ImportCsvState } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_STATE: ImportCsvState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Importando..." : "Importar"}
    </Button>
  );
}

export function CsvImportForm() {
  const [state, formAction] = useActionState(importCsvAction, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="csv">Arquivo CSV</Label>
          <Input id="csv" name="csv" type="file" accept=".csv,text/csv" required />
        </div>
        <p className="text-xs text-muted-foreground">
          Colunas esperadas: ano_letivo, serie, letra, nome_aluno, apelido,
          ataque, defesa, tecnica, velocidade, fisico, goleiro. Atributos em
          branco viram 50 (20 no goleiro) e o aluno é marcado para revisão.
        </p>
        <div>
          <SubmitButton />
        </div>
      </form>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.resumo && (
        <Alert>
          <AlertDescription>
            {state.resumo.turmasCriadas} turma(s) criada(s), {state.resumo.alunosCriados}{" "}
            aluno(s) importado(s)
            {state.resumo.alunosParaRevisar > 0
              ? `, ${state.resumo.alunosParaRevisar} marcados para revisão`
              : ""}
            .
          </AlertDescription>
        </Alert>
      )}

      {state.linhasComErro && state.linhasComErro.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="mb-1 font-medium">
              {state.linhasComErro.length} linha(s) ignorada(s):
            </p>
            <ul className="list-inside list-disc">
              {state.linhasComErro.slice(0, 20).map((e, i) => (
                <li key={i}>
                  linha {e.linha}: {e.mensagem}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
