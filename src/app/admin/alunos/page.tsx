import Link from "next/link";
import { listAlunosComTurma } from "@/lib/db/queries/alunos";
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

export default async function AdminAlunosPage() {
  const alunosLista = await listAlunosComTurma();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" render={<Link href="/admin/alunos/novo" />}>
          Novo aluno
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Overall</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosLista.map((aluno) => (
            <TableRow key={aluno.id}>
              <TableCell>
                {aluno.nome}
                {aluno.apelido && (
                  <span className="text-muted-foreground"> &quot;{aluno.apelido}&quot;</span>
                )}
              </TableCell>
              <TableCell>{nomeTurma(aluno.turma)}</TableCell>
              <TableCell>{aluno.overall}</TableCell>
              <TableCell>
                <Badge variant={aluno.ativo ? "default" : "secondary"}>
                  {aluno.ativo ? "Ativo" : "Revisar"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/admin/alunos/${aluno.id}/editar`} className="text-sm underline">
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
