import { z } from "zod";
import { UNITS } from "../island/data";
import { type Question, uid } from "./domain";
import { equivalent, scalar } from "./math";
import { gemini } from "./ai";
import { HttpError, saveQuestion, loadPractice, type Identity } from "./server";
// A certificate format lets the server derive both the statement and solution for supported types.
const generated = z.object({
  kind: z.enum(["linear", "quadratic", "evaluate", "open"]),
  a: z.number().int().min(-30).max(30),
  b: z.number().int().min(-100).max(100),
  c: z.number().int().min(-100).max(100),
  expression: z.string().max(180),
  prompt: z.string().max(2000),
  answer: z.string().max(500),
  steps: z.array(z.string().max(1200)).min(1).max(12),
});
export function certified(g: z.infer<typeof generated>) {
  if ((g.kind === "linear" || g.kind === "quadratic") && g.a === 0)
    throw Error("最高次項係數不能為零");
  let prompt = g.prompt,
    answer = g.answer,
    steps = g.steps,
    verified = false;
  if (g.kind === "linear" && g.a !== 0) {
    prompt = `解一元一次方程式：$${g.a}x + (${g.b}) = ${g.c}$，求 x。`;
    answer = `(${g.c}-${g.b})/${g.a}`;
    steps = [
      `兩邊同減 ${g.b}：${g.a}x = ${g.c - g.b}`,
      `兩邊同除以 ${g.a}：x = ${g.c - g.b}/${g.a}`,
    ];
    verified = true;
  }
  if (g.kind === "quadratic" && g.a !== 0) {
    const d = g.b * g.b - 4 * g.a * g.c;
    if (d < 0) throw Error("沒有實根，請重新產生");
    prompt = `解一元二次方程式：$${g.a}x^2 + (${g.b})x + (${g.c}) = 0$，求所有實數解。`;
    answer = `(${-g.b}+sqrt(${d}))/${2 * g.a},(${-g.b}-sqrt(${d}))/${2 * g.a}`;
    steps = [
      `a = ${g.a}，b = ${g.b}，c = ${g.c}`,
      `判別式 b² − 4ac = ${d}`,
      `公式：$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$`,
      `代入得 $x = \\frac{${-g.b} \\pm \\sqrt{${d}}}{${2 * g.a}}$`,
    ];
    verified = true;
  }
  if (g.kind === "evaluate") {
    if (equivalent(g.expression, g.answer) !== "correct")
      throw Error("算式與答案不一致");
    prompt = `計算：${g.expression}`;
    const trace: string[] = [];
    scalar(g.expression, trace);
    steps = [`原式：${g.expression}`, ...trace, `答案：${g.answer}`];
    verified = true;
  }
  if (!prompt.trim() || !answer.trim() || !steps.every((s) => s.trim()))
    throw Error("題幹或解答不完整");
  return { prompt, solution: { answer, steps }, verified };
}
export async function generate(
  who: Identity,
  unit: string,
  difficulty: number,
  demo = false,
  retry = 0,
) {
  const u = UNITS.find((u) => u.id === unit && u.island === "math");
  if (!u) throw new HttpError(400, "只能選擇現有數學單元");
  let g: z.infer<typeof generated>;
  let usedModel = demo
    ? "local-rules"
    : process.env.GEMINI_MODEL || "unconfigured";
  if (demo) {
    if (!who.demo) throw new HttpError(403, "登入帳號不使用示範題");
    if (!["m1d", "m3d"].includes(unit))
      throw new HttpError(
        400,
        "示範僅提供一元一次／一元二次方程式；其他單元需 Gemini",
      );
    const n = Math.floor(Math.random() * 7) + 1;
    g = {
      kind: unit === "m1d" ? "linear" : "quadratic",
      a: 1,
      b: unit === "m1d" ? n : -(n + 2),
      c: unit === "m1d" ? n + 3 : 2 * n,
      expression: "",
      prompt: "",
      answer: "",
      steps: [""],
    };
  } else {
    const prompt = JSON.stringify({
      unit: u,
      difficulty,
      instruction:
        "出一題符合指定概念的國中數學題。可用 linear(a x+b=c)、quadratic(a x²+b x+c=0)、evaluate(純數值算式)，不適合以上類型用 open 並寫完整題幹與解答。所有欄位必填，不用的填空字串或0。expression 僅含數字,+,-,*,/,^,sqrt(),括號。quadratic 需有實根。linear 僅適用一元一次，quadratic 僅適用一元二次；evaluate 僅適用數值計算單元。其他概念不能偷換成方程式。",
    });
    g = await gemini(who, "question", prompt, generated, (model) => {
      usedModel = model;
    });
  }
  if (
    (g.kind === "linear" && unit !== "m1d") ||
    (g.kind === "quadratic" && unit !== "m3d") ||
    (g.kind === "evaluate" &&
      !["m1a", "m1b", "m1c", "m3a", "m3b"].includes(unit))
  ) {
    if (!demo && retry < 1) {
      await new Promise((r) => setTimeout(r, 2100));
      return generate(who, unit, difficulty, false, retry + 1);
    }
    throw new HttpError(502, "AI 題型不符合指定單元，已達兩次驗證上限，請重試");
  }
  let c: ReturnType<typeof certified>;
  try {
    c = certified(g);
  } catch {
    if (!demo && retry < 1) {
      await new Promise((r) => setTimeout(r, 2100));
      return generate(who, unit, difficulty, false, retry + 1);
    }
    throw new HttpError(
      502,
      "數學驗證未通過，已達兩次上限，未發出題目；請重試",
    );
  }
  const q: Question = {
    model: usedModel,
    id: uid(),
    unit,
    difficulty,
    prompt: c.prompt,
    format: "輸入數值、分數、sqrt(數字)；多個解以逗號分隔。",
    demo,
    verification: c.verified
      ? "已以受限計算驗證"
      : "AI 解答待確認；不作確定對錯統計",
  };
  const identical = (await loadPractice(who.id, who.demo)).questions.find(
    (previous) => previous.prompt === q.prompt && !previous.reported,
  );
  if (identical) q.originId = identical.originId || identical.id;
  await saveQuestion(who, q, c.solution, c.verified);
  return q;
}
