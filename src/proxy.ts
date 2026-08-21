import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Exigem conta de verdade: dependem de outro usuário existir (amizade/desafio). */
const ROTAS_QUE_EXIGEM_CONTA = ["/amigos", "/desafios", "/admin"];

/**
 * Montar/ver o time, jogar torneio e assistir partidas — aceitam visitante
 * (cookie de convidado). /jogar é o fluxo guiado de montagem (tática +
 * draft manual de sala em sala, ver src/app/jogar/page.tsx) — precisa do
 * cookie de visitante já disponível na primeira visita, sem depender de o
 * jogador ter passado por /meu-time antes. /partida entra aqui porque também
 * é usada pelas partidas do torneio (que aceita visitante); a checagem de "é
 * dono ou participante do torneio dessa partida" é feita na própria página
 * (src/app/partida/[matchId]/page.tsx), não aqui.
 */
const ROTAS_DE_JOGO = ["/meu-time", "/jogar", "/torneio", "/partida"];

/** Nome do cookie de identidade de visitante (ver src/lib/auth/guards.ts). */
const GUEST_COOKIE = "uni_draft_guest_id";

/**
 * Só cuida de UX (redireciona sessão ausente antes de renderizar, e garante
 * o cookie de visitante nas rotas de jogo). A autorização de verdade
 * acontece de novo em cada Server Function via requireUser()/requireAdmin()/
 * requirePlayerIdentity() (src/lib/auth/guards.ts) — nunca confiar só no
 * Proxy, ver aviso em next/dist/docs sobre Server Functions não seguirem o
 * matcher abaixo.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const exigeConta = ROTAS_QUE_EXIGEM_CONTA.some((rota) =>
    pathname.startsWith(rota)
  );
  const rotaDeJogo = ROTAS_DE_JOGO.some((rota) => pathname.startsWith(rota));

  if (!exigeConta && !rotaDeJogo) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (exigeConta && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (rotaDeJogo && !user && !request.cookies.get(GUEST_COOKIE)) {
    const guestId = crypto.randomUUID();
    request.cookies.set(GUEST_COOKIE, guestId);
    response.cookies.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
