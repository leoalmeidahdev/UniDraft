"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAlunoAction, updateAlunoAction, type AdminActionState } from "@/lib/admin/actions";
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
import { nomeTurma, POSICOES_JOGADOR, POSICAO_JOGADOR_LABEL, type PosicaoJogador, type SerieEnsino } from "@/types/domain";

const INITIAL_STATE: AdminActionState = {};

const CAMPOS_ATRIBUTOS = [
  { name: "ataque", label: "Ataque" },
  { name: "defesa", label: "Defesa" },
  { name: "tecnica", label: "Técnica" },
  { name: "velocidade", label: "Velocidade" },
  { name: "fisico", label: "Físico" },
  { name: "goleiro", label: "Goleiro" },
] as const;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function AlunoForm({
  turmas,
  aluno,
  turmaIdPadrao,
}: {
  turmas: { id: string; anoLetivo: number; serie: SerieEnsino; letra: string }[];
  aluno?: {
    id: string;
    turmaId: string;
    nome: string;
    apelido: string | null;
    ataque: number;
    defesa: number;
    tecnica: number;
    velocidade: number;
    fisico: number;
    goleiro: number;
    posicao: PosicaoJogador | null;
    ativo: boolean;
  };
  turmaIdPadrao?: string;
}) {
  const action = aluno ? updateAlunoAction : createAlunoAction;
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      {aluno && <input type="hidden" name="alunoId" value={aluno.id} />}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="turmaId">Turma</Label>
        <Select name="turmaId" defaultValue={aluno?.turmaId ?? turmaIdPadrao}>
          <SelectTrigger id="turmaId" className="w-full">
            <SelectValue placeholder="Selecione a turma" />
          </SelectTrigger>
          <SelectContent>
            {turmas.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {nomeTurma(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" defaultValue={aluno?.nome} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apelido">Apelido (opcional)</Label>
        <Input id="apelido" name="apelido" defaultValue={aluno?.apelido ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="posicao">Posição</Label>
        <Select name="posicao" defaultValue={aluno?.posicao ?? undefined}>
          <SelectTrigger id="posicao" className="w-full">
            <SelectValue placeholder="Selecione a posição" />
          </SelectTrigger>
          <SelectContent>
            {POSICOES_JOGADOR.map((p) => (
              <SelectItem key={p} value={p}>
                {POSICAO_JOGADOR_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define em qual vaga do time esse aluno pode entrar no draft.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {CAMPOS_ATRIBUTOS.map((campo) => (
          <div key={campo.name} className="flex flex-col gap-1.5">
            <Label htmlFor={campo.name}>{campo.label}</Label>
            <Input
              id={campo.name}
              name={campo.name}
              type="number"
              min={0}
              max={99}
              defaultValue={aluno?.[campo.name] ?? (campo.name === "goleiro" ? 20 : 50)}
              required
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          value="true"
          defaultChecked={aluno ? aluno.ativo : true}
        />
        Ativo (aparece no sorteio do draft)
      </label>

      <SubmitButton label={aluno ? "Salvar alterações" : "Cadastrar aluno"} />
    </form>
  );
}
