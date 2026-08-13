import { listAllTurmasOrdenadas } from "@/lib/db/queries/turmas";
import { AlunoForm } from "@/components/admin/AlunoForm";

export default async function NovoAlunoPage({
  searchParams,
}: PageProps<"/admin/alunos/novo">) {
  const { turmaId } = await searchParams;
  const turmas = await listAllTurmasOrdenadas();

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Novo aluno</h2>
      <AlunoForm
        turmas={turmas}
        turmaIdPadrao={typeof turmaId === "string" ? turmaId : undefined}
      />
    </div>
  );
}
