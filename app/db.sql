CREATE TABLE clubs {
    id SERIAL PRIMARY KEY,
    name VARCHAR(64),
    created TIMESTAMP NOT NULL
};

CREATE TABLE player {
    id SERIAL PRIMARY KEY,
    name VARCHAR(64),
    phone_number varchar(32),
    email_address varchar(64) NOT NULL
};

CREATE TABLE club_players {
    player_id INT NOT NULL,
    club_id INT NOT NULL,
    admin BOOL NOT NULL DEFAULT false,

    PRIMARY KEY(player_id, club_id),
    CONSTRAINT fk_club FOREIGN KEY(club_id) REFERENCES clubs(id),
    CONSTRAINT fk_player FOREIGN KEY(player_id) REFERENCES player(id)
};

CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    has_ended BOOL NOT NULL DEFAULT false,
    club_id INT NOT NULL,

    CONSTRAINT fk_club FOREIGN KEY(club_id) REFERENCES clubs(id)
);

CREATE TABLE matches {
    id SERIAL PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    winner_id INT,
    player1score INT ARRAY,
    player2score INT ARRAY,
    when TIMESTAMP,
    status VARCHAR(32),

    CONSTRAINT fk_player1 FOREIGN KEY(player1_id) REFERENCES player(id),
    CONSTRAINT fk_player2 FOREIGN KEY(player2_id) REFERENCES player(id),
    CONSTRAINT fk_winner FOREIGN KEY(winner_id) REFERENCES player(id)
}

CREATE TABLE season_standings {
    season_id INT,
    results INT ARRAY NOT NULL,
    match_id INT,
    comment varchar(256),

    CONSTRAINT fk_match FOREIGN KEY(match_id) REFERENCES matches(id),
    CONSTRAINT fk_season FOREIGN KEY(season_id) REFERENCES seasons(id)
}
