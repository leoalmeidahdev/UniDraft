import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IniciarTorneioForm } from "@/components/tournament/IniciarTorneioForm";

interface ParticipanteVM {
  id: string;
  nome: string;
  souEu: boolean;
}

export function LobbyView({
  tournamentId,
  bracketSize,
  lobbyCode,
  participantes,
  souHost,
}: {
  tournamentId: string;
  bracketSize: number;
  lobbyCode: string;
  participantes: ParticipanteVM[];
  souHost: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sala do torneio</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Código da sala</p>
          <p className="text-4xl font-bold tracking-[0.3em]">{lobbyCode}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mande esse código pro seu amigo entrar em /torneio.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            Jogadores ({participantes.length}/{bracketSize})
          </p>
          <ul className="flex flex-col gap-2">
            {participantes.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg border p-3">
                <span className="font-medium">{p.nome}</span>
                {p.souEu && <Badge variant="secondary">Você</Badge>}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Chaveamento de {bracketSize} times — as vagas restantes são preenchidas com CPUs assim
          que o torneio começar.
        </p>

        {souHost ? (
          <IniciarTorneioForm tournamentId={tournamentId} />
        ) : (
          <p className="text-sm text-muted-foreground">Aguardando o anfitrião começar o torneio...</p>
        )}
      </CardContent>
    </Card>
  );
}
