"use server";

import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { requirePlayerIdentity, type PlayerIdentity } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { tournaments, tournamentEntries, tournamentMatches } from "@/lib/db/schema";
import { getSquadByIdentity } from "@/lib/db/queries/squads";
import {
  getActiveTournamentForIdentity,
  getTournamentByLobbyCode,
  getTournamentFull,
  getBotSquadPool,
} from "@/lib/db/queries/tournaments";
import {
  atribuirSlots,
  criarChavesIniciais,
  resolverBotVsBotProntos,
  resolverPartidaChave,
} from "@/lib/tournament/bracket";

export interface TournamentActionState {
  error?: string;
}

function camposDono(identity: PlayerIdentity) {
  return identity.kind === "user"
    ? { ownerUserId: identity.id, ownerGuestId: null }
    : { ownerUserId: null, ownerGuestId: identity.id };
}

function camposHost(identity: PlayerIdentity) {
  return identity.kind === "user"
    ? { hostUserId: identity.id, hostGuestId: null }
    : { hostUserId: null, hostGuestId: identity.id };
}

// sem 0/O, 1/I/L — evita confusão ao digitar o código
const ALFABETO_CODIGO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function gerarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return codigo;
}

async function gerarCodigoUnico(): Promise<string> {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerarCodigo();
    const [existente] = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.lobbyCode, codigo))
      .limit(1);
    if (!existente) return codigo;
  }
  throw new Error("Não foi possível gerar um código de sala. Tente novamente.");
}

const TAMANHOS_VALIDOS = [8, 16, 32] as const;

function parseBracketSize(formData: FormData): number {
  const valor = Number(formData.get("bracketSize"));
  return (TAMANHOS_VALIDOS as readonly number[]).includes(valor) ? valor : 8;
}

/** Nome que o dono escolheu pra sua entry na sala — null cai no squads.nome (ver torneio/[id]/page.tsx). */
function parseNomeExibicao(formData: FormData): string | null {
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 40);
  return nome || null;
}

export async function criarTorneioAction(
  _prevState: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const identity = await requirePlayerIdentity();

  const ativo = await getActiveTournamentForIdentity(identity);
  if (ativo) redirect(`/torneio/${ativo.id}`);

  const squad = await getSquadByIdentity(identity);
  if (!squad || !squad.draftConcluido) {
    return { error: "Complete seu time no draft antes de entrar num torneio." };
  }

  const bracketSize = parseBracketSize(formData);
  const nomeExibicao = parseNomeExibicao(formData);
  const lobbyCode = await gerarCodigoUnico();

  const tournamentId = await db.transaction(async (tx) => {
    const [tournament] = await tx
      .insert(tournaments)
      .values({ ...camposHost(identity), bracketSize, lobbyCode })
      .returning({ id: tournaments.id });

    await tx.insert(tournamentEntries).values({
      tournamentId: tournament.id,
      squadId: squad.id,
      ...camposDono(identity),
      isBot: false,
      nomeExibicao,
    });

    return tournament.id;
  });

  redirect(`/torneio/${tournamentId}`);
}

export async function entrarLobbyTorneioAction(
  _prevState: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const identity = await requirePlayerIdentity();

  const ativo = await getActiveTournamentForIdentity(identity);
  if (ativo) redirect(`/torneio/${ativo.id}`);

  const squad = await getSquadByIdentity(identity);
  if (!squad || !squad.draftConcluido) {
    return { error: "Complete seu time no draft antes de entrar num torneio." };
  }

  const codigo = String(formData.get("codigo") ?? "")
    .trim()
    .toUpperCase();
  if (!codigo) return { error: "Digite o código da sala." };

  const tournament = await getTournamentByLobbyCode(codigo);
  if (!tournament) return { error: "Código inválido ou a sala não está mais aberta." };

  const humanos = await db
    .select({ id: tournamentEntries.id })
    .from(tournamentEntries)
    .where(and(eq(tournamentEntries.tournamentId, tournament.id), eq(tournamentEntries.isBot, false)));
  if (humanos.length >= tournament.bracketSize) {
    return { error: "Essa sala já está cheia." };
  }

  await db.insert(tournamentEntries).values({
    tournamentId: tournament.id,
    squadId: squad.id,
    ...camposDono(identity),
    isBot: false,
    nomeExibicao: parseNomeExibicao(formData),
  });

  redirect(`/torneio/${tournament.id}`);
}

