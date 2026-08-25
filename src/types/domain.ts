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
  | "cartao_vermelho"
  | "falta_direta"
  | "inicio_tempo"
  | "fim_tempo"
  | "intervalo"
  | "chance_perdida"
  | "disputa_penaltis"
  | "penalti_convertido"
  | "penalti_perdido";

// ==========================================================
// TÁTICA: FORMAÇÃO E ESTILO
// ==========================================================
/** Formações reais de futsal. A notação omite o goleiro — "3-1" são os 4
 * jogadores de linha. O time sempre escala as mesmas 5 vagas
 * (POSICOES_FUTSAL); a formação muda como cada vaga é aproveitada em campo,
 * não quem entra. */
export const FORMACOES = ["1-2-1", "2-2", "3-1", "4-0"] as const;
export type Formacao = (typeof FORMACOES)[number];

export interface InfoFormacao {
  valor: Formacao;
  apelido: string;
  descricao: string;
  /** Peso de cada vaga na força ofensiva/defensiva do time. 1 = neutro.
   * O goleiro nunca muda: defende igual em qualquer formação. */
  pesoAtaque: Record<PosicaoFutsal, number>;
  pesoDefesa: Record<PosicaoFutsal, number>;
}

export const FORMACAO_INFO: Record<Formacao, InfoFormacao> = {
  "1-2-1": {
    valor: "1-2-1",
    apelido: "Diamante",
    descricao:
      "A formação mais comum do futsal: um fixo, dois alas abertos e um pivô de referência. Equilibra saída de bola e finalização.",
    pesoAtaque: { GOLEIRO: 1, FIXO: 0.9, ALA_1: 1.05, ALA_2: 1.05, PIVO: 1.15 },
    pesoDefesa: { GOLEIRO: 1, FIXO: 1.15, ALA_1: 1, ALA_2: 1, PIVO: 0.85 },
  },
  "2-2": {
    valor: "2-2",
    apelido: "Quadrado",
    descricao:
      "Dois de marcação e dois de ataque, em linhas paralelas. Simples de manter e difícil de desorganizar, mas cria menos triangulações.",
    pesoAtaque: { GOLEIRO: 1, FIXO: 0.95, ALA_1: 1.1, ALA_2: 1.1, PIVO: 1 },
    pesoDefesa: { GOLEIRO: 1, FIXO: 1.1, ALA_1: 1.05, ALA_2: 1.05, PIVO: 0.9 },
  },
  "3-1": {
    valor: "3-1",
    apelido: "Pinha",
    descricao:
      "Três jogadores de contenção e um pivô isolado na frente. Fecha o meio e vive de contra-ataque no pivô.",
    pesoAtaque: { GOLEIRO: 1, FIXO: 0.8, ALA_1: 0.9, ALA_2: 0.9, PIVO: 1.3 },
    pesoDefesa: { GOLEIRO: 1, FIXO: 1.25, ALA_1: 1.15, ALA_2: 1.15, PIVO: 0.7 },
  },
  "4-0": {
    valor: "4-0",
    apelido: "Sem pivô",
    descricao:
      "Nenhum jogador fixo na frente: os quatro de linha rodam o tempo todo. Muita posse e mobilidade, mas deixa o time exposto quando perde a bola.",
    pesoAtaque: { GOLEIRO: 1, FIXO: 1.05, ALA_1: 1.15, ALA_2: 1.15, PIVO: 1.05 },
    pesoDefesa: { GOLEIRO: 1, FIXO: 1, ALA_1: 0.9, ALA_2: 0.9, PIVO: 0.8 },
  },
};

/** Postura do time dentro da formação escolhida. Mexe no volume de chances
 * criadas e sofridas, não em quem joga. */
export const ESTILOS = ["defensivo", "equilibrado", "ofensivo"] as const;
export type EstiloTatico = (typeof ESTILOS)[number];

export interface InfoEstilo {
  valor: EstiloTatico;
  label: string;
  descricao: string;
  /** Multiplicadores aplicados à força do próprio time na simulação. */
  multAtaque: number;
  multDefesa: number;
}

export const ESTILO_INFO: Record<EstiloTatico, InfoEstilo> = {
  defensivo: {
    valor: "defensivo",
    label: "Defensivo",
    descricao: "Time recuado. Cria menos, sofre menos.",
    multAtaque: 0.85,
    multDefesa: 1.15,
  },
  equilibrado: {
    valor: "equilibrado",
    label: "Equilibrado",
    descricao: "Sem exageros dos dois lados.",
    multAtaque: 1,
    multDefesa: 1,
  },
  ofensivo: {
    valor: "ofensivo",
    label: "Ofensivo",
    descricao: "Time adiantado. Cria muito mais, mas se expõe atrás.",
    multAtaque: 1.18,
    multDefesa: 0.85,
  },
};

export const FORMACAO_PADRAO: Formacao = "1-2-1";
export const ESTILO_PADRAO: EstiloTatico = "equilibrado";

/** Squads antigos gravaram "classica" antes das formações reais existirem —
 * qualquer valor desconhecido cai no padrão. */
export function parseFormacao(valor: string | null | undefined): Formacao {
  return (FORMACOES as readonly string[]).includes(valor ?? "")
    ? (valor as Formacao)
    : FORMACAO_PADRAO;
}

export function parseEstilo(valor: string | null | undefined): EstiloTatico {
  return (ESTILOS as readonly string[]).includes(valor ?? "")
    ? (valor as EstiloTatico)
    : ESTILO_PADRAO;
}

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

/** Versão curta de nomeTurma, usada onde o nome vira identidade de time (ex.:
 * bots por turma, ver scripts/seed-bots.ts) — "2º J 2025" em vez de
 * "2025 - 2º ano J". A série vem direto de SERIES_ENSINO (o dígito), sem
 * derivar de SERIE_LABEL por substring. */
export function nomeTurmaCurto(turma: {
  anoLetivo: number;
  serie: SerieEnsino;
  letra: string;
}): string {
  return `${turma.serie}º ${turma.letra} ${turma.anoLetivo}`;
}
