-- ==========================================================
-- Índices adicionais
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_squads_user ON squads(user_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id, ordem);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_user_id, status);
CREATE INDEX IF NOT EXISTS idx_draft_rounds_session ON draft_rounds(draft_session_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- ==========================================================
-- profiles ligado a auth.users (schema gerenciado pelo Supabase)
-- ==========================================================
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_auth_users_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- cria automaticamente um profile ao criar um novo auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, is_bot)
  VALUES (
    new.id,
    -- só aplica sufixo aleatório quando não veio username explícito (fallback a partir do e-mail)
    COALESCE(
      new.raw_user_meta_data ->> 'username',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    ),
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data ->> 'is_bot')::boolean, false)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- impede que o próprio usuário se promova a admin via UPDATE direto na tabela
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role <> OLD.role AND auth.role() <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- touch updated_at genérico
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_alunos_touch_updated_at BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_squads_touch_updated_at BEFORE UPDATE ON squads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_friendships_touch_updated_at BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- helper: usuário autenticado atual é admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- helper: o usuário atual é dono (ou participante como oponente ativo) do squad
CREATE OR REPLACE FUNCTION public.owns_squad(check_squad_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM squads WHERE id = check_squad_id AND user_id = auth.uid()
  );
$$;

-- helper: o usuário atual participa da partida (como dono do squad casa ou visitante)
CREATE OR REPLACE FUNCTION public.participates_in_match(check_match_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = check_match_id
      AND (public.owns_squad(m.squad_home_id) OR public.owns_squad(m.squad_away_id))
  );
$$;

-- ==========================================================
-- RLS
-- ==========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- profiles: leitura pública para usuários logados (buscar amigos/oponentes), escrita só da própria linha
CREATE POLICY profiles_select_authenticated ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- turmas/alunos: leitura para qualquer usuário logado, escrita só admin
CREATE POLICY turmas_select_authenticated ON turmas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY turmas_write_admin ON turmas
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY alunos_select_authenticated ON alunos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY alunos_write_admin ON alunos
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- squads: dono tem controle total; oponente ativo pode ler
CREATE POLICY squads_all_owner ON squads
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY squads_select_opponent ON squads
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.squad_home_id = squads.id OR m.squad_away_id = squads.id)
        AND (public.owns_squad(m.squad_home_id) OR public.owns_squad(m.squad_away_id))
    )
  );

-- squad_slots: segue o dono do squad; oponente ativo pode ler
CREATE POLICY squad_slots_all_owner ON squad_slots
  FOR ALL TO authenticated USING (public.owns_squad(squad_id)) WITH CHECK (public.owns_squad(squad_id));
CREATE POLICY squad_slots_select_opponent ON squad_slots
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.squad_home_id = squad_slots.squad_id OR m.squad_away_id = squad_slots.squad_id)
        AND (public.owns_squad(m.squad_home_id) OR public.owns_squad(m.squad_away_id))
    )
  );

-- draft_sessions / draft_rounds: só o dono do squad
CREATE POLICY draft_sessions_all_owner ON draft_sessions
  FOR ALL TO authenticated USING (public.owns_squad(squad_id)) WITH CHECK (public.owns_squad(squad_id));

CREATE POLICY draft_rounds_all_owner ON draft_rounds
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM draft_sessions ds WHERE ds.id = draft_session_id AND public.owns_squad(ds.squad_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM draft_sessions ds WHERE ds.id = draft_session_id AND public.owns_squad(ds.squad_id))
  );

-- friendships: só quem participa
CREATE POLICY friendships_select_participant ON friendships
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY friendships_insert_requester ON friendships
  FOR INSERT TO authenticated WITH CHECK (
    requested_by = auth.uid() AND (user_id = auth.uid() OR friend_id = auth.uid())
  );
CREATE POLICY friendships_update_participant ON friendships
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY friendships_delete_participant ON friendships
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());

-- challenges: só quem desafiou ou foi desafiado
CREATE POLICY challenges_select_participant ON challenges
  FOR SELECT TO authenticated USING (
    challenger_user_id = auth.uid() OR challenged_user_id = auth.uid()
  );
CREATE POLICY challenges_insert_challenger ON challenges
  FOR INSERT TO authenticated WITH CHECK (
    challenger_user_id = auth.uid() AND public.owns_squad(challenger_squad_id)
  );
CREATE POLICY challenges_update_participant ON challenges
  FOR UPDATE TO authenticated USING (
    challenger_user_id = auth.uid() OR challenged_user_id = auth.uid()
  );

-- matches / match_events: só quem participa (dono de um dos dois squads)
CREATE POLICY matches_select_participant ON matches
  FOR SELECT TO authenticated USING (
    public.owns_squad(squad_home_id) OR public.owns_squad(squad_away_id)
  );
CREATE POLICY matches_insert_participant ON matches
  FOR INSERT TO authenticated WITH CHECK (
    public.owns_squad(squad_home_id) OR public.owns_squad(squad_away_id)
  );
CREATE POLICY matches_update_participant ON matches
  FOR UPDATE TO authenticated USING (
    public.owns_squad(squad_home_id) OR public.owns_squad(squad_away_id)
  );

CREATE POLICY match_events_select_participant ON match_events
  FOR SELECT TO authenticated USING (public.participates_in_match(match_id));
CREATE POLICY match_events_insert_participant ON match_events
  FOR INSERT TO authenticated WITH CHECK (public.participates_in_match(match_id));
