create table public.player_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision integer not null default 0,
 state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 262144)
);
alter table public.player_saves enable row level security;
revoke all on public.player_saves from anon, authenticated;
grant select, insert on public.player_saves to authenticated;
grant update (state, revision) on public.player_saves to authenticated;
create policy own_save on public.player_saves for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.registration_limits (
 bucket text primary key,
 attempts integer not null,
 expires_at timestamptz not null
);
alter table public.registration_limits enable row level security;
revoke all on public.registration_limits from anon, authenticated;
create function public.allow_player_registration(bucket_key text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare total integer;
begin
 delete from public.registration_limits where expires_at < now();
 insert into public.registration_limits as limits (bucket, attempts, expires_at)
 values (bucket_key, 1, now() + interval '1 hour')
 on conflict (bucket) do update set attempts = least(limits.attempts + 1, 26)
 returning attempts into total;
 return total <= 25;
end;
$$;
revoke all on function public.allow_player_registration(text) from public, anon, authenticated;
grant execute on function public.allow_player_registration(text) to service_role;