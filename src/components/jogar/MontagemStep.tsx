"use client";

import { AlunoListRow } from "./AlunoListRow";
import { FutsalCourt, type CourtSlot } from "@/components/squad/FutsalCourt";

import {
  useState,
  useTransition,
  useActionState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, GraduationCap, Loader2, Shuffle, Swords, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlunoCard } from "./AlunoCard";
import {
  sortearSalaAction,
  trocarSalaSerieAction,
  finalizarDraftAction,
  type AlunoSala,
  type FinalizarDraftState,
  type SalaState,
} from "@/lib/squad/actions";
import { ORDEM_POSICOES, SLOTS_POR_POSICAO_JOGADOR } from "@/lib/draft/positionOrder";
import {
  ESTILO_INFO,
  FORMACAO_INFO,
  nomeTurma,
  POSICAO_LABEL,
  type EstiloTatico,
  type Formacao,
  type PosicaoFutsal,
} from "@/types/domain";

const SALA_INICIAL: SalaState = {};
const FINALIZAR_INICIAL: FinalizarDraftState = {};
const MAX_REROLLS = 2;

export interface EscolhaAluno {
  alunoId: string;
  nome: string;
  apelido: string | null;
  overall: number | null;
}

function FinalizarButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Entrando em quadra...
        </>
      ) : (
        <>
          Jogar agora
          <Swords aria-hidden="true" />
        </>
      )}
    </Button>
  );
}

/**
 * Etapa 2 do fluxo /jogar: monta o time rolando salas de aula, uma vaga por
 * vez. Todo o progresso do draft é estado efêmero de client component —
 * nada é persistido no banco até o time ficar completo e
 * finalizarDraftAction ser chamada (ver src/lib/squad/actions.ts).
 *
 * `escolhas` e `rerolls` são controlados pelo JogarWizard, não locais:
 * voltar pra etapa 1 desmonta este componente, e nem as escolhas já feitas
 * nem o limite de re-rolagens gasto podem se perder (ou ser burlados) por
 * causa disso. A sala sorteada e as salas já vistas seguem locais — role de
 * novo ao voltar, que é o comportamento esperado.
 *
 * Uma única sala por vez fica visível, e escolher um aluno sempre limpa a
 * sala e sorteia a próxima automaticamente (a menos que o time acabe de
 * ficar completo) — por isso nunca é possível escalar dois alunos da mesma
 * sala. Esse sorteio automático, assim como a primeira rolagem da vaga, não
 * gasta re-rolagem: só o clique explícito em "Outra sala" ou "Outra série"
 * gasta, até o limite de MAX_REROLLS no draft inteiro.
 */
