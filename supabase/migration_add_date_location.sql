-- Migration: add tournament_date and location columns
alter table tournaments
  add column if not exists tournament_date timestamptz,
  add column if not exists location text;
