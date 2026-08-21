import type { PosicaoFutsal, PosicaoJogador } from "@/types/domain";

/** As 5 vagas de um squad — define a ordem de exibição (ex.: na quadra e em
 * /meu-time) e é usada por src/lib/squad/formSquad.ts pra montar um squad
 * novo de uma vez. */
export const ORDEM_POSICOES: readonly PosicaoFutsal[] = [
  "GOLEIRO",
  "FIXO",
  "ALA_1",
  "ALA_2",
  "PIVO",
];

/** Quais vagas do squad um jogador de cada posição natural pode ocupar.
 * ALA cobre as duas vagas de ala. Usado por src/lib/squad/formSquad.ts pra
 * saber qual posição natural preenche cada vaga do squad. */
export const SLOTS_POR_POSICAO_JOGADOR: Record<PosicaoJogador, PosicaoFutsal[]> = {
  GOLEIRO: ["GOLEIRO"],
  FIXO: ["FIXO"],
  ALA: ["ALA_1", "ALA_2"],
  PIVO: ["PIVO"],
};

