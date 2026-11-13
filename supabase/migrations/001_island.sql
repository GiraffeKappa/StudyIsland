-- Run in a fresh Supabase project. All application mutations use verified server routes.
-- gen_random_uuid is built into supported PostgreSQL versions.
create table public.profiles(id uuid primary key references auth.users on delete cascade, role text not null check(role in ('student','parent')), nickname text not null default '', timezone text not null default 'Asia/Taipei', synced_at timestamptz);
create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$begin insert into profiles(id,role,nickname) values(new.id,case when new.raw_user_meta_data->>'role'='parent' then 'parent' else 'student' end,left(coalesce(new.raw_user_meta_data->>'nickname',''),30));return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_profile();
create table public.guardian_links(parent_id uuid references profiles(id),student_id uuid references profiles(id),status text not null default 'accepted' check(status='accepted'),primary key(parent_id,student_id),check(parent_id<>student_id));
create table public.guardian_invites(token_hash text primary key,student_id uuid not null references profiles(id),expires_at timestamptz not null,used_at timestamptz);
create function public.can_read_student(sid uuid) returns boolean language sql stable security definer set search_path=public as $$select sid=auth.uid() or exists(select 1 from guardian_links where student_id=sid and parent_id=auth.uid() and status='accepted')$$;
create table public.subjects(id text primary key,name text not null,publisher text not null,priority int not null);
create table public.units(id text primary key,subject_id text not null references subjects(id),name text not null,concept_book int not null check(concept_book between 0 and 6),sort_order int not null);
create table public.textbook_mappings(id uuid primary key default gen_random_uuid(),unit_id text not null references units(id),publisher text not null,edition text,book int,chapter text,pages text,verified boolean not null default false);
create table public.unit_links(a text references units(id),b text references units(id),reason text not null,primary key(a,b));
create table public.learner_events(seq bigint generated always as identity unique,id uuid primary key,student_id uuid not null references profiles(id),payload jsonb not null,created_at timestamptz not null default now());
create index learner_events_student on learner_events(student_id,seq);
create table public.mastery_events(id uuid primary key,student_id uuid not null references profiles(id),unit_id text not null references units(id),value int not null check(value between 0 and 3),source text not null default 'self',occurred_at timestamptz not null);
create table public.availability(id uuid primary key default gen_random_uuid(),student_id uuid not null references profiles(id),date date not null,minutes int not null check(minutes between 0 and 720),fixed_occupation text not null default '平日晚間作業不列入額外複習',unique(student_id,date));
create table public.exam_events(id uuid primary key default gen_random_uuid(),student_id uuid not null references profiles(id),name text not null,date date,confirmed boolean not null default false,unit_ids text[] not null default '{}');
create table public.plan_versions(id uuid primary key,student_id uuid not null references profiles(id),week date not null,status text not null check(status in ('draft','accepted','superseded')),payload jsonb not null,accepted_at timestamptz);
create table public.tasks(id uuid primary key,student_id uuid not null references profiles(id),unit_id text not null references units(id),plan_id uuid not null references plan_versions(id),version int not null default 0,payload jsonb not null);
create table public.study_logs(id uuid primary key,student_id uuid not null references profiles(id),unit_id text not null references units(id),task_id uuid references tasks(id),focus_id uuid,minutes numeric not null check(minutes>0 and minutes<=720),payload jsonb not null,created_at timestamptz not null default now(),unique(student_id,focus_id));
create table public.focus_sessions(id uuid primary key,student_id uuid not null references profiles(id),unit_id text not null references units(id),payload jsonb not null);
create table public.questions(id uuid primary key,student_id uuid not null references profiles(id),unit_id text not null references units(id),payload jsonb not null,model text not null,prompt_version text not null default 'gemini-v1',created_at timestamptz not null default now());
create table public.question_solutions(question_id uuid primary key references questions(id),student_id uuid not null references profiles(id),payload jsonb not null,verified boolean not null);
create table public.attempts(id uuid primary key,student_id uuid not null references profiles(id),question_id uuid not null references questions(id),payload jsonb not null,created_at timestamptz not null default now(),unique(student_id,question_id));
create table public.review_items(id uuid primary key,student_id uuid not null references profiles(id),question_id uuid not null references questions(id),payload jsonb not null,unique(student_id,question_id));
create table public.reward_events(id text not null,student_id uuid not null references profiles(id),payload jsonb not null,created_at timestamptz not null default now(),primary key(student_id,id));
create table public.preferences(student_id uuid primary key references profiles(id),payload jsonb not null);
create table public.ai_usage(id uuid primary key,student_id uuid not null references profiles(id),kind text not null,model text not null,status text not null default 'reserved',tokens int not null default 0,created_at timestamptz not null default now());
create index ai_usage_student_date on ai_usage(student_id,created_at);
create table public.question_feedback(id uuid primary key default gen_random_uuid(),student_id uuid not null references profiles(id),question_id uuid not null references questions(id),payload jsonb not null,created_at timestamptz not null default now());

