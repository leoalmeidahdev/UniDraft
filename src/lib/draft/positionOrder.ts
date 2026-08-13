import type { PosicaoFutsal } from "@/types/domain";

/** Ordem fixa de preenchimento das 5 posições ao longo das rodadas do draft. */
export const ORDEM_POSICOES: readonly PosicaoFutsal[] = [
  "GOLEIRO",
  "FIXO",
  "ALA_1",
  "ALA_2",
  "PIVO",
];

export function posicaoDaRodada(rodadaNumero: number): PosicaoFutsal {
  const posicao = ORDEM_POSICOES[rodadaNumero - 1];
  if (!posicao) {
    throw new Error(`Rodada inválida: ${rodadaNumero}`);
  }
  return posicao;
}
