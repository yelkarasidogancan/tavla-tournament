-- Migration: katılım başvuru tablosu
create table if not exists registrations (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  apartment text not null,
  added_to_tournament boolean not null default false,
  created_at timestamptz default now()
);

alter table registrations enable row level security;
create policy "Public insert registrations" on registrations for insert with check (true);
create policy "Public read registrations"  on registrations for select using (true);
create policy "All access registrations"   on registrations for all using (true) with check (true);
