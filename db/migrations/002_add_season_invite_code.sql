ALTER TABLE seasons ADD COLUMN invite_code TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX seasons_invite_code_unique
  ON seasons (invite_code) WHERE invite_code != '';

-- Backfill existing seasons with generated invite codes
DO $$
DECLARE
  rec RECORD;
  new_code TEXT;
  done BOOLEAN;
BEGIN
  FOR rec IN SELECT id FROM seasons WHERE invite_code = '' LOOP
    done := FALSE;
    WHILE NOT done LOOP
      new_code := upper(substr(md5(random()::text), 1, 6));
      BEGIN
        UPDATE seasons SET invite_code = new_code WHERE id = rec.id;
        done := TRUE;
      EXCEPTION WHEN unique_violation THEN
        done := FALSE;
      END;
    END LOOP;
  END LOOP;
END $$;
