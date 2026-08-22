/**
 * Cria (se ainda não existir) um perfil de bot por turma ativa com elenco
 * completo, e um squad para cada um escalado só com alunos daquela turma
 * (melhor aluno por posição). Rodar depois de importar alunos e definir a
 * posição de cada um (npm run seed:import, /admin/alunos).
 *
 * Um bot representa a turma inteira: username `bot_turma_<turmaId>`, nome
 * (perfil e squad) = nomeTurmaCurto(turma) (ex.: "2º J 2025"). O torneio
 * mata-mata (ver src/lib/tournament/) consome esses squads via
 * getBotSquadPool (src/lib/db/queries/tournaments.ts).
 *
 * Idempotente: turma já semeada (perfil e/ou squad já existentes) é pulada,
 * rodar de novo não duplica nada. Não mexe nos bots antigos por dificuldade
 * (bot_facil_1 etc.) nem nos squads deles — saíram de circulação só pelo
 * filtro de username em getBotSquadIdAleatorio/getBotSquadPool, sem apagar
 * histórico de partidas já jogadas contra eles.
 *
 * turmaTemElencoCompleto (src/lib/squad/formSquad.ts) não pode ser importada
 * aqui: o arquivo é "server-only", que lança erro em qualquer import fora de
 * Server Component/bundler Next.js — inclusive rodando este script via tsx.
 * A checagem (>= 1 goleiro, 1 fixo, 2 alas, 1 pivô ativos) está replicada
 * abaixo, junto com o critério de escalação de formarSquadDaTurma (melhor
 * aluno por vaga: goleiro pelo atributo `goleiro`, demais por overall).
 *
 * Uso: npm run seed:bots
 */
import "./load-env";
import { randomUUID } from "node:crypto";
import { and, eq, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, squads, squadSlots, alunos, turmas } from "@/lib/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDEM_POSICOES, SLOTS_POR_POSICAO_JOGADOR } from "@/lib/draft/positionOrder";
import {
  nomeTurmaCurto,
  POSICOES_JOGADOR,
  type PosicaoFutsal,
  type PosicaoJogador,
} from "@/types/domain";

/** Réplica de MINIMO_POR_POSICAO em src/lib/squad/formSquad.ts (não pode ser
 * importado aqui, ver cabeçalho do arquivo). */
const MINIMO_POR_POSICAO: Record<PosicaoJogador, number> = {
  GOLEIRO: 1,
  FIXO: 1,
  ALA: 2,
  PIVO: 1,
};

/** Vaga do squad -> posição natural do jogador que a preenche (inverso de
 * SLOTS_POR_POSICAO_JOGADOR, mesma derivação de formSquad.ts). */
const SLOT_PARA_POSICAO_JOGADOR: Record<PosicaoFutsal, PosicaoJogador> = Object.fromEntries(
  POSICOES_JOGADOR.flatMap((pj) => SLOTS_POR_POSICAO_JOGADOR[pj].map((slot) => [slot, pj]))
) as Record<PosicaoFutsal, PosicaoJogador>;

async function main() {
  const turmasAtivas = await db.select().from(turmas).where(eq(turmas.ativa, true));
  if (turmasAtivas.length === 0) {
    console.error("Nenhuma turma ativa cadastrada. Importe turmas/alunos antes de rodar este script.");
    process.exit(1);
  }

  const admin = createAdminClient();
  let criados = 0;
  let pulados = 0;

  for (const turma of turmasAtivas) {
    const nomeCurto = nomeTurmaCurto(turma);
    const alunosDaTurma = await db
      .select()
      .from(alunos)
      .where(and(eq(alunos.turmaId, turma.id), eq(alunos.ativo, true)));

    const candidatosPorPosicao = new Map<PosicaoJogador, typeof alunosDaTurma>();
    for (const pj of POSICOES_JOGADOR) {
      const candidatos = alunosDaTurma
        .filter((a) => a.posicao === pj)
        .sort((a, b) => (pj === "GOLEIRO" ? b.goleiro - a.goleiro : (b.overall ?? -1) - (a.overall ?? -1)));
      candidatosPorPosicao.set(pj, candidatos);
    }

    const elencoCompleto = (Object.keys(MINIMO_POR_POSICAO) as PosicaoJogador[]).every(
      (pj) => (candidatosPorPosicao.get(pj)?.length ?? 0) >= MINIMO_POR_POSICAO[pj]
    );
    if (!elencoCompleto) {
      console.log(`Turma ${nomeCurto}: elenco incompleto, pulando.`);
      pulados++;
      continue;
    }

    const username = `bot_turma_${turma.id}`;
    const email = `bot-turma-${turma.id}@unidraft.local`;

    let [profile] = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);

    if (!profile) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: randomUUID(),
        email_confirm: true,
        user_metadata: { username, display_name: nomeCurto, is_bot: true },
      });
      if (error || !data.user) {
        console.error(`Erro ao criar usuário do bot da turma ${nomeCurto}:`, error?.message);
        continue;
      }
      [profile] = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1);
      console.log(`Criado auth user + profile para turma ${nomeCurto} (${username}).`);
    }

    const [squadExistente] = await db.select().from(squads).where(eq(squads.userId, profile.id)).limit(1);
    if (squadExistente) {
      console.log(`Turma ${nomeCurto} já tem squad (${squadExistente.id}), pulando.`);
      pulados++;
      continue;
    }

    const usados = new Map<PosicaoJogador, number>();
    const alunoIdPorSlot = new Map<PosicaoFutsal, string>();
    for (const slot of ORDEM_POSICOES) {
      const posicaoJogador = SLOT_PARA_POSICAO_JOGADOR[slot];
      const indice = usados.get(posicaoJogador) ?? 0;
      const candidato = candidatosPorPosicao.get(posicaoJogador)?.[indice];
      if (!candidato) {
        // Não deveria acontecer (já checamos elencoCompleto acima), mas não
        // arrisca criar squad pela metade.
        throw new Error(`Turma ${nomeCurto} sem jogador de posição ${posicaoJogador} para a vaga ${slot}.`);
      }
      alunoIdPorSlot.set(slot, candidato.id);
      usados.set(posicaoJogador, indice + 1);
    }

    await db.transaction(async (tx) => {
      const [squad] = await tx
        .insert(squads)
        .values({ userId: profile.id, nome: nomeCurto, draftConcluido: true })
        .returning({ id: squads.id });

      await tx.insert(squadSlots).values(
        ORDEM_POSICOES.map((posicao) => ({
          squadId: squad.id,
          posicao,
          alunoId: alunoIdPorSlot.get(posicao)!,
          preenchidaEm: new Date(),
        }))
      );
    });

    console.log(`Squad criado para a turma ${nomeCurto}.`);
    criados++;
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(profiles)
    .where(and(eq(profiles.isBot, true), like(profiles.username, "bot_%")));

  console.log(
    `\nConcluído: ${criados} squad(s) de turma criado(s), ${pulados} turma(s) pulada(s) (sem elenco ou já semeada). Total de bots (todas as convenções) no banco: ${total}.`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
