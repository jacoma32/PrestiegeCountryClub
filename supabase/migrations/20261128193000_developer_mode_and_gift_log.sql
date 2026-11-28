create schema if not exists pcc_admin;
revoke all on schema pcc_admin from public, anon, authenticated;
create table pcc_admin.settings (owner_id uuid primary key references auth.users, pin_hash text not null, failures integer not null default 0, retry_at timestamptz);
create table pcc_admin.unlocks (session_id uuid primary key, expires_at timestamptz not null);
create table pcc_admin.gifts (id uuid primary key, sender uuid not null, recipient uuid not null, coins integer, item text, created_at timestamptz not null default now());