"use client";

import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaticaDiagram } from "./TaticaDiagram";
import { cn } from "@/lib/utils";
import {
  ESTILOS,
  ESTILO_INFO,
  FORMACOES,
  FORMACAO_INFO,
  type EstiloTatico,
  type Formacao,
} from "@/types/domain";

/**
 * Etapa 1 do fluxo /jogar: escolher formação e estilo. Estado controlado
 * pelo pai (JogarWizard) — essa etapa é só apresentação + seleção, não tem
 * estado próprio, pra sobreviver a ida-e-volta com a etapa 2 sem perder a
 * escolha.
 */
export function TaticaStep({
  formacao,
  estilo,
  onFormacaoChange,
  onEstiloChange,
  onContinuar,
}: {
  formacao: Formacao;
  estilo: EstiloTatico;
  onFormacaoChange: (formacao: Formacao) => void;
  onEstiloChange: (estilo: EstiloTatico) => void;
  onContinuar: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Formação</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Como os quatro jogadores de linha se posicionam em quadra. O goleiro fica sempre no
          gol, em qualquer formação — muda só o peso de cada vaga no ataque e na defesa.
        </p>
        <div
          role="radiogroup"
          aria-label="Formação"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {FORMACOES.map((f) => {
            const info = FORMACAO_INFO[f];
            const ativo = f === formacao;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onFormacaoChange(f)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors sm:p-4",
                  ativo
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <TaticaDiagram formacao={f} className="w-20 shrink-0 sm:w-24" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{info.apelido}</span>
                    <Badge variant="outline" className="num">
                      {f}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{info.descricao}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Estilo</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sua postura tática mexe direto no placar: ofensivo cria mais chances de gol, mas
          também sofre mais; defensivo é o oposto.
        </p>
        <div
          role="radiogroup"
          aria-label="Estilo"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {ESTILOS.map((e) => {
            const info = ESTILO_INFO[e];
            const ativo = e === estilo;
            return (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onEstiloChange(e)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                  ativo
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <span className="font-semibold">{info.label}</span>
                <p className="text-xs text-muted-foreground">{info.descricao}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={onContinuar}>
          Continuar para montagem
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
