CREATE TABLE raffle_prizes (
  id TEXT PRIMARY KEY,
  tier INTEGER NOT NULL UNIQUE CHECK(tier BETWEEN 1 AND 3),
  name TEXT NOT NULL,
  contents TEXT NOT NULL,
  initial_stock INTEGER NOT NULL CHECK(initial_stock >= 0),
  remaining_stock INTEGER NOT NULL CHECK(remaining_stock >= 0 AND remaining_stock <= initial_stock),
  accent TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE raffle_draws (
  id TEXT PRIMARY KEY,
  prize_id TEXT NOT NULL REFERENCES raffle_prizes(id),
  operator_id TEXT NOT NULL REFERENCES users(id),
  prize_name TEXT NOT NULL,
  prize_contents TEXT NOT NULL,
  drawn_at TEXT NOT NULL
);

CREATE INDEX raffle_draws_time_idx ON raffle_draws(drawn_at DESC, id);
CREATE INDEX raffle_draws_operator_idx ON raffle_draws(operator_id, drawn_at DESC);

INSERT INTO raffle_prizes(id,tier,name,contents,initial_stock,remaining_stock,accent,sort_order,updated_at) VALUES
  ('raffle-third',3,'三等奖','挂件',250,250,'#59a875',1,datetime('now')),
  ('raffle-second',2,'二等奖','透卡',40,40,'#6aa7d8',2,datetime('now')),
  ('raffle-first',1,'一等奖','挂件 + 透卡 + 卡套',10,10,'#efb74f',3,datetime('now'));
