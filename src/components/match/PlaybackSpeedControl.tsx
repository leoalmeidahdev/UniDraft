"use client";

import { Gauge, SkipForward } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlaybackSpeed = 1 | 2 | 4 | "instant";

const OPCOES: { valor: PlaybackSpeed; label: string }[] = [
  { valor: 1, label: "1x" },
  { valor: 2, label: "2x" },
  { valor: 4, label: "4x" },
];

export function PlaybackSpeedControl({
  speed,
  onSpeedChange,
}: {
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <Gauge className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground">Velocidade</span>
      <div className="flex items-center gap-1" role="group" aria-label="Velocidade de reprodução">
        {OPCOES.map((opcao) => (
          <Button
            key={opcao.valor}
            type="button"
            size="sm"
            variant={speed === opcao.valor ? "default" : "outline"}
            aria-pressed={speed === opcao.valor}
            className={cn("num", speed === opcao.valor && "bg-primary text-primary-foreground")}
            onClick={() => onSpeedChange(opcao.valor)}
          >
            {opcao.label}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant={speed === "instant" ? "default" : "outline"}
        aria-pressed={speed === "instant"}
        className="ml-auto gap-1.5"
        onClick={() => onSpeedChange("instant")}
      >
        <SkipForward className="size-4" aria-hidden />
        Pular pro resultado
      </Button>
    </div>
  );
}
