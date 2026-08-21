import Link from "next/link";
import {
  Info,
  BookOpen,
  Play,
  Shirt,
  Trophy,
  Users,
  Swords,
  ShieldCheck,
  Menu,
} from "@/components/icons";
import { getOptionalUser } from "@/lib/auth/guards";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/nav/NavLink";

// Não exigem conta — visitante joga com um cookie de sessão (ver src/proxy.ts).
const LINKS_JOGO = [
  { href: "/jogar", label: "Jogar agora", icon: Play },
  { href: "/meu-time", label: "Meu Time", icon: Shirt },
  { href: "/torneio", label: "Torneio", icon: Trophy },
] as const;

// Dependem de outro usuário existir (amizade/desafio), exigem conta real.
const LINKS_CONTA = [
  { href: "/amigos", label: "Amigos", icon: Users },
  { href: "/desafios", label: "Desafios", icon: Swords },
] as const;

const LINKS_INSTITUCIONAIS = [
  { href: "/sobre", label: "Sobre", icon: Info },
  { href: "/como-jogar", label: "Como Jogar", icon: BookOpen },
] as const;

export async function Navbar() {
  const user = await getOptionalUser();

  const linksNav = [
    ...LINKS_INSTITUCIONAIS,
    ...LINKS_JOGO,
    ...(user ? LINKS_CONTA : []),
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck } as const]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <Shirt className="size-5" aria-hidden="true" />
            Uni Draft
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {linksNav.map((link) => (
              <NavLink key={link.href} href={link.href} icon={link.icon}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {user.displayName}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={
                    <NavLink href="/meu-time" icon={Shirt} block>
                      Meu Time
                    </NavLink>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <form action={signOutAction} className="w-full">
                      <button type="submit" className="w-full text-left">
                        Sair
                      </button>
                    </form>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" render={<Link href="/login" />}>
                Entrar
              </Button>
              <Button render={<Link href="/cadastro" />}>Criar conta</Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu aria-hidden="true" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {linksNav.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  render={
                    <NavLink href={link.href} icon={link.icon} block>
                      {link.label}
                    </NavLink>
                  }
                />
              ))}
              {!user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/login">Entrar</Link>} />
                  <DropdownMenuItem
                    render={<Link href="/cadastro">Criar conta</Link>}
                  />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
