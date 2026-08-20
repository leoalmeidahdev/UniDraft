"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { turmas, alunos } from "@/lib/db/schema";
import { parseAlunosCsv } from "@/lib/csv/parseAlunosCsv";
import { importAlunosRows } from "@/lib/csv/importAlunos";
import { SERIES_ENSINO, LETRAS_TURMA, POSICOES_JOGADOR } from "@/types/domain";

export interface AdminActionState {
  error?: string;
  success?: string;
}

const atributo = z.coerce.number().int().min(0).max(99);

// ---------------------------------------------------------------- Turmas

const turmaSchema = z.object({
  anoLetivo: z.coerce.number().int().min(2000).max(2100),
  serie: z.enum(SERIES_ENSINO),
  letra: z.enum(LETRAS_TURMA),
});

export async function createTurmaAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = turmaSchema.safeParse({
    anoLetivo: formData.get("anoLetivo"),
    serie: formData.get("serie"),
    letra: formData.get("letra"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await db.insert(turmas).values(parsed.data);
  } catch {
    return { error: "Essa turma já existe." };
  }

  revalidatePath("/admin/turmas");
  return { success: "Turma criada." };
}

export async function toggleTurmaAtivaAction(formData: FormData) {
  await requireAdmin();
  const turmaId = String(formData.get("turmaId") ?? "");
  const ativa = formData.get("ativa") === "true";
  if (!turmaId) return;

  await db.update(turmas).set({ ativa: !ativa }).where(eq(turmas.id, turmaId));
  revalidatePath("/admin/turmas");
}

// ---------------------------------------------------------------- Alunos

const alunoSchema = z.object({
  turmaId: z.string().uuid("Selecione uma turma"),
  nome: z.string().trim().min(1, "Informe o nome"),
  apelido: z.string().trim().optional(),
  posicao: z.enum(POSICOES_JOGADOR),
  ataque: atributo,
  defesa: atributo,
  tecnica: atributo,
  velocidade: atributo,
  fisico: atributo,
  goleiro: atributo,
  ativo: z.coerce.boolean().optional(),
});

export async function createAlunoAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const parsed = alunoSchema.safeParse({
    turmaId: formData.get("turmaId"),
    nome: formData.get("nome"),
    apelido: formData.get("apelido") || undefined,
    posicao: formData.get("posicao"),
    ataque: formData.get("ataque"),
    defesa: formData.get("defesa"),
    tecnica: formData.get("tecnica"),
    velocidade: formData.get("velocidade"),
    fisico: formData.get("fisico"),
    goleiro: formData.get("goleiro"),
    ativo: formData.get("ativo") ? true : false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(alunos).values({ ...parsed.data, createdBy: admin.id });
  revalidatePath("/admin/alunos");
  redirect("/admin/alunos");
}

export async function updateAlunoAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const alunoId = String(formData.get("alunoId") ?? "");
  if (!alunoId) return { error: "Aluno inválido." };

  const parsed = alunoSchema.safeParse({
    turmaId: formData.get("turmaId"),
    nome: formData.get("nome"),
    apelido: formData.get("apelido") || undefined,
    posicao: formData.get("posicao"),
    ataque: formData.get("ataque"),
    defesa: formData.get("defesa"),
    tecnica: formData.get("tecnica"),
    velocidade: formData.get("velocidade"),
    fisico: formData.get("fisico"),
    goleiro: formData.get("goleiro"),
    ativo: formData.get("ativo") ? true : false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.update(alunos).set(parsed.data).where(eq(alunos.id, alunoId));
  revalidatePath("/admin/alunos");
  redirect("/admin/alunos");
}

// ---------------------------------------------------------------- Importar CSV

export interface ImportCsvState {
  error?: string;
  resumo?: { turmasCriadas: number; alunosCriados: number; alunosParaRevisar: number };
  linhasComErro?: { linha: number; mensagem: string }[];
}

export async function importCsvAction(
  _prevState: ImportCsvState,
  formData: FormData
): Promise<ImportCsvState> {
  const admin = await requireAdmin();

  const arquivo = formData.get("csv");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }

  const csvText = await arquivo.text();
  const { rows, errors } = parseAlunosCsv(csvText);

  if (rows.length === 0) {
    return { error: "Nenhuma linha válida encontrada no CSV.", linhasComErro: errors };
  }

  const resumo = await importAlunosRows(rows, admin.id);

  revalidatePath("/admin/alunos");
  revalidatePath("/admin/turmas");
  return { resumo, linhasComErro: errors.length > 0 ? errors : undefined };
}
