import { redirect } from "next/navigation";

export default async function ResultadoPartidaPage({
  params,
}: PageProps<"/partida/[matchId]/resultado">) {
  const { matchId } = await params;
  // A própria tela da partida já mostra o estado "finalizada" automaticamente.
  redirect(`/partida/${matchId}`);
}
