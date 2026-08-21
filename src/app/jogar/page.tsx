import { requirePlayerIdentity } from "@/lib/auth/guards";
import { JogarWizard } from "@/components/jogar/JogarWizard";

/**
 * Fluxo guiado de "Jogar agora": escolher tática (etapa 1) e depois montar o
 * time rolando salas de aula, vaga a vaga (etapa 2, ver JogarWizard). Aceita
 * visitante — requirePlayerIdentity() cobre conta ou cookie de convidado
 * (nunca requireUser aqui). O draft em si é efêmero, todo em estado de
 * client component; só o resultado final vira squad no banco
 * (finalizarDraftAction, src/lib/squad/actions.ts).
 */
export default async function JogarPage() {
  await requirePlayerIdentity();

  return <JogarWizard />;
}
