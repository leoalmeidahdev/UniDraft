import Papa from "papaparse";
import { z } from "zod";
import { SERIES_ENSINO, LETRAS_TURMA, POSICOES_JOGADOR, type PosicaoJogador } from "@/types/domain";

const ATRIBUTO_DEFAULT = 50;

const linhaCsvSchema = z.object({
  ano_letivo: z.coerce.number().int().min(2000).max(2100),
  serie: z.enum(SERIES_ENSINO),
  letra: z
    .string()
    .trim()
    .toUpperCase()
    .refine((l) => (LETRAS_TURMA as readonly string[]).includes(l), {
      message: `letra deve ser entre ${LETRAS_TURMA[0]} e ${LETRAS_TURMA.at(-1)}`,
    }),
  nome_aluno: z.string().trim().min(1, "nome_aluno é obrigatório"),
  apelido: z.string().trim().optional(),
  posicao: z
    .string()
    .trim()
    .toUpperCase()
    .refine((p) => (POSICOES_JOGADOR as readonly string[]).includes(p), {
      message: `posicao deve ser uma de ${POSICOES_JOGADOR.join(", ")}`,
    })
    .optional(),
  ataque: z.coerce.number().int().min(0).max(99).optional(),
  defesa: z.coerce.number().int().min(0).max(99).optional(),
  tecnica: z.coerce.number().int().min(0).max(99).optional(),
  velocidade: z.coerce.number().int().min(0).max(99).optional(),
  fisico: z.coerce.number().int().min(0).max(99).optional(),
  goleiro: z.coerce.number().int().min(0).max(99).optional(),
});

export interface AlunoCsvRow {
  anoLetivo: number;
  serie: "1" | "2" | "3";
  letra: string;
  nome: string;
  apelido: string | null;
  posicao: PosicaoJogador | null;
  ataque: number;
  defesa: number;
  tecnica: number;
  velocidade: number;
  fisico: number;
  goleiro: number;
  /** true quando algum atributo veio em branco (ou a posição não veio) e recebeu o
   * default — precisa revisão de um admin */
  precisaRevisao: boolean;
}

export interface ParseAlunosCsvResult {
  rows: AlunoCsvRow[];
  errors: { linha: number; mensagem: string }[];
}

/** Converte string vazia em undefined antes de validar (linhas de planilha exportam "" para campos em branco). */
function limparRegistroVazio(registro: Record<string, string>) {
  const limpo: Record<string, string | undefined> = {};
  for (const [chave, valor] of Object.entries(registro)) {
    limpo[chave] = valor.trim() === "" ? undefined : valor;
  }
  return limpo;
}

export function parseAlunosCsv(csvText: string): ParseAlunosCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: AlunoCsvRow[] = [];
  const errors: ParseAlunosCsvResult["errors"] = [];

  parsed.data.forEach((registro, index) => {
    const numeroLinha = index + 2; // +1 header, +1 índice 1-based
    const resultado = linhaCsvSchema.safeParse(limparRegistroVazio(registro));

    if (!resultado.success) {
      errors.push({
        linha: numeroLinha,
        mensagem: resultado.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      });
      return;
    }

    const dado = resultado.data;
    const algumAtributoFaltando = [
      dado.ataque,
      dado.defesa,
      dado.tecnica,
      dado.velocidade,
      dado.fisico,
    ].some((v) => v === undefined);

    rows.push({
      anoLetivo: dado.ano_letivo,
      serie: dado.serie,
      letra: dado.letra,
      nome: dado.nome_aluno,
      apelido: dado.apelido ?? null,
      posicao: (dado.posicao as PosicaoJogador | undefined) ?? null,
      ataque: dado.ataque ?? ATRIBUTO_DEFAULT,
      defesa: dado.defesa ?? ATRIBUTO_DEFAULT,
      tecnica: dado.tecnica ?? ATRIBUTO_DEFAULT,
      velocidade: dado.velocidade ?? ATRIBUTO_DEFAULT,
      fisico: dado.fisico ?? ATRIBUTO_DEFAULT,
      goleiro: dado.goleiro ?? 20,
      precisaRevisao: algumAtributoFaltando || !dado.posicao,
    });
  });

  if (parsed.errors.length > 0) {
    parsed.errors.forEach((e) =>
      errors.push({ linha: (e.row ?? 0) + 2, mensagem: e.message })
    );
  }

  return { rows, errors };
}
