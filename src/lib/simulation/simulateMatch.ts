import {
  ESTILO_PADRAO,
  FORMACAO_PADRAO,
  type EstiloTatico,
  type Formacao,
  type PosicaoFutsal,
  type TipoEventoPartida,
} from "@/types/domain";
import { createRng, poissonRandom, randomInt, weightedPick, clamp, type Rng } from "@/lib/simulation/rng";
import {
  forcaDefensivaTime,
  forcaOfensivaTime,
  forcaOfensivaJogador,
  pesoOfensivoPosicao,
  type JogadorAtributos,
  type Titular,
} from "@/lib/simulation/attributes";

const BASE_GOLS_ESPERADOS = 2.0;
const ESCALA_DIFERENCA = 20;
const LAMBDA_MIN = 0.3;
const LAMBDA_MAX = 8;

/** 90min corridos, mas simulados em 2 tempos de 45 — ver Item 1 do plano de overhaul. */
export const DURACAO_JOGO_MIN = 90;
export const MINUTOS_POR_TEMPO = 45;

/** Limite de faltas por time, por tempo, antes de virar falta direta (Item 8). */
const LIMITE_FALTAS_TEMPO = 5;
/** Chance de uma falta (dentro do limite) render cartão amarelo pro autor. */
const CHANCE_CARTAO_NA_FALTA = 0.15;
/** Probabilidade de conversão de uma falta direta em gol. */
const XG_FALTA_DIRETA = 0.6;

/** Disputa de pênaltis (Item: empate no tempo normal). */
const CHANCE_BASE_PENALTI = 0.78;
const PLAYBACK_SEG_POR_PENALTI = 2.5;

export interface JogadorSimulado extends JogadorAtributos {
  id: string;
  nome: string;
}

export interface SquadSimulado {
  id: string;
  titulares: Titular<JogadorSimulado>[];
  /** Tática do time — opcionais para não quebrar quem ainda monta o objeto sem elas
   * (ex.: testes existentes); caem no padrão neutro (FORMACAO_PADRAO/ESTILO_PADRAO). */
  formacao?: Formacao;
  estilo?: EstiloTatico;
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
  /** Só vem preenchido quando o tempo normal termina empatado. */
  placarPenaltiHome: number | null;
  placarPenaltiAway: number | null;
  /** Duração total de playback em segundos, já somando a disputa de pênaltis (se houve) —
   * usar este valor pra gravar em matches.duracaoPlaybackSeg, não o parâmetro de entrada. */
  duracaoPlaybackSeg: number;
  eventos: EventoSimulado[];
}

type EventoBruto = Omit<EventoSimulado, "ordem" | "offsetPlaybackMs">;

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
      return `Cartão amarelo para ${jogadorNome}.`;
    case "cartao_vermelho":
      return `Cartão vermelho! ${jogadorNome} está fora da partida!`;
    case "falta_direta":
      return `Falta perigosa! ${jogadorNome} vai cobrar a falta direta.`;
    case "chance_perdida":
      return `${jogadorNome} perde uma chance incrível${posicao === "PIVO" ? " na cara do gol" : ""}.`;
    case "inicio_tempo":
      return "Bola rolando! Começa a partida.";
    case "fim_tempo":
      return "Apito final!";
    case "intervalo":
      return "Fim de primeiro tempo. Intervalo!";
    case "disputa_penaltis":
      return "Empate no tempo normal! Vai para a disputa de pênaltis.";
    case "penalti_convertido":
      return `${jogadorNome} converte a cobrança!`;
    case "penalti_perdido":
      return `${jogadorNome} perde a cobrança!`;
  }
}

/** Sorteia um minuto dentro do tempo (1: 1-45, 2: 46-90). */
function sortearMinutoNoTempo(rng: Rng, tempo: 1 | 2): number {
  const inicio = tempo === 1 ? 1 : MINUTOS_POR_TEMPO + 1;
  const fim = tempo === 1 ? MINUTOS_POR_TEMPO : DURACAO_JOGO_MIN;
  return randomInt(rng, inicio, fim);
}