export function MontagemStep({
  formacao,
  estilo,
  escolhas,
  setEscolhas,
  rerolls,
  setRerolls,
  onVoltar,
}: {
  formacao: Formacao;
  estilo: EstiloTatico;
  escolhas: Partial<Record<PosicaoFutsal, EscolhaAluno>>;
  setEscolhas: Dispatch<SetStateAction<Partial<Record<PosicaoFutsal, EscolhaAluno>>>>;
  rerolls: number;
  setRerolls: Dispatch<SetStateAction<number>>;
  onVoltar: () => void;
}) {
  const [sala, setSala] = useState<SalaState>(SALA_INICIAL);
  const [vistas, setVistas] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [finalizarState, finalizarAction] = useActionState(finalizarDraftAction, FINALIZAR_INICIAL);

  const vagasAbertas = ORDEM_POSICOES.filter((slot) => !escolhas[slot]);
  const completo = vagasAbertas.length === 0;
  const courtSlots: CourtSlot[] = ORDEM_POSICOES.map((slot) => ({
    posicao: slot,
    aluno: escolhas[slot]
      ? { nome: escolhas[slot]!.nome, apelido: escolhas[slot]!.apelido, overall: escolhas[slot]!.overall }
      : null,
  }));
  const alunosEscaladosIds = new Set(Object.values(escolhas).map((e) => e!.alunoId));
  const rerollsRestantes = MAX_REROLLS - rerolls;
  const rerollsLabel =
    rerollsRestantes <= 0
      ? "Sem re-rolagens"
      : rerollsRestantes === 1
        ? "1 restante"
        : `${rerollsRestantes} re-rolagens restantes`;

  function registrarSala(resultado: SalaState) {
    setSala(resultado);
    if (resultado.turma) {
      setVistas((prev) => (prev.includes(resultado.turma!.id) ? prev : [...prev, resultado.turma!.id]));
    }
  }

  function buscarSala(excluir: string[], vagas: PosicaoFutsal[]) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("excluir", excluir.join(","));
      fd.set("vagas", vagas.join(","));
      registrarSala(await sortearSalaAction(SALA_INICIAL, fd));
    });
  }

  function rolar() {
    // Só gasta re-rolagem quando já existe sala na tela (clique explícito em
    // "Outra sala"). A primeira rolagem de uma vaga é livre.
    if (sala.turma) {
      if (rerollsRestantes <= 0) return;
      setRerolls((prev) => prev + 1);
    }
    buscarSala(vistas, vagasAbertas);
  }

  function outraSerie() {
    if (!sala.turma || rerollsRestantes <= 0) return;
    setRerolls((prev) => prev + 1);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("turmaId", sala.turma!.id);
      fd.set("vagas", vagasAbertas.join(","));
      registrarSala(await trocarSalaSerieAction(SALA_INICIAL, fd));
    });
  }

  function escalar(aluno: AlunoSala) {
    const slot = SLOTS_POR_POSICAO_JOGADOR[aluno.posicao].find((s) => !escolhas[s]);
    if (!slot) return;
    const proximasEscolhas = {
      ...escolhas,
      [slot]: {
        alunoId: aluno.id,
        nome: aluno.nome,
        apelido: aluno.apelido,
        overall: aluno.overall,
      },
    };
    setEscolhas(proximasEscolhas);
    // Sempre limpa a sala ao escalar: um único jogador por sala sorteada.
    setSala(SALA_INICIAL);

    const proximasVagas = ORDEM_POSICOES.filter((s) => !proximasEscolhas[s]);
    if (proximasVagas.length === 0) {
      // Time acabou de ficar completo: não sorteia mais nada, o card de
      // finalizar assume assim que `escolhas` propagar pro pai e `completo`
      // virar true.
      return;
    }
    // Sorteio automático da próxima sala não gasta re-rolagem.
    buscarSala(vistas, proximasVagas);
  }

  function remover(slot: PosicaoFutsal) {
    setEscolhas((prev) => {
      const proximo = { ...prev };
      delete proximo[slot];
      return proximo;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onVoltar}>
          <ArrowLeft aria-hidden="true" />
          Voltar para tática
        </Button>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">{FORMACAO_INFO[formacao].apelido}</Badge>
          <Badge variant="outline">{ESTILO_INFO[estilo].label}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu time</CardTitle>
          <CardDescription>
            {completo
              ? "Todas as vagas preenchidas."
              : `Faltam ${vagasAbertas.length} de ${ORDEM_POSICOES.length} vagas.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ORDEM_POSICOES.map((slot) => {
              const escolha = escolhas[slot];
              return (
                <li
                  key={slot}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-muted-foreground">
                      {POSICAO_LABEL[slot]}
                    </div>
                    <div className="truncate text-sm font-semibold">
                      {escolha ? escolha.nome : "Vaga aberta"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {escolha?.overall != null && (
                      <span className="num text-sm font-bold text-destaque">
                        {escolha.overall}
                      </span>
                    )}
                    {escolha && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${escolha.nome} da vaga ${POSICAO_LABEL[slot]}`}
                        onClick={() => remover(slot)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {!completo && (
        <Card>
          <CardHeader>
            <CardTitle>Sala</CardTitle>
            <CardDescription>
              {sala.turma
                ? nomeTurma(sala.turma)
                : "Role uma sala pra ver os alunos disponíveis."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={rolar}
                  disabled={isPending || (!!sala.turma && rerollsRestantes <= 0)}>
                  <Shuffle aria-hidden="true" />
                  {sala.turma ? "Outra sala" : "Rolar"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={outraSerie}
                  disabled={isPending || !sala.turma || rerollsRestantes <= 0}>
                  <GraduationCap aria-hidden="true" />
                  Outra série
                </Button>
              </div>
              <Badge variant={rerollsRestantes <= 0 ? "secondary" : "outline"} className="num shrink-0">
                {rerollsLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Outra série troca a série mantendo a letra da sala — 2º J vira 1º J ou 3º J.
            </p>
            {sala.error && (
              <Alert variant="destructive"><AlertDescription>{sala.error}</AlertDescription></Alert>
            )}

            {/* Lista à esquerda, quadra à direita — como no 7a0 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
              <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1 lg:max-h-none">
                {isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                  ))
                ) : sala.alunos && sala.alunos.length > 0 ? (
                  sala.alunos.map((aluno) => (
                    <AlunoListRow
                      key={aluno.id}
                      aluno={aluno}
                      podeEscalar={SLOTS_POR_POSICAO_JOGADOR[aluno.posicao].some((s) => !escolhas[s])}
                      jaEscalado={alunosEscaladosIds.has(aluno.id)}
                      onEscalar={() => escalar(aluno)}
                    />
                  ))
                ) : sala.turma ? (
                  <p className="text-sm text-muted-foreground">
                    Essa sala não tem alunos com posição cadastrada. Role outra.
                  </p>
                ) : null}
              </div>

              <FutsalCourt slots={courtSlots} formacao={formacao} />
            </div>
          </CardContent>
        </Card>
      )}

      {completo && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>Time completo</CardTitle>
            <CardDescription>
              Uma turma da escola será sorteada como adversária. Entre em quadra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={finalizarAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <input type="hidden" name="formacao" value={formacao} />
              <input type="hidden" name="estilo" value={estilo} />
              {ORDEM_POSICOES.map((slot) => (
                <input
                  key={slot}
                  type="hidden"
                  name={`aluno_${slot}`}
                  value={escolhas[slot]?.alunoId ?? ""}
                />
              ))}
              <FinalizarButton />
            </form>
            {finalizarState.error && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>{finalizarState.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
