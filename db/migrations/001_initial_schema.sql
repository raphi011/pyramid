-- Full database schema for Pyramid app
-- Source of truth: docs/database.mdx
-- If schema and docs diverge, update both.

-----------------------------------------------
-- 0. images
-----------------------------------------------
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data BYTEA NOT NULL,
    content_type TEXT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    size_bytes INT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT now()
);

-----------------------------------------------
-- 1. clubs
-----------------------------------------------
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    phone_number TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    image_id UUID REFERENCES images(id),
    is_disabled BOOL NOT NULL DEFAULT false,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 2. player
-----------------------------------------------
CREATE TABLE player (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL DEFAULT '',
    email_address TEXT NOT NULL UNIQUE,
    image_id UUID REFERENCES images(id),
    bio TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'auto',
    is_app_admin BOOL NOT NULL DEFAULT false,
    created TIMESTAMPTZ NOT NULL,
    unavailable_from TIMESTAMPTZ,
    unavailable_until TIMESTAMPTZ,
    unavailable_reason TEXT NOT NULL DEFAULT ''
);

-----------------------------------------------
-- 3. club_members
-----------------------------------------------
CREATE TABLE club_members (
    player_id INT NOT NULL REFERENCES player(id),
    club_id INT NOT NULL REFERENCES clubs(id),
    role TEXT NOT NULL DEFAULT 'player',
    created TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (player_id, club_id)
);

-----------------------------------------------
-- 4. seasons
-----------------------------------------------
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    club_id INT NOT NULL REFERENCES clubs(id),
    name TEXT NOT NULL,
    min_team_size INT NOT NULL DEFAULT 1,
    max_team_size INT NOT NULL DEFAULT 1,
    best_of INT NOT NULL DEFAULT 3,
    match_deadline_days INT NOT NULL DEFAULT 14,
    reminder_after_days INT NOT NULL DEFAULT 7,
    requires_result_confirmation BOOL NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 5. teams
-----------------------------------------------
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    season_id INT NOT NULL REFERENCES seasons(id),
    name TEXT NOT NULL DEFAULT '',
    opted_out BOOL NOT NULL DEFAULT false,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 6. team_players
-----------------------------------------------
CREATE TABLE team_players (
    team_id INT NOT NULL REFERENCES teams(id),
    player_id INT NOT NULL REFERENCES player(id),
    created TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (team_id, player_id)
);

-----------------------------------------------
-- 7. season_matches
-----------------------------------------------
CREATE TABLE season_matches (
    id SERIAL PRIMARY KEY,
    season_id INT NOT NULL REFERENCES seasons(id),
    team1_id INT NOT NULL REFERENCES teams(id),
    team2_id INT NOT NULL REFERENCES teams(id),
    winner_team_id INT REFERENCES teams(id),
    result_entered_by INT REFERENCES player(id),
    result_entered_at TIMESTAMPTZ,
    confirmed_by INT REFERENCES player(id),
    team1_score INT[],
    team2_score INT[],
    status TEXT NOT NULL,
    challenge_text TEXT NOT NULL DEFAULT '',
    disputed_reason TEXT NOT NULL DEFAULT '',
    game_at TIMESTAMPTZ,
    image_id UUID REFERENCES images(id),
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 8. match_comments
-----------------------------------------------
CREATE TABLE match_comments (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES season_matches(id),
    player_id INT NOT NULL REFERENCES player(id),
    comment TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL,
    edited_at TIMESTAMPTZ
);

-----------------------------------------------
-- 9. date_proposals
-----------------------------------------------
CREATE TABLE date_proposals (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES season_matches(id),
    proposed_by INT NOT NULL REFERENCES player(id),
    proposed_datetime TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 10. season_standings
-----------------------------------------------
CREATE TABLE season_standings (
    id SERIAL PRIMARY KEY,
    season_id INT REFERENCES seasons(id),
    match_id INT REFERENCES season_matches(id),
    results INT[] NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 11. events
-----------------------------------------------
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    club_id INT NOT NULL REFERENCES clubs(id),
    season_id INT REFERENCES seasons(id),
    match_id INT REFERENCES season_matches(id),
    player_id INT REFERENCES player(id),
    target_player_id INT REFERENCES player(id),
    event_type TEXT NOT NULL,
    metadata JSONB,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-----------------------------------------------
-- 12. event_reads
-----------------------------------------------
CREATE TABLE event_reads (
    player_id INT NOT NULL REFERENCES player(id),
    club_id INT NOT NULL REFERENCES clubs(id),
    last_read_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (player_id, club_id)
);

-----------------------------------------------
-- 13. notification_preferences
-----------------------------------------------
CREATE TABLE notification_preferences (
    player_id INT PRIMARY KEY REFERENCES player(id),
    email_enabled BOOL NOT NULL DEFAULT true,
    challenge_emails BOOL NOT NULL DEFAULT true,
    result_emails BOOL NOT NULL DEFAULT true,
    reminder_emails BOOL NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-----------------------------------------------
-- 14. magic_links
-----------------------------------------------
CREATE TABLE magic_links (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL UNIQUE REFERENCES player(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- 15. sessions
-----------------------------------------------
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- Indexes
-----------------------------------------------
-- idx_magic_links_token and idx_sessions_token omitted: UNIQUE constraints already create indexes
CREATE INDEX idx_events_club_feed ON events(club_id, created DESC);
CREATE INDEX idx_events_personal ON events(target_player_id, created DESC);
CREATE INDEX idx_events_global_feed ON events(created DESC);
CREATE INDEX idx_matches_season_status ON season_matches(season_id, status);
CREATE INDEX idx_matches_team1 ON season_matches(team1_id);
CREATE INDEX idx_matches_team2 ON season_matches(team2_id);
CREATE INDEX idx_standings_latest ON season_standings(season_id, created DESC);
