import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  admin,
  checked,
  configured,
  demoAllowed,
  identity,
  studentFor,
  sync,
  eventsFor,
  loadPractice,
  getQuestion,
  saveQuestion,
  submit,
  local,
  HttpError,
  hash,
} from "@/lib/server";
import { aiConfigured, gemini } from "@/lib/ai";
import { generate } from "@/lib/questions";
import { equivalent } from "@/lib/math";
import {
  eventSchema,
  uid,
  today,
  addDays,
  project,
  planSchema,
  validatePlan,
  validateEvent,
  type Plan,
  type Event,
  type Review,
  type Result,
} from "@/lib/domain";
import { UNITS } from "@/island/data";
export const runtime = "nodejs";
const bodySchema = z.record(z.string(), z.unknown());
async function handle(req: Request, action: string) {
  const body =
    req.method === "GET"
      ? Object.fromEntries(new URL(req.url).searchParams)
      : bodySchema.parse(await req.json());
  if (action === "config")
    return {
      cloud: configured(),
      demo: demoAllowed(),
      ai: aiConfigured(),
      provider: "Gemini",
      model: process.env.GEMINI_MODEL || null,
      dailyLimit: Number(process.env.AI_DAILY_REQUEST_LIMIT || 30),
    };
  if (action === "demo") {
    if (!demoAllowed()) throw new HttpError(403, "正式環境不開放本機示範");
    (await cookies()).set("island-demo", "local-student", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    return { ok: true };
  }
  if (action === "logout") {
    (await cookies()).delete("island-demo");
    return { ok: true };
  }
  const readOnly = ["me", "state", "children"].includes(action);
  const who = await identity(req, !readOnly);
  if (action === "me") return who;
  if (action === "children") {
    if (who.role !== "parent") return [];
    const links = await checked(
      admin()
        .from("guardian_links")
        .select("student_id")
        .eq("parent_id", who.id),
    );
    const rows = await checked(
      admin()
        .from("profiles")
        .select("id,nickname,synced_at")
        .in(
          "id",
          (links || []).map((l) => l.student_id),
        ),
    );
    return rows;
  }
  if (action === "state") {
    const id = await studentFor(who, body.student as string | undefined);
    const events = await eventsFor(id, who.demo),
      practice = await loadPractice(id, who.demo);
    const profile = who.demo
      ? null
      : await checked(
          admin().from("profiles").select("synced_at").eq("id", id).single(),
        );
    return { events, ...practice, lastSync: profile?.synced_at || null };
  }
  if (action === "sync") {
    return sync(who, z.array(eventSchema).max(100).parse(body.events));
  }
  if (action === "invite") {
    if (who.demo)
      throw new HttpError(503, "示範無跨裝置配對；請先設定 Supabase");
    const token = randomBytes(24).toString("base64url");
    await checked(
      admin()
        .from("guardian_invites")
        .insert({
          token_hash: hash(token),
          student_id: who.id,
          expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
        }),
    );
    return { token, expires: "15 分鐘內有效，僅可使用一次" };
  }
  if (action === "pair") {
    // Parent-only route authenticates without learning-write permission.
    throw new HttpError(400, "請使用家長配對入口");
  }
  if (action === "match") {
    const text = z.string().trim().min(1).max(500).parse(body.text);
    const options = UNITS.filter((u) => u.island === "math");
    const result = await gemini(
      who,
      "match",
      JSON.stringify({
        input: text,
        units: options,
        instruction:
          "找出符合輸入的既有數學單元，歧義時列出多個候選，無符合回空陣列。最多五個 ID，不出題。",
      }),
      z.object({ ids: z.array(z.string()).max(5) }),
    );
    if (result.ids.some((id) => !options.some((u) => u.id === id)))
      throw new HttpError(502, "AI 回覆不存在的單元");
    return result;
  }
  if (action === "plan") {
    const week = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .parse(body.week),
      capacity = z
        .record(z.string(), z.number().int().min(0).max(720))
        .parse(body.capacity);
    const p = project(await eventsFor(who.id, who.demo));
    const schema = z.object({
      explanation: z.string().max(3000),
      tasks: z
        .array(
          z.object({
            unit: z.string(),
            date: z.string(),
            minutes: z.number().int().min(1).max(180),
            questions: z.number().int().min(0).max(20),
          }),
        )
        .max(100),
      unplaced: z.array(z.string()).max(300),
    });
    const result = await gemini(
      who,
      "plan",
      JSON.stringify({
        week,
        capacity,
        mastery: p.mastery,
        schoolUnits: p.prefs.schoolUnits,
        existing: p.tasks,
        units: UNITS,
        instruction:
          "提出九科週計畫草稿。只用提供的 ID 與本週七天。第五六冊與schoolUnits優先，其餘時間補一到四冊，數學理化生物優先補強。每日數學三題 questions=3 約15分鐘獨立列出；其餘questions=0負荷不得超capacity（需加上existing剩餘）。平日0不能排一般複習。不可重新排已有任務。無法容納列unplaced，explanation說明取捨與數學額外負荷。不編造考試日期。",
      }),
      schema,
    );
    const plan: Plan = planSchema.parse({
      id: uid(),
      week,
      source: "gemini",
      ...result,
      tasks: result.tasks.map((t) => ({
        ...t,
        id: uid(),
        remaining: t.minutes,
        status: "pending",
        version: 0,
      })),
    });
    validatePlan(plan, capacity, p.tasks);
    if (!who.demo)
      await checked(
        admin().from("plan_versions").insert({
          id: plan.id,
          student_id: who.id,
          week: plan.week,
          status: "draft",
          payload: plan,
        }),
      );
    return plan;
  }
  if (action === "reschedule") {
    const week = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .parse(body.week),
      capacity = z
        .record(z.string(), z.number().int().min(0).max(720))
        .parse(body.capacity);
    const events = await eventsFor(who.id, who.demo),
      p = project(events);
    const pending = p.tasks.filter(
      (t) => t.status !== "done" && t.date < today(),
    );
    const response = await gemini(
      who,
      "reschedule",
      JSON.stringify({
        week,
        capacity,
        existing: p.tasks,
        pending,
        instruction:
          "為未完成任務建議改到本週日期，回傳moves(task原ID,date,reason)、無法容納的taskID(unplaced)、explanation。已投入紀錄不改。一般任務剩餘分鐘加既有任務不得超過可用分鐘；數學題數獨立列出但須說明額外負荷。無法容納不要硬排。",
      }),
      z.object({
        moves: z
          .array(
            z.object({
              task: z.uuid(),
              date: z.string(),
              reason: z.string().max(500),
            }),
          )
          .max(100),
        unplaced: z.array(z.uuid()).max(100),
        explanation: z.string().max(2000),
      }),
    );
    const temporary: Event[] = [
      ...events,
      {
        id: uid(),
        type: "plan",
        data: {
          id: uid(),
          week,
          source: "local",
          explanation: "確認可用時間",
          tasks: [],
          unplaced: [],
          capacity,
          base: p.planId,
        },
      },
    ];
    const seen = new Set<string>();
    for (const m of response.moves) {
      const t = pending.find((t) => t.id === m.task);
      if (!t || seen.has(m.task) || m.date < week || m.date > addDays(week, 6))
        throw new HttpError(502, "改期建議包含無效任務或日期");
      seen.add(m.task);
      const e = eventSchema.parse({
        id: uid(),
        type: "task",
        data: {
          id: t.id,
          base: t.version,
          date: m.date,
          status: t.status === "partial" ? "partial" : "pending",
          remaining: t.remaining,
        },
      });
      validateEvent(e, temporary);
      temporary.push(e);
    }
    if (response.unplaced.some((id) => !pending.some((t) => t.id === id)))
      throw new HttpError(502, "未安排任務 ID 不合法");
    return response;
  }
  if (action === "question")
    return generate(
      who,
      z.string().parse(body.unit),
      z.number().int().min(1).max(3).parse(body.difficulty),
      body.demo === true,
    );
  if (action === "answer") {
    const id = z.uuid().parse(body.id),
      answer = z.string().trim().min(1).max(500).parse(body.answer),
      q = await getQuestion(who, id);
    if (!q) throw new HttpError(404, "題目不存在或不屬於此帳號");
    if (q.question.reported) throw new HttpError(409, "此題已回報，請換題");
    return submit(
      who,
      q.question,
      answer,
      q.verified ? equivalent(answer, q.solution.answer) : "uncertain",
      q.solution,
    );
  }
  if (action === "feedback") {
    const id = z.uuid().parse(body.id),
      kind = z.enum(["easy", "hard", "report", "revoke"]).parse(body.kind),
      q = await getQuestion(who, id);
    if (!q) throw new HttpError(404, "找不到自己的題目");
    if (who.demo) {
      await local((db) => {
        db.feedback.push({ id, kind, at: new Date().toISOString() });
        if (kind === "report" || kind === "revoke") {
          const root = q.question.originId || id;
          for (const stored of Object.values(db.questions))
            if ((stored.question.originId || stored.question.id) === root)
              stored.question.reported = true;
          db.attempts = db.attempts.map((a) =>
            (a.question.originId || a.question.id) === root
              ? { ...a, revoked: true }
              : a,
          );
          db.reviews = db.reviews.filter(
            (r) => (r.question.originId || r.question.id) !== root,
          );
        }
      }, true);
    } else {
      await checked(
        admin().rpc("report_question", { sid: who.id, qid: id, kind }),
      );
    }
    return { ok: true };
  }
  if (action === "retry-answer") {
    const id = z.uuid().parse(body.id),
      original = await getQuestion(who, id);
    if (!original) throw new HttpError(404, "題目不存在");
    const attempt = (await loadPractice(who.id, who.demo)).attempts.find(
      (a) => a.question.id === id && a.verdict === "uncertain" && !a.revoked,
    );
    if (!attempt) throw new HttpError(409, "這題沒有可重新輸入的待確認判定");
    const q = {
      ...original.question,
      id: uid(),
      originId: original.question.originId || id,
    };
    await saveQuestion(who, q, original.solution, original.verified);
    return q;
  }
  if (action === "review") {
    const id = z.uuid().parse(body.id),
      operation = z.enum(["postpone", "retry"]).parse(body.operation),
      r = (await loadPractice(who.id, who.demo)).reviews.find(
        (r) => r.id === id,
      );
    if (!r) throw new HttpError(404, "錯題項目不存在");
    if (operation === "postpone") {
      const due = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .parse(body.date);
      if (due <= today() || due > addDays(today(), 90))
        throw new HttpError(400, "請選擇未來 90 天內日期");
      const updated = { ...r, due };
      if (who.demo)
        await local((db) => {
          db.reviews = db.reviews.map((x) => (x.id === id ? updated : x));
        }, true);
      else
        await checked(
          admin()
            .from("review_items")
            .update({ payload: updated })
            .eq("id", id)
            .eq("student_id", who.id),
        );
      return { ok: true };
    }
    const original = await getQuestion(who, r.question.id);
    if (!original) throw new HttpError(404, "原題已不存在");
    const q = {
      ...original.question,
      id: uid(),
      reviewId: r.id,
      originId: r.question.originId || r.question.id,
    };
    await saveQuestion(who, q, original.solution, original.verified);
    return q;
  }
  throw new HttpError(404, "不存在的操作");
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return route(req, (await params).action);
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const origin = req.headers.get("origin");
  const allowed = process.env.SITE_ORIGIN
    ? new URL(process.env.SITE_ORIGIN).host
    : req.headers.get("host");
  if (origin && new URL(origin).host !== allowed)
    return NextResponse.json({ error: "來源不符" }, { status: 403 });
  return route(req, (await params).action);
}
async function route(req: Request, action: string) {
  try {
    if (action === "ai-settings") {
      const who = await identity(req);
      if (who.role !== "parent")
        throw new HttpError(403, "AI 服務設定限家長管理");
      const allowed = (
          process.env.AI_ALLOWED_MODELS ||
          process.env.GEMINI_MODEL ||
          ""
        )
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        max = Number(process.env.AI_DAILY_REQUEST_LIMIT || 30);
      if (req.method === "GET") {
        const data = await checked(
          admin()
            .from("ai_settings")
            .select("model,daily_limit,enabled")
            .eq("parent_id", who.id)
            .maybeSingle(),
        );
        return NextResponse.json({
          settings: data || {
            model: process.env.GEMINI_MODEL || "",
            daily_limit: max,
            enabled: true,
          },
          allowed,
          max,
        });
      }
      const data = z
        .object({
          model: z.string().refine((s) => allowed.includes(s)),
          daily_limit: z.number().int().min(1).max(max),
          enabled: z.boolean(),
        })
        .parse(await req.json());
      await checked(
        admin()
          .from("ai_settings")
          .upsert({
            parent_id: who.id,
            ...data,
            updated_at: new Date().toISOString(),
          }),
      );
      return NextResponse.json({ ok: true });
    }
    if (
      req.method === "GET" &&
      !["config", "me", "state", "children"].includes(action)
    )
      throw new HttpError(405, "請使用 POST");
    if (
      req.method === "POST" &&
      Number(req.headers.get("content-length") || 0) > 250000
    )
      throw new HttpError(413, "同步資料太大，請分批");
    if (action === "pair" && req.method === "POST") {
      const who = await identity(req);
      if (who.role !== "parent") throw new HttpError(403, "僅家長可以接受邀請");
      const { token } = z
        .object({ token: z.string().min(20).max(100) })
        .parse(await req.json());
      const { error } = await admin().rpc("redeem_invite", {
        pid: who.id,
        hashed: hash(token),
      });
      if (error) throw new HttpError(400, "邀請無效、已使用或已過期");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(await handle(req, action));
  } catch (e) {
    const status =
      e instanceof HttpError ? e.status : e instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error:
          e instanceof HttpError
            ? e.message
            : e instanceof z.ZodError
              ? "輸入資料驗證失敗"
              : "服務暫時無法完成，資料未宣告成功，請重試",
      },
      { status },
    );
  }
}
