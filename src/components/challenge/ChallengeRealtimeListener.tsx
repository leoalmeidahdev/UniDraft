"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Avisa quem desafiou assim que o desafio é aceito e a partida já está pronta —
 * sem isso, só descobriria olhando a lista de novo manualmente.
 */
export function ChallengeRealtimeListener({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`challenges-challenger-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `challenger_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new?.status === "aceito") {
            toast.success("Seu desafio foi aceito! A partida já está pronta.");
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
