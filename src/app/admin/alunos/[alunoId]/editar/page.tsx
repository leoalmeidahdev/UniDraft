import { notFound } from "next/navigation";
import { getAlunoComTurma } from "@/lib/db/queries/alunos";
import { listAllTurmasOrdenadas } from "@/lib/db/queries/turmas";
import { AlunoForm } from "@/components/admin/AlunoForm";

export default async function EditarAlunoPage({
  params,
}: PageProps<"/admin/alunos/[alunoId]/editar">) {
  const { alunoId } = await params;
  const [aluno, turmas] = await Promise.all([
    getAlunoComTurma(alunoId),
    listAllTurmasOrdenadas(),
  ]);
  if (!aluno) notFound();

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Editar {aluno.nome}</h2>
      <AlunoForm turmas={turmas} aluno={aluno} />
    </div>
  );
}