/** Peso pro sorteio de quem comete a falta — inverso do peso ofensivo usado pra vítima,
 * puxando pra posições mais defensivas (fixo/goleiro cometem mais faltas táticas). */
function pesoDefensivoInverso(posicao: PosicaoFutsal): number {
  return 1 / (pesoOfensivoPosicao(posicao) + 0.1);
}

/** Um jogador expulso (mapa jogadorId -> minuto do cartão vermelho) fica de fora de
 * qualquer evento/gol a partir do minuto da expulsão, inclusive. */
function estaAtivo(expulsos: Map<string, number>, jogadorId: string, minuto: number): boolean {
  const minutoExpulsao = expulsos.get(jogadorId);
  return minutoExpulsao === undefined || minuto < minutoExpulsao;
}

function titularesAtivos(
  squad: SquadSimulado,
  expulsos: Map<string, number>,
  minuto: number
): Titular<JogadorSimulado>[] {
  return squad.titulares.filter((t) => estaAtivo(expulsos, t.jogador.id, minuto));
}

/**
 * Gera faltas/cartões de um time (squadFouling) contra o outro (squadVictim) num tempo.
 * Faltas 1-5 do tempo: evento "falta" normal (vítima ofensiva) + chance de cartão pro autor
 * (2º amarelo na partida = cartão vermelho direto, marca expulsão). Da 6ª falta em diante:
 * falta direta pro melhor atacante do time vítima, resolvida na hora.
 */
function gerarFaltasDoTime(
  rng: Rng,
  squadFouling: SquadSimulado,
  squadVictim: SquadSimulado,
  tempo: 1 | 2,
  amarelosNaPartida: Map<string, number>,
  expulsos: Map<string, number>,
  eventosBrutos: EventoBruto[]
): void {
  const numFaltas = randomInt(rng, 2, 8);
  const minutos = Array.from({ length: numFaltas }, () => sortearMinutoNoTempo(rng, tempo)).sort(
    (a, b) => a - b
  );

  minutos.forEach((minuto, idx) => {
    const faltaIndex = idx + 1;
    const poolVitimas = titularesAtivos(squadVictim, expulsos, minuto);
    if (poolVitimas.length === 0) return;

    if (faltaIndex > LIMITE_FALTAS_TEMPO) {
      // 6ª+ falta do tempo: falta direta pro melhor atacante do time vítima.
      const cobrador = poolVitimas.reduce((melhor, atual) =>
        forcaOfensivaJogador(atual.jogador) > forcaOfensivaJogador(melhor.jogador) ? atual : melhor
      );
      eventosBrutos.push({
        minutoJogo: minuto,
        tipo: "falta_direta",
        squadId: squadVictim.id,
        alunoId: cobrador.jogador.id,
        descricao: descricaoEvento("falta_direta", cobrador.jogador.nome),
      });
      if (rng() < XG_FALTA_DIRETA) {
        eventosBrutos.push({
          minutoJogo: minuto,
          tipo: "gol",
          squadId: squadVictim.id,
          alunoId: cobrador.jogador.id,
          descricao: descricaoEvento("gol", cobrador.jogador.nome),
        });
      }
      return;
    }

    const vitima = weightedPick(rng, poolVitimas, (t) => pesoOfensivoPosicao(t.posicao) + 0.2);
    eventosBrutos.push({
      minutoJogo: minuto,
      tipo: "falta",
      squadId: squadVictim.id,
      alunoId: vitima.jogador.id,
      descricao: descricaoEvento("falta", vitima.jogador.nome),
    });

    if (rng() >= CHANCE_CARTAO_NA_FALTA) return;

    const poolAutores = titularesAtivos(squadFouling, expulsos, minuto);
    if (poolAutores.length === 0) return;
    const autor = weightedPick(rng, poolAutores, (t) => pesoDefensivoInverso(t.posicao));
    const amarelosAtuais = amarelosNaPartida.get(autor.jogador.id) ?? 0;

    if (amarelosAtuais >= 1) {
      eventosBrutos.push({
        minutoJogo: minuto,
        tipo: "cartao_vermelho",
        squadId: squadFouling.id,
        alunoId: autor.jogador.id,
        descricao: descricaoEvento("cartao_vermelho", autor.jogador.nome),
      });
      expulsos.set(autor.jogador.id, minuto);
    } else {
      amarelosNaPartida.set(autor.jogador.id, amarelosAtuais + 1);
      eventosBrutos.push({
        minutoJogo: minuto,
        tipo: "cartao",
        squadId: squadFouling.id,
        alunoId: autor.jogador.id,
        descricao: descricaoEvento("cartao", autor.jogador.nome),
      });
    }
  });
}

