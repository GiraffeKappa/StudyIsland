import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { sessionRole } from "./link-access";
import {
  type Event,
  type Question,
  type Result,
  type Review,
  today,
  addDays,
  project,
  validateEvent,
  eventSchema,
  rewards,
} from "./domain";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const configured = () =>
  !!(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
export const demoAllowed = () =>
  !configured() &&
  process.env.NODE_ENV !== "production" &&
  process.env.ALLOW_LOCAL_DEMO !== "false";
export function admin() {
  if (!configured()) throw new HttpError(503, "Supabase 尚未設定");
  return createClient(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export type Identity = {
  id: string;
  role: "student" | "parent";
  demo: boolean;
};
export async function identity(
  request: Request,
  write = false,
): Promise<Identity> {
  if (
    demoAllowed() &&
    (await cookies()).get("island-demo")?.value === "local-student"
  )
    return {
      id: "00000000-0000-4000-8000-000000000001",
      role: "student",
      demo: true,
    };
  const role = sessionRole((await cookies()).get("island-access")?.value || "");
  if (!role) throw new HttpError(401, "請使用家庭專屬連結開啟");
  if (write && role !== "student") throw new HttpError(403, "家長連結只能查看");
  const db = admin();
  const { data: family, error } = await db
    .from("family_access")
    .select("student_id,parent_id")
    .eq("singleton", true)
    .single();
  if (error || !family) throw new HttpError(503, "家庭資料尚未完成設定");
  return {
    id: role === "student" ? family.student_id : family.parent_id,
    role,
    demo: false,
  };
}
export async function studentFor(who: Identity, requested?: string) {
  if (who.role === "student") {
    if (requested && requested !== who.id)
      throw new HttpError(403, "無法存取其他學生");
    return who.id;
  }
  if (!requested) throw new HttpError(400, "請選擇已連結的孩子");
  const { data } = await admin()
    .from("guardian_links")
    .select("student_id")
    .eq("parent_id", who.id)
    .eq("student_id", requested)
    .eq("status", "accepted")
    .maybeSingle();
  if (!data) throw new HttpError(403, "尚未與此學生配對");
  return requested;
}
type LocalDB = {
  events: Event[];
  questions: Record<
    string,
    {
      question: Question;
      solution: { answer: string; steps: string[] };
      verified: boolean;
    }
  >;
  attempts: Result[];
  reviews: Review[];
  feedback: unknown[];
};
const initial = (): LocalDB => ({
  events: [],
  questions: {},
  attempts: [],
  reviews: [],
  feedback: [],
});
// Demo persistence is deliberately local and disabled in production. Writes are serialized in one process.
let queue: Promise<unknown> = Promise.resolve();
export async function local<T>(
  fn: (db: LocalDB) => T | Promise<T>,
  save = false,
): Promise<T> {
  const op = queue.then(async () => {
    await mkdir(".local", { recursive: true });
    let db: LocalDB;
    try {
      db = JSON.parse(await readFile(".local/demo.json", "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new HttpError(503, "本機資料檔無法讀取，請保留檔案並從備份復原");
      db = initial();
    }
    const out = await fn(db);
    if (save) {
      await writeFile(".local/demo.next.json", JSON.stringify(db));
      await rename(".local/demo.next.json", ".local/demo.json");
    }
    return out;
  });
  queue = op.catch(() => {});
  return op;
}
export async function eventsFor(id: string, demo = false): Promise<Event[]> {
  if (demo) return local((db) => db.events);
  const out: Event[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin()
      .from("learner_events")
      .select("payload")
      .eq("student_id", id)
      .order("seq")
      .range(offset, offset + 499);
    if (error) throw new HttpError(503, "讀取雲端紀錄失敗");
    out.push(...(data || []).map((r) => r.payload as Event));
    if (!data || data.length < 500) break;
  }
  return out;
}
export async function sync(who: Identity, incoming: Event[]) {
  if (incoming.length > 100) throw new HttpError(400, "單次同步最多 100 筆");
  const apply = (events: Event[]) => {
    const conflicts: { event: Event; reason: string }[] = [],
      accepted: Event[] = [];
    for (const raw of incoming) {
      const e = eventSchema.parse(raw);
      const previous = events.find((x) => x.id === e.id);
      if (previous) {
        if (JSON.stringify(previous) !== JSON.stringify(e))
          conflicts.push({
            event: e,
            reason: "事件 ID 已存在且內容不同，原版本保留",
          });
        continue;
      }
      try {
        validateEvent(e, events);
        events.push(e);
        accepted.push(e);
      } catch (err) {
        conflicts.push({ event: e, reason: (err as Error).message });
      }
    }
    return { events, accepted, conflicts };
  };
  if (who.demo)
    return local((db) => {
      const r = apply([...db.events]);
      db.events = r.events;
      return { events: r.events, conflicts: r.conflicts };
    }, true);
  const before = await eventsFor(who.id),
    result = apply([...before]);
  if (result.accepted.length) {
    const p = project(result.events);
    const { error } = await admin().rpc("commit_events", {
      sid: who.id,
      expected_count: before.length,
      batch: result.accepted,
      earned: rewards(
        p.logs,
        (await loadPractice(who.id)).attempts,
        result.events,
      )
        .filter((r) => r.got)
        .map((r) => ({ id: r.id, name: r.name })),
    });
    if (error)
      throw new HttpError(409, "同步時其他裝置已更新；資料已保留，請重試同步");
  }
  return { events: result.events, conflicts: result.conflicts };
}
export async function loadPractice(id: string, demo = false) {
  if (demo)
    return local((db) => ({
      questions: Object.values(db.questions).map((q) => q.question),
      attempts: db.attempts,
      reviews: db.reviews,
    }));
  async function rows<T>(table: string, sort: string) {
    const out: T[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await admin()
        .from(table)
        .select("payload")
        .eq("student_id", id)
        .order(sort)
        .range(offset, offset + 499);
      if (error) throw new HttpError(503, "數學資料讀取失敗");
      out.push(...(data || []).map((r) => r.payload as T));
      if (!data || data.length < 500) break;
    }
    return out;
  }
  const results = await Promise.all([
    rows<Question>("questions", "created_at"),
    rows<Result>("attempts", "created_at"),
    rows<Review>("review_items", "id"),
  ]);
  return {
    questions: results[0],
    attempts: results[1],
    reviews: results[2],
  };
}
export async function saveQuestion(
  who: Identity,
  q: Question,
  solution: { answer: string; steps: string[] },
  verified: boolean,
) {
  if (who.demo)
    return local((db) => {
      db.questions[q.id] = { question: q, solution, verified };
    }, true);
  const { error } = await admin().rpc("save_question", {
    sid: who.id,
    q,
    solution,
    verified,
  });
  if (error) throw new HttpError(503, "題目儲存失敗，請重試");
}
export async function getQuestion(who: Identity, id: string) {
  if (who.demo) return local((db) => db.questions[id]);
  const db = admin();
  const { data: q } = await db
    .from("questions")
    .select("payload")
    .eq("student_id", who.id)
    .eq("id", id)
    .maybeSingle();
  const { data: s } = await db
    .from("question_solutions")
    .select("payload,verified")
    .eq("student_id", who.id)
    .eq("question_id", id)
    .maybeSingle();
  return q && s
    ? {
        question: q.payload as Question,
        solution: s.payload as { answer: string; steps: string[] },
        verified: s.verified,
      }
    : undefined;
}
export async function submit(
  who: Identity,
  q: Question,
  answer: string,
  verdict: Result["verdict"],
  solution: Result["solution"],
) {
  const prefs = project(await eventsFor(who.id, who.demo)).prefs;
  const old = await loadPractice(who.id, who.demo);
  const existing = old.attempts.find(
    (a) => a.question.id === q.id && !a.revoked,
  );
  if (existing) return existing;
  const at = new Date().toISOString(),
    result: Result = {
      id: randomUUID(),
      question: q,
      answer,
      verdict,
      solution,
      at,
      day: today(),
    };
  let review = old.reviews.find(
    (r) =>
      (r.question.originId || r.question.id) === (q.originId || q.id) ||
      r.id === q.reviewId,
  );
  if (verdict === "incorrect" || (review && verdict === "correct")) {
    const stage =
      verdict === "correct" ? Math.min(2, (review?.stage ?? -1) + 1) : 0;
    review = {
      id: review?.id || randomUUID(),
      question: review?.question || q,
      stage,
      due: addDays(today(), prefs.reviewIntervals[stage]),
      last: at,
      results: [...(review?.results || []), result],
    };
  }
  if (who.demo)
    return local((db) => {
      const duplicate = db.attempts.find(
        (a) => a.question.id === q.id && !a.revoked,
      );
      if (duplicate) return duplicate;
      db.attempts.push(result);
      if (review) {
        db.reviews = db.reviews.filter((r) => r.id !== review.id);
        db.reviews.push(review);
      }
      return result;
    }, true);
  const { data, error } = await admin().rpc("commit_attempt", {
    sid: who.id,
    result,
    review: review || null,
  });
  if (error) throw new HttpError(503, "作答儲存失敗；答案草稿仍保留");
  const all = await loadPractice(who.id);
  const earned = rewards(project(await eventsFor(who.id)).logs, all.attempts)
    .filter((r) => r.got)
    .map((r) => ({
      id: r.id,
      student_id: who.id,
      payload: { name: r.name, condition: r.condition },
    }));
  if (earned.length)
    await admin()
      .from("reward_events")
      .upsert(earned, { onConflict: "student_id,id", ignoreDuplicates: true });
  return data as Result;
}
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export async function checked<T>(
  promise: PromiseLike<{ data: T; error: unknown }>,
) {
  const { data, error } = await promise;
  if (error) throw new HttpError(503, "資料服務暫時無法完成，請稍後重試");
  return data;
}
