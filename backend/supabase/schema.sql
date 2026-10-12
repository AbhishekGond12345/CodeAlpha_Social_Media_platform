-- Run this once in Supabase → SQL Editor.
-- Auth credentials live in Supabase Auth (auth.users);
-- this table stores the public profile details for each user.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  display_name  text not null,
  email         text not null,
  bio           text not null default '',
  avatar_url    text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- The API talks to Supabase with the service-role key (bypasses RLS).
-- Enabling RLS with no public policies keeps the table closed to browser clients.
alter table public.profiles enable row level security;

-- ── Photo & video uploads ─────────────────────────────────────
-- Public bucket: anyone can VIEW media by URL; only the server (service-role key) can upload/delete.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 26214400)
on conflict (id) do nothing;