-- Security: no client can choose another role, link itself, retrieve solutions, or mutate learning data directly.
alter table profiles enable row level security;
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or public.can_read_student(id));
alter table guardian_links enable row level security;
create policy link_read on guardian_links for select to authenticated using(parent_id=auth.uid() or student_id=auth.uid());
alter table guardian_invites enable row level security;
alter table question_solutions enable row level security;
do $$declare t text;begin
 foreach t in array array['subjects','units','textbook_mappings','unit_links'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy catalog_read on public.%I for select to authenticated using(true)',t);
 end loop;
 foreach t in array array['learner_events','mastery_events','availability','exam_events','plan_versions','tasks','study_logs','focus_sessions','questions','attempts','review_items','reward_events','preferences','ai_usage','question_feedback'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy student_read on public.%I for select to authenticated using(public.can_read_student(student_id))',t);
 end loop;
end$$;
revoke all on all tables in schema public from anon,authenticated;
grant select on profiles,guardian_links,subjects,units,textbook_mappings,unit_links,learner_events,mastery_events,availability,exam_events,plan_versions,tasks,study_logs,focus_sessions,questions,attempts,review_items,reward_events,preferences,ai_usage,question_feedback to authenticated;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;

create function public.commit_events(sid uuid,expected_count int,batch jsonb,earned jsonb) returns void language plpgsql security definer set search_path=public as $$
declare e jsonb;d jsonb;t jsonb;k text;r jsonb;begin
 perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
 if (select count(*) from learner_events where student_id=sid)<>expected_count then raise exception 'revision conflict';end if;
 if not exists(select 1 from profiles where id=sid and role='student') then raise exception 'not student';end if;
 for e in select * from jsonb_array_elements(batch) loop
 if exists(select 1 from learner_events where id=(e->>'id')::uuid) then continue;end if;
 insert into learner_events(id,student_id,payload) values((e->>'id')::uuid,sid,e);
 d=e->'data';k=e->>'type';
 if k='mastery' then insert into mastery_events values((e->>'id')::uuid,sid,d->>'unit',(d->>'value')::int,'self',(d->>'at')::timestamptz);
 elsif k='preferences' then
 insert into preferences values(sid,d) on conflict(student_id) do update set payload=excluded.payload;
 delete from exam_events where student_id=sid and name='會考';
 insert into exam_events(student_id,name,date,confirmed) values(sid,'會考',nullif(d->>'examDate','')::date,coalesce(d->>'examDate','')<>'');
 elsif k='focus' then
 insert into focus_sessions values((d->>'id')::uuid,sid,d->>'unit',d) on conflict(id) do update set payload=excluded.payload where focus_sessions.student_id=sid;
 elsif k='plan' then
 insert into plan_versions values((d->>'id')::uuid,sid,(d->>'week')::date,'accepted',d,now()) on conflict(id) do update set status='accepted',payload=excluded.payload,accepted_at=excluded.accepted_at where plan_versions.student_id=sid and plan_versions.status='draft';
 for t in select * from jsonb_array_elements(d->'tasks') loop
 insert into tasks values((t->>'id')::uuid,sid,t->>'unit',(d->>'id')::uuid,0,t);
 end loop;
 for r in select jsonb_build_object('key',key,'value',value) from jsonb_each(d->'capacity') loop
 insert into availability(student_id,date,minutes) values(sid,(r->>'key')::date,(r->>'value')::int) on conflict(student_id,date) do update set minutes=excluded.minutes;
 end loop;
 elsif k='task' then
 update tasks set version=version+1,payload=payload||d||jsonb_build_object('version',version+1) where id=(d->>'id')::uuid and student_id=sid and version=(d->>'base')::int;
 if not found then raise exception 'task version conflict';end if;
 elsif k='log' then
 insert into study_logs(id,student_id,unit_id,task_id,focus_id,minutes,payload) values((d->>'id')::uuid,sid,d->>'unit',(d->>'task')::uuid,(d->>'focus')::uuid,(d->>'minutes')::numeric,d);
 insert into mastery_events values((e->>'id')::uuid,sid,d->>'unit',(d->>'mastery')::int,'self',(d->>'at')::timestamptz);
 if d->>'task' is not null then
 update tasks set version=version+1,payload=payload||jsonb_build_object('remaining',case when (d->>'finish')::boolean then 0 else greatest(0,(payload->>'remaining')::numeric-(d->>'minutes')::numeric) end,'status',case when (d->>'finish')::boolean then 'done' else 'partial' end,'version',version+1) where id=(d->>'task')::uuid and student_id=sid;
 if not found then raise exception 'task ownership';end if;
 end if;
 end if;
 end loop;
 for r in select * from jsonb_array_elements(earned) loop insert into reward_events values(r->>'id',sid,r,now()) on conflict do nothing;end loop;
 update profiles set synced_at=now() where id=sid;
end$$;
create function public.save_question(sid uuid,q jsonb,solution jsonb,verified boolean) returns void language plpgsql security definer set search_path=public as $$begin
 insert into questions(id,student_id,unit_id,payload,model) values((q->>'id')::uuid,sid,q->>'unit',q,coalesce(q->>'model','unconfigured'));
 insert into question_solutions values((q->>'id')::uuid,sid,solution,verified);
end$$;
create function public.commit_attempt(sid uuid,result jsonb,review jsonb) returns jsonb language plpgsql security definer set search_path=public as $$declare old jsonb;begin
 perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
 select payload into old from attempts where student_id=sid and question_id=(result->'question'->>'id')::uuid;
 if old is not null then return old;end if;
 if not exists(select 1 from questions where id=(result->'question'->>'id')::uuid and student_id=sid) then raise exception 'ownership';end if;
 insert into attempts(id,student_id,question_id,payload) values((result->>'id')::uuid,sid,(result->'question'->>'id')::uuid,result);
 if review is not null and review<>'null'::jsonb then insert into review_items values((review->>'id')::uuid,sid,(review->'question'->>'id')::uuid,review) on conflict(id) do update set payload=excluded.payload;end if;
 if (select count(distinct coalesce(payload->'question'->>'originId',question_id::text)) from attempts where student_id=sid and payload->>'verdict'<>'uncertain' and not coalesce((payload->>'revoked')::boolean,false))>=3 then insert into reward_events values('math-three',sid,'{"name":"數學小船"}',now()) on conflict do nothing;end if;
 update profiles set synced_at=now() where id=sid;return result;
end$$;
create function public.reserve_ai_request(sid uuid,kind text,model text,rid uuid,daily_limit int) returns boolean language plpgsql security definer set search_path=public as $$begin
 perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
 if (select count(*) from ai_usage where student_id=sid and (created_at at time zone 'Asia/Taipei')::date=(now() at time zone 'Asia/Taipei')::date)>=daily_limit or exists(select 1 from ai_usage where student_id=sid and created_at>now()-interval '2 seconds') then return false;end if;
 insert into ai_usage(id,student_id,kind,model) values(rid,sid,kind,model);return true;end$$;
create function public.redeem_invite(pid uuid,hashed text) returns void language plpgsql security definer set search_path=public as $$declare inv guardian_invites;begin
 if not exists(select 1 from profiles where id=pid and role='parent') then raise exception 'parent only';end if;
 select * into inv from guardian_invites where token_hash=hashed and expires_at>now() and used_at is null for update;
 if inv is null then raise exception 'invalid invitation';end if;
 insert into guardian_links(parent_id,student_id) values(pid,inv.student_id) on conflict do nothing;
 update guardian_invites set used_at=now() where token_hash=hashed;end$$;
-- Definer functions are callable by the service role only; authorization happens before RPC.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.can_read_student(uuid) to authenticated;
grant execute on all functions in schema public to service_role;