function calcularLambdas(
  squadHome: SquadSimulado,
  ativosHome: Titular<JogadorSimulado>[],
  squadAway: SquadSimulado,
  ativosAway: Titular<JogadorSimulado>[]
) {
  const formacaoHome = squadHome.formacao ?? FORMACAO_PADRAO;
  const estiloHome = squadHome.estilo ?? ESTILO_PADRAO;
  const formacaoAway = squadAway.formacao ?? FORMACAO_PADRAO;
  const estiloAway = squadAway.estilo ?? ESTILO_PADRAO;

  const forcaOfHome = forcaOfensivaTime(ativosHome, formacaoHome, estiloHome);
  const forcaDefHome = forcaDefensivaTime(ativosHome, formacaoHome, estiloHome);
  const forcaOfAway = forcaOfensivaTime(ativosAway, formacaoAway, estiloAway);
  const forcaDefAway = forcaDefensivaTime(ativosAway, formacaoAway, estiloAway);

  return {
    lambdaHome: clamp(
      BASE_GOLS_ESPERADOS + (forcaOfHome - forcaDefAway) / ESCALA_DIFERENCA,
      LAMBDA_MIN,
      LAMBDA_MAX
    ),
    lambdaAway: clamp(
      BASE_GOLS_ESPERADOS + (forcaOfAway - forcaDefHome) / ESCALA_DIFERENCA,
      LAMBDA_MIN,
      LAMBDA_MAX
    ),
  };
}

/** Divide [inicio,fim] em sub-segmentos nos minutos de cartão vermelho já conhecidos. */
function construirSegmentos(
  inicio: number,
  fim: number,
  minutosCartaoVermelho: number[]
): { inicio: number; fim: number }[] {
  const cortes = Array.from(new Set(minutosCartaoVermelho.filter((m) => m > inicio && m < fim))).sort(
    (a, b) => a - b
  );
  const pontos = [inicio, ...cortes, fim];
  const segmentos: { inicio: number; fim: number }[] = [];
  for (let i = 0; i < pontos.length - 1; i++) {
    if (pontos[i + 1] > pontos[i]) segmentos.push({ inicio: pontos[i], fim: pontos[i + 1] });
  }
  if (segmentos.length === 0) segmentos.push({ inicio, fim });
  return segmentos;
}

/**
 * Gera os gols de um tempo, dividido em sub-segmentos a cada cartão vermelho já emitido
 * (a força ofensiva/defensiva de cada time é recalculada por segmento, filtrando expulsos).
 */
