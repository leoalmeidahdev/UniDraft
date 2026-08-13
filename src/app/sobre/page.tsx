export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Sobre o Uni Draft</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground">
        <p>
          O Uni Draft é um jogo de montar times inspirado no 7a0, o
          simulador de draft de Copa do Mundo que viralizou entre torcedores
          de futebol. Em vez de sortear seleções nacionais e craques
          históricos, o Uni Draft sorteia <strong>turmas da nossa escola</strong> e
          o time é montado com os próprios colegas.
        </p>
        <p>
          A ideia é simples: cada turma (ano letivo, série e letra) é um
          &quot;elenco&quot; do qual você pode escolher jogadores. Ao final do
          draft, você tem um time de futsal 5x5 formado por colegas de
          diferentes turmas e anos — do 1º ao 3º ano, turmas A a L, das
          turmas de 2024, 2025 e 2026.
        </p>
        <p>
          Depois de montado, seu time pode desafiar o time de um amigo ou um
          bot para uma partida simulada, assistida em tempo real por quem
          topar o desafio.
        </p>
        <p>
          Para entender as regras completas do draft, das posições e das
          partidas, veja a página{" "}
          <a href="/como-jogar" className="underline">
            Como Jogar
          </a>
          .
        </p>
      </div>
    </div>
  );
}
