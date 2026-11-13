import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("family migration creates shared profiles without any login account and keeps service-only access", async () => {
  const db = new PGlite();
  await db.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;",
  );
  for (const name of [
    "001_island.sql",
    "002_reports.sql",
    "003_ai_settings.sql",
    "004_family_links.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + name, "utf8"));
  assert.equal((await db.query("select * from auth.users")).rows.length, 0);
  assert.equal((await db.query("select * from profiles")).rows.length, 2);
  assert.equal((await db.query("select * from family_access")).rows.length, 1);
  assert.equal((await db.query("select * from guardian_links")).rows.length, 1);
  await db.exec("set role anon");
  await assert.rejects(
    () => db.query("select * from family_access"),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("select * from study_logs"),
    /permission denied/,
  );
  await db.exec("reset role;set role authenticated");
  await assert.rejects(
    () => db.query("select * from family_access"),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("update profiles set role='student'"),
    /permission denied/,
  );
  await db.close();
});
