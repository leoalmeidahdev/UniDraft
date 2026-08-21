import type { PosicaoFutsal } from "@/types/domain";
import { matchEvents } from "@/lib/db/schema";
import { createRng, clamp } from "@/lib/simulation/rng";

const NOTA_BASE = 6.0;
const NOTA_MIN = 0;
const NOTA_MAX = 10;

const PONTOS_GOL = 1.5;
const PONTOS_DEFESA = 0.4;
const PONTOS_CARTAO_AMARELO = -0.7;
const PONTOS_CARTAO_VERMELHO = -2.0;
const PONTOS_CHANCE_PERDIDA = -0.15;
const BONUS_VITORIA = 0.5;
const PENALIDADE_DERROTA = -0.3;

export interface PlayerRating {
  alunoId: string;
  nome: string;
  squadId: string;
  posicao: PosicaoFutsal;
  nota: number;
  gols: number;
  cartaoAmarelo: boolean;
  cartaoVermelho: boolean;
}

type MatchEventRow = typeof matchEvents.$inferSelect;

interface SquadSlotComAluno {
  posicao: PosicaoFutsal;
  aluno: { id: string; nome: string } | null;
}

interface SquadComSlots {
  id: string;
  slots: SquadSlotComAluno[];
}

/** Nota do bônus/penalidade de resultado pro dono do squadId, dado o placar da partida. */
function bonusResultado(
  squadId: string,
  squadHomeId: string,
  placarHome: number,
  placarAway: number
): number {
  if (placarHome === placarAway) return 0;
  const squadVenceu =
    (squadId === squadHomeId && placarHome > placarAway) ||
    (squadId !== squadHomeId && placarAway > placarHome);
  return squadVenceu ? BONUS_VITORIA : PENALIDADE_DERROTA;
}

/**
 * Nota (0-10, base 6.0) de cada titular dos dois squads, derivada só de `matchEvents`
 * (sem schema novo — Item 7 do plano de overhaul). Só titulares de `squadSlots` entram
 * na lista, mesmo os com zero eventos (nota = base + bônus/penalidade de resultado).
 */
export function computeRatings(params: {
  events: MatchEventRow[];
  squadHome: SquadComSlots;
  squadAway: SquadComSlots;
  placarHome: number;
  placarAway: number;
}): PlayerRating[] {
  const { events, squadHome, squadAway, placarHome, placarAway } = params;

  const ratings: PlayerRating[] = [];

  for (const squad of [squadHome, squadAway]) {
    const bonusTime = bonusResultado(squad.id, squadHome.id, placarHome, placarAway);

    for (const slot of squad.slots) {
      if (!slot.aluno) continue;
      const alunoId = slot.aluno.id;
      const eventosDoJogador = events.filter(
        (e) => e.alunoId === alunoId && e.squadId === squad.id
      );

      const gols = eventosDoJogador.filter((e) => e.tipo === "gol").length;
      const defesas = eventosDoJogador.filter((e) => e.tipo === "defesa").length;
      const amarelos = eventosDoJogador.filter((e) => e.tipo === "cartao").length;
      const vermelhos = eventosDoJogador.filter((e) => e.tipo === "cartao_vermelho").length;
      const chancesPerdidas = eventosDoJogador.filter((e) => e.tipo === "chance_perdida").length;

      const notaBruta =
        NOTA_BASE +
        gols * PONTOS_GOL +
        defesas * PONTOS_DEFESA +
        amarelos * PONTOS_CARTAO_AMARELO +
        vermelhos * PONTOS_CARTAO_VERMELHO +
        chancesPerdidas * PONTOS_CHANCE_PERDIDA +
        bonusTime;

      ratings.push({
        alunoId,
        nome: slot.aluno.nome,
        squadId: squad.id,
        posicao: slot.posicao,
        nota: clamp(notaBruta, NOTA_MIN, NOTA_MAX),
        gols,
        cartaoAmarelo: amarelos > 0,
        cartaoVermelho: vermelhos > 0,
      });
    }
  }

  return ratings;
}

/**
 * Melhor jogador da partida: maior nota, empate por gols, e se ainda empatado um
 * desempate determinístico via `createRng(seed)` (mesma seed da partida) — mantém a
 * escolha estável entre re-renders/re-fetches, ao contrário de `Math.random()`.
 */
export function pickMvp(ratings: PlayerRating[], seed: bigint): PlayerRating | null {
  if (ratings.length === 0) return null;

  const maiorNota = Math.max(...ratings.map((r) => r.nota));
  const candidatosPorNota = ratings.filter((r) => r.nota === maiorNota);
  if (candidatosPorNota.length === 1) return candidatosPorNota[0];

  const maisGols = Math.max(...candidatosPorNota.map((r) => r.gols));
  const candidatosPorGols = candidatosPorNota.filter((r) => r.gols === maisGols);
  if (candidatosPorGols.length === 1) return candidatosPorGols[0];

  const rng = createRng(seed);
  const indice = Math.min(
    Math.floor(rng() * candidatosPorGols.length),
    candidatosPorGols.length - 1
  );
  return candidatosPorGols[indice];
}
