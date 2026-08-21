"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { requirePlayerIdentity, ownsSquad, type PlayerIdentity } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { alunos, squadSlots, squads } from "@/lib/db/schema";
import { getSquadByIdentity, getTurmaComAlunos } from "@/lib/db/queries/squads";
import {
  formarSquadDaTurma,
  inserirSquadComSlots,
  sortearTurmaComElencoCompleto,
} from "@/lib/squad/formSquad";
import { sortearTurma } from "@/lib/draft/drawTurma";
import { ORDEM_POSICOES, SLOTS_POR_POSICAO_JOGADOR } from "@/lib/draft/positionOrder";
import {
  getTurma,
  turmaComMesmaLetraOutraSerie,
  turmaComMesmoAnoOutraSerieLetra,
  turmaComMesmoSerieELetraOutroAno,
} from "@/lib/db/queries/turmas";
import { getBotSquadIdAleatorio, simularEPersistirPartida } from "@/lib/challenge/matchmaking";
import {
  parseFormacao,
  parseEstilo,
  POSICAO_LABEL,
  POSICOES_FUTSAL,
  type PosicaoFutsal,
  type PosicaoJogador,
  type SerieEnsino,
} from "@/types/domain";

export interface SquadActionState {
  error?: string;
}

/** Sorteia uma turma com elenco completo e forma um squad novo pra essa
 * identidade — nunca reusa/muta um squad existente (ver formSquad.ts).
 * Compartilhado por iniciarRodadaAction e novaRodadaAction: a única diferença
 * entre as duas é semântica de UI (primeira vez vs. reroll), a lógica é a mesma. */
async function sortearEFormarNovoSquad(
  identity: PlayerIdentity
): Promise<SquadActionState> {
  let turma;
  try {
    turma = await sortearTurmaComElencoCompleto();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao sortear turma." };
  }

  await formarSquadDaTurma(identity, turma.id);
  redirect("/meu-time");
}

/** Começa a jogar: sorteia uma turma e forma o primeiro squad da identidade
 * atual. Substitui o antigo startDraftAction — não há mais draft, o squad já
 * nasce completo. */
export async function iniciarRodadaAction(
  _prevState: SquadActionState,
  _formData: FormData
): Promise<SquadActionState> {
  const identity = await requirePlayerIdentity();
  return sortearEFormarNovoSquad(identity);
}

/** Rodada rápida: forma um squad novo a partir de outra turma sorteada,
 * mesmo já havendo um squad. O squad anterior nunca é apagado — fica como
 * histórico inerte (outras tabelas referenciam ele via ON DELETE CASCADE). */
export async function novaRodadaAction(
  _prevState: SquadActionState,
  _formData: FormData
): Promise<SquadActionState> {
  const identity = await requirePlayerIdentity();
  return sortearEFormarNovoSquad(identity);
}

/** Troca a posição de dois colegas já escalados no mesmo squad. Nunca remove ninguém. */
export async function swapSlotsAction(
  _prevState: SquadActionState,
  formData: FormData
): Promise<SquadActionState> {
  const identity = await requirePlayerIdentity();

  const squadId = String(formData.get("squadId") ?? "");
  const posicaoA = String(formData.get("posicaoA") ?? "") as PosicaoFutsal;
  const posicaoB = String(formData.get("posicaoB") ?? "") as PosicaoFutsal;

  if (!squadId || !posicaoA || !posicaoB || posicaoA === posicaoB) {
    return { error: "Selecione duas posições diferentes para trocar." };
  }

  const [squad] = await db.select().from(squads).where(eq(squads.id, squadId)).limit(1);
  if (!squad || !ownsSquad(squad, identity)) {
    return { error: "Time não encontrado." };
  }

  const slots = await db
    .select()
    .from(squadSlots)
    .where(eq(squadSlots.squadId, squadId));

  const slotA = slots.find((s) => s.posicao === posicaoA);
  const slotB = slots.find((s) => s.posicao === posicaoB);

  if (!slotA?.alunoId || !slotB?.alunoId) {
    return { error: "As duas posições precisam já estar escaladas." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(squadSlots)
      .set({ alunoId: slotB.alunoId })
      .where(eq(squadSlots.id, slotA.id));
    await tx
      .update(squadSlots)
      .set({ alunoId: slotA.alunoId })
      .where(eq(squadSlots.id, slotB.id));
  });

  revalidatePath("/meu-time");
  return {};
}

/** Turma de origem do squad atual — invariante do item 4/9: todo squad nasce
 * de uma única turma (formarSquadDaTurma insere as 5 vagas de uma vez a
 * partir do mesmo elenco), então o turmaId de qualquer vaga preenchida serve
 * pra identificar a turma do squad inteiro. */
