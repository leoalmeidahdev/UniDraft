import { requireUser } from "@/lib/auth/guards";
import { listFriendshipsForUser } from "@/lib/db/queries/friendships";
import { ChallengeForm } from "@/components/challenge/ChallengeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NovoDesafioPage() {
  const user = await requireUser();
  const relacoes = await listFriendshipsForUser(user.id);
  const amigos = relacoes
    .filter((r) => r.status === "aceito")
    .map((r) => r.otherUser);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo desafio</CardTitle>
        </CardHeader>
        <CardContent>
          <ChallengeForm amigos={amigos} />
        </CardContent>
      </Card>
    </div>
  );
}
