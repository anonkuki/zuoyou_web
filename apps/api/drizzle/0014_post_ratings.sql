ALTER TABLE post_votes ADD COLUMN value INTEGER NOT NULL DEFAULT 1 CHECK(value IN (-1,1));
CREATE INDEX post_vote_score_idx ON post_votes(post_id,value);
