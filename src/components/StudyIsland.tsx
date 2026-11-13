"use client";
import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { ISLANDS, UNITS, LINKS, publisher, type Bubble } from "@/island/data";
import {
  IslandWorld,
  CSS,
  Mascot,
  CREW,
  crewByKind,
  pick,
  TALK,
  IdolBadge,
  idolLineFor,
  IDOL_CHIBI,
} from "@/island/art";
import { IslandWorld3D, IslandTown, bookLabel } from "@/island/worlds";
import { api, auth } from "@/lib/client";
import {
  readState,
  writeState,
  clearState,
  clearIdentity,
} from "@/lib/storage";
import {
  MASTERY,
  eventSchema,
  uid,
  today,
  addDays,
  weekStart,
  emptyState,
  project,
  validateEvent,
  validatePlan,
  localPlan,
  focusSeconds,
  dailyCount,
  practiceSummary,
  rewards,
  type State,
  type Event,
  type Plan,
  type Task,
  type Question,
  type Result,
} from "@/lib/domain";
import katex from "katex";
type User = { id: string; role: "student" | "parent"; demo: boolean };
type Config = {
  cloud: boolean;
  demo: boolean;
  ai: boolean;
  provider: string;
  model: string | null;
  dailyLimit: number;
};
type Panel =
  | "today"
  | "unit"
  | "math"
  | "review"
  | "week"
  | "settings"
  | "parent"
  | "focus"
  | null;
const unitName = (id: string) => UNITS.find((u) => u.id === id)?.name || id;
const subjectName = (id: string) =>
  ISLANDS.find(
    (i) => i.id === UNITS.find((u) => u.id === id)?.island,
  )?.name.replace("島", "") || "";
