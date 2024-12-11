CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64),
    created TIMESTAMP NOT NULL
);

CREATE TABLE player (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    phone_number VARCHAR(32) NOT NULL DEFAULT '',
    email_address VARCHAR(64) NOT NULL,
    created TIMESTAMP NOT NULL,

    unavailable_from TIMESTAMP,
    unavailable_until TIMESTAMP,
    unavailable_reason VARCHAR(128) NOT NULL DEFAULT ''
);

CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    has_ended BOOL NOT NULL DEFAULT false,
    club_id INT NOT NULL,
    created TIMESTAMP NOT NULL,

    CONSTRAINT fk_club FOREIGN KEY(club_id) REFERENCES clubs(id)
);

CREATE TABLE season_players (
    player_id INT NOT NULL,
    season_id INT NOT NULL,
    created TIMESTAMP NOT NULL,
    admin BOOL NOT NULL DEFAULT false,

    PRIMARY KEY(player_id, club_id),
    CONSTRAINT fk_club FOREIGN KEY(club_id) REFERENCES clubs(id),
    CONSTRAINT fk_player FOREIGN KEY(player_id) REFERENCES player(id)
);

CREATE TABLE season_matches (
    id SERIAL PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    winner_id INT,
    player1_score INT ARRAY,
    player2_score INT ARRAY,
    season_id INT NOT NULL,
    game_at TIMESTAMP,
    created TIMESTAMP NOT NULL,
    status VARCHAR(32),
    challenge_text VARCHAR(256),

    CONSTRAINT fk_season FOREIGN KEY(season_id) REFERENCES seasons(id),
    CONSTRAINT fk_player1 FOREIGN KEY(player1_id) REFERENCES player(id),
    CONSTRAINT fk_player2 FOREIGN KEY(player2_id) REFERENCES player(id),
    CONSTRAINT fk_winner FOREIGN KEY(winner_id) REFERENCES player(id)
);

CREATE TABLE match_comments (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL,
    created TIMESTAMP NOT NULL,
    comment VARCHAR(256) NOT NULL,

    CONSTRAINT fk_player FOREIGN KEY(player_id) REFERENCES player(id)
);

CREATE TABLE season_standings (
    season_id INT,
    results INT ARRAY NOT NULL,
    match_id INT,
    created TIMESTAMP NOT NULL,
    comment varchar(256),

    CONSTRAINT fk_match FOREIGN KEY(match_id) REFERENCES matches(id),
    CONSTRAINT fk_season FOREIGN KEY(season_id) REFERENCES seasons(id)
)
