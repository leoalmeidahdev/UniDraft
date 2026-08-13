import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";

const ABAS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/turmas", label: "Turmas" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/importar", label: "Importar CSV" },
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Cadastro de turmas e colegas usados no draft.
      </p>
      <nav className="mb-8 flex gap-4 border-b text-sm">
        {ABAS.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="border-b-2 border-transparent px-1 pb-3 text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            {aba.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
