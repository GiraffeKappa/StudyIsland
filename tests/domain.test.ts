import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  today,
  weekStart,
  uid,
  project,
  localPlan,
  validatePlan,
  validateEvent,
  focusSeconds,
  dailyCount,
  eventSchema,
  type Event,
  type Result,
} from "../src/lib/domain";
import { equivalent, scalar } from "../src/lib/math";
import { certified } from "../src/lib/questions";
test("Taipei day and Monday boundary are independent of host timezone", () => {
  assert.equal(today(Date.parse("2026-11-13T16:01:00Z")), "2026-11-14");
  assert.equal(weekStart("2026-11-15"), "2026-11-09");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
test("safe math accepts equivalent fractions, roots and unordered solution sets", () => {
  assert.equal(equivalent("2/4", "0.5"), "correct");
  assert.equal(equivalent("√8", "2*sqrt(2)"), "correct");
  assert.equal(equivalent("x=-2,3", "3,-2"), "correct");
  assert.equal(equivalent("-3", "3"), "incorrect");
  assert.equal(equivalent("process.exit()", "1"), "uncertain");
  assert.equal(equivalent("1/0", "1"), "uncertain");
  assert.equal(equivalent("2,2", "2"), "correct");
  assert.equal(equivalent("-2^2", "-4"), "correct");
  assert.equal(equivalent("(-2)^2", "4"), "correct");
  assert.equal(equivalent("x=2, x=-2", "±sqrt(4)"), "correct");
  assert.equal(equivalent("\\frac{2}{4}", "0.5"), "correct");
  assert.equal(equivalent("2sqrt(2)", "sqrt(8)"), "correct");
  assert.throws(() => scalar("(".repeat(30) + "1" + ")".repeat(30)));
});
test("timestamp timer compensates for background without ticking; paused time excluded", () => {
  const f = {
    id: uid(),
    unit: "m1d",
    target: 1500,
    elapsed: 30,
    started: 10000,
    converted: false,
  };
  assert.equal(focusSeconds(f, 70000), 90);
  assert.equal(focusSeconds({ ...f, started: null }, 70000), 30);
  assert.equal(focusSeconds(f, 99999999), 1500);
});
test("plan cannot exceed available time; weekdays zero and daily math separate", () => {
  const week = "2026-11-09",
    capacity = Object.fromEntries(
      Array.from({ length: 7 }, (_, i) => [addDays(week, i), i > 4 ? 180 : 0]),
    );
  const plan = localPlan(week, capacity, {});
  validatePlan(plan, capacity);
  assert.equal(plan.tasks.filter((t) => t.questions).length, 7);
  assert.equal(
    new Set(plan.tasks.filter((t) => !t.questions).map((t) => t.unit)).size,
    9,
  );
  assert.throws(() =>
    validatePlan(
      { ...plan, tasks: plan.tasks.map((t) => ({ ...t, date: week })) },
      capacity,
    ),
  );
});
test("partial logs and mastery remain distinct and repeated events do not double count", () => {
  const log: Event = {
    id: uid(),
    type: "log",
    data: {
      id: uid(),
      unit: "m1d",
      task: null,
      minutes: 20,
      note: "只看過",
      source: "manual",
      focus: null,
      at: new Date().toISOString(),
      mastery: 1,
      finish: false,
    },
  };
  const p = project([log, log]);
  assert.equal(p.logs.length, 1);
  assert.equal(p.logs[0].note, "只看過");
  assert.equal(p.mastery.m1d, 1);
  assert.equal(p.mastery.m1c, undefined);
});
test("stale task versions and duplicate timer conversion are rejected", () => {
  const week = "2026-11-09",
    capacity = { "2026-11-14": 180, "2026-11-15": 180 };
  const plan = localPlan(week, capacity, {});
  const e: Event = {
      id: uid(),
      type: "plan",
      data: { ...plan, capacity, base: null },
    },
    t = plan.tasks[0];
  assert.throws(() =>
    validateEvent(
      {
        id: uid(),
        type: "task",
        data: {
          id: t.id,
          base: 8,
          date: t.date,
          status: "pending",
          remaining: 20,
        },
      },
      [e],
    ),
  );
  const f: Event = {
    id: uid(),
    type: "focus",
    data: {
      id: uid(),
      unit: "m1d",
      target: 1500,
      elapsed: 120,
      started: null,
      converted: false,
    },
  };
  const log: Event = {
    id: uid(),
    type: "log",
    data: {
      id: uid(),
      unit: "m1d",
      minutes: 2,
      task: null,
      source: "timer",
      focus: f.data.id,
      note: "",
      mastery: 0,
      finish: false,
      at: new Date().toISOString(),
    },
  };
  validateEvent(log, [f]);
  assert.throws(() => validateEvent({ ...log, id: uid() }, [f, log]));
});
test("projection never mutates accepted plan or repeatedly subtracts effort", () => {
  const plan = localPlan(
      "2026-11-09",
      { "2026-11-14": 180, "2026-11-15": 180 },
      {},
    ),
    t = plan.tasks[0];
  const events: Event[] = [
    {
      id: uid(),
      type: "plan",
      data: {
        ...plan,
        capacity: { "2026-11-14": 180, "2026-11-15": 180 },
        base: null,
      },
    },
    {
      id: uid(),
      type: "log",
      data: {
        id: uid(),
        unit: t.unit,
        task: t.id,
        minutes: 12,
        note: "部分",
        source: "manual",
        focus: null,
        at: new Date().toISOString(),
        mastery: 0,
        finish: false,
      },
    },
  ];
  const snapshot = JSON.stringify(events);
  assert.equal(project(events).tasks[0].remaining, 13);
  assert.equal(project(events).tasks[0].remaining, 13);
  assert.equal(JSON.stringify(events), snapshot);
});
test("daily submissions are unique by original question, uncertainty excluded", () => {
  const q = {
    id: uid(),
    unit: "m1d",
    prompt: "test",
    difficulty: 1,
    format: "number",
    verification: "verified",
  };
  const a: Result = {
    id: uid(),
    question: q,
    answer: "1",
    verdict: "incorrect",
    solution: { answer: "2", steps: ["test"] },
    at: new Date().toISOString(),
    day: today(),
  };
  assert.equal(
    dailyCount([
      a,
      a,
      { ...a, id: uid(), question: { ...q, id: uid(), originId: q.id } },
    ]),
    1,
  );
  assert.equal(dailyCount([{ ...a, verdict: "uncertain" }]), 0);
});
test("server derives quadratic statement and solution from coefficients", () => {
  const c = certified({
    kind: "quadratic",
    a: 1,
    b: -5,
    c: 6,
    expression: "",
    prompt: "模型試圖寫其他題目",
    answer: "999",
    steps: ["錯誤步驟"],
  });
  assert.equal(c.verified, true);
  assert.equal(equivalent("3,2", c.solution.answer), "correct");
  assert.ok(!c.prompt.includes("其他"));
  assert.ok(!c.solution.steps.includes("錯誤步驟"));
});
test("event schema rejects foreign units and impossible dates", () => {
  assert.equal(
    eventSchema.safeParse({
      id: uid(),
      type: "mastery",
      data: { unit: "nonexistent", value: 1, at: new Date().toISOString() },
    }).success,
    false,
  );
  assert.equal(
    eventSchema.safeParse({
      id: uid(),
      type: "task",
      data: {
        id: uid(),
        base: 0,
        date: "2026-02-31",
        remaining: 1,
        status: "pending",
      },
    }).success,
    false,
  );
});
