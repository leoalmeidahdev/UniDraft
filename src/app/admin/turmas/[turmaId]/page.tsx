import Link from "next/link";
import { notFound } from "next/navigation";
import { getTurmaComAlunosAdmin } from "@/lib/db/queries/turmas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { nomeTurma } from "@/types/domain";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminTurmaDetailPage({
  params,
}: PageProps<"/admin/turmas/[turmaId]">) {
  const { turmaId } = await params;
  const turma = await getTurmaComAlunosAdmin(turmaId);
  if (!turma) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{nomeTurma(turma)}</h2>
        <Button size="sm" render={<Link href={`/admin/alunos/novo?turmaId=${turma.id}`} />}>
          Adicionar aluno
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Overall</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {turma.alunos.map((aluno) => (
            <TableRow key={aluno.id}>
              <TableCell>
                {aluno.nome}
                {aluno.apelido && (
                  <span className="text-muted-foreground"> &quot;{aluno.apelido}&quot;</span>
                )}
              </TableCell>
              <TableCell>{aluno.overall}</TableCell>
              <TableCell>
                <Badge variant={aluno.ativo ? "default" : "secondary"}>
                  {aluno.ativo ? "Ativo" : "Revisar"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/alunos/${aluno.id}/editar`}
                  className="text-sm underline"
                >
                  Editar
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
