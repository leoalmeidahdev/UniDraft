"use client";

import { useEffect, useState } from "react";
import { LiveScoreboard } from "@/components/match/LiveScoreboard";
import { EventTimeline, type EventoTimeline } from "@/components/match/EventTimeline";

const DURACAO_JOGO_MIN = 40;

export interface EventoPlayback extends EventoTimeline {
  offsetPlaybackMs: number;
}

export interface MatchPlaybackData {
  iniciadaEmISO: string;
  duracaoPlaybackSeg: number;
  squadHome: { id: string; nome: string; ownerNome: string };
  squadAway: { id: string; nome: string; ownerNome: string };
  placarFinalHome: number;
  placarFinalAway: number;
  eventos: EventoPlayback[];
}

/**
 * Não depende de WebSocket: a partida inteira já foi simulada e gravada no servidor.
 * Cada cliente (dono do time da casa e do visitante, ou o dono e o bot) calcula
 * localmente `agora - iniciadaEm` e revela os eventos cujo offsetPlaybackMs já passou —
 * como os dois usam a mesma âncora `iniciadaEm`, o playback fica sincronizado entre eles.
 */
export function MatchPlaybackController({ data }: { data: MatchPlaybackData }) {
  const iniciadaEmMs = new Date(data.iniciadaEmISO).getTime();
  const duracaoMs = data.duracaoPlaybackSeg * 1000;

  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - iniciadaEmMs);

  useEffect(() => {
    if (elapsedMs >= duracaoMs) return;
    const intervalo = setInterval(() => {
      setElapsedMs(Date.now() - iniciadaEmMs);
    }, 500);
    return () => clearInterval(intervalo);
  }, [iniciadaEmMs, duracaoMs, elapsedMs]);

  const finalizado = elapsedMs >= duracaoMs;
  const elapsedClamped = Math.min(elapsedMs, duracaoMs);

  const eventosRevelados = finalizado
    ? data.eventos
    : data.eventos.filter((e) => e.offsetPlaybackMs <= elapsedClamped);

  const placarHome = finalizado
    ? data.placarFinalHome
    : eventosRevelados.filter((e) => e.tipo === "gol" && e.squadId === data.squadHome.id).length;
  const placarAway = finalizado
    ? data.placarFinalAway
    : eventosRevelados.filter((e) => e.tipo === "gol" && e.squadId === data.squadAway.id).length;

  const minutoAtual = Math.min(
    DURACAO_JOGO_MIN,
    Math.floor((elapsedClamped / duracaoMs) * DURACAO_JOGO_MIN)
  );

  return (
    <div className="flex flex-col gap-6">
      <LiveScoreboard
        squadHome={data.squadHome}
        squadAway={data.squadAway}
        placarHome={placarHome}
        placarAway={placarAway}
        minutoAtual={minutoAtual}
        finalizado={finalizado}
      />
      <EventTimeline eventos={eventosRevelados} squadHomeId={data.squadHome.id} />
    </div>
  );
}