/** Só o host pode começar; enche as vagas restantes com bots e monta o chaveamento inteiro. */
export async function iniciarTorneioAction(
  _prevState: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const identity = await requirePlayerIdentity();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!tournamentId) return { error: "Torneio inválido." };

  const tournament = await getTournamentFull(tournamentId);
  if (!tournament || tournament.status !== "lobby") return { error: "Esse torneio não está mais na sala de espera." };

  const souHost =
    identity.kind === "user"
      ? tournament.hostUserId === identity.id
      : tournament.hostGuestId === identity.id;
  if (!souHost) return { error: "Só o anfitrião pode começar o torneio." };

  const humanos = tournament.entries.filter((e) => !e.isBot);
  const vagasRestantes = tournament.bracketSize - humanos.length;
  if (vagasRestantes < 0) return { error: "Tem gente demais na sala pra esse tamanho de chaveamento." };

  const botPoolCompleto = await getBotSquadPool();
  if (botPoolCompleto.length < vagasRestantes) {
    return {
      error: `Faltam times de turma pra completar o chaveamento (${botPoolCompleto.length} disponíveis, ${vagasRestantes} necessários). Escolha um chaveamento menor ou chame mais amigos.`,
    };
  }

  const botsEscolhidos = [...botPoolCompleto].sort(() => Math.random() - 0.5).slice(0, vagasRestantes);

  await db.transaction(async (tx) => {
    const botEntries = vagasRestantes
      ? await tx
          .insert(tournamentEntries)
          .values(
            botsEscolhidos.map((squadId) => ({
              tournamentId: tournament.id,
              squadId,
              isBot: true,
            }))
          )
          .returning({ id: tournamentEntries.id })
      : [];

    const atribuicao = atribuirSlots({
      bracketSize: tournament.bracketSize,
      humanos: humanos.map((h) => h.id),
      bots: botEntries.map((e) => e.id),
    });

    for (const [entryId, slot] of atribuicao) {
      await tx.update(tournamentEntries).set({ slot }).where(eq(tournamentEntries.id, entryId));
    }

    const slotParaEntryId = new Map(Array.from(atribuicao, ([entryId, slot]) => [slot, entryId]));
    await criarChavesIniciais(tx, {
      tournamentId: tournament.id,
      bracketSize: tournament.bracketSize,
      slotParaEntryId,
    });

    await tx
      .update(tournaments)
      .set({ status: "em_andamento", iniciadoEm: new Date() })
      .where(eq(tournaments.id, tournament.id));
  });

  await resolverBotVsBotProntos(tournament.id, 1);

  redirect(`/torneio/${tournament.id}`);
}

/** Simula a chave sob demanda (dá o ritmo de "uma rodada por vez" pro jogador). */
export async function jogarPartidaTorneioAction(formData: FormData): Promise<void> {
  const identity = await requirePlayerIdentity();
  const tournamentMatchId = String(formData.get("tournamentMatchId") ?? "");
  if (!tournamentMatchId) return;

  const [chave] = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, tournamentMatchId))
    .limit(1);
  if (!chave || chave.status !== "pronta" || !chave.entryHomeId || !chave.entryAwayId) return;

  const entradas = await db
    .select()
    .from(tournamentEntries)
    .where(inArray(tournamentEntries.id, [chave.entryHomeId, chave.entryAwayId]));
  const home = entradas.find((e) => e.id === chave.entryHomeId);
  const away = entradas.find((e) => e.id === chave.entryAwayId);
  if (!home || !away) return;

  const souParticipante =
    identity.kind === "user"
      ? home.ownerUserId === identity.id || away.ownerUserId === identity.id
      : home.ownerGuestId === identity.id || away.ownerGuestId === identity.id;
  if (!souParticipante) return;

  const matchId = await resolverPartidaChave(chave.id, home, away);
  if (matchId) {
    redirect(`/partida/${matchId}`);
  }

  // corrida rara: outra chamada já resolveu essa chave, assiste ao mesmo resultado
  const [chaveAtual] = await db
    .select({ matchId: tournamentMatches.matchId })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, tournamentMatchId))
    .limit(1);
  if (chaveAtual?.matchId) {
    redirect(`/partida/${chaveAtual.matchId}`);
  }
}

/** Só o host cancela — some da lista de "torneio ativo" de todo mundo (ver
 * getActiveTournamentForIdentity) sem apagar entries/chaves já jogadas. */
export async function cancelarTorneioAction(
  _prevState: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const identity = await requirePlayerIdentity();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!tournamentId) return { error: "Torneio inválido." };

  const tournament = await getTournamentFull(tournamentId);
  if (!tournament) return { error: "Torneio não encontrado." };

  const souHost =
    identity.kind === "user"
      ? tournament.hostUserId === identity.id
      : tournament.hostGuestId === identity.id;
  if (!souHost) return { error: "Só o anfitrião pode cancelar o torneio." };

  if (tournament.status === "finalizado") return { error: "Esse torneio já terminou." };

  await db
    .update(tournaments)
    .set({ status: "finalizado", finalizadoEm: new Date() })
    .where(eq(tournaments.id, tournamentId));

  redirect("/torneio");
}
