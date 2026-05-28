-- Migration: 3. lük maçı için kaybeden yönlendirme kolonları
alter table matches
  add column if not exists loser_next_match_id uuid references matches(id) on delete set null,
  add column if not exists loser_next_match_slot int check (loser_next_match_slot in (1, 2));
