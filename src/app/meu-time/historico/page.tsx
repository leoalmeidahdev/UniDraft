import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getUserSquad, getSquadFull } from "@/lib/db/queries/squads";
import { POSICAO_LABEL, nomeTurma } from "@/types/domain";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function HistoricoDraftPage() {
  const user = await requireUser();
  const squadResumo = await getUserSquad(user.id);
  if (!squadResumo) redirect("/draft");

  const squad = await getSquadFull(squadResumo.id);
  if (!squad?.draftSession) redirect("/draft");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Histórico do draft</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rodada</TableHead>
            <TableHead>Turma sorteada</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead>Escolhido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {squad.draftSession.rounds.map((rodada) => (
            <TableRow key={rodada.id}>
              <TableCell>{rodada.rodadaNumero}</TableCell>
              <TableCell>{nomeTurma(rodada.turmaSorteada)}</TableCell>
              <TableCell>{POSICAO_LABEL[rodada.posicaoAlvo]}</TableCell>
              <TableCell>{rodada.alunoEscolhido?.nome ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
