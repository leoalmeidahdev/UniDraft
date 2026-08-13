import Link from "next/link";
import { listTurmasComContagem } from "@/lib/db/queries/turmas";
import { toggleTurmaAtivaAction } from "@/lib/admin/actions";
import { TurmaForm } from "@/components/admin/TurmaForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SERIE_LABEL, type SerieEnsino } from "@/types/domain";

export default async function AdminTurmasPage() {
  const turmasLista = await listTurmasComContagem();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Nova turma</h2>
        <TurmaForm />
      </section>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Turma</TableHead>
            <TableHead>Alunos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {turmasLista.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/admin/turmas/${t.id}`} className="underline">
                  {t.anoLetivo} - {SERIE_LABEL[t.serie as SerieEnsino]} {t.letra}
                </Link>
              </TableCell>
              <TableCell>{t.totalAlunos}</TableCell>
              <TableCell>
                <Badge variant={t.ativa ? "default" : "secondary"}>
                  {t.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              <TableCell>
                <form action={toggleTurmaAtivaAction}>
                  <input type="hidden" name="turmaId" value={t.id} />
                  <input type="hidden" name="ativa" value={String(t.ativa)} />
                  <Button type="submit" variant="outline" size="sm">
                    {t.ativa ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
