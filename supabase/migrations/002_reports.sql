create function public.report_question(sid uuid,qid uuid,kind text) returns void language plpgsql security definer set search_path=public as $$declare root text;begin
 perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
 if not exists(select 1 from questions where id=qid and student_id=sid) then raise exception 'ownership';end if;
 insert into question_feedback(student_id,question_id,payload) values(sid,qid,jsonb_build_object('kind',kind));
 if kind in ('report','revoke') then
 select coalesce(payload->>'originId',id::text) into root from questions where id=qid and student_id=sid;
 update questions set payload=payload||'{"reported":true}' where student_id=sid and coalesce(payload->>'originId',id::text)=root;
 update attempts set payload=payload||'{"revoked":true}' where student_id=sid and coalesce(payload->'question'->>'originId',question_id::text)=root;
 delete from review_items where student_id=sid and coalesce(payload->'question'->>'originId',question_id::text)=root;
 if (select count(distinct coalesce(payload->'question'->>'originId',question_id::text)) from attempts where student_id=sid and payload->>'verdict'<>'uncertain' and not coalesce((payload->>'revoked')::boolean,false))<3 then delete from reward_events where student_id=sid and id='math-three';end if;
 if not exists(select 1 from attempts where student_id=sid and payload->>'verdict'<>'uncertain' and not coalesce((payload->>'revoked')::boolean,false)) then delete from reward_events where student_id=sid and id='practice-badge';end if;
 end if;
end$$;
revoke execute on function public.report_question(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.report_question(uuid,uuid,text) to service_role;
