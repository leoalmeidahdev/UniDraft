-- ==========================================================
-- 0005_squads_visitante
--
-- Um squad passa a poder pertencer a uma conta (profiles) OU a um
-- visitante identificado só por um cookie (guest_id), nunca os dois
-- ao mesmo tempo. Ver src/lib/auth/guards.ts (PlayerIdentity) e
-- src/proxy.ts (onde o cookie de visitante é criado).
--
-- Idempotente: pode ser re-executado sem erro.
-- ==========================================================

-- user_id deixa de ser obrigatório (squads de visitante não têm dono
-- em profiles). ALTER COLUMN ... DROP NOT NULL é idempotente por natureza.
ALTER TABLE squads ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE squads ADD COLUMN IF NOT EXISTS guest_id text;

-- Exatamente um dos dois donos deve estar preenchido.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'squads_owner_xor'
  ) THEN
    ALTER TABLE squads
      ADD CONSTRAINT squads_owner_xor
      CHECK ((user_id IS NOT NULL) <> (guest_id IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_squads_guest
  ON squads (guest_id)
  WHERE guest_id IS NOT NULL;
