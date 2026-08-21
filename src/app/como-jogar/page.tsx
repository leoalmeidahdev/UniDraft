import type { ElementType, ReactNode } from "react";
import { Dices, Users, Clock, Swords } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Secao {
  titulo: string;
  icone: ElementType;
  paragrafos: ReactNode[];
}

function Num({ children }: { children: ReactNode }) {
  return <span className="num text-destaque font-semibold">{children}</span>;
}

const SECOES: Secao[] = [
  {
    titulo: "Rodada rápida, sem conta",
    icone: Dices,
    paragrafos: [
      <>
        Não existe conta obrigatória: clique em &quot;Jogar agora&quot;,
        escolha a formação e o estilo do time e monte o elenco rolando
        salas — a cada rolagem, uma turma da escola é sorteada (ano letivo,
        série e letra) e você escolhe um colega dela pra ocupar a posição
        da vez, repetindo até fechar as <Num>5</Num> posições.
      </>,
      <>
        Não curtiu a turma sorteada? Peça &quot;Outra sala&quot; pra sortear
        outra turma, ou &quot;Outro ano&quot; pra ver a mesma turma em outro
        ano letivo, antes de escolher o colega.
      </>,
    ],
  },
  {
    titulo: "As posições do futsal",
    icone: Users,
    paragrafos: [
      <>
        Seu time tem <Num>5</Num> posições fixas: Goleiro, Fixo, dois Alas e
        Pivô. Cada colega só pode ocupar a posição em que ele joga, então a
        sala sorteada precisa ter alguém pra vaga que você quer preencher.
      </>,
      <>
        A formação escolhida antes do sorteio — Diamante (1-2-1), Quadrado
        (2-2), Pinha (3-1) ou Sem pivô (4-0) — muda como o time se comporta
        em campo, e o estilo (defensivo, equilibrado ou ofensivo) muda o
        quanto ele arrisca.
      </>,
      <>
        Você pode trocar a posição de dois colegas já escalados entre si
        (por exemplo, trocar um Ala de posição com o Pivô) em &quot;Meu
        Time&quot;.
      </>,
    ],
  },
  {
    titulo: "A partida: 90 minutos em 2 tempos",
    icone: Clock,
    paragrafos: [
      <>
        Cada jogo simula uma partida completa de futsal: dois tempos de{" "}
        <Num>45</Num> minutos, com faltas, cartões amarelo e vermelho, e
        limite de <Num>5</Num> faltas por tempo — a partir da <Num>6ª</Num>,
        o time adversário ganha uma cobrança direta com chance de gol bem
        maior.
      </>,
      <>
        Ao final, cada jogador recebe uma nota de desempenho e o melhor
        jogador da partida é destacado.
      </>,
    ],
  },
  {
    titulo: "Contra o computador ou contra amigos",
    icone: Swords,
    paragrafos: [
      <>
        Com o time formado, você já pode jogar contra o computador sem
        precisar de conta: o adversário é sempre uma turma real da escola,
        sorteada na hora e escalada só com alunos dela.
      </>,
      <>
        Pra desafiar um amigo é preciso ter uma conta. A partida é simulada
        com base nos atributos dos <Num>5</Num> titulares de cada time; o
        resultado já sai definido, mas é revelado aos poucos, com opção de
        acelerar a velocidade ou pular direto pro resultado.
      </>,
    ],
  },
];

export default function ComoJogarPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Como Jogar
        </h1>
        <p className="mt-2 text-muted-foreground">
          Do sorteio da primeira sala ao apito final, é assim que uma
          partida de Uni Draft acontece.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-5">
        {SECOES.map((secao, index) => (
          <Card key={secao.titulo}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <secao.icone
                  className="size-4.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <CardTitle className="text-lg">{secao.titulo}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-muted-foreground">
              {secao.paragrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