function MathText({ text }: { text: string }) {
  return (
    <span className="math-text">
      {text.split(/(\$[^$]+\$)/g).map((s, i) =>
        s.startsWith("$") ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(s.slice(1, -1), {
                throwOnError: false,
                trust: false,
                strict: "ignore",
              }),
            }}
          />
        ) : (
          <span key={i}>{s}</span>
        ),
      )}
    </span>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={secondary ? "button secondary" : "button"}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export default function StudyIsland() {
  const [visualHeight, setVisualHeight] = useState<number | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const resize = () => setVisualHeight(v.height);
    resize();
    v.addEventListener("resize", resize);
    return () => v.removeEventListener("resize", resize);
  }, []);
  const [user, setUser] = useState<User | null>(null),
    [config, setConfig] = useState<Config | null>(null),
    [ready, setReady] = useState(false),
    [state, setState] = useState<State>(emptyState),
    [online, setOnline] = useState(true),
    [panel, setPanel] = useState<Panel>(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [syncing, setSyncing] = useState(false);
  const [island, setIsland] = useState("math"),
    [unit, setUnit] = useState(""),
    [task, setTask] = useState<string | null>(null),
    [bubble, setBubble] = useState<Bubble | null>(null),
    [reacting, setReacting] = useState(""),
    [card, setCard] = useState<{ name: string; text: string } | null>(null),
    [full, setFull] = useState(false),
    [child, setChild] = useState(""),
    [children, setChildren] = useState<
      { id: string; nickname: string; synced_at: string | null }[]
    >([]),
    [clock, setClock] = useState(Date.now()),
    [viewMode, setViewMode] = useState<"3d" | "2d" | null>(null),
    [localMotion, setLocalMotion] = useState<boolean | null>(null);
  const stateRef = useRef(state),
    userRef = useRef(user),
    childRef = useRef(child),
    syncLock = useRef(false),
    mounted = useRef(false),
    saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  stateRef.current = state;
  userRef.current = user;
  childRef.current = child;
  const p = useMemo(() => project(state.events), [state.events]),
    readOnly = user?.role === "parent";
  const cacheKey = (u = userRef.current, c = childRef.current) =>
    u ? `${u.id}:${u.role === "parent" ? c : u.id}` : "";
  function store(next: State) {
    stateRef.current = next;
    setState(next);
    const key = cacheKey();
    if (key) {
      saveQueue.current = saveQueue.current
        .then(() => writeState(key, next))
        .catch(() => {
          setNotice("裝置儲存失敗，請匯出備份並檢查空間；資料仍在本次畫面。");
        });
    }
    return next;
  }
  function mutate(fn: (s: State) => State) {
    return store(fn(stateRef.current));
  }
  function emit(events: Event[]) {
    events = events.map((e) => eventSchema.parse(e));
    if (readOnly) throw Error("家長帳號只能查看");
    const s = stateRef.current;
    const all = [...s.events];
    for (const e of events) {
      validateEvent(e, all);
      all.push(e);
    }
    mutate((s) => ({ ...s, events: all, outbox: [...s.outbox, ...events] }));
    void synchronize();
  }
  async function synchronize() {
    const u = userRef.current;
    if (!u || !navigator.onLine || syncLock.current) return;
    syncLock.current = true;
    setSyncing(true);
    try {
      if (u.role === "parent") {
        const c = childRef.current;
        if (!c) return;
        const data = await api("state?student=" + encodeURIComponent(c));
        store({ ...emptyState(), ...data });
        return;
      }
      const pending = stateRef.current.outbox.slice(0, 100);
      const data = await api("sync", { events: pending });
      const practice = await api("state");
      const ids = new Set(pending.map((e) => e.id));
      mutate((s) => {
        const rest = s.outbox.filter((e) => !ids.has(e.id));
        return {
          ...s,
          events: [...data.events, ...rest],
          outbox: rest,
          conflicts: [...s.conflicts, ...data.conflicts],
          questions: practice.questions,
          attempts: practice.attempts,
          reviews: practice.reviews,
          lastSync: u.demo ? null : practice.lastSync,
        };
      });
    } catch (err) {
      setNotice((err as Error).message + "；未同步的紀錄仍留在裝置。");
    } finally {
      syncLock.current = false;
      setSyncing(false);
      if (stateRef.current.outbox.length > 100 && navigator.onLine)
        setTimeout(() => void synchronize(), 500);
    }
  }
  async function enter(u: User) {
    userRef.current = u;
    setUser(u);
    localStorage.setItem("island-last-identity", JSON.stringify(u));
    let c = "";
    if (u.role === "parent" && navigator.onLine) {
      const cs = await api("children");
      setChildren(cs);
      c = cs[0]?.id || "";
      childRef.current = c;
      setChild(c);
    }
    const cached = await readState(cacheKey(u, c));
    store(cached);
    setReady(true);
    setNotice("");
    setPanel(u.role === "parent" ? "parent" : null);
    void synchronize();
  }
  useEffect(() => {
    mounted.current = true;
    setOnline(navigator.onLine);
    void (async () => {
      try {
        const c = await api<Config>("config");
        setConfig(c);
        try {
          await enter(await api<User>("me"));
        } catch {
          setReady(true);
        }
      } catch {
        const saved = localStorage.getItem("island-last-identity");
        if (saved) {
          setOnline(false);
          await enter(JSON.parse(saved));
        } else setReady(true);
      }
    })();
    const wake = () => {
      setOnline(navigator.onLine);
      if (document.visibilityState === "visible") void synchronize();
    };
    window.addEventListener("online", wake);
    window.addEventListener("offline", wake);
    document.addEventListener("visibilitychange", wake);
    const id = setInterval(() => setClock(Date.now()), 1000);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      void navigator.serviceWorker
        .register("/sw.js")
        .catch(() => setNotice("離線外殼尚未快取，請保持連線後重試。"));
    const { data: subscription } = auth()?.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_OUT" &&
          userRef.current &&
          !userRef.current.demo
        ) {
          const old = userRef.current.id;
          void saveQueue.current.then(() => clearIdentity(old));
          localStorage.removeItem("island-last-identity");
          setUser(null);
          userRef.current = null;
          setState(emptyState());
        }
        if (event === "SIGNED_IN" && session && !userRef.current)
          queueMicrotask(() => {
            void api<User>("me")
              .then(enter)
              .catch((e) => setNotice(e.message));
          });
      },
    ) || { data: null };
    return () => {
      mounted.current = false;
      clearInterval(id);
      window.removeEventListener("online", wake);
      window.removeEventListener("offline", wake);
      document.removeEventListener("visibilitychange", wake);
      subscription?.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        setCard(null);
        setFull(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    if (!user || !p.prefs.motion) return;
    const id = setInterval(() => {
      const c = pick(CREW);
      setBubble({ id: `crew-${c.kind}`, text: pick(c.lines), key: Date.now() });
    }, 9000);
    return () => clearInterval(id);
  }, [user, p.prefs.motion]);
  const progress = useMemo(
    () =>
      Object.fromEntries(
        ISLANDS.map((i) => {
          const us = UNITS.filter((u) => u.island === i.id);
          return [
            i.id,
            us.reduce((n, u) => n + (p.mastery[u.id] || 0) / 3, 0) / us.length,
          ];
        }),
      ),
    [p.mastery],
  );
  const stickers = rewards(p.logs, state.attempts, state.events),
    effort = p.logs.reduce((n, l) => n + l.minutes, 0),
    todays = p.tasks.filter((t) => t.date === today()),
    count = dailyCount(state.attempts),
    due = state.reviews.filter((r) => r.due <= today()),
    focus = Object.values(p.focus)
      .filter((f) => !f.converted && !p.logs.some((l) => l.focus === f.id))
      .at(-1);
  async function work(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function selectUnit(id: string, t: string | null = null) {
    setUnit(id);
    setIsland(UNITS.find((u) => u.id === id)?.island || island);
    setTask(t);
    setPanel("unit");
  }
  function poke(id: string) {
    setReacting(id);
    const c = crewByKind(Number(id.replace("crew-", ""))),
      idol = IDOL_CHIBI.find((c) => `idol-${c.kind}` === id);
    const name = c?.name || idol?.name || p.prefs.character,
      text = c ? pick(c.lines) : idol ? idolLineFor(idol.name) : pick(TALK);
    setBubble({ id, text, key: Date.now() });
    setCard({ name, text });
    setTimeout(() => setReacting(""), 1800);
  }
  function preferences(update: Partial<typeof p.prefs>) {
    emit([{ id: uid(), type: "preferences", data: { ...p.prefs, ...update } }]);
  }
  async function logout() {
    await saveQueue.current;
    await clearIdentity(userRef.current!.id);
    localStorage.removeItem("island-last-identity");
    await api("logout", {}).catch(() => {});
    await auth()?.auth.signOut();
    userRef.current = null;
    setUser(null);
    setState(emptyState());
    setPanel(null);
  }
  const worldProps = {
    progress,
    selected: island,
    hits: new Set(stickers.filter((s) => s.got).map((s) => s.id)),
    motion: localMotion ?? p.prefs.motion,
    bubbleNow: bubble,
    reacting,
    idolsOn: p.prefs.idols,
    onPick: (id: string) => {
      setIsland(id);
      setUnit("");
      setTask(null);
      setPanel("unit");
    },
    onPoke: poke,
  };
  if (!ready)
    return (
      <main className="loading">
        <Mascot size={90} />
        <p>正在讓島嶼醒來…</p>
      </main>
    );
  if (!user)
    return (
      <Login
        config={config}
        busy={busy}
        work={work}
        enter={enter}
        notice={notice}
      />
    );
  return (
    <main
      style={visualHeight ? { height: visualHeight } : undefined}
      className={`island-app ${panel ? "has-panel" : ""} ${full ? "panel-full" : ""}`}
    >
      <style>{CSS}</style>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setPanel(null);
            setFull(false);
          }}
        >
          <span className="brand-mark">島</span>
          <span>
            <b>{p.prefs.name}的讀書島</b>
            <small>STUDY A LITTLE, GROW A LITTLE</small>
          </span>
        </button>
        <div className="today-strip">
          <span>{today().slice(5).replace("-", " / ")}</span>
          <button onClick={() => setPanel("today")}>
            今日{" "}
            <b>
              {todays.filter((t) => t.status === "done").length}/{todays.length}
            </b>
          </button>
          <button onClick={() => setPanel("math")}>
            數學{" "}
            <b>
              {count}/{p.prefs.dailyTarget} 題
            </b>
          </button>
        </div>
        <button
          className={`sync-state ${!online ? "offline" : ""}`}
          onClick={() => void synchronize()}
        >
          {syncing
            ? "◌ 同步中"
            : !online
              ? "○ 離線保存"
              : user.demo
                ? "○ 本機示範"
                : state.outbox.length
                  ? `○ ${state.outbox.length} 筆待同步`
                  : "● 已連線"}
        </button>
      </header>
      <div className="world-area">
        {(viewMode ?? p.prefs.mode) === "3d" ? (
          <IslandWorld3D
            {...worldProps}
            onFail={(why) => {
              setNotice("3D 無法啟用：" + why + "，已切換 2D，紀錄仍保留。");
              setViewMode("2d");
              if (!readOnly) preferences({ mode: "2d" });
            }}
          />
        ) : (
          <div className="world-2d">
            <IslandWorld {...worldProps} />
          </div>
        )}
        <div className="island-caption">
          <span>YOUR LITTLE WORLD</span>
          <h1>每一點努力，都會長大。</h1>
          <p>
            {readOnly
              ? "家長檢視 · 學習資料只讀"
              : `已投入 ${effort} 分鐘，收集 ${stickers.filter((s) => s.got).length} 件島上小物`}
          </p>
        </div>
        <div className="map-switch">
          <button
            onClick={() => {
              const mode = (viewMode ?? p.prefs.mode) === "3d" ? "2d" : "3d";
              setViewMode(mode);
              if (!readOnly) preferences({ mode });
            }}
          >
            {(viewMode ?? p.prefs.mode) === "3d" ? "切換 2D" : "切換 3D"}
          </button>
          <button
            onClick={() => {
              const motion = !(localMotion ?? p.prefs.motion);
              setLocalMotion(motion);
              if (!readOnly) preferences({ motion });
            }}
          >
            {(localMotion ?? p.prefs.motion) ? "動畫開" : "動畫關"}
          </button>
        </div>
      </div>
      {user.demo && (
        <div className="demo-label">本機示範 · 不代表登入或雲端同步</div>
      )}
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button aria-label="關閉提示" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <nav className="dock" aria-label="主要功能">
        {(
          [
            ["today", "☀", "今日任務"],
            ["math", "✎", "數學練習"],
            ["review", "↻", "錯題本"],
            ["week", "▦", "每週安排"],
            ["focus", "◷", "番茄鐘"],
            ["settings", "✿", "收藏設定"],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            className={panel === key ? "active" : ""}
            onClick={() => {
              setPanel(panel === key ? null : key);
              setFull(false);
            }}
          >
            <span>{icon}</span>
            {label}
            {key === "review" && due.length > 0 && <i>{due.length}</i>}
          </button>
        ))}
        {readOnly && (
          <button onClick={() => setPanel("parent")}>家長摘要</button>
        )}
      </nav>
      {panel && (
        <aside
          className="panel"
          role="dialog"
          aria-modal={full}
          aria-label={
            {
              today: "今日任務",
              unit: "單元小鎮",
              math: "數學練習",
              review: "錯題本",
              week: "每週安排",
              focus: "番茄鐘",
              settings: "收藏與設定",
              parent: "家長摘要",
            }[panel]
          }
        >
          <div className="panel-heading">
            <span className="eyebrow">ISLAND JOURNAL</span>
            <div>
              <button
                aria-label={full ? "收合全畫面" : "展開全畫面"}
                onClick={() => setFull(!full)}
              >
                {full ? "↙" : "↗"}
              </button>
              <button
                aria-label="關閉面板"
                onClick={() => {
                  setPanel(null);
                  setFull(false);
                }}
              >
                ×
              </button>
            </div>
          </div>
          <div className="panel-scroll">
            {panel === "today" && (
              <>
                <h2>
                  今天，慢慢前進 <span>☀</span>
                </h2>
                <p className="muted">
                  {today()} · 平日作業時間不列為可排複習時間
                </p>
                <div className="stat-banner">
                  <b>
                    {count}
                    <small> / {p.prefs.dailyTarget} 題</small>
                  </b>
                  <span>
                    今天的數學練習
                    <br />
                    <small>答錯也算努力，同題不重算</small>
                  </span>
                </div>
                {!todays.length && (
                  <div className="empty">
                    <p>今天還沒有安排。</p>
                    <p>先填這週可用時間，再確認自己的計畫。</p>
                    <Button onClick={() => setPanel("week")}>
                      安排這一週 →
                    </Button>
                  </div>
                )}
                {todays.map((t) => (
                  <TaskCard
                    key={t.id}
                    t={t}
                    readOnly={readOnly}
                    onOpen={() => selectUnit(t.unit, t.id)}
                    onMove={(d) =>
                      emit([
                        {
                          id: uid(),
                          type: "task",
                          data: {
                            id: t.id,
                            base: t.version,
                            date: d,
                            status: "pending",
                            remaining: t.remaining,
                          },
                        },
                      ])
                    }
                  />
                ))}
                <h3>小小的複習冒險</h3>
                <p>不知道從哪裡開始？抽一個還不熟的概念。</p>
                <Button
                  secondary
                  onClick={() => {
                    const pool = UNITS.filter(
                      (u) => (p.mastery[u.id] ?? 0) < 3,
                    );
                    const selected = pick(pool.length ? pool : UNITS).id;
                    if (!readOnly)
                      emit([
                        {
                          id: uid(),
                          type: "explore",
                          data: {
                            unit: selected,
                            at: new Date().toISOString(),
                          },
                        },
                      ]);
                    selectUnit(selected);
                  }}
                >
                  ⚄ 抽一個複習單元
                </Button>
                {p.tasks.filter((t) => t.date < today() && t.status !== "done")
                  .length > 0 && (
                  <>
                    <h3>還在路上的任務</h3>
                    <p>可以先記部分投入，再由妳選擇改期。</p>
                    {p.tasks
                      .filter((t) => t.date < today() && t.status !== "done")
                      .map((t) => (
                        <TaskCard
                          key={t.id}
                          t={t}
                          readOnly={readOnly}
                          onOpen={() => selectUnit(t.unit, t.id)}
                          onMove={(date) =>
                            emit([
                              {
                                id: uid(),
                                type: "task",
                                data: {
                                  id: t.id,
                                  base: t.version,
                                  date,
                                  status: "pending",
                                  remaining: t.remaining,
                                },
                              },
                            ])
                          }
                        />
                      ))}
                  </>
                )}
              </>
            )}
            {panel === "unit" && (
              <>
                <h2>{ISLANDS.find((i) => i.id === island)?.name}的小鎮</h2>
                <p className="muted">{publisher(island)} · 出版社章節待核對</p>
                <IslandTown
                  island={ISLANDS.find((i) => i.id === island)!}
                  units={UNITS.filter((u) => u.island === island)}
                  level={(id) => p.mastery[id] || 0}
                  selected={unit}
                  onPick={(id) => selectUnit(id)}
                  motion={p.prefs.motion}
                  progress={progress[island] || 0}
                />
                <div className="unit-picker">
                  <label>
                    選擇概念單元
                    <select
                      value={unit}
                      onChange={(e) => selectUnit(e.target.value)}
                    >
                      <option value="">點建築或選擇單元</option>
                      {UNITS.filter((u) => u.island === island).map((u) => (
                        <option key={u.id} value={u.id}>
                          {bookLabel(u.book)} · {u.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {unit && (
                  <UnitPanel
                    key={unit + task}
                    id={unit}
                    task={task}
                    state={state}
                    p={p}
                    readOnly={readOnly}
                    emit={emit}
                    focus={focus}
                    onFocus={() => setPanel("focus")}
                    onLink={selectUnit}
                  />
                )}
                <h3>島嶼熟悉概況</h3>
                <MasterySummary
                  mastery={p.mastery}
                  ids={UNITS.filter((u) => u.island === island).map(
                    (u) => u.id,
                  )}
                />
              </>
            )}
            {panel === "math" && (
              <MathPanel
                state={state}
                mutate={mutate}
                busy={busy}
                work={work}
                readOnly={readOnly}
                config={config}
                online={online}
                due={due.length}
                refresh={synchronize}
                openReviews={() => setPanel("review")}
              />
            )}
            {panel === "review" && (
              <>
                <h2>錯題是找到寶藏的地方</h2>
                <p className="muted">到期 {due.length} 題 · 重練算入每日題數</p>
                {!state.reviews.length && (
                  <div className="empty">
                    還沒有確定的錯題。需要確認的判定不會放進這裡。
                  </div>
                )}
                {state.reviews.map((r) => (
                  <article className="record" key={r.id}>
                    <small>
                      {unitName(r.question.unit)} ·{" "}
                      {r.due <= today() ? "今天可重練" : r.due + " 重練"}
                    </small>
                    <p>
                      <MathText text={r.question.prompt} />
                    </p>
                    <details>
                      <summary>
                        原作答與完整解答 · 重練{" "}
                        {Math.max(0, r.results.length - 1)} 次
                      </summary>
                      {r.results.map((a) => (
                        <div key={a.id}>
                          <p>
                            {a.at.slice(0, 10)} · 作答 {a.answer} ·{" "}
                            {a.verdict === "correct" ? "答對" : "待補強"}
                          </p>
                          <Solution result={a} />
                        </div>
                      ))}
                    </details>
                    {!readOnly && (
                      <div className="row">
                        <Button
                          disabled={busy || !online}
                          onClick={() =>
                            void work(async () => {
                              const q = await api<Question>("review", {
                                id: r.id,
                                operation: "retry",
                              });
                              mutate((s) => ({
                                ...s,
                                questions: [...s.questions, q],
                              }));
                              setPanel("math");
                            })
                          }
                        >
                          保留原範圍，重練此題
                        </Button>
                        <Button
                          secondary
                          disabled={busy || !online}
                          onClick={() =>
                            void work(async () => {
                              await api("review", {
                                id: r.id,
                                operation: "postpone",
                                date: addDays(today(), 1),
                              });
                              await synchronize();
                            })
                          }
                        >
                          延後一天
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </>
            )}
            {panel === "week" && (
              <WeekPanel
                state={state}
                p={p}
                mutate={mutate}
                emit={emit}
                readOnly={readOnly}
                busy={busy}
                work={work}
                online={online}
              />
            )}
            {panel === "focus" && (
              <>
                <h2>給自己一段專注時光</h2>
                <p className="muted">
                  以時間戳校正。背景無法保證持續執行，回到畫面時會重新計算。
                </p>
                {!readOnly && (
                  <FocusPanel
                    focus={focus}
                    clock={clock}
                    emit={emit}
                    defaultUnit={unit}
                    onConvert={(id) => {
                      selectUnit(id);
                    }}
                  />
                )}
                {readOnly && <p>家長只能查看已同步的專注紀錄。</p>}
              </>
            )}
            {panel === "settings" && (
              <>
                <h2>把努力收藏起來</h2>
                <div className="sticker-grid">
                  {stickers.map((s) => (
                    <div
                      key={s.id}
                      className={s.got ? "sticker earned" : "sticker"}
                    >
                      <span>
                        {(
                          {
                            "first-log": "🌱",
                            hour: "🍵",
                            "math-three": "⛵",
                            "five-hours": "🌟",
                          } as Record<string, string>
                        )[s.id] || "✦"}
                      </span>
                      <b>{s.name}</b>
                      <small>{s.condition}</small>
                      <em>{s.got ? "已收藏" : "等待發芽"}</em>
                    </div>
                  ))}
                </div>
                <p className="muted">熟悉程度降低，也不會收回努力裝飾。</p>
                <h3>我的小島設定</h3>
                <SettingsForm
                  key={p.prefs.name + p.prefs.character}
                  prefs={p.prefs}
                  save={preferences}
                  disabled={readOnly}
                />
                <h3>帳號與連線</h3>
                <p>
                  {readOnly
                    ? "家長帳號 · 學習資料只讀"
                    : user.demo
                      ? "本機示範，沒有真實登入"
                      : "學生帳號"}
                  <br />
                  最後雲端同步：
                  {state.lastSync
                    ? new Date(state.lastSync).toLocaleString("zh-TW", {
                        timeZone: "Asia/Taipei",
                      })
                    : "尚無紀錄"}
                </p>
                <p className="muted">離線資料尚未上傳，不代表沒有讀書。</p>
                {!readOnly && (
                  <Button
                    secondary
                    onClick={() =>
                      void work(async () => {
                        const v = await api("invite", {});
                        setNotice(`家長邀請碼：${v.token}（${v.expires}）`);
                      })
                    }
                  >
                    產生家長一次性配對碼
                  </Button>
                )}
                <h3>Gemini 服務設定</h3>
                {readOnly && <AISettings work={work} />}
                <p>
                  {config?.ai ? "已設定 Gemini" : "尚未設定 Gemini"} · 模型：
                  {config?.model || "待設定"}
                  <br />
                  每日請求限制：{config?.dailyLimit || 30} 次
                </p>
                <p className="muted">
                  API
                  金鑰與模型由服務管理者設定伺服器環境；此處不收集或儲存金鑰。次數限制不是供應商費用硬上限。
                </p>
                <h3>安裝與備份</h3>
                <p>
                  Safari：分享 →
                  加入主畫面。建議橫式操作，直式也能閱讀。考試日期未確認時不顯示倒數。
                </p>
                <Button
                  secondary
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(state, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `讀書島備份-${today()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  匯出目前裝置資料
                </Button>
                <div className="spacer" />
                <Button secondary onClick={() => void work(logout)}>
                  登出並清除此身份裝置快取
                </Button>
                {state.conflicts.length > 0 && (
                  <>
                    <h3>同步衝突 · 原內容已保留</h3>
                    {state.conflicts.map((c, i) => (
                      <article className="record" key={i}>
                        <p>{c.reason}</p>
                        <pre>{JSON.stringify(c.event.data, null, 2)}</pre>
                        <p>
                          確認雲端版本後，從任務或每週安排重新編輯；這份原內容會保留到你移除。
                        </p>
                        <Button
                          secondary
                          onClick={() =>
                            mutate((s) => ({
                              ...s,
                              events: s.events.filter(
                                (e) => e.id !== c.event.id,
                              ),
                              conflicts: s.conflicts.filter((_, n) => n !== i),
                            }))
                          }
                        >
                          已核對，移除此衝突副本
                        </Button>
                      </article>
                    ))}
                  </>
                )}
              </>
            )}
            {panel === "parent" && (
              <>
                <h2>陪她看見自己的努力</h2>
                <p className="muted">只讀檢視 · 只顯示已同步資料</p>
                <label>
                  已配對的孩子
                  <select
                    value={child}
                    onChange={(e) =>
                      void work(async () => {
                        const c = e.target.value;
                        childRef.current = c;
                        setChild(c);
                        store(await readState(cacheKey(user, c)));
                        await synchronize();
                      })
                    }
                  >
                    <option value="">尚未配對</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname || "孩子"}
                      </option>
                    ))}
                  </select>
                </label>
                <PairForm
                  onPair={(token) =>
                    void work(async () => {
                      await api("pair", { token });
                      const cs = await api("children");
                      setChildren(cs);
                      if (cs.length) {
                        childRef.current = cs[0].id;
                        setChild(cs[0].id);
                        await synchronize();
                      }
                    })
                  }
                />
                <p>
                  最後同步：
                  {state.lastSync
                    ? new Date(state.lastSync).toLocaleString("zh-TW", {
                        timeZone: "Asia/Taipei",
                      })
                    : "尚無同步紀錄"}
                  <br />
                  <small>孩子可能已離線讀書，請勿把尚未同步視為沒讀。</small>
                </p>
                <div className="stat-banner">
                  <b>
                    {effort}
                    <small> 分鐘</small>
                  </b>
                  <span>
                    {p.logs.length} 筆投入紀錄
                    <br />
                    {state.attempts.filter((a) => !a.revoked).length} 次數學練習
                  </span>
                </div>
                {ISLANDS.map((i) => (
                  <article key={i.id} className="record">
                    <button
                      className="text-button"
                      onClick={() => {
                        setIsland(i.id);
                        setPanel("unit");
                      }}
                    >
                      {i.name} →
                    </button>
                    <MasterySummary
                      mastery={p.mastery}
                      ids={UNITS.filter((u) => u.island === i.id).map(
                        (u) => u.id,
                      )}
                    />
                  </article>
                ))}
                <h3>最近的讀書紀錄</h3>
                <PracticeStats attempts={state.attempts} />
                {p.logs
                  .slice(-15)
                  .reverse()
                  .map((l) => (
                    <div className="record" key={l.id}>
                      {unitName(l.unit)} · {l.minutes} 分鐘
                      <p>{l.note || "沒有備註"}</p>
                      <small>
                        {l.at.slice(0, 10)} · {MASTERY[l.mastery]}
                      </small>
                    </div>
                  ))}
              </>
            )}
          </div>
        </aside>
      )}
      {card && (
        <div className="card-shade" onClick={() => setCard(null)}>
          <div
            className="cheer-card gi-pop"
            role="dialog"
            aria-label="應援卡"
            onClick={(e) => e.stopPropagation()}
          >
            <Mascot size={80} />
            <small>A LITTLE CHEER FOR YOU</small>
            <h2>{card.name}來打氣！</h2>
            <IdolBadge name={card.name} />
            <p>{card.text}</p>
            <small>角色應援創作；名人內容為粉絲自製，非本人發言</small>
            <Button onClick={() => setCard(null)}>收下這份加油 ♡</Button>
          </div>
        </div>
      )}
      {!p.prefs.onboarded && !readOnly && (
        <Onboarding prefs={p.prefs} save={preferences} />
      )}
    </main>
  );
}

function Login({
  config,
  busy,
  work,
  enter,
  notice,
}: {
  config: Config | null;
  busy: boolean;
  work: (fn: () => Promise<unknown>) => Promise<void>;
  enter: (u: User) => Promise<void>;
  notice: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("student"),
    [signup, setSignup] = useState(false),
    [message, setMessage] = useState("");
  return (
    <main className="login-page">
      <div className="login-art">
        <span>WELCOME TO YOUR LITTLE WORLD</span>
        <h1>
          一點一滴，
          <br />
          讀成自己的島。
        </h1>
        <Mascot size={170} />
        <p>
          九座島，一起慢慢長大。
          <br />
          臭凝會考讀書島
        </p>
      </div>
      <section className="login-form">
        <span className="eyebrow">STUDY ISLAND</span>
        <h2>{signup ? "開始一段新的冒險" : "歡迎回到島上"}</h2>
        <p>學生記錄努力，家長陪伴成長。</p>
        {config?.cloud ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void work(async () => {
                const sb = auth()!;
                if (signup) {
                  const r = await sb.auth.signUp({
                    email,
                    password,
                    options: {
                      data: {
                        role,
                        nickname: role === "student" ? "臭凝" : "家長",
                      },
                    },
                  });
                  if (r.error) throw r.error;
                  if (!r.data.session) {
                    setMessage("請到信箱確認帳號後再登入。");
                    return;
                  }
                } else {
                  const r = await sb.auth.signInWithPassword({
                    email,
                    password,
                  });
                  if (r.error) throw r.error;
                }
                await enter(await api("me"));
              });
            }}
          >
            <label>
              電子郵件
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              密碼
              <input
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {signup && (
              <label>
                帳號身份
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">學生</option>
                  <option value="parent">家長（學習資料只讀）</option>
                </select>
              </label>
            )}
            <button className="button" disabled={busy}>
              {busy ? "處理中…" : signup ? "建立帳號" : "登入讀書島 →"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setSignup(!signup)}
            >
              {signup ? "已有帳號，前往登入" : "第一次來？建立獨立帳號"}
            </button>
          </form>
        ) : (
          <div className="empty">
            <p>雲端帳號服務尚未設定。</p>
            <small>
              本機示範可驗證地圖、排程與保存；不會假裝同步到其他裝置。
            </small>
          </div>
        )}
        {config?.demo && (
          <Button
            secondary
            disabled={busy}
            onClick={() =>
              void work(async () => {
                await api("demo", {});
                await enter(await api("me"));
              })
            }
          >
            進入本機示範 →
          </Button>
        )}
        <p role="status" className="error">
          {notice || message}
        </p>
        <small>以 Asia/Taipei 記錄每一天 · 不發送推播</small>
      </section>
    </main>
  );
}

function MasterySummary({
  mastery,
  ids,
}: {
  mastery: Record<string, number>;
  ids: string[];
}) {
  const counts = MASTERY.map(
      (_, n) => ids.filter((id) => (mastery[id] || 0) === n).length,
    ),
    assessed = ids.length - counts[0];
  return (
    <div className="mastery-summary">
      <div className="mastery-bar">
        {counts.map(
          (c, i) =>
            c > 0 && (
              <span
                key={i}
                className={"level-" + i}
                style={{ width: `${(c / ids.length) * 100}%` }}
                title={`${MASTERY[i]} ${c}`}
              />
            ),
        )}
      </div>
      <small>
        已評估 {assessed}/{ids.length}（
        {Math.round((assessed / ids.length) * 100)}%）
      </small>
      <div className="legend">
        {counts.map((c, i) => (
          <span key={i}>
            <i className={"level-" + i} />
            {MASTERY[i]} {c}
          </span>
        ))}
      </div>
      <small>
        覆蓋率＝已自評單元／全部概念單元；地圖建築分數＝熟悉等級總和／(3×單元數)。均不是會考預測。
      </small>
    </div>
  );
}
function TaskCard({
  t,
  readOnly,
  onOpen,
  onMove,
}: {
  t: Task;
  readOnly: boolean;
  onOpen: () => void;
  onMove: (d: string) => void;
}) {
  const [d, setD] = useState(addDays(t.date, 1)),
    [message, setMessage] = useState("");
  return (
    <article className="task-card">
      <div
        className={"subject-dot " + UNITS.find((u) => u.id === t.unit)?.island}
      />
      <div>
        <small>
          {subjectName(t.unit)} · {t.date} ·{" "}
          {
            {
              pending: "待開始",
              partial: "今天有讀",
              done: "這次任務已完成",
              deferred: "已改期",
            }[t.status]
          }
        </small>
        <button className="task-title" onClick={onOpen}>
          {unitName(t.unit)} →
        </button>
        <p>
          {t.minutes} 分鐘
          {t.questions > 0 ? ` · ${t.questions} 題（獨立負荷）` : ""} · 剩餘{" "}
          {t.remaining} 分鐘
        </p>
        {!readOnly && t.status !== "done" && (
          <details>
            <summary>自己安排到另一天</summary>
            <label>
              改期日期
              <input
                aria-label="改期日期"
                type="date"
                value={d}
                onChange={(e) => setD(e.target.value)}
              />
            </label>
            <Button
              secondary
              onClick={() => {
                try {
                  onMove(d);
                  setMessage("已改期，投入紀錄保留。");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              確認改期，保留投入紀錄
            </Button>
            <p role="status">{message}</p>
          </details>
        )}
      </div>
    </article>
  );
}
function UnitPanel({
  id,
  task,
  state,
  p,
  readOnly,
  emit,
  focus,
  onFocus,
  onLink,
}: {
  id: string;
  task: string | null;
  state: State;
  p: ReturnType<typeof project>;
  readOnly: boolean;
  emit: (e: Event[]) => void;
  focus: ReturnType<typeof project>["focus"][string] | undefined;
  onFocus: () => void;
  onLink: (id: string) => void;
}) {
  const [minutes, setMinutes] = useState("20"),
    [note, setNote] = useState(""),
    [mastery, setMastery] = useState(p.mastery[id] || 0),
    [finish, setFinish] = useState(false),
    [useTimer, setUseTimer] = useState(false),
    [error, setError] = useState("");
  const matchingFocus = focus?.unit === id ? focus : undefined;
  return (
    <section className="unit-detail">
      <h3>{unitName(id)}</h3>
      <p className="muted">
        {bookLabel(UNITS.find((u) => u.id === id)!.book)} ·
        概念整理，非出版社正式目錄
      </p>
      <label>
        我覺得自己…
        <select
          disabled={readOnly}
          value={mastery}
          onChange={(e) => {
            const n = Number(e.target.value);
            setMastery(n);
            emit([
              {
                id: uid(),
                type: "mastery",
                data: { unit: id, value: n, at: new Date().toISOString() },
              },
            ]);
          }}
        >
          {MASTERY.map((s, i) => (
            <option key={s} value={i}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const n =
                useTimer && matchingFocus
                  ? Math.floor(focusSeconds(matchingFocus) / 60)
                  : Number(minutes);
              if (!Number.isFinite(n) || n < 1 || n > 720)
                throw Error("請填 1–720 分鐘，計時至少需滿一分鐘");
              const events: Event[] = [
                {
                  id: uid(),
                  type: "log",
                  data: {
                    id: uid(),
                    unit: id,
                    task,
                    minutes: n,
                    note,
                    source: useTimer ? "timer" : "manual",
                    focus: useTimer && matchingFocus ? matchingFocus.id : null,
                    at: new Date().toISOString(),
                    mastery,
                    finish,
                  },
                },
              ];
              if (useTimer && matchingFocus)
                events.push({
                  id: uid(),
                  type: "focus",
                  data: {
                    ...matchingFocus,
                    elapsed: focusSeconds(matchingFocus),
                    started: null,
                    converted: true,
                  },
                });
              emit(events);
              setNote("");
              setError("已留下今天的努力。讀過不等於整個單元讀完。");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <h3>今天有讀</h3>
          <label>
            實際投入分鐘
            <input
              type="number"
              min="1"
              max="720"
              required
              disabled={useTimer}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          {matchingFocus && (
            <label className="check">
              <input
                type="checkbox"
                checked={useTimer}
                onChange={(e) => setUseTimer(e.target.checked)}
              />
              帶入這段專注時間（{Math.floor(focusSeconds(matchingFocus) / 60)}{" "}
              分鐘）
            </label>
          )}
          <label>
            留給自己的小筆記
            <textarea
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="有做筆記、只看過、這裡還卡卡的…"
            />
          </label>
          {task && (
            <label className="check">
              <input
                type="checkbox"
                checked={finish}
                onChange={(e) => setFinish(e.target.checked)}
              />
              完成這次任務（不代表已熟悉整個單元）
            </label>
          )}
          <div className="row">
            <button className="button">記下今天的努力</button>
            <Button secondary onClick={onFocus}>
              開始番茄鐘
            </Button>
          </div>
          <p role="status">{error}</p>
        </form>
      )}
      <h3>讀書足跡</h3>
      {p.logs
        .filter((l) => l.unit === id)
        .slice(-8)
        .reverse()
        .map((l) => (
          <div className="record" key={l.id}>
            <small>
              {new Date(l.at).toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              })}{" "}
              · {l.source === "timer" ? "計時器" : "手填"}
            </small>
            <p>
              {l.minutes} 分鐘 · {MASTERY[l.mastery]}
              <br />
              {l.note}
            </p>
          </div>
        ))}
      {!p.logs.some((l) => l.unit === id) && (
        <p className="muted">還沒有紀錄，從一小步開始。</p>
      )}
      <h3>連到另一座島</h3>
      {LINKS.filter((l) => l.a === id || l.b === id).map((l) => {
        const other = l.a === id ? l.b : l.a;
        return (
          <button
            key={other}
            className="link-unit"
            onClick={() => onLink(other)}
          >
            {unitName(other)} →<small>{l.why}</small>
          </button>
        );
      })}
    </section>
  );
}

function Solution({ result }: { result: Result }) {
  return (
    <div className="solution">
      <b>
        {result.revoked
          ? "已撤銷此判定"
          : result.verdict === "correct"
            ? "✓ 答對了"
            : result.verdict === "incorrect"
              ? "再想一下，我們一起看"
              : "? 需要確認，不列入錯誤率"}
      </b>
      <p>
        答案：
        <MathText text={result.solution.answer} />
      </p>
      <ol>
        {result.solution.steps.map((s, i) => (
          <li key={i}>
            <MathText text={s} />
          </li>
        ))}
      </ol>
    </div>
  );
}
function PracticeStats({ attempts }: { attempts: Result[] }) {
  const s = practiceSummary(attempts);
  return (
    <p className="muted">
      已確認：答對 {s.correct}、待補強 {s.incorrect}；待確認 {s.uncertain}。
      <br />
      答對率 {s.rate === null ? "尚無資料" : s.rate + "%"}
      （答對／確定判定，不含撤銷與待確認），不是會考預測。
    </p>
  );
}
function MathPanel({
  state,
  mutate,
  busy,
  work,
  readOnly,
  config,
  online,
  due,
  refresh,
  openReviews,
}: {
  state: State;
  mutate: (fn: (s: State) => State) => void;
  busy: boolean;
  work: (fn: () => Promise<unknown>) => Promise<void>;
  readOnly: boolean;
  config: Config | null;
  online: boolean;
  due: number;
  refresh: () => Promise<void>;
  openReviews: () => void;
}) {
  const [text, setText] = useState("一元二次方程式"),
    [candidates, setCandidates] = useState<string[]>([]),
    [unit, setUnit] = useState(""),
    [difficulty, setDifficulty] = useState(2),
    [selected, setSelected] = useState(""),
    [demo, setDemo] = useState(false),
    [message, setMessage] = useState("");
  const question =
      state.questions.find((q) => q.id === selected) ||
      [...state.questions]
        .reverse()
        .find(
          (q) =>
            !state.attempts.some((a) => a.question.id === q.id) && !q.reported,
        ),
    result = state.attempts.find((a) => a.question.id === question?.id),
    answer = question ? state.answers[question.id] || "" : "";
  return (
    <>
      <h2>今天，想練什麼？</h2>
      <p className="muted">紙上慢慢算，再把答案寫在這裡。</p>
      <PracticeStats attempts={state.attempts} />
      <div className="stat-banner">
        <b>
          {dailyCount(state.attempts)}
          <small> 題</small>
        </b>
        <span>
          不同題目首次有效提交
          <br />
          答錯也算練習，可繼續加練
        </span>
      </div>
      {due > 0 && (
        <button className="due-banner" onClick={openReviews}>
          ↻ 有 {due} 題錯題到期。妳可以保留原範圍或延後 →
        </button>
      )}
      {!online && (
        <p className="warning">目前離線：可以保存作答草稿，上線後才批改。</p>
      )}
      {!config?.ai && (
        <p className="warning">
          Gemini 尚未設定。示範題為固定規則題，並非 AI。
        </p>
      )}
      {!readOnly && (
        <>
          <label>
            今天想練…
            <input
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如：今天想練一元二次方程式"
            />
          </label>
          <Button
            secondary
            disabled={busy || !online || !config?.ai}
            onClick={() =>
              void work(async () => {
                const r = await api<{ ids: string[] }>("match", { text });
                setCandidates(r.ids);
                setUnit("");
                setMessage(
                  r.ids.length
                    ? "請確認要練的概念，再出題。"
                    : "找不到符合的概念，請改寫或直接選擇。",
                );
              })
            }
          >
            尋找對應概念
          </Button>
          <p role="status">{message}</p>
          <label>
            確認本次範圍
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">請選擇概念單元</option>
              {UNITS.filter(
                (u) =>
                  u.island === "math" &&
                  (!candidates.length || candidates.includes(u.id)),
              ).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            練習難度
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              <option value={1}>暖身</option>
              <option value={2}>剛剛好</option>
              <option value={3}>挑戰看看</option>
            </select>
          </label>
          {config?.demo && (
            <label className="check">
              <input
                type="checkbox"
                checked={demo}
                onChange={(e) => setDemo(e.target.checked)}
              />
              使用本機示範題（僅一元一次／二次方程式）
            </label>
          )}
          <Button
            disabled={busy || !online || !unit || (!demo && !config?.ai)}
            onClick={() =>
              void work(async () => {
                const q = await api<Question>("question", {
                  unit,
                  difficulty,
                  demo,
                });
                mutate((s) => ({ ...s, questions: [...s.questions, q] }));
                setSelected(q.id);
              })
            }
          >
            {busy ? "處理中…" : "出一題，慢慢練 →"}
          </Button>
        </>
      )}
      {question && (
        <article className="question">
          <small>
            {unitName(question.unit)} ·{" "}
            {question.demo ? "本機示範題" : "Gemini 題目"}
            {question.reviewId ? " · 錯題重練" : ""}
          </small>
          <h3>
            <MathText text={question.prompt} />
          </h3>
          <p className="muted">{question.verification}</p>
          {!result && !readOnly && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void work(async () => {
                  const r = await api<Result>("answer", {
                    id: question.id,
                    answer,
                  });
                  mutate((s) => ({
                    ...s,
                    attempts: [
                      ...s.attempts.filter(
                        (a) => a.question.id !== r.question.id,
                      ),
                      r,
                    ],
                  }));
                  await refresh();
                });
              }}
            >
              <label>
                我的答案
                <input
                  autoComplete="off"
                  value={answer}
                  maxLength={500}
                  onChange={(e) =>
                    mutate((s) => ({
                      ...s,
                      answers: { ...s.answers, [question.id]: e.target.value },
                    }))
                  }
                  placeholder="例如：1/2、sqrt(2)、-2, 3"
                />
              </label>
              <small>{question.format}</small>
              <button
                className="button submit-answer"
                disabled={
                  busy || !online || !answer.trim() || question.reported
                }
              >
                {busy
                  ? "批改中…"
                  : !online
                    ? "草稿已保存，連線後提交"
                    : "提交並查看完整解答"}
              </button>
            </form>
          )}
          {result && <Solution result={result} />}
          {result?.verdict === "uncertain" && !readOnly && (
            <Button
              secondary
              disabled={busy || !online}
              onClick={() =>
                void work(async () => {
                  const q = await api<Question>("retry-answer", {
                    id: question.id,
                  });
                  mutate((s) => ({ ...s, questions: [...s.questions, q] }));
                  setSelected(q.id);
                })
              }
            >
              換個答案格式再提交（同題不重算）
            </Button>
          )}
          <div className="row">
            {!readOnly &&
              (["easy", "hard", "report"] as const).map((kind) => (
                <Button
                  key={kind}
                  secondary
                  disabled={busy || !online}
                  onClick={() =>
                    void work(async () => {
                      await api("feedback", { id: question.id, kind });
                      if (kind === "easy")
                        setDifficulty((d) => Math.min(3, d + 1));
                      if (kind === "hard")
                        setDifficulty((d) => Math.max(1, d - 1));
                      setMessage(
                        kind === "report"
                          ? "已回報並撤銷此題判定；錯題與統計已修正。"
                          : "已記下回饋，下次依新難度出題。",
                      );
                      await refresh();
                    })
                  }
                >
                  {
                    {
                      easy: "太簡單",
                      hard: "太難",
                      report: "題目有問題／撤銷判定",
                    }[kind]
                  }
                </Button>
              ))}
          </div>
        </article>
      )}
      <h3>練過的每一步</h3>
      {[...state.attempts]
        .reverse()
        .slice(0, 20)
        .map((a) => (
          <details className="record" key={a.id}>
            <summary>
              {a.day} · {unitName(a.question.unit)} ·{" "}
              {a.revoked
                ? "已撤銷"
                : a.verdict === "correct"
                  ? "答對"
                  : a.verdict === "incorrect"
                    ? "待補強"
                    : "待確認"}
            </summary>
            <p>{a.question.prompt}</p>
            <p>我的答案：{a.answer}</p>
            <Solution result={a} />
          </details>
        ))}
    </>
  );
}

function WeekPanel({
  state,
  p,
  mutate,
  emit,
  readOnly,
  busy,
  work,
  online,
}: {
  state: State;
  p: ReturnType<typeof project>;
  mutate: (fn: (s: State) => State) => void;
  emit: (e: Event[]) => void;
  readOnly: boolean;
  busy: boolean;
  work: (fn: () => Promise<unknown>) => Promise<void>;
  online: boolean;
}) {
  const [suggestion, setSuggestion] = useState<{
    moves: { task: string; date: string; reason: string }[];
    unplaced: string[];
    explanation: string;
  } | null>(null);
  const [week, setWeek] = useState(weekStart()),
    [error, setError] = useState("");
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    capacity = Object.fromEntries(
      days.map((d, i) => [d, state.capacity[d] ?? (i >= 5 ? 180 : 0)]),
    ),
    draft = state.draft;
  function updatePlan(fn: (plan: Plan) => Plan) {
    if (draft) mutate((s) => ({ ...s, draft: fn(draft) }));
  }
  return (
    <>
      <h2>時間是自己的，計畫也是。</h2>
      <p className="muted">先看看這週有多少空間。AI 建議由妳確認後才生效。</p>
      <label>
        週起日（星期一）
        <input
          type="date"
          value={week}
          onChange={(e) => setWeek(weekStart(e.target.value))}
        />
      </label>
      <div className="availability">
        {days.map((d, i) => (
          <label key={d}>
            <span>
              週{"一二三四五六日"[i]} <small>{d.slice(5)}</small>
            </span>
            <input
              aria-label={`週${"一二三四五六日"[i]}可用分鐘`}
              type="number"
              min="0"
              max="720"
              disabled={readOnly}
              value={capacity[d]}
              onChange={(e) =>
                mutate((s) => ({
                  ...s,
                  capacity: {
                    ...s.capacity,
                    [d]: Math.max(0, Math.min(720, Number(e.target.value))),
                  },
                }))
              }
            />
            <small>分鐘</small>
          </label>
        ))}
      </div>
      <p className="warning">
        平日額外複習預設 0。每日數學三題約 15
        分鐘另列，請自行確認能否負擔；不占用一小時作業時間。
      </p>
      {!readOnly && (
        <div className="row">
          <Button
            disabled={busy || !online}
            onClick={() =>
              void work(async () => {
                const draft = await api<Plan>("plan", { week, capacity });
                mutate((s) => ({
                  ...s,
                  draft,
                  capacity: { ...s.capacity, ...capacity },
                }));
              })
            }
          >
            Gemini 建議草稿
          </Button>
          <Button
            secondary
            onClick={() => {
              const draft = localPlan(
                week,
                capacity,
                p.mastery,
                p.prefs.schoolUnits,
              );
              mutate((s) => ({
                ...s,
                draft,
                capacity: { ...s.capacity, ...capacity },
              }));
              setError("已建立本機規則草稿，尚未套用。");
            }}
          >
            本機規則草稿
          </Button>
        </div>
      )}
      {draft && (
        <>
          <h3>
            待確認草稿{" "}
            <span className="tag">
              {draft.source === "gemini" ? "Gemini" : "本機規則，非 AI"}
            </span>
          </h3>
          <p>{draft.explanation}</p>
          {Array.from({ length: 7 }, (_, i) => addDays(draft.week, i)).map(
            (d) => {
              const ts = draft.tasks.filter((t) => t.date === d),
                used = ts
                  .filter((t) => !t.questions)
                  .reduce((n, t) => n + t.minutes, 0),
                math = ts
                  .filter((t) => t.questions)
                  .reduce((n, t) => n + t.minutes, 0),
                cap = state.capacity[d] ?? capacity[d] ?? 0,
                existing = p.tasks
                  .filter(
                    (t) =>
                      t.date === d &&
                      t.status !== "done" &&
                      t.status !== "deferred" &&
                      !t.questions,
                  )
                  .reduce((n, t) => n + t.remaining, 0);
              return (
                <section className="day-plan" key={d}>
                  <h4>
                    {d}{" "}
                    <span className={used + existing > cap ? "error" : ""}>
                      {used + existing} / {cap} 分鐘 ＋ 數學 {math} 分鐘
                    </span>
                  </h4>
                  {ts.map((t) => (
                    <article key={t.id} className="draft-task">
                      <b>
                        {subjectName(t.unit)} · {unitName(t.unit)}
                      </b>
                      <div className="row">
                        <input
                          aria-label="草稿任務日期"
                          type="date"
                          disabled={readOnly}
                          min={draft.week}
                          max={addDays(draft.week, 6)}
                          value={t.date}
                          onChange={(e) =>
                            updatePlan((plan) => ({
                              ...plan,
                              tasks: plan.tasks.map((x) =>
                                x.id === t.id
                                  ? { ...x, date: e.target.value }
                                  : x,
                              ),
                            }))
                          }
                        />
                        <input
                          aria-label="草稿預計分鐘"
                          type="number"
                          min="1"
                          max="360"
                          disabled={readOnly}
                          value={t.minutes}
                          onChange={(e) =>
                            updatePlan((plan) => ({
                              ...plan,
                              tasks: plan.tasks.map((x) =>
                                x.id === t.id
                                  ? {
                                      ...x,
                                      minutes: Number(e.target.value),
                                      remaining: Number(e.target.value),
                                    }
                                  : x,
                              ),
                            }))
                          }
                        />
                        <small>
                          分鐘{t.questions ? ` · ${t.questions}題` : ""}
                        </small>
                        {!readOnly && (
                          <button
                            aria-label="移除草稿任務"
                            onClick={() =>
                              updatePlan((plan) => ({
                                ...plan,
                                tasks: plan.tasks.filter((x) => x.id !== t.id),
                                unplaced: [
                                  ...new Set([...plan.unplaced, t.unit]),
                                ],
                              }))
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </section>
              );
            },
          )}
          <h4>這週還沒放進去的概念</h4>
          <p>
            {draft.unplaced.length
              ? draft.unplaced.map(unitName).join("、")
              : "本次九科候選均已安排；不代表已涵蓋六冊。"}
          </p>
          {!readOnly && (
            <Button
              disabled={busy}
              onClick={() => {
                try {
                  const caps = Object.fromEntries(
                    Array.from({ length: 7 }, (_, i) => {
                      const d = addDays(draft.week, i);
                      return [d, state.capacity[d] ?? capacity[d] ?? 0];
                    }),
                  );
                  validatePlan(draft, caps, p.tasks);
                  emit([
                    {
                      id: uid(),
                      type: "plan",
                      data: { ...draft, capacity: caps, base: p.planId },
                    },
                  ]);
                  mutate((s) => ({ ...s, draft: null }));
                  setError("已確認套用；既有任務與紀錄保留。");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              確認，套用這份計畫
            </Button>
          )}
        </>
      )}
      <p className="error" role="status">
        {error}
      </p>
      <h3>已確認的本週任務</h3>
      {p.tasks
        .filter((t) => t.date >= week && t.date <= addDays(week, 6))
        .map((t) => (
          <p key={t.id} className="record">
            {t.date} · {unitName(t.unit)} · {t.minutes} 分鐘
            {t.questions ? ` · ${t.questions} 題` : ""}
          </p>
        ))}
      <h3>未完成怎麼調整？</h3>
      {!readOnly && (
        <>
          <div className="row">
            <Button
              secondary
              disabled={busy || !online}
              onClick={() =>
                void work(async () => {
                  setSuggestion(await api("reschedule", { week, capacity }));
                })
              }
            >
              Gemini 建議未完成任務改期
            </Button>
            <Button
              secondary
              onClick={() => {
                try {
                  emit([
                    {
                      id: uid(),
                      type: "plan",
                      data: {
                        id: uid(),
                        week,
                        source: "local",
                        explanation: "自行確認每週可用時間，沒有新增任務",
                        tasks: [],
                        unplaced: [],
                        capacity,
                        base: p.planId,
                      },
                    },
                  ]);
                  setError("已確認可用時間，可到今日任務自行改期。");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              只確認可用時間
            </Button>
          </div>
          {suggestion && (
            <article className="record">
              <p>{suggestion.explanation}</p>
              {suggestion.moves.map((m) => (
                <p key={m.task}>
                  {unitName(p.tasks.find((t) => t.id === m.task)?.unit || "")} →{" "}
                  {m.date}
                  <br />
                  <small>{m.reason}</small>
                </p>
              ))}
              <p>無法容納：{suggestion.unplaced.length} 項</p>
              <Button
                onClick={() => {
                  try {
                    const changes: Event[] = [
                      {
                        id: uid(),
                        type: "plan",
                        data: {
                          id: uid(),
                          week,
                          source: "local",
                          explanation: "確認改期可用時間",
                          tasks: [],
                          unplaced: [],
                          capacity,
                          base: p.planId,
                        },
                      },
                    ];
                    for (const m of suggestion.moves) {
                      const t = p.tasks.find((t) => t.id === m.task);
                      if (!t) throw Error("任務已變更，請重新取得建議");
                      changes.push({
                        id: uid(),
                        type: "task",
                        data: {
                          id: t.id,
                          base: t.version,
                          date: m.date,
                          status:
                            t.status === "partial" ? "partial" : "pending",
                          remaining: t.remaining,
                        },
                      });
                    }
                    emit(changes);
                    setSuggestion(null);
                    setError("已確認改期，投入紀錄保留。");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                確認這些改期建議
              </Button>
            </article>
          )}
        </>
      )}
      <p>
        先記下今天投入的分鐘，再到今日任務自行改期。重新產生的草稿不會覆蓋既有任務，超量會阻擋套用。
      </p>
    </>
  );
}

function FocusPanel({
  focus,
  clock,
  emit,
  defaultUnit,
  onConvert,
}: {
  focus: ReturnType<typeof project>["focus"][string] | undefined;
  clock: number;
  emit: (e: Event[]) => void;
  defaultUnit: string;
  onConvert: (id: string) => void;
}) {
  const [id, setId] = useState(defaultUnit || UNITS[0].id),
    [duration, setDuration] = useState(25);
  const elapsed = focus ? focusSeconds(focus, clock) : 0,
    left = focus ? Math.max(0, focus.target - elapsed) : duration * 60;
  return (
    <>
      <div className="timer-circle">
        <span>
          {String(Math.floor(left / 60)).padStart(2, "0")}
          <i>:</i>
          {String(Math.floor(left % 60)).padStart(2, "0")}
        </span>
        <small>{focus ? unitName(focus.unit) : "先選一個概念，再開始"}</small>
      </div>
      {!focus ? (
        <>
          <label>
            這次陪哪個單元？
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {subjectName(u.id)} · {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            專注分鐘
            <input
              type="number"
              min="1"
              max="180"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
          <Button
            disabled={duration < 1 || duration > 180}
            onClick={() =>
              emit([
                {
                  id: uid(),
                  type: "focus",
                  data: {
                    id: uid(),
                    unit: id,
                    target: duration * 60,
                    elapsed: 0,
                    started: Date.now(),
                    converted: false,
                  },
                },
              ])
            }
          >
            開始這段專注
          </Button>
        </>
      ) : (
        <>
          <div className="row">
            <Button
              secondary
              onClick={() =>
                emit([
                  {
                    id: uid(),
                    type: "focus",
                    data: {
                      ...focus,
                      elapsed,
                      started:
                        focus.started === null && elapsed < focus.target
                          ? Date.now()
                          : null,
                    },
                  },
                ])
              }
            >
              {focus.started !== null ? "暫停" : "繼續"}
            </Button>
            <Button
              disabled={elapsed < 60}
              onClick={() => onConvert(focus.unit)}
            >
              帶入讀書紀錄 →
            </Button>
          </div>
          <p>
            已投入 {Math.floor(elapsed / 60)}{" "}
            分鐘；進入單元後勾選「帶入這段專注時間」，只會計入一次。
          </p>
        </>
      )}
    </>
  );
}
function SettingsForm({
  prefs,
  save,
  disabled,
}: {
  prefs: ReturnType<typeof project>["prefs"];
  save: (p: Partial<ReturnType<typeof project>["prefs"]>) => void;
  disabled: boolean;
}) {
  const [name, setName] = useState(prefs.name),
    [character, setCharacter] = useState(prefs.character),
    [examDate, setExamDate] = useState(prefs.examDate);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({ name, character, examDate });
      }}
    >
      <fieldset disabled={disabled}>
        <label>
          我的名字
          <input
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          自訂應援角色名字
          <input
            value={character}
            maxLength={30}
            onChange={(e) => setCharacter(e.target.value)}
          />
        </label>
        <label>
          已確認的考試日期（未確認請留空）
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </label>
        <label>
          每日數學目標
          <input
            type="number"
            min="1"
            max="20"
            value={prefs.dailyTarget}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= 20) save({ dailyTarget: n });
            }}
          />
        </label>
        <label>
          錯題間隔（天，依序三次）
          <div className="row">
            {prefs.reviewIntervals.map((n, i) => (
              <input
                key={i}
                aria-label={`第${i + 1}次重練間隔`}
                type="number"
                min="1"
                max="90"
                value={n}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 90)
                    save({
                      reviewIntervals: prefs.reviewIntervals.map((n, j) =>
                        i === j ? v : n,
                      ),
                    });
                }}
              />
            ))}
          </div>
        </label>
        <div className="idol-options">
          {["許光漢", "曾敬驊", "沈伯洋", "周杰倫"].map((name) => (
            <label className="check" key={name}>
              <input
                type="checkbox"
                checked={prefs.idols.includes(name)}
                onChange={(e) =>
                  save({
                    idols: e.target.checked
                      ? [...prefs.idols, name]
                      : prefs.idols.filter((n) => n !== name),
                  })
                }
              />
              {name}角色
            </label>
          ))}
        </div>
        <button className="button secondary">儲存名字與考試日期</button>
      </fieldset>
    </form>
  );
}
function PairForm({ onPair }: { onPair: (token: string) => void }) {
  const [token, setToken] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPair(token);
      }}
    >
      <label>
        貼上孩子產生的一次性邀請碼
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
      </label>
      <button disabled={!token.trim()} className="button secondary">
        安全配對
      </button>
    </form>
  );
}
function AISettings({
  work,
}: {
  work: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [data, setData] = useState<{
      settings: { model: string; daily_limit: number; enabled: boolean };
      allowed: string[];
      max: number;
    } | null>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    void api("ai-settings")
      .then(setData)
      .catch((e) => setMessage(e.message));
  }, []);
  if (!data) return <p className="muted">{message || "讀取家長服務設定…"}</p>;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void work(async () => {
          await api("ai-settings", data.settings);
          setMessage("已儲存自己的 AI 服務設定，僅對已配對孩子生效。");
        });
      }}
    >
      <label>
        Gemini 模型（服務管理者允許的型號）
        <select
          disabled={!data.allowed.length}
          value={data.settings.model}
          onChange={(e) =>
            setData({
              ...data,
              settings: { ...data.settings, model: e.target.value },
            })
          }
        >
          {!data.allowed.length && <option value="">伺服器尚未提供模型</option>}
          {data.allowed.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        每日請求次數（最多 {data.max}）
        <input
          type="number"
          min="1"
          max={data.max}
          value={data.settings.daily_limit}
          onChange={(e) =>
            setData({
              ...data,
              settings: {
                ...data.settings,
                daily_limit: Number(e.target.value),
              },
            })
          }
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={data.settings.enabled}
          onChange={(e) =>
            setData({
              ...data,
              settings: { ...data.settings, enabled: e.target.checked },
            })
          }
        />
        啟用已配對孩子的 Gemini 功能
      </label>
      <button disabled={!data.allowed.length} className="button secondary">
        儲存我的 AI 設定
      </button>
      <p className="muted">
        {message ||
          "金鑰由伺服器保管，不經本裝置輸入。多位家長設定時採啟用者最低次數，模型依穩定的家長 ID 順序選取。"}
      </p>
    </form>
  );
}
function Onboarding({
  prefs,
  save,
}: {
  prefs: ReturnType<typeof project>["prefs"];
  save: (p: Partial<ReturnType<typeof project>["prefs"]>) => void;
}) {
  const [name, setName] = useState(prefs.name),
    [school, setSchool] = useState<string[]>(prefs.schoolUnits);
  return (
    <div className="onboarding-shade">
      <section
        className="onboarding"
        role="dialog"
        aria-modal="true"
        aria-label="第一次設定"
      >
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h2>先讓小島認識妳。</h2>
        <p>不用一次讀完。先記住目前學校的進度，再安排能做到的一週。</p>
        <label>
          怎麼稱呼妳？
          <input
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <h3>各科目前在學哪個概念？</h3>
        <p className="muted">
          可以先留空，之後到單元確認。出版社章節尚未核對。
        </p>
        {ISLANDS.map((i) => (
          <label key={i.id}>
            {i.name.replace("島", "")}
            <select
              value={
                school.find(
                  (id) => UNITS.find((u) => u.id === id)?.island === i.id,
                ) || ""
              }
              onChange={(e) =>
                setSchool([
                  ...school.filter(
                    (id) => UNITS.find((u) => u.id === id)?.island !== i.id,
                  ),
                  ...(e.target.value ? [e.target.value] : []),
                ])
              }
            >
              <option value="">尚未確認</option>
              {UNITS.filter((u) => u.island === i.id).map((u) => (
                <option key={u.id} value={u.id}>
                  {bookLabel(u.book)} · {u.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <p>
          各單元熟悉程度先保留「尚未評估」。六日可用時間請在「每週安排」填寫；考試日期預設待確認。
        </p>
        <Button
          onClick={() =>
            save({
              name: name.trim() || "臭凝",
              schoolUnits: school,
              onboarded: true,
              motion: !window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches,
            })
          }
        >
          確認，回到我的讀書島 →
        </Button>
      </section>
    </div>
  );
}
