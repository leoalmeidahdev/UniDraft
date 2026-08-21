import Link from "next/link";
import type { ReactNode } from "react";
import { GraduationCap, Shirt, Trophy, BookOpen } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

function Num({ children }: { children: ReactNode }) {
  return <span className="num text-destaque font-semibold">{children}</span>;
}

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Sobre o Uni Draft
        </h1>
        <p className="mt-2 text-muted-foreground">
          Um jogo de montar times com a galera da própria escola.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <Card>
          <CardContent className="flex gap-3">
            <GraduationCap
              className="size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">
              O Uni Draft é um jogo de montar times inspirado no 7a0, o
              simulador de draft de Copa do Mundo que viralizou entre
              torcedores de futebol. Em vez de sortear seleções nacionais e
              craques históricos, o Uni Draft sorteia{" "}
              <strong className="text-foreground">
                turmas da nossa escola
              </strong>{" "}
              e o time é montado com os próprios colegas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex gap-3">
            <Shirt className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">
              A ideia é simples: cada turma (ano letivo, série e letra) é um
              &quot;elenco&quot;. A cada rolagem uma turma é sorteada e você
              escolhe um colega dela pra ocupar uma posição, até fechar seu
              time de futsal <Num>5x5</Num> — do <Num>1º</Num> ao{" "}
              <Num>3º</Num> ano, turmas A a L, das turmas de 2024, 2025 e
              2026. Não precisa de conta, e você pode pedir outra sala ou a
              mesma sala de outro ano antes de escolher.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex gap-3">
            <Trophy className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">
              Depois de montado, seu time pode jogar contra o computador
              (sem conta) ou desafiar o time de um amigo (com conta) para
              uma partida simulada de <Num>90</Num> minutos, assistida em
              tempo real por quem topar o desafio.
            </p>
          </CardContent>
        </Card>

        <Alert>
          <BookOpen aria-hidden="true" />
          <AlertTitle>Quer entender as regras completas?</AlertTitle>
          <AlertDescription>
            Veja a página{" "}
            <Link href="/como-jogar">Como Jogar</Link> para as regras
            completas das rodadas, das posições e das partidas.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
