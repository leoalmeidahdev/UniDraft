/**
 * Cria (se ainda não existirem) os 3 perfis de bot (fácil/médio/difícil) e um squad
 * completo para cada um, sorteado a partir dos alunos já cadastrados. Rodar depois de
 * importar pelo menos alguns alunos (npm run seed:import).
 * Uso: npm run seed:bots
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, squads, squadSlots, alunos } from "@/lib/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDEM_POSICOES } from "@/lib/draft/positionOrder";
import type { BotDificuldade } from "@/types/domain";

const BOTS: { dificuldade: BotDificuldade; username: string; displayName: string; email: string }[] = [
  { dificuldade: "facil", username: "bot_facil", displayName: "Bot Fácil", email: "bot-facil@unidraft.local" },
  { dificuldade: "medio", username: "bot_medio", displayName: "Bot Médio", email: "bot-medio@unidraft.local" },
  { dificuldade: "dificil", username: "bot_dificil", displayName: "Bot Difícil", email: "bot-dificil@unidraft.local" },
];

function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function main() {
  const todosAlunos = await db.select().from(alunos).where(eq(alunos.ativo, true)).orderBy(asc(alunos.overall));
  if (todosAlunos.length < 5) {
    console.error(`Só há ${todosAlunos.length} aluno(s) ativo(s). Importe pelo menos 5 antes de rodar este script.`);
    process.exit(1);
  }

  const admin = createAdminClient();
  const tercio = Math.max(1, Math.floor(todosAlunos.length / 3));
  const pools: Record<BotDificuldade, typeof todosAlunos> = {
    facil: todosAlunos.slice(0, tercio),
    medio: todosAlunos.slice(tercio, tercio * 2),
    dificil: todosAlunos.slice(tercio * 2),
  };

  for (const bot of BOTS) {
    let [profile] = await db.select().from(profiles).where(eq(profiles.username, bot.username)).limit(1);

    if (!profile) {
      const { data, error } = await admin.auth.admin.createUser({
        email: bot.email,
        password: randomUUID(),
        email_confirm: true,
        user_metadata: { username: bot.username, display_name: bot.displayName, is_bot: true },
      });
      if (error || !data.user) {
        console.error(`Erro ao criar usuário do ${bot.displayName}:`, error?.message);
        continue;
      }
      [profile] = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1);
      console.log(`Criado auth user + profile para ${bot.displayName}`);
    }

    const [squadExistente] = await db.select().from(squads).where(eq(squads.userId, profile.id)).limit(1);
    if (squadExistente) {
      console.log(`${bot.displayName} já tem squad (${squadExistente.id}), pulando.`);
      continue;
    }

    const pool = pools[bot.dificuldade].length >= 5 ? pools[bot.dificuldade] : todosAlunos;
    const escolhidos = embaralhar(pool).slice(0, 5);
    const goleiro = [...escolhidos].sort((a, b) => b.goleiro - a.goleiro)[0];
    const restantes = embaralhar(escolhidos.filter((a) => a.id !== goleiro.id));
    const outrasPosicoes = ORDEM_POSICOES.filter((p) => p !== "GOLEIRO");

    await db.transaction(async (tx) => {
      const [squad] = await tx
        .insert(squads)
        .values({ userId: profile.id, nome: `Time do ${bot.displayName}`, draftConcluido: true })
        .returning({ id: squads.id });

      await tx.insert(squadSlots).values([
        { squadId: squad.id, posicao: "GOLEIRO", alunoId: goleiro.id, preenchidaEm: new Date() },
        ...outrasPosicoes.map((posicao, i) => ({
          squadId: squad.id,
          posicao,
          alunoId: restantes[i].id,
          preenchidaEm: new Date(),
        })),
      ]);
    });

    console.log(`Squad criado para ${bot.displayName}.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
