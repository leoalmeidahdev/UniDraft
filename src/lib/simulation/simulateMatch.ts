import type { PosicaoFutsal, TipoEventoPartida } from "@/types/domain";
import { createRng, poissonRandom, randomInt, weightedPick, clamp } from "@/lib/simulation/rng";
import {
  forcaDefensivaTime,
  forcaOfensivaTime,
  pesoOfensivoPosicao,
  type JogadorAtributos,
  type Titular,
} from "@/lib/simulation/attributes";

const BASE_GOLS_ESPERADOS = 2.0;
const ESCALA_DIFERENCA = 20;
const LAMBDA_MIN = 0.3;
const LAMBDA_MAX = 8;
const DURACAO_JOGO_MIN = 40;

export interface JogadorSimulado extends JogadorAtributos {
  id: string;
  nome: string;
}

export interface SquadSimulado {
  id: string;
  titulares: Titular<JogadorSimulado>[];
}

export interface EventoSimulado {
  ordem: number;
  minutoJogo: number;
  offsetPlaybackMs: number;
  tipo: TipoEventoPartida;
  squadId: string | null;
  alunoId: string | null;
  descricao: string;
}

export interface ResultadoSimulacao {
  placarHome: number;
  placarAway: number;
  eventos: EventoSimulado[];
}

function descricaoEvento(
  tipo: TipoEventoPartida,
  jogadorNome?: string,
  posicao?: PosicaoFutsal
): string {
  switch (tipo) {
    case "gol":
      return `GOL! ${jogadorNome} balança as redes!`;
    case "defesa":
      return `Defesaça do goleiro!`;
    case "falta":
      return `Falta em ${jogadorNome}.`;
    case "cartao":
      return `Cartão para ${jogadorNome}.`;
    case "chance_perdida":
      return `${jogadorNome} perde uma chance incrível${posicao === "PIVO" ? " na cara do gol" : ""}.`;
    case "inicio_tempo":
      return "Bola rolando! Começa a partida.";
    case "fim_tempo":
      return "Apito final!";
  }
}

function sortearMinuto(rng: ReturnType<typeof createRng>): number {
  let minuto = randomInt(rng, 0, DURACAO_JOGO_MIN - 1);
  // leve viés para o 2º tempo (fadiga)
  if (minuto < DURACAO_JOGO_MIN / 2 && rng() < 0.18) {
    minuto += DURACAO_JOGO_MIN / 2;
  }
  return Math.min(minuto, DURACAO_JOGO_MIN - 1);
}

/**
 * Simula uma partida de futsal 5x5 de forma determinística (mesma seed = mesmo resultado).
 * Roda inteira no servidor de uma vez; o resultado é reproduzido depois no client via
 * offsetPlaybackMs, sem precisar de um servidor de jogo em tempo real.
 */
export function simulateMatch(params: {
  squadHome: SquadSimulado;
  squadAway: SquadSimulado;
  seed: bigint;
  duracaoPlaybackSeg?: number;
}): ResultadoSimulacao {
  const { squadHome, squadAway, seed, duracaoPlaybackSeg = 90 } = params;
  const rng = createRng(seed);

  const forcaOfHome = forcaOfensivaTime(squadHome.titulares);
  const forcaDefHome = forcaDefensivaTime(squadHome.titulares);
  const forcaOfAway = forcaOfensivaTime(squadAway.titulares);
  const forcaDefAway = forcaDefensivaTime(squadAway.titulares);

  const lambdaHome = clamp(
    BASE_GOLS_ESPERADOS + (forcaOfHome - forcaDefAway) / ESCALA_DIFERENCA,
    LAMBDA_MIN,
    LAMBDA_MAX
  );
  const lambdaAway = clamp(
    BASE_GOLS_ESPERADOS + (forcaOfAway - forcaDefHome) / ESCALA_DIFERENCA,
    LAMBDA_MIN,
    LAMBDA_MAX
  );

  const golsHome = poissonRandom(rng, lambdaHome);
  const golsAway = poissonRandom(rng, lambdaAway);

  type EventoBruto = Omit<EventoSimulado, "ordem" | "offsetPlaybackMs">;
  const eventosBrutos: EventoBruto[] = [];

  eventosBrutos.push({ minutoJogo: 0, tipo: "inicio_tempo", squadId: null, alunoId: null, descricao: descricaoEvento("inicio_tempo") });

  for (const [squad, gols] of [
    [squadHome, golsHome],
    [squadAway, golsAway],
  ] as const) {
    for (let i = 0; i < gols; i++) {
      const autor = weightedPick(rng, squad.titulares, (t) => pesoOfensivoPosicao(t.posicao) + 0.05);
      eventosBrutos.push({
        minutoJogo: sortearMinuto(rng),
        tipo: "gol",
        squadId: squad.id,
        alunoId: autor.jogador.id,
        descricao: descricaoEvento("gol", autor.jogador.nome),
      });
    }
  }

  const totalDecorativos = randomInt(rng, 8, 14);
  for (let i = 0; i < totalDecorativos; i++) {
    const squad = rng() < 0.5 ? squadHome : squadAway;
    const jogador = weightedPick(rng, squad.titulares, (t) => pesoOfensivoPosicao(t.posicao) + 0.2);
    const tipo: TipoEventoPartida = weightedPick(
      rng,
      ["defesa", "falta", "chance_perdida"] as const,
      () => 1
    );
    eventosBrutos.push({
      minutoJogo: sortearMinuto(rng),
      tipo,
      squadId: squad.id,
      alunoId: jogador.jogador.id,
      descricao: descricaoEvento(tipo, jogador.jogador.nome, jogador.posicao),
    });
  }

  eventosBrutos.push({ minutoJogo: DURACAO_JOGO_MIN, tipo: "fim_tempo", squadId: null, alunoId: null, descricao: descricaoEvento("fim_tempo") });

  eventosBrutos.sort((a, b) => a.minutoJogo - b.minutoJogo);

  const eventos: EventoSimulado[] = eventosBrutos.map((e, index) => ({
    ...e,
    ordem: index + 1,
    offsetPlaybackMs: Math.round((e.minutoJogo / DURACAO_JOGO_MIN) * duracaoPlaybackSeg * 1000),
  }));

  return {
    placarHome: eventos.filter((e) => e.tipo === "gol" && e.squadId === squadHome.id).length,
    placarAway: eventos.filter((e) => e.tipo === "gol" && e.squadId === squadAway.id).length,
    eventos,
  };
}
