import Link from "next/link";
import {
  Play,
  Users,
  Dices,
  UserPlus,
  Repeat,
  Clock,
  Flag,
  Star,
  Timer,
  Trophy,
  ArrowRight,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOptionalUser } from "@/lib/auth/guards";

const PASSOS_MONTAGEM = [
  {
    numero: "1",
    icone: Dices,
    titulo: "Role a sala",
    descricao:
      "Pra cada posição, uma turma inteira da escola é sorteada — ano, série e letra.",
  },
  {
    numero: "2",
    icone: UserPlus,
    titulo: "Escolha um colega",
    descricao:
      "Veja o elenco da turma sorteada e escolha quem entra naquela posição do seu time.",
  },
  {
    numero: "3",
    icone: Repeat,
    titulo: "Outra sala ou outro ano",
    descricao:
      "Não curtiu a turma? Sorteie Outra sala, ou Outro ano pra ver a mesma turma em outro ano letivo, antes de decidir. Repita até fechar as 5 posições.",
  },
] as const;

const DETALHES_PARTIDA = [
  {
    icone: Clock,
    titulo: "90 minutos, 2 tempos",
    descricao: (
      <>
        Cada partida simula os <span className="num text-destaque font-semibold">90</span>{" "}
        minutos completos, em dois tempos de{" "}
        <span className="num text-destaque font-semibold">45</span>.
      </>
    ),
  },
  {
    icone: Flag,
    titulo: "Faltas e cartões",
    descricao: (
      <>
        Amarelo, vermelho e limite de{" "}
        <span className="num text-destaque font-semibold">5</span> faltas por tempo — a
        partir da <span className="num text-destaque font-semibold">6ª</span>, cobrança
        direta com chance de gol bem maior.
      </>
    ),
  },
  {
    icone: Star,
    titulo: "Notas e destaque",
    descricao:
      "Cada jogador recebe uma nota de desempenho, e o melhor jogador da partida é destacado no fim do jogo.",
  },
  {
    icone: Timer,
    titulo: "Playback no seu ritmo",
    descricao:
      "Assista o jogo rolar em tempo real, acelere a velocidade ou pule direto pro resultado.",
  },
] as const;

export default async function HomePage() {
  const user = await getOptionalUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-marinho-gradiente">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/20">
            Futsal 5x5 com a galera da escola
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Uni Draft
          </h1>
          <p className="max-w-xl text-balance text-lg text-white/80">
            Role as salas, escolha um colega pra cada posição e assista a
            partida rolar minuto a minuto.
          </p>

          <div className="mt-2 flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <Button
                size="lg"
                className="gap-2 bg-white px-6 text-base text-marinho hover:bg-white/90"
                render={<Link href="/jogar" />}
              >
                <Play className="size-4" aria-hidden="true" />
                Jogar agora
              </Button>
              <span className="text-xs text-white/60">
                Offline, contra a CPU — sem precisar de conta
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/torneio" />}
              >
                <Users className="size-4" aria-hidden="true" />
                Com amigos
              </Button>
              <span className="text-xs text-white/60">
                Lobby de torneio — precisa de conta
              </span>
            </div>
          </div>

          {user && (
            <Link
              href="/meu-time"
              className="mt-2 inline-flex items-center gap-1 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              Ir para Meu Time
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Como você monta seu time
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sem draft chato: cada posição — Goleiro, Fixo, dois Alas e Pivô —
            é preenchida rolando salas até você achar o colega certo.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PASSOS_MONTAGEM.map((passo) => (
            <Card key={passo.titulo} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <passo.icone className="size-4.5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-base">{passo.titulo}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {passo.descricao}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              O que a partida simula
            </h2>
            <p className="mt-2 text-muted-foreground">
              Time montado, é só jogar contra a CPU — o motor de simulação
              cuida do resto.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DETALHES_PARTIDA.map((item) => (
              <Card key={item.titulo}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icone className="size-4.5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-base">{item.titulo}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.descricao}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Trophy className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Jogue com amigos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie um torneio em mata-mata de{" "}
                <span className="num font-medium text-foreground">8</span> ou{" "}
                <span className="num font-medium text-foreground">16</span>{" "}
                times e convide a galera com um código de lobby — as vagas
                que sobrarem são preenchidas com CPUs. Precisa de conta.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 sm:justify-self-end"
              render={<Link href="/torneio" />}
            >
              Ir para o lobby
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
