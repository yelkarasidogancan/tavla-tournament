-- Tavla Tournament Schema

create extension if not exists "uuid-ossp";

-- tournaments
create table if not exists tournaments (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Tavla Turnuvası',
  status text not null default 'draft' check (status in ('draft', 'published', 'completed')),
  group_size int not null default 4,
  advances_per_group int not null default 2,
  created_at timestamptz default now()
);

-- players
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  avatar_seed text not null default '',
  created_at timestamptz default now()
);

-- groups
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null
);

-- group_players
create table if not exists group_players (
  group_id uuid references groups(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  wins int not null default 0,
  losses int not null default 0,
  score_for int not null default 0,
  score_against int not null default 0,
  points int not null default 0,
  position int,
  primary key (group_id, player_id)
);

-- matches
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  round text not null default '',
  match_number int not null default 1,
  player1_id uuid references players(id) on delete set null,
  player2_id uuid references players(id) on delete set null,
  score1 int,
  score2 int,
  winner_id uuid references players(id) on delete set null,
  stage text not null default 'group' check (stage in ('group', 'knockout')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  next_match_id uuid references matches(id) on delete set null,
  next_match_slot int check (next_match_slot in (1, 2)),
  created_at timestamptz default now()
);

-- Enable RLS (allow public read, restrict writes to service role)
alter table tournaments enable row level security;
alter table players enable row level security;
alter table groups enable row level security;
alter table group_players enable row level security;
alter table matches enable row level security;

-- Public read access
create policy "Public read tournaments" on tournaments for select using (true);
create policy "Public read players" on players for select using (true);
create policy "Public read groups" on groups for select using (true);
create policy "Public read group_players" on group_players for select using (true);
create policy "Public read matches" on matches for select using (true);

-- Full access with service role (API routes use anon key so we allow all for now)
create policy "All access tournaments" on tournaments for all using (true) with check (true);
create policy "All access players" on players for all using (true) with check (true);
create policy "All access groups" on groups for all using (true) with check (true);
create policy "All access group_players" on group_players for all using (true) with check (true);
create policy "All access matches" on matches for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table group_players;
alter publication supabase_realtime add table tournaments;
