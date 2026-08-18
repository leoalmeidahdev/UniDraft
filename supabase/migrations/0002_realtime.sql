-- Publica a tabela challenges para o Supabase Realtime (usado para avisar quem
-- desafiou assim que o desafio é aceito, ver ChallengeRealtimeListener).
--
-- Envolvido em um guard porque ALTER PUBLICATION ... ADD TABLE falha com
-- "relation is already member of publication" se executado duas vezes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
  END IF;
END $$;