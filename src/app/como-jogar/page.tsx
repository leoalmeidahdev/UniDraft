const SECOES = [
  {
    titulo: "1. O sorteio de turmas",
    paragrafos: [
      "Ao iniciar um draft, você escolhe o modo de jogo: Clássico (os atributos dos colegas ficam visíveis) ou Às Cegas (os atributos ficam ocultos até você escalar o jogador).",
      "A cada rodada, o sistema sorteia uma turma da escola — ano letivo (2024, 2025 ou 2026), série (1º ao 3º ano) e letra (A a L). Você vê a lista de colegas daquela turma e escolhe um deles para o seu time.",
    ],
  },
  {
    titulo: "2. As posições do futsal",
    paragrafos: [
      "Seu time tem 5 posições fixas: Goleiro, Fixo, dois Alas e Pivô. A cada rodada você escolhe qual posição em aberto vai preencher com o colega sorteado.",
      "Depois de escalado, um colega nunca pode ser removido do time — você só pode trocar sua posição com outro colega já escalado (por exemplo, trocar um Ala de posição com o Pivô), nunca substituí-lo por outro jogador.",
    ],
  },
  {
    titulo: "3. Completando o time",
    paragrafos: [
      "O draft termina quando as 5 posições estiverem preenchidas. A partir daí, seu time fica salvo em \"Meu Time\" e pronto para entrar em campo.",
    ],
  },
  {
    titulo: "4. Desafios: amigos e bots",
    paragrafos: [
      "Com o time completo, você pode desafiar um amigo (que também precisa ter um time completo) ou um bot em uma de três dificuldades.",
      "Ao aceitar um desafio, a partida é simulada com base nos atributos dos 5 titulares de cada time. O resultado já sai definido, mas é revelado aos poucos: você assiste ao placar e aos eventos (gols, defesas, faltas) rolando em tempo real, como se estivesse acompanhando o jogo ao vivo — e se for contra um amigo, os dois assistem sincronizados ao mesmo tempo.",
    ],
  },
];

export default function ComoJogarPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Como Jogar</h1>
      <div className="mt-8 flex flex-col gap-8">
        {SECOES.map((secao) => (
          <section key={secao.titulo}>
            <h2 className="text-xl font-semibold">{secao.titulo}</h2>
            <div className="mt-2 flex flex-col gap-2 text-muted-foreground">
              {secao.paragrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
