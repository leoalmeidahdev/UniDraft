import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROTAS_PROTEGIDAS = [
  "/draft",
  "/meu-time",
  "/amigos",
  "/desafios",
  "/partida",
  "/admin",
];

/**
 * Só cuida de UX (redireciona sessão ausente antes de renderizar).
 * A autorização de verdade acontece de novo em cada Server Function via
 * requireUser()/requireAdmin() (src/lib/auth/guards.ts) e via RLS no Postgres —
 * nunca confiar só no Proxy, ver aviso em next/dist/docs sobre Server Functions
 * não seguirem o matcher abaixo.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const precisaProteger = ROTAS_PROTEGIDAS.some((rota) =>
    request.nextUrl.pathname.startsWith(rota)
  );
  if (!precisaProteger) {
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

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