async function turmaAtualDoSquad(squadId: string): Promise<string | null> {
  const [slot] = await db
    .select({ turmaId: alunos.turmaId })
    .from(squadSlots)
    .innerJoin(alunos, eq(squadSlots.alunoId, alunos.id))
    .where(eq(squadSlots.squadId, squadId))
    .limit(1);
  return slot?.turmaId ?? null;
}

/** Troca o squad inteiro (nunca muta) por um formado a partir de uma turma
 * candidata sorteada num eixo (ano ou série/letra) — mesma base pra
 * trocarAnoAction e trocarTurmaAction, a única diferença é qual busca de
 * candidatas (queries/turmas.ts) e qual mensagem mostrar quando não há
 * candidata elegível. getSquadByIdentity já é escopado por dono
 * (userId/guestId), então não precisa de um ownsSquad separado aqui — ao
 * contrário de swapSlotsAction, essas ações não recebem squadId do form (são
 * disparadas por RodadaForm, sem inputs), então a única fonte confiável do
 * squad "atual" é a identidade de quem chamou. */
async function trocarSquadPorEixo(
  identity: PlayerIdentity,
  buscarCandidatas: (turmaId: string) => Promise<{ id: string }[]>,
  mensagemSemCandidata: string
): Promise<SquadActionState> {
  const squadAtual = await getSquadByIdentity(identity);
  if (!squadAtual) {
    return { error: "Você ainda não tem um time formado para trocar." };
  }

  const turmaAtualId = await turmaAtualDoSquad(squadAtual.id);
  if (!turmaAtualId) {
    return { error: "Você ainda não tem um time formado para trocar." };
  }

  const candidatas = await buscarCandidatas(turmaAtualId);
  if (candidatas.length === 0) {
    return { error: mensagemSemCandidata };
  }

  const escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
  await formarSquadDaTurma(identity, escolhida.id);
  redirect("/meu-time");
}

/** Troca de time pelo eixo "ano": forma um squad novo com outra turma da
 * mesma série/letra (mesma sala), mas de outro ano letivo. */
export async function trocarAnoAction(
  _prevState: SquadActionState,
  _formData: FormData
): Promise<SquadActionState> {
  const identity = await requirePlayerIdentity();
  return trocarSquadPorEixo(
    identity,
    turmaComMesmoSerieELetraOutroAno,
    "Nenhuma outra turma da mesma série/letra, em outro ano, tem elenco completo no momento."
  );
}

/** Troca de time pelo eixo "turma": forma um squad novo com outra turma
 * (série/letra diferente) do mesmo ano letivo. */
export async function trocarTurmaAction(
  _prevState: SquadActionState,
  _formData: FormData
): Promise<SquadActionState> {
  const identity = await requirePlayerIdentity();
  return trocarSquadPorEixo(
    identity,
    turmaComMesmoAnoOutraSerieLetra,
    "Nenhuma outra turma do mesmo ano, com série ou letra diferente, tem elenco completo no momento."
  );
}

// ==========================================================
// /jogar — draft manual vaga a vaga (ver src/app/jogar/page.tsx)
//
// Diferente da rodada rápida acima (que forma o squad inteiro de uma turma
// só, automaticamente), aqui o jogador rola salas e escolhe um aluno de cada
// vez, possivelmente de turmas diferentes por vaga. O estado do draft em si
// é efêmero (client component, ver JogarWizard) — nada é persistido até
// finalizarDraftAction. As duas actions de sala abaixo só leem o banco.
// ==========================================================

/** Um aluno elegível pra alguma vaga, do jeito que a UI de /jogar precisa —
 * nunca a linha crua do banco (ver aviso de "constrain return values" nos
 * docs de Server Actions do Next). */
export interface AlunoSala {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: PosicaoJogador;
  overall: number | null;
  ataque: number;
  defesa: number;
  tecnica: number;
  velocidade: number;
  fisico: number;
  goleiro: number;
}

export interface SalaState {
  error?: string;
  turma?: { id: string; anoLetivo: number; serie: SerieEnsino; letra: string };
  alunos?: AlunoSala[];
}

/** Carrega a sala (turma + alunos ativos com posição natural definida) no
 * formato que a UI consome. Alunos sem posição cadastrada (posicao null) não
 * servem pra nenhuma vaga (ver SLOTS_POR_POSICAO_JOGADOR) e ficam de fora. */
