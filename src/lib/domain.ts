import { z } from "zod";
import { UNITS, ISLANDS } from "../island/data";
export const MASTERY = ["尚未評估", "不太會", "大致會", "很熟"] as const;
export const today = (time: number | Date = Date.now()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(time);
export const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + "T12:00:00+08:00") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export const weekStart = (date = today()) => {
  const d = new Date(date + "T12:00:00+08:00");
  return addDays(date, -((d.getUTCDay() + 6) % 7));
};
export const uid = () => crypto.randomUUID();
const unit = z
  .string()
  .refine((id) => UNITS.some((u) => u.id === id), "不存在的概念單元");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (d) =>
      !Number.isNaN(Date.parse(d + "T00:00:00Z")) &&
      new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d,
  );
export const taskSchema = z.object({
  id: z.uuid(),
  unit,
  date,
  minutes: z.number().int().min(1).max(360),
  questions: z.number().int().min(0).max(30),
  remaining: z.number().int().min(0).max(360),
  status: z.enum(["pending", "partial", "done", "deferred"]),
  version: z.number().int().min(0),
});
export type Task = z.infer<typeof taskSchema>;
export const planSchema = z.object({
  id: z.uuid(),
  week: date,
  source: z.enum(["local", "gemini"]),
  explanation: z.string().max(3000),
  tasks: z.array(taskSchema).max(150),
  unplaced: z.array(unit).max(300),
});
export type Plan = z.infer<typeof planSchema>;
export const preferencesSchema = z.object({
  name: z.string().max(30),
  character: z.string().max(30),
  motion: z.boolean(),
  mode: z.enum(["3d", "2d"]),
  idols: z.array(z.string().max(30)).max(8),
  dailyTarget: z.number().int().min(1).max(20),
  examDate: z.union([date, z.literal("")]),
  reviewIntervals: z.array(z.number().int().min(1).max(90)).length(3),
  onboarded: z.boolean(),
  schoolUnits: z.array(unit).max(50),
});
const logSchema = z.object({
  id: z.uuid(),
  unit,
  task: z.uuid().nullable(),
  minutes: z.number().min(1).max(720),
  note: z.string().max(2000),
  source: z.enum(["manual", "timer"]),
  focus: z.uuid().nullable(),
  at: z.iso.datetime(),
  mastery: z.number().int().min(0).max(3),
  finish: z.boolean(),
});
export type StudyLog = z.infer<typeof logSchema>;
export type Focus = {
  id: string;
  unit: string;
  target: number;
  elapsed: number;
  started: number | null;
  converted: boolean;
};
export const eventSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.uuid(),
    type: z.literal("explore"),
    data: z.object({ unit, at: z.iso.datetime() }),
  }),
  z.object({ id: z.uuid(), type: z.literal("log"), data: logSchema }),
  z.object({
    id: z.uuid(),
    type: z.literal("mastery"),
    data: z.object({
      unit,
      value: z.number().int().min(0).max(3),
      at: z.iso.datetime(),
    }),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal("plan"),
    data: planSchema.extend({
      capacity: z.record(date, z.number().int().min(0).max(720)),
      base: z.string().nullable(),
    }),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal("task"),
    data: z.object({
      id: z.uuid(),
      base: z.number().int().min(0),
      date,
      status: z.enum(["pending", "partial", "done", "deferred"]),
      remaining: z.number().int().min(0).max(360),
    }),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal("preferences"),
    data: preferencesSchema,
  }),
  z.object({
    id: z.uuid(),
    type: z.literal("focus"),
    data: z.object({
      id: z.uuid(),
      unit,
      target: z.number().int().min(60).max(10800),
      elapsed: z.number().min(0).max(10800),
      started: z.number().nullable(),
      converted: z.boolean(),
    }),
  }),
]);
export type Event = z.infer<typeof eventSchema>;
export type Question = {
  model?: string;
  id: string;
  unit: string;
  prompt: string;
  difficulty: number;
  format: string;
  demo?: boolean;
  verification: string;
  reviewId?: string;
  originId?: string;
  reported?: boolean;
};
export type Result = {
  question: Question;
  id: string;
  answer: string;
  verdict: "correct" | "incorrect" | "uncertain";
  solution: { answer: string; steps: string[] };
  at: string;
  day: string;
  revoked?: boolean;
};
export type Review = {
  id: string;
  question: Question;
  due: string;
  stage: number;
  last: string;
  results: Result[];
};
export type State = {
  events: Event[];
  outbox: Event[];
  conflicts: { event: Event; reason: string }[];
  questions: Question[];
  attempts: Result[];
  reviews: Review[];
  draft: Plan | null;
  capacity: Record<string, number>;
  answers: Record<string, string>;
  lastSync: string | null;
};
export const emptyState = (): State => ({
  events: [],
  outbox: [],
  conflicts: [],
  questions: [],
  attempts: [],
  reviews: [],
  draft: null,
  capacity: {},
  answers: {},
  lastSync: null,
});
export const defaultPrefs = (): z.infer<typeof preferencesSchema> => ({
  name: "臭凝",
  character: "島島獺",
  motion: true,
  mode: "3d",
  idols: ["許光漢", "曾敬驊", "沈伯洋", "周杰倫"],
  dailyTarget: 3,
  examDate: "",
  reviewIntervals: [1, 3, 7],
  onboarded: false,
  schoolUnits: [],
});
export function project(events: Event[]) {
  const mastery: Record<string, number> = {},
    tasks: Record<string, Task> = {},
    logs: StudyLog[] = [],
    focus: Record<string, Focus> = {};
  let prefs = defaultPrefs(),
    planId: string | null = null;
  const seen = new Set<string>(),
    focusLogs = new Set<string>();
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    if (e.type === "preferences") prefs = e.data;
    if (e.type === "mastery") mastery[e.data.unit] = e.data.value;
    if (e.type === "focus") focus[e.data.id] = e.data;
    if (e.type === "plan") {
      planId = e.data.id;
      for (const t of e.data.tasks) tasks[t.id] = { ...t };
    }
    if (e.type === "task" && tasks[e.data.id]) {
      const t = tasks[e.data.id];
      if (t.version === e.data.base)
        tasks[t.id] = { ...t, ...e.data, version: t.version + 1 };
    }
    if (e.type === "log") {
      const l = e.data;
      if (l.focus && focusLogs.has(l.focus)) continue;
      if (l.focus) focusLogs.add(l.focus);
      logs.push(l);
      mastery[l.unit] = l.mastery;
      if (l.task && tasks[l.task]) {
        const t = tasks[l.task];
        t.remaining = l.finish ? 0 : Math.max(0, t.remaining - l.minutes);
        t.status = l.finish ? "done" : "partial";
        t.version++;
      }
    }
  }
  return { mastery, tasks: Object.values(tasks), logs, focus, prefs, planId };
}
export function validateEvent(e: Event, events: Event[]) {
  const p = project(events);
  if (e.type === "plan") {
    if (e.data.base !== p.planId) throw Error("正式計畫已在其他裝置更新");
    validatePlan(e.data, e.data.capacity, p.tasks);
  }
  if (e.type === "task") {
    const t = p.tasks.find((t) => t.id === e.data.id);
    if (!t || t.version !== e.data.base)
      throw Error("任務版本衝突，請保留並重新確認");
    if (e.data.status === "done" && e.data.remaining !== 0)
      throw Error("完成任務時剩餘量需為 0");
    if (t.questions === 0 && e.data.status !== "done") {
      const caps = Object.assign(
        {},
        ...events.filter((e) => e.type === "plan").map((e) => e.data.capacity),
      );
      const used = p.tasks
        .filter(
          (x) =>
            x.id !== t.id &&
            x.date === e.data.date &&
            x.questions === 0 &&
            x.status !== "done",
        )
        .reduce((n, x) => n + x.remaining, 0);
      if (used + e.data.remaining > (caps[e.data.date] ?? 0))
        throw Error("改期日期超出已確認的可用時間，請先調整每週安排");
    }
  }
  if (e.type === "log") {
    if (p.logs.some((l) => l.id === e.data.id))
      throw Error("此筆讀書紀錄已存在");
    if (
      e.data.task &&
      !p.tasks.some((t) => t.id === e.data.task && t.unit === e.data.unit)
    )
      throw Error("任務與單元不一致");
    if (e.data.focus) {
      const f = p.focus[e.data.focus];
      if (
        !f ||
        f.unit !== e.data.unit ||
        p.logs.some((l) => l.focus === e.data.focus)
      )
        throw Error("這段計時已轉成紀錄或單元不一致");
      if (
        e.data.source !== "timer" ||
        e.data.minutes > Math.floor(focusSeconds(f) / 60)
      )
        throw Error("計時分鐘超出有效時間");
    }
    if (e.data.source === "timer" && !e.data.focus)
      throw Error("計時紀錄需指定有效專注時段");
  }
}
export function validatePlan(
  plan: Plan,
  capacity: Record<string, number>,
  existing: Task[] = [],
) {
  const ids = new Set<string>();
  const loads: Record<string, number> = {};
  for (const t of [
    ...existing.filter((t) => t.status !== "done" && t.status !== "deferred"),
    ...plan.tasks,
  ]) {
    if (ids.has(t.id)) throw Error("任務 ID 重複");
    ids.add(t.id);
    if (t.questions === 0) loads[t.date] = (loads[t.date] || 0) + t.remaining;
  }
  for (const t of plan.tasks) {
    if (t.date < plan.week || t.date > addDays(plan.week, 6))
      throw Error("任務超出本週");
    if (
      t.questions > 0 &&
      UNITS.find((u) => u.id === t.unit)?.island !== "math"
    )
      throw Error("只有數學可以排題數");
  }
  for (const [d, n] of Object.entries(loads))
    if (plan.tasks.some((t) => t.date === d) && n > (capacity[d] ?? 0))
      throw Error(
        `${d} 已排 ${n} 分鐘，超過可用 ${capacity[d] ?? 0} 分鐘（數學另列）`,
      );
}
export function localPlan(
  week: string,
  capacity: Record<string, number>,
  mastery: Record<string, number>,
  schoolUnits: string[] = [],
): Plan {
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    left = { ...capacity },
    tasks: Task[] = [],
    unplaced: string[] = [];
  const ordered = [...ISLANDS].sort((a, b) =>
    ["math", "phy", "bio"].indexOf(a.id) < 0
      ? 1
      : ["math", "phy", "bio"].indexOf(b.id) < 0
        ? -1
        : 0,
  );
  for (const island of ordered) {
    const us = UNITS.filter((u) => u.island === island.id).sort(
      (a, b) =>
        Number(schoolUnits.includes(b.id)) -
          Number(schoolUnits.includes(a.id)) ||
        Number(b.book >= 5) - Number(a.book >= 5) ||
        (mastery[a.id] ?? 0) - (mastery[b.id] ?? 0),
    );
    const u = us[0];
    const d = days.find((d) => (left[d] || 0) >= 25);
    if (d) {
      tasks.push({
        id: uid(),
        unit: u.id,
        date: d,
        minutes: 25,
        remaining: 25,
        questions: 0,
        status: "pending",
        version: 0,
      });
      left[d] -= 25;
    } else unplaced.push(u.id);
  }
  const mu =
    schoolUnits.find(
      (id) => UNITS.find((u) => u.id === id)?.island === "math",
    ) || UNITS.find((u) => u.island === "math" && u.book === 5)!.id;
  for (const d of days)
    tasks.push({
      id: uid(),
      unit: mu,
      date: d,
      minutes: 15,
      remaining: 15,
      questions: 3,
      status: "pending",
      version: 0,
    });
  return {
    id: uid(),
    week,
    source: "local",
    explanation:
      "本機規則草稿（非 AI）：九科各安排一個概念，第五六冊與目前進度優先。平日額外複習預設 0；數學每日三題約 15 分鐘獨立列出，請確認實際負荷。未安排的概念仍需後續排程。",
    tasks,
    unplaced,
  };
}
export function focusSeconds(f: Focus, now = Date.now()) {
  return Math.min(
    f.target,
    Math.max(
      0,
      f.elapsed + (f.started === null ? 0 : (now - f.started) / 1000),
    ),
  );
}
export function dailyCount(attempts: Result[], day = today()) {
  return new Set(
    attempts
      .filter((a) => a.day === day && !a.revoked && a.verdict !== "uncertain")
      .map((a) => a.question.originId || a.question.id),
  ).size;
}
export function practiceSummary(attempts: Result[]) {
  const valid = [
    ...new Map(
      attempts.filter((a) => !a.revoked).map((a) => [a.question.id, a]),
    ).values(),
  ];
  const correct = valid.filter((a) => a.verdict === "correct").length,
    incorrect = valid.filter((a) => a.verdict === "incorrect").length,
    uncertain = valid.filter((a) => a.verdict === "uncertain").length;
  return {
    correct,
    incorrect,
    uncertain,
    rate:
      correct + incorrect
        ? Math.round((correct / (correct + incorrect)) * 100)
        : null,
  };
}
export function rewards(
  logs: StudyLog[],
  attempts: Result[],
  events: Event[] = [],
) {
  const effort = logs.reduce((n, l) => n + l.minutes, 0),
    count = new Set(
      attempts
        .filter((a) => !a.revoked && a.verdict !== "uncertain")
        .map((a) => a.question.originId || a.question.id),
    ).size;
  const visited = new Set(logs.map((l) => l.unit)),
    math = UNITS.filter((u) => u.island === "math"),
    pomos = logs.filter((l) => l.source === "timer" && l.minutes >= 25).length;
  const returnVisits = UNITS.filter(
    (u) =>
      new Set(
        logs.filter((l) => l.unit === u.id).map((l) => today(new Date(l.at))),
      ).size >= 2,
  ).length;
  return [
    {
      id: "first-light",
      name: "第一盞燈",
      condition: "記下任一單元的投入",
      got: logs.length > 0,
    },
    {
      id: "ten-lights",
      name: "十棟亮燈",
      condition: "十個不同單元留下讀書足跡",
      got: visited.size >= 10,
    },
    {
      id: "review-master",
      name: "複習達人",
      condition: "五個單元在不同日再回來讀",
      got: returnVisits >= 5,
    },
    {
      id: "practice-badge",
      name: "練習徽章",
      condition: "首次有效數學提交（由原考過徽章調整）",
      got: count >= 1,
    },
    {
      id: "math-half",
      name: "數學半亮",
      condition: "半數數學概念留下投入紀錄，不代表已熟悉",
      got:
        math.filter((u) => visited.has(u.id)).length >=
        Math.ceil(math.length / 2),
    },
    {
      id: "math-full",
      name: "數學全亮",
      condition: "每個數學概念都曾投入，不代表全部讀完",
      got: math.every((u) => visited.has(u.id)),
    },
    {
      id: "nature-explorer",
      name: "自然探險家",
      condition: "生物、理化、地科各留一筆紀錄",
      got: ["bio", "phy", "earth"].every((id) =>
        UNITS.some((u) => u.island === id && visited.has(u.id)),
      ),
    },
    {
      id: "island-light",
      name: "全島點亮",
      condition: "任一島全部概念都曾投入，不代表全部熟悉",
      got: ISLANDS.some((i) =>
        UNITS.filter((u) => u.island === i.id).every((u) => visited.has(u.id)),
      ),
    },
    {
      id: "pomo-one",
      name: "專注番茄",
      condition: "一段至少25分鐘的計時轉為紀錄",
      got: pomos >= 1,
    },
    {
      id: "pomo-four",
      name: "番茄四連",
      condition: "累積四段至少25分鐘的專注紀錄",
      got: pomos >= 4,
    },
    {
      id: "dice",
      name: "今日骰子",
      condition: "抽一次隨機複習單元",
      got: events.some((e) => e.type === "explore"),
    },
    {
      id: "first-log",
      name: "發芽小樹",
      condition: "留下第一筆讀書紀錄",
      got: logs.length > 0,
    },
    {
      id: "hour",
      name: "茶茶休息亭",
      condition: "累積投入 60 分鐘",
      got: effort >= 60,
    },
    {
      id: "math-three",
      name: "數學小船",
      condition: "練習三道不同數學題",
      got: count >= 3,
    },
    {
      id: "five-hours",
      name: "星光燈塔",
      condition: "累積投入 300 分鐘",
      got: effort >= 300,
    },
  ];
}
