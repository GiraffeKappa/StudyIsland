-- Passwordless family access. Profiles are internal subjects, not login accounts.
-- Preserve learning records; detach the former Auth FK.
alter table public.profiles drop constraint if exists profiles_id_fkey;
drop trigger if exists on_auth_user_created on auth.users;
create table public.family_access(singleton boolean primary key default true check(singleton),student_id uuid not null references public.profiles(id),parent_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),check(student_id<>parent_id));
alter table public.family_access enable row level security;
revoke all on public.family_access from public,anon,authenticated;
grant all on public.family_access to service_role;
do $$declare sid uuid;pid uuid;begin
 if exists(select 1 from family_access) then return;end if;
 if (select count(*) from profiles where role='student')>1 then raise exception 'Multiple students exist; choose the family explicitly before migration';end if;
 select id into sid from profiles where role='student' limit 1;
 if sid is null then sid=gen_random_uuid();insert into profiles(id,role,nickname) values(sid,'student','臭凝');end if;
 select g.parent_id into pid from guardian_links g where g.student_id=sid limit 1;
 if pid is null then pid=gen_random_uuid();insert into profiles(id,role,nickname) values(pid,'parent','家長');end if;
 insert into guardian_links(parent_id,student_id) values(pid,sid) on conflict do nothing;
 insert into family_access(singleton,student_id,parent_id) values(true,sid,pid);
end$$;
