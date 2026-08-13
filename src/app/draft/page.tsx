import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getUserSquad } from "@/lib/db/queries/squads";
import { StartDraftForm } from "@/components/draft/StartDraftForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DraftPage() {
  const user = await requireUser();
  const squad = await getUserSquad(user.id);

  if (squad) {
    redirect(squad.draftConcluido ? "/meu-time" : `/draft/${squad.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Começar meu time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            Escolha o modo de jogo. A cada rodada uma turma da escola é
            sorteada e você escolhe um colega dela para completar seu time
            de futsal 5x5.
          </p>
          <StartDraftForm />
        </CardContent>
      </Card>
    </div>
  );
}
