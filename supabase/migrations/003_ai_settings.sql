create table public.ai_settings(parent_id uuid primary key references profiles(id),model text not null,daily_limit int not null check(daily_limit between 1 and 1000),enabled boolean not null default true,updated_at timestamptz not null default now());
alter table public.ai_settings enable row level security;
create policy own_ai_settings on public.ai_settings for select to authenticated using(parent_id=auth.uid());
revoke all on public.ai_settings from anon,authenticated;
grant select on public.ai_settings to authenticated;
grant all on public.ai_settings to service_role;
