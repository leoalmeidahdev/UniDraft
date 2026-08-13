import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOptionalUser } from "@/lib/auth/guards";

export default async function HomePage() {
  const user = await getOptionalUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Uni Draft
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Sorteie turmas da escola, escolha colegas para montar seu time de
            futsal 5x5 e desafie amigos e bots em partidas ao vivo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<Link href={user ? "/draft" : "/cadastro"} />}>
              {user ? "Ir para o Draft" : "Criar meu time"}
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/como-jogar" />}>
              Como jogar
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Sorteie turmas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A cada rodada, uma turma da escola (ano, série e letra) é
            sorteada. Escolha um colega dela para o seu time.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Monte seu 5x5</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Complete as 5 posições do futsal: Goleiro, Fixo, dois Alas e
            Pivô. Depois, só é possível trocar posição, nunca remover.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Desafie e assista ao vivo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Desafie um amigo ou um bot. A partida é simulada e assistida em
            tempo real, com placar e eventos rolando ao vivo.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
