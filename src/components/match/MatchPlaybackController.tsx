"use client";

import { useEffect, useState } from "react";
import { LiveScoreboard } from "@/components/match/LiveScoreboard";
import { EventTimeline, type EventoTimeline } from "@/components/match/EventTimeline";
import { PlaybackSpeedControl, type PlaybackSpeed } from "@/components/match/PlaybackSpeedControl";
import { MatchRatingsPanel } from "@/components/match/MatchRatingsPanel";
import { DURACAO_JOGO_MIN } from "@/lib/simulation/simulateMatch";
import type { PlayerRating } from "@/lib/match/ratings";

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
  placarPenaltiHome: number | null;
  placarPenaltiAway: number | null;
  eventos: EventoPlayback[];
}

/**
 * Não depende de WebSocket: a partida inteira já foi simulada e gravada no servidor.
 * Cada cliente (dono do time da casa e do visitante, ou o dono e o bot) calcula
 * localmente `agora - iniciadaEm` e revela os eventos cujo offsetPlaybackMs já passou —
 * como os dois usam a mesma âncora `iniciadaEm`, o playback fica sincronizado entre eles.
 */
export function MatchPlaybackController({
  data,
  ratings,
  mvp,
}: {
  data: MatchPlaybackData;
  /** Notas + melhor jogador (Item 7) — opcionais: só renderiza o painel quando presentes,
   * revelado apenas quando `finalizado` vira true (mesmo gate do placar/eventos revelados). */
  ratings?: PlayerRating[];
  mvp?: PlayerRating | null;
}) {
  const iniciadaEmMs = new Date(data.iniciadaEmISO).getTime();
  const duracaoMs = data.duracaoPlaybackSeg * 1000;

  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - iniciadaEmMs);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  useEffect(() => {
    if (elapsedMs >= duracaoMs || speed === "instant") return;
    const intervalo = setInterval(() => {
      setElapsedMs((prev) => Math.min(prev + 500 * speed, duracaoMs));
    }, 500);
    return () => clearInterval(intervalo);
  }, [duracaoMs, elapsedMs, speed]);

  function handleSpeedChange(novaSpeed: PlaybackSpeed) {
    setSpeed(novaSpeed);
    if (novaSpeed === "instant") setElapsedMs(duracaoMs);
  }

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

  const offsetFimTempo = data.eventos.find((e) => e.tipo === "fim_tempo")?.offsetPlaybackMs ?? duracaoMs;
  const emPenaltis = !finalizado && elapsedClamped >= offsetFimTempo;

  return (
    <div className="flex flex-col gap-6">
      <LiveScoreboard
        squadHome={data.squadHome}
        squadAway={data.squadAway}
        placarHome={placarHome}
        placarAway={placarAway}
        placarPenaltiHome={data.placarPenaltiHome}
        placarPenaltiAway={data.placarPenaltiAway}
        minutoAtual={minutoAtual}
        finalizado={finalizado}
        emPenaltis={emPenaltis}
      />
      {!finalizado && <PlaybackSpeedControl speed={speed} onSpeedChange={handleSpeedChange} />}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Linha do tempo</h2>
        <div className="overflow-x-auto">
          <EventTimeline eventos={eventosRevelados} squadHomeId={data.squadHome.id} />
        </div>
      </div>
      {finalizado && ratings && ratings.length > 0 && (
        <MatchRatingsPanel
          ratings={ratings}
          mvp={mvp ?? null}
          squadHomeId={data.squadHome.id}
          squadAwayId={data.squadAway.id}
        />
      )}
    </div>
  );
}
