import Link from "next/link";
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

const LINKS_LOGADO = [
  { href: "/draft", label: "Draft" },
  { href: "/meu-time", label: "Meu Time" },
  { href: "/amigos", label: "Amigos" },
  { href: "/desafios", label: "Desafios" },
] as const;

export async function Navbar() {
  const user = await getOptionalUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold tracking-tight text-lg">
            Uni Draft
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/sobre" className="text-muted-foreground hover:text-foreground">
              Sobre
            </Link>
            <Link href="/como-jogar" className="text-muted-foreground hover:text-foreground">
              Como Jogar
            </Link>
            {user &&
              LINKS_LOGADO.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            {user?.role === "admin" && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            )}
          </nav>
        </div>

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
                  <span className="hidden sm:inline">{user.displayName}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/meu-time">Meu Time</Link>} />
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button render={<Link href="/cadastro" />}>Criar conta</Button>
          </div>
        )}
      </div>
    </header>
  );
}