function gerarGolsDoTempo(
  rng: Rng,
  squadHome: SquadSimulado,
  squadAway: SquadSimulado,
  tempo: 1 | 2,
  expulsos: Map<string, number>,
  eventosBrutos: EventoBruto[]
): void {
  const inicio = tempo === 1 ? 1 : MINUTOS_POR_TEMPO + 1;
  const fim = tempo === 1 ? MINUTOS_POR_TEMPO : DURACAO_JOGO_MIN;

  const minutosCartaoVermelho = Array.from(expulsos.values()).filter((m) => m >= inicio && m <= fim);
  const segmentos = construirSegmentos(inicio, fim, minutosCartaoVermelho);

  for (const segmento of segmentos) {
    const duracaoSegmento = segmento.fim - segmento.inicio;
    if (duracaoSegmento <= 0) continue;

    const ativosHome = titularesAtivos(squadHome, expulsos, segmento.inicio);
    const ativosAway = titularesAtivos(squadAway, expulsos, segmento.inicio);
    const { lambdaHome, lambdaAway } = calcularLambdas(squadHome, ativosHome, squadAway, ativosAway);
    const fracaoSegmento = duracaoSegmento / DURACAO_JOGO_MIN;

    for (const [squad, ativos, lambda] of [
      [squadHome, ativosHome, lambdaHome * fracaoSegmento],
      [squadAway, ativosAway, lambdaAway * fracaoSegmento],
    ] as const) {
      if (ativos.length === 0) continue;
      const gols = poissonRandom(rng, lambda);
      for (let i = 0; i < gols; i++) {
        const autor = weightedPick(rng, ativos, (t) => pesoOfensivoPosicao(t.posicao) + 0.05);
        const minutoGol = randomInt(rng, segmento.inicio, Math.max(segmento.inicio, segmento.fim - 1));
        eventosBrutos.push({
          minutoJogo: minutoGol,
          tipo: "gol",
          squadId: squad.id,
          alunoId: autor.jogador.id,
          descricao: descricaoEvento("gol", autor.jogador.nome),
        });
      }
    }
  }
}

/** Eventos decorativos (defesa/chance perdida) de um tempo — sem impacto no placar.
 * "defesa" só pode ser creditada ao goleiro titular (Item 7). */
function gerarDecorativosDoTempo(
  rng: Rng,
  squadHome: SquadSimulado,
  squadAway: SquadSimulado,
  tempo: 1 | 2,
  expulsos: Map<string, number>,
  eventosBrutos: EventoBruto[]
): void {
  const totalDecorativos = randomInt(rng, 4, 7);
  for (let i = 0; i < totalDecorativos; i++) {
    const squad = rng() < 0.5 ? squadHome : squadAway;
    const minuto = sortearMinutoNoTempo(rng, tempo);

    if (rng() < 0.5) {
      const goleiro = squad.titulares.find(
        (t) => t.posicao === "GOLEIRO" && estaAtivo(expulsos, t.jogador.id, minuto)
      );
      if (!goleiro) continue;
      eventosBrutos.push({
        minutoJogo: minuto,
        tipo: "defesa",
        squadId: squad.id,
        alunoId: goleiro.jogador.id,
        descricao: descricaoEvento("defesa"),
      });
      continue;
    }

    const pool = titularesAtivos(squad, expulsos, minuto);
    if (pool.length === 0) continue;
    const jogador = weightedPick(rng, pool, (t) => pesoOfensivoPosicao(t.posicao) + 0.2);
    eventosBrutos.push({
      minutoJogo: minuto,
      tipo: "chance_perdida",
      squadId: squad.id,
      alunoId: jogador.jogador.id,
      descricao: descricaoEvento("chance_perdida", jogador.jogador.nome, jogador.posicao),
    });
  }
}

/** Chance de conversão de uma cobrança, ajustada pela força ofensiva do cobrador e,
 * quando o goleiro adversário segue ativo, pelo atributo goleiro dele. */
function chanceConversaoPenalti(
  cobrador: JogadorSimulado,
  goleiroAdversario: JogadorSimulado | null
): number {
  const ajusteCobrador = (forcaOfensivaJogador(cobrador) - 50) / 500;
  const ajusteGoleiro = goleiroAdversario ? -(goleiroAdversario.goleiro - 50) / 400 : 0;
  return clamp(CHANCE_BASE_PENALTI + ajusteCobrador + ajusteGoleiro, 0.5, 0.95);
}

/** Cobradores disponíveis pra disputa: titulares ativos, de preferência de linha
 * (goleiro só cobra se não sobrar mais ninguém — expulsões deixaram o time muito curto). */
