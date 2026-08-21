"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaticaStep } from "./TaticaStep";
import { MontagemStep } from "./MontagemStep";
import {
  ESTILO_PADRAO,
  FORMACAO_PADRAO,
  type EstiloTatico,
  type Formacao,
  type PosicaoFutsal,
} from "@/types/domain";
import type { EscolhaAluno } from "./MontagemStep";

const ETAPAS = [
  { numero: 1, label: "Tática" },
  { numero: 2, label: "Montar o time" },
] as const;

/**
 * Orquestra as duas etapas de /jogar: tática (formação + estilo) e montagem
 * do time (draft manual rolando salas). Tática, escolhas e o contador de
 * re-rolagens vivem aqui, não nas etapas, porque trocar de etapa desmonta o
 * componente da outra — se fossem estado local da etapa 2, clicar em
 * "Voltar para tática" apagaria as vagas já preenchidas e zeraria o limite
 * de re-rolagens (um jeito trivial de burlar a regra de 2 no draft
 * inteiro).
 */
export function JogarWizard() {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [formacao, setFormacao] = useState<Formacao>(FORMACAO_PADRAO);
  const [estilo, setEstilo] = useState<EstiloTatico>(ESTILO_PADRAO);
  const [escolhas, setEscolhas] = useState<Partial<Record<PosicaoFutsal, EscolhaAluno>>>({});
  const [rerolls, setRerolls] = useState(0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Jogar agora</h1>
        <p className="text-sm text-muted-foreground">
          Escolha sua tática e monte o time sorteando salas de aula da escola.
        </p>
      </div>

      <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="Etapas">
        {ETAPAS.map((e, i) => (
          <li key={e.numero} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-6 bg-border sm:w-10" aria-hidden="true" />}
            <span
              className={cn(
                "flex items-center gap-1.5 font-medium",
                etapa === e.numero ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={etapa === e.numero ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  etapa === e.numero
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                )}
              >
                {e.numero}
              </span>
              <span className="hidden sm:inline">{e.label}</span>
            </span>
          </li>
        ))}
      </ol>

      {etapa === 1 ? (
        <TaticaStep
          formacao={formacao}
          estilo={estilo}
          onFormacaoChange={setFormacao}
          onEstiloChange={setEstilo}
          onContinuar={() => setEtapa(2)}
        />
      ) : (
        <MontagemStep
          formacao={formacao}
          estilo={estilo}
          escolhas={escolhas}
          setEscolhas={setEscolhas}
          rerolls={rerolls}
          setRerolls={setRerolls}
          onVoltar={() => setEtapa(1)}
        />
      )}
    </div>
  );
}
