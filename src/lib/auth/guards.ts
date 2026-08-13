import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface AuthedProfile {
  id: string;
  username: string;
  displayName: string;
  role: "comum" | "admin";
  isBot: boolean;
}

/** Retorna o profile do usuário logado, ou null se não houver sessão. Não redireciona. */
export async function getOptionalUser(): Promise<AuthedProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return null;

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    role: profile.role,
    isBot: profile.isBot,
  };
}

/**
 * Garante que existe um usuário autenticado. Redireciona para /login se não houver.
 * Usar no topo de Server Components/Server Actions de rotas protegidas — o Proxy
 * (src/proxy.ts) já bloqueia essas rotas por padrão, mas cada handler valida de novo
 * (defesa em profundidade: Server Functions podem ser chamadas fora do matcher do Proxy).
 */
export async function requireUser(): Promise<AuthedProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    redirect("/login");
  }

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    role: profile.role,
    isBot: profile.isBot,
  };
}

/** Garante usuário autenticado com role=admin. Redireciona para /meu-time caso contrário. */
export async function requireAdmin(): Promise<AuthedProfile> {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    redirect("/meu-time");
  }
  return profile;
}
