import Link from "next/link";
import { redirect } from "next/navigation";
import { Shuffle, Swords, UserPlus } from "@/components/icons";
import { requirePlayerIdentity } from "@/lib/auth/guards";
import { getSquadByIdentity, getSquadFull } from "@/lib/db/queries/squads";
import { SquadFormationView } from "@/components/squad/SquadFormationView";
import { RodadaForm } from "@/components/squad/RodadaForm";
import { BotMatchForm } from "@/components/match/BotMatchForm";
import {
  iniciarRodadaAction,
  novaRodadaAction,
  trocarAnoAction,
  trocarTurmaAction,
} from "@/lib/squad/actions";
import { ORDEM_POSICOES } from "@/lib/draft/positionOrder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ESTILO_INFO,
  FORMACAO_INFO,
  nomeTurma,
  parseEstilo,
  parseFormacao,
} from "@/types/domain";

export default async function MeuTimePage() {
  const identity = await requirePlayerIdentity();
  const squadResumo = await getSquadByIdentity(identity);

  if (!squadResumo) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Montar meu time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Uma turma da escola é sorteada na hora e seu time de futsal 5x5
              já sai completo — Goleiro, Fixo, dois Alas e Pivô — com os
              melhores colegas dela em cada posição.
            </p>
            <RodadaForm
              action={iniciarRodadaAction}
              label="Jogar agora"
              pendingLabel="Sorteando turma..."
              size="lg"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // squads nascem sempre completos desde a rodada rápida (ver
  // src/lib/squad/formSquad.ts); draftConcluido continua existindo na tabela
  // pra quem lê squads antigos, mas não há mais um estado "incompleto" pra
  // redirecionar.
  const squad = await getSquadFull(squadResumo.id);
  if (!squad) {
    redirect("/meu-time");
  }

  const slots = ORDEM_POSICOES.map((posicao) => {
    const slot = squad.slots.find((s) => s.posicao === posicao);
    return {
      posicao,
      aluno: slot?.aluno
        ? {
            nome: slot.aluno.nome,
            apelido: slot.aluno.apelido,
            overall: slot.aluno.overall,
          }
        : null,
    };
  });

  // Toda vaga preenchida vem da mesma turma (invariante da rodada rápida,
  // ver src/lib/squad/formSquad.ts) — qualquer slot com aluno serve pra
  // mostrar de qual turma o time atual é.
  const turmaAtual = squad.slots.find((s) => s.aluno)?.aluno?.turma ?? null;

  const formacao = parseFormacao(squad.formacao);
  const estilo = parseEstilo(squad.estilo);
  const infoFormacao = FORMACAO_INFO[formacao];
  const infoEstilo = ESTILO_INFO[estilo];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      {/* Identidade do time em destaque: nome, turma e a tática atual. */}
      <div className="bg-marinho-gradiente flex flex-col gap-3 rounded-2xl p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{squad.nome}</h1>
          {turmaAtual && (
            <p className="text-sm text-white/70">{nomeTurma(turmaAtual)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            Formação {infoFormacao.valor} · {infoFormacao.apelido}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            Estilo {infoEstilo.label}
          </span>
        </div>
      </div>

      <SquadFormationView squadId={squad.id} slots={slots} formacao={formacao} />

      {/* Ações agrupadas por intenção: trocar de time (rodada/ano/turma) e
       * entrar em partida (CPU ou desafio) — todas as server actions
       * seguem exatamente as mesmas de antes, só a organização visual muda. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shuffle className="size-4 text-primary" aria-hidden />
              Meu time
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <RodadaForm
              action={novaRodadaAction}
              label="Nova rodada"
              pendingLabel="Sorteando..."
              variant="outline"
              size="sm"
            />
            <RodadaForm
              action={trocarAnoAction}
              label="Trocar ano"
              pendingLabel="Trocando..."
              variant="outline"
              size="sm"
            />
            <RodadaForm
              action={trocarTurmaAction}
              label="Trocar turma"
              pendingLabel="Trocando..."
              variant="outline"
              size="sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="size-4 text-primary" aria-hidden />
              Jogar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <BotMatchForm />
            {identity.kind === "user" ? (
              <Button size="sm" render={<Link href="/desafios/novo" />}>
                <UserPlus className="size-4" aria-hidden />
                Desafiar amigo
              </Button>
            ) : (
              <Link
                href="/cadastro"
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Crie uma conta para desafiar amigos
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
