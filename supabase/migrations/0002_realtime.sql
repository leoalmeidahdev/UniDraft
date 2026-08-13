-- Publica a tabela challenges para o Supabase Realtime (usado para avisar quem
-- desafiou assim que o desafio é aceito, ver ChallengeRealtimeListener).
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