function cobradoresDisponiveis(
  squad: SquadSimulado,
  expulsos: Map<string, number>
): Titular<JogadorSimulado>[] {
  const ativos = titularesAtivos(squad, expulsos, DURACAO_JOGO_MIN);
  const semGoleiro = ativos.filter((t) => t.posicao !== "GOLEIRO");
  return semGoleiro.length > 0 ? semGoleiro : ativos;
}

function goleiroAtivo(
  squad: SquadSimulado,
  expulsos: Map<string, number>
): Titular<JogadorSimulado> | null {
  return (
    titularesAtivos(squad, expulsos, DURACAO_JOGO_MIN).find((t) => t.posicao === "GOLEIRO") ?? null
  );
}

/**
 * Disputa de pênaltis: 5 rodadas alternadas (interrompidas cedo se o resultado já não
 * pode mais mudar, como na regra oficial) e, se ainda empatado, morte súbita aos pares.
 * Roda só quando o tempo normal termina empatado — o placar dela não conta como gol
 * pra nenhum outro fim (ratings, xG etc.), só decide o vencedor da partida.
 */
function gerarDisputaPenaltis(
  rng: Rng,
  squadHome: SquadSimulado,
  squadAway: SquadSimulado,
  expulsos: Map<string, number>,
  ordemInicial: number,
  offsetInicialMs: number
): { placarHome: number; placarAway: number; eventos: EventoSimulado[]; duracaoPlaybackSegExtra: number } {
  const eventos: EventoSimulado[] = [];
  let ordem = ordemInicial;
  let offsetMs = offsetInicialMs;

  function empurrar(bruto: EventoBruto) {
    ordem += 1;
    offsetMs += PLAYBACK_SEG_POR_PENALTI * 1000;
    eventos.push({ ...bruto, ordem, offsetPlaybackMs: Math.round(offsetMs) });
  }

  empurrar({
    minutoJogo: DURACAO_JOGO_MIN,
    tipo: "disputa_penaltis",
    squadId: null,
    alunoId: null,
    descricao: descricaoEvento("disputa_penaltis"),
  });

  const cobradoresHome = cobradoresDisponiveis(squadHome, expulsos);
  const cobradoresAway = cobradoresDisponiveis(squadAway, expulsos);
  const goleiroHome = goleiroAtivo(squadHome, expulsos);
  const goleiroAway = goleiroAtivo(squadAway, expulsos);

  let placarHome = 0;
  let placarAway = 0;

  function cobrar(
    squadId: string,
    cobrador: Titular<JogadorSimulado>,
    goleiroAdversario: Titular<JogadorSimulado> | null
  ): boolean {
    const converteu = rng() < chanceConversaoPenalti(cobrador.jogador, goleiroAdversario?.jogador ?? null);
    empurrar({
      minutoJogo: DURACAO_JOGO_MIN,
      tipo: converteu ? "penalti_convertido" : "penalti_perdido",
      squadId,
      alunoId: cobrador.jogador.id,
      descricao: descricaoEvento(converteu ? "penalti_convertido" : "penalti_perdido", cobrador.jogador.nome),
    });
    return converteu;
  }

  for (let rodada = 1; rodada <= 5; rodada++) {
    if (cobrar(squadHome.id, cobradoresHome[(rodada - 1) % cobradoresHome.length], goleiroAway)) {
      placarHome++;
    }
    // Decisão antecipada: visitante não alcança mais mesmo convertendo tudo que resta.
    if (placarHome > placarAway + (5 - rodada)) break;

    if (cobrar(squadAway.id, cobradoresAway[(rodada - 1) % cobradoresAway.length], goleiroHome)) {
      placarAway++;
    }
    // Decisão antecipada: casa não alcança mais mesmo convertendo tudo que resta.
    if (placarAway > placarHome + (5 - rodada)) break;
  }

  for (let rodada = 5; placarHome === placarAway; rodada++) {
    if (cobrar(squadHome.id, cobradoresHome[rodada % cobradoresHome.length], goleiroAway)) placarHome++;
    if (cobrar(squadAway.id, cobradoresAway[rodada % cobradoresAway.length], goleiroHome)) placarAway++;
  }

  return {
    placarHome,
    placarAway,
    eventos,
    duracaoPlaybackSegExtra: (offsetMs - offsetInicialMs) / 1000,
  };
}

