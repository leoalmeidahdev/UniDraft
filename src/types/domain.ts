export const POSICOES_FUTSAL = [
  "GOLEIRO",
  "FIXO",
  "ALA_1",
  "ALA_2",
  "PIVO",
] as const;
export type PosicaoFutsal = (typeof POSICOES_FUTSAL)[number];

export const POSICAO_LABEL: Record<PosicaoFutsal, string> = {
  GOLEIRO: "Goleiro",
  FIXO: "Fixo",
  ALA_1: "Ala",
  ALA_2: "Ala",
  PIVO: "Pivô",
};

/** Posição natural do jogador (atributo do aluno) — distinta da vaga do squad (PosicaoFutsal),
 * já que ALA_1 e ALA_2 são duas vagas para o mesmo tipo de jogador ("Ala"). */
export const POSICOES_JOGADOR = ["GOLEIRO", "FIXO", "ALA", "PIVO"] as const;
export type PosicaoJogador = (typeof POSICOES_JOGADOR)[number];

export const POSICAO_JOGADOR_LABEL: Record<PosicaoJogador, string> = {
  GOLEIRO: "Goleiro",
  FIXO: "Fixo",
  ALA: "Ala",
  PIVO: "Pivô",
};

export const SERIES_ENSINO = ["1", "2", "3"] as const;
export type SerieEnsino = (typeof SERIES_ENSINO)[number];

export const SERIE_LABEL: Record<SerieEnsino, string> = {
  "1": "1º ano",
  "2": "2º ano",
  "3": "3º ano",
};

export const LETRAS_TURMA = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;
export type LetraTurma = (typeof LETRAS_TURMA)[number];

export type ModoDraft = "classico" | "as_cegas";
export type StatusDraft = "em_andamento" | "concluido" | "abandonado";
export type StatusAmizade = "pendente" | "aceito" | "recusado" | "bloqueado";
export type TipoDesafiado = "amigo" | "bot";
export type StatusDesafio =
  | "pendente"
  | "aceito"
  | "recusado"
  | "cancelado"
  | "em_andamento"
  | "finalizado";
export type StatusPartida = "agendada" | "ao_vivo" | "finalizada";
export type TipoEventoPartida =
  | "gol"
  | "defesa"
  | "falta"
  | "cartao"
  | "inicio_tempo"
  | "fim_tempo"
  | "chance_perdida";

export type BotDificuldade = "facil" | "medio" | "dificil";

export interface AtributosAluno {
  ataque: number;
  defesa: number;
  tecnica: number;
  velocidade: number;
  fisico: number;
  goleiro: number;
}

export function nomeTurma(turma: {
  anoLetivo: number;
  serie: SerieEnsino;
  letra: string;
}): string {
  return `${turma.anoLetivo} - ${SERIE_LABEL[turma.serie]} ${turma.letra}`;
}