async function carregarSala(turmaId: string): Promise<SalaState> {
  const turma = await getTurmaComAlunos(turmaId);
  if (!turma) {
    return { error: "Turma não encontrada." };
  }

  const alunosElegiveis: AlunoSala[] = turma.alunos
    .filter((a) => a.posicao != null)
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      apelido: a.apelido,
      posicao: a.posicao as PosicaoJogador,
      overall: a.overall,
      ataque: a.ataque,
      defesa: a.defesa,
      tecnica: a.tecnica,
      velocidade: a.velocidade,
      fisico: a.fisico,
      goleiro: a.goleiro,
    }));

  return {
    turma: { id: turma.id, anoLetivo: turma.anoLetivo, serie: turma.serie, letra: turma.letra },
    alunos: alunosElegiveis,
  };
}

const VAGAS_VALIDAS = new Set<string>(POSICOES_FUTSAL);

/** Lê o campo `vagas` do FormData (slots ainda abertos no draft, separados
 * por vírgula) e valida contra os valores de PosicaoFutsal — nunca confia
 * cegamente no payload do cliente. Vazio/ausente é tratado como "qualquer
 * vaga serve" (compatibilidade com chamadas antigas). */
function parseVagas(formData: FormData): PosicaoFutsal[] {
  return String(formData.get("vagas") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is PosicaoFutsal => VAGAS_VALIDAS.has(v));
}

/** Uma sala "serve" se algum aluno elegível cobre, pela posição natural
 * (SLOTS_POR_POSICAO_JOGADOR), pelo menos uma das vagas ainda abertas. Lista
 * de vagas vazia = qualquer sala serve (ver parseVagas). Com só 2
 * re-rolagens no draft inteiro, devolver uma sala inútil seria punição
 * injusta pro jogador. */
function salaServeVaga(alunosSala: AlunoSala[], vagasAbertas: PosicaoFutsal[]): boolean {
  if (vagasAbertas.length === 0) return true;
  return alunosSala.some((aluno) =>
    SLOTS_POR_POSICAO_JOGADOR[aluno.posicao].some((slot) => vagasAbertas.includes(slot))
  );
}

const MAX_TENTATIVAS_SORTEIO = 20;

/**
 * Sorteia uma sala (turma) qualquer, sem persistir nada — usada tanto pelo
 * botão "Rolar" (primeira sala) quanto "Outra sala" (reroll). `excluir` é uma
 * lista de ids de turma já vistas nesta montagem, separados por vírgula
 * (acumulada no client), pra dar variedade — mesmo mecanismo de
 * sortearTurma (src/lib/draft/drawTurma.ts). `vagas` são as posições ainda
 * abertas no draft (ver parseVagas/salaServeVaga) — sorteia de novo até achar
 * uma sala que sirva pra pelo menos uma delas, até MAX_TENTATIVAS_SORTEIO
 * tentativas (evita laço infinito se nenhuma sala ativa servir; sortearTurma
 * eventualmente passa a permitir repetir turmas já vistas, então o limite de
 * tentativas — não a exclusão — é o que garante o término).
 */
export async function sortearSalaAction(
  _prevState: SalaState,
  formData: FormData
): Promise<SalaState> {
  await requirePlayerIdentity();

  const excluirInicial = String(formData.get("excluir") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const vagas = parseVagas(formData);

  const vistas = [...excluirInicial];
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS_SORTEIO; tentativa++) {
    let turma;
    try {
      turma = await sortearTurma(vistas);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Erro ao sortear turma." };
    }

    const sala = await carregarSala(turma.id);
    if (sala.error) return sala;
    if (salaServeVaga(sala.alunos ?? [], vagas)) {
      return sala;
    }

    vistas.push(turma.id);
  }

  return {
    error: "Nenhuma sala com jogador para as vagas em aberto foi encontrada. Tente novamente.",
  };
}

/**
 * Troca pela sala de mesma letra e série diferente — botão "Outra série"
 * (2º J vira 1º J ou 3º J). O ano letivo não entra na busca: nos dados
 * reais cada série de uma letra está num ano próprio (é a mesma turma
 * subindo de ano). Reaproveita
 * turmaComMesmaLetraOutraSerie (src/lib/db/queries/turmas.ts), que não filtra
 * por elenco completo (regra do draft: basta servir pra uma vaga aberta, ver
 * salaServeVaga). O total de candidatas vem do banco (finito), então
 * percorrer todas embaralhadas até achar uma útil não tem risco de laço
 * infinito.
 */
export async function trocarSalaSerieAction(
  _prevState: SalaState,
  formData: FormData
): Promise<SalaState> {
  await requirePlayerIdentity();

  const turmaId = String(formData.get("turmaId") ?? "");
  if (!turmaId) {
    return { error: "Sorteie uma sala antes de pedir outra série." };
  }
  const vagas = parseVagas(formData);

  const turmaAtual = await getTurma(turmaId);
  const mensagemSemCandidata = turmaAtual
    ? `Nenhuma outra série com a letra ${turmaAtual.letra} tem jogador pras suas vagas no momento.`
    : "Nenhuma outra série com essa letra tem jogador pras suas vagas no momento.";

  const candidatas = await turmaComMesmaLetraOutraSerie(turmaId);
  if (candidatas.length === 0) {
    return { error: mensagemSemCandidata };
  }

  const candidatasEmbaralhadas = [...candidatas].sort(() => Math.random() - 0.5);
  for (const candidata of candidatasEmbaralhadas) {
    const sala = await carregarSala(candidata.id);
    if (!sala.error && salaServeVaga(sala.alunos ?? [], vagas)) {
      return sala;
    }
  }

  return { error: mensagemSemCandidata };
}

