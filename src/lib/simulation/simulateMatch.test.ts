import { describe, expect, it } from "vitest";
import { simulateMatch, type SquadSimulado } from "@/lib/simulation/simulateMatch";
import type { PosicaoFutsal } from "@/types/domain";

function criarSquad(id: string, overallBase: number): SquadSimulado {
  const posicoes: PosicaoFutsal[] = ["GOLEIRO", "FIXO", "ALA_1", "ALA_2", "PIVO"];
  return {
    id,
    titulares: posicoes.map((posicao, i) => ({
      posicao,
      jogador: {
        id: `${id}-jogador-${i}`,
        nome: `Jogador ${id}-${i}`,
        ataque: overallBase,
        defesa: overallBase,
        tecnica: overallBase,
        velocidade: overallBase,
        fisico: overallBase,
        goleiro: posicao === "GOLEIRO" ? overallBase : 20,
      },
    })),
  };
}

describe("simulateMatch", () => {
  it("é determinístico: mesma seed e mesmos squads geram sempre o mesmo resultado", () => {
    const squadHome = criarSquad("home", 60);
    const squadAway = criarSquad("away", 55);
    const seed = 123456789n;

    const resultado1 = simulateMatch({ squadHome, squadAway, seed });
    const resultado2 = simulateMatch({ squadHome, squadAway, seed });

    expect(resultado1.placarHome).toBe(resultado2.placarHome);
    expect(resultado1.placarAway).toBe(resultado2.placarAway);
    expect(resultado1.eventos).toEqual(resultado2.eventos);
  });

  it("seeds diferentes tendem a gerar resultados diferentes", () => {
    const squadHome = criarSquad("home", 60);
    const squadAway = criarSquad("away", 55);

    const resultados = Array.from({ length: 5 }, (_, i) =>
      simulateMatch({ squadHome, squadAway, seed: BigInt(i + 1) })
    );

    const placaresUnicos = new Set(resultados.map((r) => `${r.placarHome}-${r.placarAway}`));
    expect(placaresUnicos.size).toBeGreaterThan(1);
  });

  it("o placar bate com a contagem de eventos de gol", () => {
    const squadHome = criarSquad("home", 70);
    const squadAway = criarSquad("away", 40);
    const resultado = simulateMatch({ squadHome, squadAway, seed: 42n });

    const golsHome = resultado.eventos.filter((e) => e.tipo === "gol" && e.squadId === "home").length;
    const golsAway = resultado.eventos.filter((e) => e.tipo === "gol" && e.squadId === "away").length;

    expect(resultado.placarHome).toBe(golsHome);
    expect(resultado.placarAway).toBe(golsAway);
    expect(resultado.placarHome).toBeGreaterThanOrEqual(0);
    expect(resultado.placarAway).toBeGreaterThanOrEqual(0);
  });

  it("eventos estão ordenados por minuto e offset de playback crescente", () => {
    const squadHome = criarSquad("home", 60);
    const squadAway = criarSquad("away", 60);
    const resultado = simulateMatch({ squadHome, squadAway, seed: 999n, duracaoPlaybackSeg: 90 });

    for (let i = 1; i < resultado.eventos.length; i++) {
      expect(resultado.eventos[i].minutoJogo).toBeGreaterThanOrEqual(
        resultado.eventos[i - 1].minutoJogo
      );
      expect(resultado.eventos[i].offsetPlaybackMs).toBeGreaterThanOrEqual(
        resultado.eventos[i - 1].offsetPlaybackMs
      );
      expect(resultado.eventos[i].ordem).toBe(i + 1);
    }
    expect(resultado.eventos.at(-1)?.offsetPlaybackMs).toBeLessThanOrEqual(90_000);
  });

  it("um time muito mais forte tende a vencer mais partidas em várias seeds", () => {
    const squadForte = criarSquad("forte", 90);
    const squadFraco = criarSquad("fraco", 20);

    let vitoriasForte = 0;
    const totalPartidas = 30;
    for (let i = 0; i < totalPartidas; i++) {
      const r = simulateMatch({ squadHome: squadForte, squadAway: squadFraco, seed: BigInt(i + 1) });
      if (r.placarHome > r.placarAway) vitoriasForte++;
    }

    expect(vitoriasForte).toBeGreaterThan(totalPartidas * 0.6);
  });
});