/**
 * Simula uma partida de futsal 5x5 de forma determinística (mesma seed = mesmo resultado).
 * Roda inteira no servidor de uma vez; o resultado é reproduzido depois no client via
 * offsetPlaybackMs, sem precisar de um servidor de jogo em tempo real.
 *
 * 90min em 2 tempos de 45 (Item 1). Cartões amarelo/vermelho e limite de 5 faltas por
 * time por tempo (falta direta a partir da 6ª) são gerados junto com os gols, já que um
 * cartão vermelho reduz o time pro resto da partida e corta o tempo em sub-segmentos de
 * força diferente (Item 3 + 8).
 */
export function simulateMatch(params: {
  squadHome: SquadSimulado;
  squadAway: SquadSimulado;
  seed: bigint;
  duracaoPlaybackSeg?: number;
}): ResultadoSimulacao {
  const { squadHome, squadAway, seed, duracaoPlaybackSeg = 90 } = params;
  const rng = createRng(seed);

  const eventosBrutos: EventoBruto[] = [];
  const amarelosNaPartida = new Map<string, number>();
  const expulsos = new Map<string, number>();

  eventosBrutos.push({
    minutoJogo: 0,
    tipo: "inicio_tempo",
    squadId: null,
    alunoId: null,
    descricao: descricaoEvento("inicio_tempo"),
  });

  for (const tempo of [1, 2] as const) {
    gerarFaltasDoTime(rng, squadHome, squadAway, tempo, amarelosNaPartida, expulsos, eventosBrutos);
    gerarFaltasDoTime(rng, squadAway, squadHome, tempo, amarelosNaPartida, expulsos, eventosBrutos);

    gerarGolsDoTempo(rng, squadHome, squadAway, tempo, expulsos, eventosBrutos);
    gerarDecorativosDoTempo(rng, squadHome, squadAway, tempo, expulsos, eventosBrutos);

    if (tempo === 1) {
      eventosBrutos.push({
        minutoJogo: MINUTOS_POR_TEMPO,
        tipo: "intervalo",
        squadId: null,
        alunoId: null,
        descricao: descricaoEvento("intervalo"),
      });
    }
  }

  eventosBrutos.push({
    minutoJogo: DURACAO_JOGO_MIN,
    tipo: "fim_tempo",
    squadId: null,
    alunoId: null,
    descricao: descricaoEvento("fim_tempo"),
  });

  eventosBrutos.sort((a, b) => a.minutoJogo - b.minutoJogo);

  let eventos: EventoSimulado[] = eventosBrutos.map((e, index) => ({
    ...e,
    ordem: index + 1,
    offsetPlaybackMs: Math.round((e.minutoJogo / DURACAO_JOGO_MIN) * duracaoPlaybackSeg * 1000),
  }));

  const placarHome = eventos.filter((e) => e.tipo === "gol" && e.squadId === squadHome.id).length;
  const placarAway = eventos.filter((e) => e.tipo === "gol" && e.squadId === squadAway.id).length;

  let placarPenaltiHome: number | null = null;
  let placarPenaltiAway: number | null = null;
  let duracaoPlaybackSegTotal = duracaoPlaybackSeg;

  if (placarHome === placarAway) {
    const disputa = gerarDisputaPenaltis(
      rng,
      squadHome,
      squadAway,
      expulsos,
      eventos.length,
      duracaoPlaybackSeg * 1000
    );
    eventos = eventos.concat(disputa.eventos);
    placarPenaltiHome = disputa.placarHome;
    placarPenaltiAway = disputa.placarAway;
    duracaoPlaybackSegTotal = duracaoPlaybackSeg + disputa.duracaoPlaybackSegExtra;
  }

  return {
    placarHome,
    placarAway,
    placarPenaltiHome,
    placarPenaltiAway,
    duracaoPlaybackSeg: duracaoPlaybackSegTotal,
    eventos,
  };
}