export interface FinalizarDraftState {
  error?: string;
}

/**
 * Recebe as 5 escolhas do draft manual + formação + estilo e cria o squad —
 * validação completa no servidor, o payload do cliente nunca é confiável
 * (ids de aluno podem ter sido adulterados, ou o aluno pode ter sido
 * desativado entre a escolha e o envio):
 *   1. as 5 vagas (ORDEM_POSICOES) precisam vir preenchidas no formData;
 *   2. nenhum aluno repetido entre as 5 vagas;
 *   3. cada aluno precisa existir e estar ativo;
 *   4. a posição natural do aluno precisa cobrir a vaga (SLOTS_POR_POSICAO_JOGADOR).
 * formacao/estilo passam por parseFormacao/parseEstilo, que já caem no
 * padrão pra qualquer valor desconhecido — não há como um payload adulterado
 * gravar um valor fora do enum. Insere squad+slots via inserirSquadComSlots
 * (src/lib/squad/formSquad.ts, compartilhada com a rodada rápida). Depois de
 * criar o squad (que já está garantido nesse ponto, independente do que
 * segue), tenta encadear direto pra uma partida contra uma turma sorteada
 * como bot — a experiência mais direta de "Jogar agora". Se o sorteio do bot
 * falhar por qualquer motivo, cai pra /meu-time em vez de deixar o jogador
 * num beco sem saída: o time já foi criado, e de lá dá pra jogar contra o
 * bot a um clique (BotMatchForm).
 */
export async function finalizarDraftAction(
  _prevState: FinalizarDraftState,
  formData: FormData
): Promise<FinalizarDraftState> {
  const identity = await requirePlayerIdentity();

  const formacao = parseFormacao(String(formData.get("formacao") ?? ""));
  const estilo = parseEstilo(String(formData.get("estilo") ?? ""));

  const alunoIdPorSlot = new Map<PosicaoFutsal, string>();
  for (const slot of ORDEM_POSICOES) {
    const alunoId = String(formData.get(`aluno_${slot}`) ?? "").trim();
    if (!alunoId) {
      return { error: "Preencha as 5 vagas antes de finalizar o time." };
    }
    alunoIdPorSlot.set(slot, alunoId);
  }

  const idsEscolhidos = [...alunoIdPorSlot.values()];
  if (new Set(idsEscolhidos).size !== idsEscolhidos.length) {
    return { error: "Cada aluno só pode ocupar uma vaga." };
  }

  const alunosEncontrados = await db
    .select()
    .from(alunos)
    .where(inArray(alunos.id, idsEscolhidos));

  if (alunosEncontrados.length !== idsEscolhidos.length) {
    return { error: "Um dos alunos escolhidos não existe mais. Revise a montagem do time." };
  }

  const alunoPorId = new Map(alunosEncontrados.map((a) => [a.id, a]));

  for (const slot of ORDEM_POSICOES) {
    const aluno = alunoPorId.get(alunoIdPorSlot.get(slot)!)!;
    if (!aluno.ativo) {
      return { error: `${aluno.nome} não está mais ativo. Escolha outro aluno para ${POSICAO_LABEL[slot]}.` };
    }
    if (!aluno.posicao || !SLOTS_POR_POSICAO_JOGADOR[aluno.posicao].includes(slot)) {
      return { error: `${aluno.nome} não joga na posição ${POSICAO_LABEL[slot]}.` };
    }
  }

  const squadId = await inserirSquadComSlots(identity, alunoIdPorSlot, { formacao, estilo });

  let matchId: string;
  try {
    const botSquadId = await getBotSquadIdAleatorio();
    matchId = await simularEPersistirPartida({
      squadHomeId: squadId,
      squadAwayId: botSquadId,
      isBotMatch: true,
    });
  } catch {
    // squad já foi criado com sucesso acima — se o pareamento contra o bot
    // falhar (ex.: nenhuma turma-bot cadastrada), não deixa o jogador num
    // erro sem saída: manda pra /meu-time, de onde dá pra tentar jogar
    // contra o bot de novo a um clique.
    redirect("/meu-time");
  }
  redirect(`/partida/${matchId}`);
}
