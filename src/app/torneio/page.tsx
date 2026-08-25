import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlayerIdentity } from "@/lib/auth/guards";
import { getSquadByIdentity } from "@/lib/db/queries/squads";
import { getActiveTournamentForIdentity } from "@/lib/db/queries/tournaments";
import { CriarTorneioForm } from "@/components/tournament/CriarTorneioForm";
import { EntrarLobbyForm } from "@/components/tournament/EntrarLobbyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TorneioPage() {
  const identity = await requirePlayerIdentity();

  const ativo = await getActiveTournamentForIdentity(identity);
  if (ativo) {
    redirect(`/torneio/${ativo.id}`);
  }

  const squad = await getSquadByIdentity(identity);
  if (!squad || !squad.draftConcluido) {
    redirect("/meu-time");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Criar torneio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-1 text-sm text-muted-foreground">
            Escolha o tamanho do mata-mata. As vagas restantes são preenchidas com times de
            turma sorteados na hora — convide um amigo com o código da sala pra jogar junto
            no mesmo chaveamento.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Vai jogar com <span className="font-medium text-foreground">{squad.nome}</span>.{" "}
            <Link href="/jogar" className="text-primary underline underline-offset-2">
              Sortear um time novo
            </Link>{" "}
            antes de criar o torneio, se quiser trocar.
          </p>
          <CriarTorneioForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entrar com código</CardTitle>
        </CardHeader>
        <CardContent>
          <EntrarLobbyForm />
        </CardContent>
      </Card>
    </div>
  );
}
