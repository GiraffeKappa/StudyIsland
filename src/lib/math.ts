// Bounded recursive-descent numeric parser. No dynamic JavaScript or arbitrary function calls.
export function scalar(input: string, trace?: string[]): number {
  let s = input
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .normalize("NFKC")
    .replace(/−/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s/g, "")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/√(\d+(?:\.\d+)?)/g, "sqrt($1)")
    .replace(/√\(/g, "sqrt(");
  s = s
    .replace(/(\d(?:\.\d+)?)[eE]([+-]?\d+)/g, "$1*10^($2)")
    .replace(/(\d|\))(?=sqrt\(|\()/g, "$1*");
  if (s.length > 180 || !/^[\d.+*/()^sqrt-]+$/.test(s))
    throw Error("無法確定解析此答案");
  let i = 0,
    depth = 0;
  const atom = (): number => {
    if (++depth > 24) throw Error("算式太深");
    let n: number;
    if (s.slice(i, i + 5) === "sqrt(") {
      i += 5;
      const inside = expr();
      n = Math.sqrt(inside);
      trace?.push(`√(${inside}) = ${n}`);
      if (s[i++] !== ")") throw Error("括號未配對");
    } else if (s[i] === "(") {
      i++;
      n = expr();
      if (s[i++] !== ")") throw Error("括號未配對");
    } else {
      const m = s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!m) throw Error("答案格式待確認");
      i += m[0].length;
      n = Number(m[0]);
    }
    depth--;
    return n;
  };
  const power = (): number => {
    let n = atom();
    if (s[i] === "^") {
      i++;
      const e = unary();
      if (Math.abs(e) > 12) throw Error("指數太大");
      const base = n;
      n = n ** e;
      trace?.push(`${base} ^ ${e} = ${n}`);
    }
    return n;
  };
  const unary = (): number => {
    if (s[i] === "+" || s[i] === "-") {
      const sign = s[i++];
      return (sign === "-" ? -1 : 1) * unary();
    }
    return power();
  };
  const term = (): number => {
    let n = unary();
    while (s[i] === "*" || s[i] === "/") {
      const op = s[i++],
        v = unary();
      const left = n;
      n = op === "*" ? n * v : n / v;
      trace?.push(`${left} ${op === "*" ? "×" : "÷"} ${v} = ${n}`);
    }
    return n;
  };
  const expr = (): number => {
    let n = term();
    while (s[i] === "+" || s[i] === "-") {
      const op = s[i++],
        v = term();
      const left = n;
      n = op === "+" ? n + v : n - v;
      trace?.push(`${left} ${op} ${v} = ${n}`);
    }
    return n;
  };
  const n = expr();
  if (i !== s.length || !Number.isFinite(n) || Math.abs(n) > 1e12)
    throw Error("答案無法有限驗證");
  return n;
}
export function answerSet(s: string) {
  s = s
    .trim()
    .replace(/^\{(.*)\}$/, "$1")
    .replace(/^｛(.*)｝$/, "$1");
  if (s.startsWith("±")) s = s.slice(1) + ",-(" + s.slice(1) + ")";
  const parts = s
    .split(/[,，、;；]|或/)
    .map((x) => x.trim().replace(/^[xy]\s*[=＝]\s*/i, ""))
    .filter(Boolean);
  if (!parts.length || parts.length > 8) throw Error("解的數量待確認");
  const values = parts.map((s) => scalar(s)).sort((a, b) => a - b);
  return values.filter((n, i) => !i || Math.abs(n - values[i - 1]) > 1e-9);
}
export function equivalent(
  answer: string,
  expected: string,
): "correct" | "incorrect" | "uncertain" {
  try {
    const a = answerSet(answer),
      b = answerSet(expected);
    return a.length === b.length &&
      a.every(
        (n, i) => Math.abs(n - b[i]) <= 1e-8 * Math.max(1, Math.abs(b[i])),
      )
      ? "correct"
      : "incorrect";
  } catch {
    return "uncertain";
  }
}
