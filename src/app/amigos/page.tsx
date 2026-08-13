import { requireUser } from "@/lib/auth/guards";
import { searchProfilesByUsername, listFriendshipsForUser } from "@/lib/db/queries/friendships";
import { respondFriendRequestAction, removeFriendshipAction } from "@/lib/social/actions";
import { AddFriendButton } from "@/components/social/AddFriendButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function AmigosPage({
  searchParams,
}: PageProps<"/amigos">) {
  const user = await requireUser();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  const [resultados, relacoes] = await Promise.all([
    searchProfilesByUsername(query, user.id),
    listFriendshipsForUser(user.id),
  ]);

  const amigos = relacoes.filter((r) => r.status === "aceito");
  const pendentesRecebidos = relacoes.filter(
    (r) => r.status === "pendente" && !r.souEuQuemPediu
  );
  const pendentesEnviados = relacoes.filter(
    (r) => r.status === "pendente" && r.souEuQuemPediu
  );
  const idsComRelacao = new Set(relacoes.map((r) => r.otherUser.id));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Amigos</h1>
        <form className="flex gap-2">
          <Input name="q" defaultValue={query} placeholder="Buscar por usuário..." />
          <Button type="submit">Buscar</Button>
        </form>
        {query.length >= 2 && (
          <div className="mt-3 flex flex-col gap-2">
            {resultados.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            )}
            {resultados.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{r.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{r.username}</div>
                </div>
                {idsComRelacao.has(r.id) ? (
                  <span className="text-xs text-muted-foreground">Já relacionado</span>
                ) : (
                  <AddFriendButton targetUserId={r.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pendentesRecebidos.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Pedidos recebidos</h2>
          <div className="flex flex-col gap-2">
            {pendentesRecebidos.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{r.otherUser.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{r.otherUser.displayName}</span>
                  </div>
                  <div className="flex gap-2">
                    <form action={respondFriendRequestAction}>
                      <input type="hidden" name="friendshipId" value={r.id} />
                      <input type="hidden" name="aceitar" value="true" />
                      <Button type="submit" size="sm">Aceitar</Button>
                    </form>
                    <form action={respondFriendRequestAction}>
                      <input type="hidden" name="friendshipId" value={r.id} />
                      <input type="hidden" name="aceitar" value="false" />
                      <Button type="submit" size="sm" variant="outline">Recusar</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {pendentesEnviados.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Pedidos enviados</h2>
          <div className="flex flex-col gap-2">
            {pendentesEnviados.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <span>{r.otherUser.displayName}</span>
                  <span className="text-xs text-muted-foreground">Aguardando resposta</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Meus amigos ({amigos.length})</h2>
        {amigos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem amigos adicionados. Busque pelo usuário acima.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {amigos.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{r.otherUser.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{r.otherUser.displayName}</span>
                  </div>
                  <form action={removeFriendshipAction}>
                    <input type="hidden" name="friendshipId" value={r.id} />
                    <Button type="submit" size="sm" variant="ghost">Remover</Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
