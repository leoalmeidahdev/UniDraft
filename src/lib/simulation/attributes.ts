import {
  ESTILO_INFO,
  ESTILO_PADRAO,
  FORMACAO_INFO,
  FORMACAO_PADRAO,
  type EstiloTatico,
  type Formacao,
  type PosicaoFutsal,
} from "@/types/domain";

export interface JogadorAtributos {
  ataque: number;
  defesa: number;
  tecnica: number;
  velocidade: number;
  fisico: number;
  goleiro: number;
}

export interface Titular<T extends JogadorAtributos = JogadorAtributos> {
  posicao: PosicaoFutsal;
  jogador: T;
}

const PESO_OFENSIVO: Record<PosicaoFutsal, number> = {
  PIVO: 1.0,
  ALA_1: 0.8,
  ALA_2: 0.8,
  FIXO: 0.4,
  GOLEIRO: 0.1,
};

const PESO_DEFENSIVO: Record<PosicaoFutsal, number> = {
  GOLEIRO: 1.0,
  FIXO: 0.9,
  ALA_1: 0.5,
  ALA_2: 0.5,
  PIVO: 0.3,
};

export function forcaOfensivaJogador(j: JogadorAtributos): number {
  return 0.5 * j.ataque + 0.3 * j.tecnica + 0.2 * j.velocidade;
}

export function forcaDefensivaJogador(j: JogadorAtributos, posicao: PosicaoFutsal): number {
  if (posicao === "GOLEIRO") return 0.6 * j.goleiro + 0.4 * j.defesa;
  return 0.7 * j.defesa + 0.3 * j.fisico;
}

function mediaPonderada(valores: { valor: number; peso: number }[]): number {
  const totalPeso = valores.reduce((acc, v) => acc + v.peso, 0);
  if (totalPeso <= 0) return 0;
  return valores.reduce((acc, v) => acc + v.valor * v.peso, 0) / totalPeso;
}

/**
 * Força ofensiva do time: média ponderada por posição (PESO_OFENSIVO) ajustada pelo
 * peso da vaga na formação escolhida (FORMACAO_INFO[formacao].pesoAtaque, 1 = neutro)
 * e depois escalada pelo multiplicador de estilo tático do time inteiro
 * (ESTILO_INFO[estilo].multAtaque). Com FORMACAO_PADRAO + ESTILO_PADRAO o resultado
 * é o mesmo de antes desta função existir (pesos e multiplicador ~1).
 */
export function forcaOfensivaTime(
  titulares: Titular[],
  formacao: Formacao = FORMACAO_PADRAO,
  estilo: EstiloTatico = ESTILO_PADRAO
): number {
  const pesoFormacao = FORMACAO_INFO[formacao].pesoAtaque;
  const base = mediaPonderada(
    titulares.map((t) => ({
      valor: forcaOfensivaJogador(t.jogador),
      peso: PESO_OFENSIVO[t.posicao] * pesoFormacao[t.posicao],
    }))
  );
  return base * ESTILO_INFO[estilo].multAtaque;
}

/** Espelho defensivo de forcaOfensivaTime: pesoDefesa da formação + multDefesa do estilo. */
export function forcaDefensivaTime(
  titulares: Titular[],
  formacao: Formacao = FORMACAO_PADRAO,
  estilo: EstiloTatico = ESTILO_PADRAO
): number {
  const pesoFormacao = FORMACAO_INFO[formacao].pesoDefesa;
  const base = mediaPonderada(
    titulares.map((t) => ({
      valor: forcaDefensivaJogador(t.jogador, t.posicao),
      peso: PESO_DEFENSIVO[t.posicao] * pesoFormacao[t.posicao],
    }))
  );
  return base * ESTILO_INFO[estilo].multDefesa;
}

export function pesoOfensivoPosicao(posicao: PosicaoFutsal): number {
  return PESO_OFENSIVO[posicao];
}
