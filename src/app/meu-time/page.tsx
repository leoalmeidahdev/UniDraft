import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getUserSquad, getSquadFull } from "@/lib/db/queries/squads";
import { SquadFormationView } from "@/components/squad/SquadFormationView";
import { ORDEM_POSICOES } from "@/lib/draft/positionOrder";
import { Button } from "@/components/ui/button";

export default async function MeuTimePage() {
  const user = await requireUser();
  const squadResumo = await getUserSquad(user.id);

  if (!squadResumo) {
    redirect("/draft");
  }
  if (!squadResumo.draftConcluido) {
    redirect(`/draft/${squadResumo.id}`);
  }

  const squad = await getSquadFull(squadResumo.id);
  if (!squad) {
    redirect("/draft");
  }

  const slots = ORDEM_POSICOES.map((posicao) => {
    const slot = squad.slots.find((s) => s.posicao === posicao);
    return {
      posicao,
      aluno: slot?.aluno
        ? {
            nome: slot.aluno.nome,
            apelido: slot.aluno.apelido,
            overall: slot.aluno.overall,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{squad.nome}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href="/meu-time/historico" />}>
            Histórico do draft
          </Button>
          <Button size="sm" render={<Link href="/desafios/novo" />}>
            Desafiar
          </Button>
        </div>
      </div>
      <SquadFormationView squadId={squad.id} slots={slots} />
    </div>
  );
}
