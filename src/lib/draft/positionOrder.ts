import { POSICOES_JOGADOR, type PosicaoFutsal, type PosicaoJogador } from "@/types/domain";

/** As 5 vagas de um squad. A ordem de preenchimento não é mais fixa — só define
 * a ordem de exibição (ex.: na quadra do draft e em /meu-time). */
export const ORDEM_POSICOES: readonly PosicaoFutsal[] = [
  "GOLEIRO",
  "FIXO",
  "ALA_1",
  "ALA_2",
  "PIVO",
];

/** Quais vagas do squad um jogador de cada posição natural pode ocupar.
 * ALA cobre as duas vagas de ala — o aluno entra na que estiver aberta. */
export const SLOTS_POR_POSICAO_JOGADOR: Record<PosicaoJogador, PosicaoFutsal[]> = {
  GOLEIRO: ["GOLEIRO"],
  FIXO: ["FIXO"],
  ALA: ["ALA_1", "ALA_2"],
  PIVO: ["PIVO"],
};

export function posicoesAbertas(
  posicoesPreenchidas: readonly PosicaoFutsal[]
): PosicaoFutsal[] {
  return ORDEM_POSICOES.filter((p) => !posicoesPreenchidas.includes(p));
}

/** Quais posições de jogador (Goleiro/Fixo/Ala/Pivô) ainda têm alguma vaga
 * livre — usado só pra exibição (ex.: "vagas em aberto: Ala, Pivô"). */
export function posicoesJogadorAbertas(
  posicoesPreenchidas: readonly PosicaoFutsal[]
): PosicaoJogador[] {
  return POSICOES_JOGADOR.filter((pj) =>
    SLOTS_POR_POSICAO_JOGADOR[pj].some((slot) => !posicoesPreenchidas.includes(slot))
  );
}

/** Vaga do squad que esse aluno pode preencher agora, ou null se ele não tem
 * posição definida ou todas as vagas compatíveis com ela já estão ocupadas. */
export function slotDisponivelParaAluno(
  posicaoJogador: PosicaoJogador | null,
  posicoesPreenchidas: readonly PosicaoFutsal[]
): PosicaoFutsal | null {
  if (!posicaoJogador) return null;
  const candidatas = SLOTS_POR_POSICAO_JOGADOR[posicaoJogador];
  return candidatas.find((slot) => !posicoesPreenchidas.includes(slot)) ?? null;
}
