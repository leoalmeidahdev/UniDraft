-- ==========================================================
-- 0003_constraints_e_indices
--
-- Constraints e índices que faltavam no schema inicial. Todos são
-- aditivos (nenhum DROP, nenhuma alteração de coluna existente).
--
-- Idempotente: pode ser re-executado sem erro.
-- ==========================================================

-- ----------------------------------------------------------
-- 1) Amizade é uma relação simétrica
--
-- O unique original é em (user_id, friend_id), o que permite que
-- (A,B) e (B,A) coexistam como duas linhas diferentes. O código em
-- findFriendshipBetween() checa os dois sentidos, mas isso é uma
-- checagem de aplicação: se A e B mandam pedido no mesmo instante,
-- as duas linhas entram. Este índice torna o par único de verdade.
-- ----------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS friendships_par_unico
  ON friendships (least(user_id, friend_id), greatest(user_id, friend_id));


-- ----------------------------------------------------------
-- 2) Um único desafio pendente por par de jogadores
--
-- Impede spam de desafios (hoje nada impede mandar 50 pendentes
-- para o mesmo amigo). Desafios contra bot têm challenged_user_id
-- NULL e não são afetados: valores NULL nunca conflitam em índice
-- único, então você continua podendo desafiar os três bots à vontade.
-- ----------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS challenges_pendente_unico
  ON challenges (challenger_user_id, challenged_user_id)
  WHERE status = 'pendente';


-- ----------------------------------------------------------
-- 3) Importação de CSV idempotente
--
-- Sem isto, rodar o mesmo CSV duas vezes duplica todos os alunos.
-- Usa lower(nome) para que "João Silva" e "joão silva" colidam.
--
-- ATENÇÃO: se a sua escola tiver dois alunos com exatamente o mesmo
-- nome na mesma turma, a importação vai falhar nessa linha. Nesse
-- caso, diferencie no CSV (ex.: "Maria Souza" e "Maria Souza F.")
-- ou remova este índice.
-- ----------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS alunos_turma_nome_unico
  ON alunos (turma_id, lower(nome));


-- ----------------------------------------------------------
-- 4) Índices para consulta de partidas por time
--
-- Necessários assim que existir a tela de histórico de partidas;
-- baratos de criar agora, com as tabelas vazias.
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_matches_home ON matches (squad_home_id);
CREATE INDEX IF NOT EXISTS idx_matches_away ON matches (squad_away_id);