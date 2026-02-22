ALTER TABLE player ADD COLUMN slug TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX player_slug_unique ON player (slug) WHERE slug != '';
