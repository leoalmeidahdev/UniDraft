/**
 * Importa turmas + alunos a partir de um CSV (ver supabase/seed/alunos_seed_template.csv).
 * Uso: npm run seed:import -- caminho/para/arquivo.csv
 * Roda com DATABASE_URL (conexão direta ao Postgres), nunca no client.
 */
import "./load-env";
import { readFileSync } from "node:fs";
import { parseAlunosCsv } from "@/lib/csv/parseAlunosCsv";
import { importAlunosRows } from "@/lib/csv/importAlunos";

async function main() {
  const caminho = process.argv[2];
  if (!caminho) {
    console.error(
      "Uso: npm run seed:import -- caminho/para/arquivo.csv\n" +
        "Exemplo: npm run seed:import -- supabase/seed/alunos_seed_template.csv"
    );
    process.exit(1);
  }

  const csvText = readFileSync(caminho, "utf-8");
  const { rows, errors } = parseAlunosCsv(csvText);

  if (errors.length > 0) {
    console.warn(`${errors.length} linha(s) com erro (ignoradas):`);
    for (const e of errors) console.warn(`  linha ${e.linha}: ${e.mensagem}`);
  }

  const resumo = await importAlunosRows(rows);

  console.log(
    `Concluído: ${resumo.turmasCriadas} turma(s) criada(s), ${resumo.alunosCriados} aluno(s) importado(s)` +
      (resumo.alunosParaRevisar > 0
        ? ` (${resumo.alunosParaRevisar} marcados inativos por atributos faltando — revisar em /admin/alunos)`
        : "")
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
