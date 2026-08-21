import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { listChallengesForUser } from "@/lib/db/queries/challenges";
import { acceptChallengeAction, declineChallengeAction } from "@/lib/challenge/actions";
import { ChallengeRealtimeListener } from "@/components/challenge/ChallengeRealtimeListener";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aceito: "Aceito",
  recusado: "Recusado",
  cancelado: "Cancelado",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

export default async function DesafiosPage() {
  const user = await requireUser();
  const todos = await listChallengesForUser(user.id);

  const recebidosPendentes = todos.filter(
    (c) => c.challengedUserId === user.id && c.status === "pendente"
  );
  const outros = todos.filter(
    (c) => !(c.challengedUserId === user.id && c.status === "pendente")
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-8">
      <ChallengeRealtimeListener userId={user.id} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Desafios</h1>
        <Button render={<Link href="/desafios/novo" />}>Novo desafio</Button>
      </div>

      {recebidosPendentes.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Recebidos</h2>
          <div className="flex flex-col gap-2">
            {recebidosPendentes.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <span>{c.challenger.displayName} te desafiou</span>
                  <div className="flex gap-2">
                    <form action={acceptChallengeAction}>
                      <input type="hidden" name="challengeId" value={c.id} />
                      <Button type="submit" size="sm">Aceitar</Button>
                    </form>
                    <form action={declineChallengeAction}>
                      <input type="hidden" name="challengeId" value={c.id} />
                      <Button type="submit" size="sm" variant="outline">Recusar</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Histórico</h2>
        {outros.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum desafio ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {outros.map((c) => {
              // Desafio contra bot não passa mais pela tabela challenges (ver
              // jogarContraBotAction em src/lib/match/actions.ts), então só
              // sobra o ramo de desafio de amigo aqui.
              const souEuOChallenger = c.challengerUserId === user.id;
              const nomeOponente = souEuOChallenger
                ? c.challenged?.displayName ?? "?"
                : c.challenger.displayName;
              return (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <span>
                      {souEuOChallenger ? "Você desafiou" : "Desafio de"} {nomeOponente}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{STATUS_LABEL[c.status]}</Badge>
                      {c.matchId && (
                        <Link href={`/partida/${c.matchId}`} className="text-sm underline">
                          Ver partida
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
