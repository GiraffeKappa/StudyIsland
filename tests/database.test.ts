import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { uid, localPlan, project, type Event } from "../src/lib/domain";
import { ISLANDS, UNITS } from "../src/island/data";
test("PostgreSQL migrations, transactional events, invite pairing and RLS isolation", async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
  );
  await db.exec(await readFile("supabase/migrations/001_island.sql", "utf8"));
  await db.exec(await readFile("supabase/migrations/002_reports.sql", "utf8"));
  await db.exec(
    await readFile("supabase/migrations/003_ai_settings.sql", "utf8"),
  );
  const sid = uid(),
    pid = uid(),
    stranger = uid();
  for (const [id, role] of [
    [sid, "student"],
    [pid, "parent"],
    [stranger, "parent"],
  ])
    await db.query("insert into auth.users values($1,$2)", [id, { role }]);
  for (const i of ISLANDS)
    await db.query("insert into subjects values($1,$2,$3,1)", [
      i.id,
      i.name,
      "待核對",
    ]);
  for (const [u, i] of UNITS.map((u, i) => [u, i] as const))
    await db.query("insert into units values($1,$2,$3,$4,$5)", [
      u.id,
      u.island,
      u.name,
      u.book,
      i,
    ]);
  const plan = localPlan(
      "2026-11-09",
      { "2026-11-14": 180, "2026-11-15": 180 },
      {},
    ),
    pe: Event = {
      id: uid(),
      type: "plan",
      data: {
        ...plan,
        capacity: { "2026-11-14": 180, "2026-11-15": 180 },
        base: null,
      },
    };
  await db.query("select commit_events($1,0,$2,$3)", [sid, [pe], []]);
  assert.equal((await db.query("select * from tasks")).rows.length, 16);
  await assert.rejects(
    () => db.query("select commit_events($1,0,$2,$3)", [sid, [], []]),
    /revision conflict/,
  );
  const log: Event = {
    id: uid(),
    type: "log",
    data: {
      id: uid(),
      unit: plan.tasks[0].unit,
      task: plan.tasks[0].id,
      minutes: 10,
      mastery: 1,
      source: "manual",
      focus: null,
      note: "有做筆記",
      finish: false,
      at: new Date().toISOString(),
    },
  };
  await db.query("select commit_events($1,1,$2,$3)", [
    sid,
    [log],
    [{ id: "first-log", name: "發芽小樹" }],
  ]);
  await db.query("select commit_events($1,2,$2,$3)", [
    sid,
    [log],
    [{ id: "first-log", name: "發芽小樹" }],
  ]);
  assert.equal((await db.query("select * from study_logs")).rows.length, 1);
  assert.equal((await db.query("select * from reward_events")).rows.length, 1);
  const task = (
    await db.query<{ payload: { remaining: number; status: string } }>(
      "select payload from tasks where id=$1",
      [plan.tasks[0].id],
    )
  ).rows[0].payload;
  assert.equal(task.remaining, 15);
  assert.equal(task.status, "partial");
  const qid = uid(),
    q = {
      id: qid,
      unit: "m3d",
      prompt: "解 x²−5x+6=0",
      difficulty: 1,
      format: "number",
      verification: "已驗證",
    };
  await db.query("select save_question($1,$2,$3,true)", [
    sid,
    q,
    { answer: "2,3", steps: ["因式分解"] },
  ]);
  async function role(id: string) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("set role authenticated");
  }
  await role(sid);
  assert.equal((await db.query("select * from study_logs")).rows.length, 1);
  await assert.rejects(
    () => db.query("select * from question_solutions"),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("update profiles set role='parent'"),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("select commit_events($1,2,$2,$3)", [sid, [], []]),
    /permission denied/,
  );
  await role(pid);
  assert.equal((await db.query("select * from study_logs")).rows.length, 0);
  await assert.rejects(
    () =>
      db.query("insert into guardian_links values($1,$2,'accepted')", [
        pid,
        sid,
      ]),
    /permission denied/,
  );
  await db.exec("reset role");
  await db.query(
    "insert into guardian_invites values('hashed-secret',$1,now()+interval '15 minutes',null)",
    [sid],
  );
  await db.query("select redeem_invite($1,'hashed-secret')", [pid]);
  await assert.rejects(
    () => db.query("select redeem_invite($1,'hashed-secret')", [stranger]),
    /invalid invitation/,
  );
  await role(pid);
  assert.equal((await db.query("select * from study_logs")).rows.length, 1);
  await assert.rejects(
    () =>
      db.query("update study_logs set minutes=999 where student_id=$1", [sid]),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("select * from question_solutions"),
    /permission denied/,
  );
  await role(stranger);
  assert.equal((await db.query("select * from study_logs")).rows.length, 0);
  assert.equal((await db.query("select * from questions")).rows.length, 0);
  await db.exec("reset role");
  const result = {
    id: uid(),
    question: q,
    answer: "1",
    verdict: "incorrect",
    solution: { answer: "2,3", steps: ["test"] },
    at: new Date().toISOString(),
    day: "2026-11-13",
  };
  const review = {
    id: uid(),
    question: q,
    due: "2026-11-14",
    stage: 0,
    last: result.at,
    results: [result],
  };
  await db.query("select commit_attempt($1,$2,$3)", [sid, result, review]);
  await db.query("select commit_attempt($1,$2,$3)", [
    sid,
    { ...result, id: uid() },
    review,
  ]);
  assert.equal((await db.query("select * from attempts")).rows.length, 1);
  assert.equal((await db.query("select * from review_items")).rows.length, 1);
  await db.query("select report_question($1,$2,'report')", [sid, qid]);
  assert.equal((await db.query("select * from review_items")).rows.length, 0);
  assert.equal(
    (
      await db.query<{ payload: { revoked: boolean } }>(
        "select payload from attempts",
      )
    ).rows[0].payload.revoked,
    true,
  );
  await db.close();
});
