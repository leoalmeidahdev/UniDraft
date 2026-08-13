import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { turmas, alunos } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [[turmasCount], [alunosCount]] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int`, ativas: sql<number>`count(*) filter (where ativa)::int` }).from(turmas),
    db
      .select({
        total: sql<number>`count(*)::int`,
        paraRevisar: sql<number>`count(*) filter (where not ativo)::int`,
      })
      .from(alunos),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Turmas ativas</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {turmasCount.ativas} / {turmasCount.total}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Alunos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{alunosCount.total}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Para revisar</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{alunosCount.paraRevisar}</CardContent>
      </Card>
    </div>
  );
}
