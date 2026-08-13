import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";

export async function getMatchFull(matchId: string) {
  return db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      squadHome: { with: { user: true } },
      squadAway: { with: { user: true } },
      events: { orderBy: (e, { asc }) => [asc(e.ordem)] },
    },
  });
}

export { asc };
