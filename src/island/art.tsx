import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import type { ReactNode } from "react";
import {
  STATUSES,
  WEIGHT,
  LEVEL,
  SEA,
  SEA_DEEP,
  SHALLOW,
  FOAM,
  SAGE,
  PAVE,
  CREAM,
  SIDE_L,
  SIDE_F,
  SIDE_R,
  ORANGE,
  LEAF_D,
  LEAF_L,
  LEAF_Y,
  PINE,
  TRUNK,
  WALL,
  WALL_S,
  WIN,
  LIT,
  LIGHT,
  INK,
  OL,
  UI_BG,
  UI_LINE,
  ACC,
  ISLANDS,
  FACILITY,
  U,
  UNITS,
  LINKS,
} from "./data";
import type { Island, Unit, Link2, Bubble } from "./data";
const CHEERS: string[] = [
  "又往會考前進一步了！",
  "這棟建築亮起來了，超棒！",
  "今天的你比昨天更熟了一點。",
  "錯題是寶藏，你剛挖到一塊。",
  "慢慢來也是在前進。",
  "記得喝口水、伸個懶腰。",
  "先休息五分鐘，再繼續發光。",
  "島島獺幫你把燈點亮了！",
];
// 角色對話：打氣＋簡短複習小提醒（內容依課本常見觀念）
const TALK: string[] = [
  "加油！一步一步來",
  "今天也很棒喔",
  "錯題隔 3 天再做一次",
  "非選題要寫出算式和理由",
  "密度＝質量÷體積",
  "歐姆定律 V＝IR",
  "a²＋b²＝c²",
  "斜率看傾斜，截距看起點",
  "酸鹼中和會產生鹽和水",
  "光合作用要光、水、二氧化碳",
  "板塊擠壓會造山",
  "先蓋住解答，自己做一次",
  "累了就休息一下",
  "看懂題目再下筆",
];
const IDOL_LINES: string[] = [
  "今天也辛苦了！",
  "一起把這座島點亮吧！",
  "認真的你最閃亮！",
  "加油，會考見！",
  "休息一下，再出發！",
  "又完成一個單元，好厲害！",
];
const IDOL_OPTIONS: string[] = ["許光漢", "曾敬驊", "沈伯洋", "周杰倫"];
// 各偶像專屬的應援句（粉絲自製，非本人發言）；沒有的就用通用句
const IDOL_SAYS: Record<string, string[]> = {
  沈伯洋: [
    "考試順起來！今天先把一個單元顧好就很棒。",
    "讀書跟跑步一樣，配速穩，考試順起來。",
    "錯題不是扣分，是幫妳找到下次的分數。",
    "考試順起來！先寫會的，再回頭挑戰難題。",
    "每天進步一點點，五月就會看到大不同。",
    "累了就喝口水、伸個懶腰，考試順起來。",
    "題目看兩次再作答，細心就是實力。",
    "妳的努力大家都看得見，繼續保持！",
    "考試順起來！睡飽吃好，腦袋才會清楚。",
    "不會的地方就問，敢問的人進步最快。",
    "今天完成的進度，就是明天的底氣。",
    "會考那天，帶著自信進考場，考試順起來！",
  ],
  周杰倫: [
    "唉呦不錯哦~這題解得很漂亮。",
    "慢慢來，比較快，穩穩讀就對了。",
    "唉呦不錯哦~又完成一個單元了。",
    "讀累了就聽聽音樂，休息一下再回來。",
    "聽媽媽的話，早點睡，明天腦袋更清楚。",
    "唉呦不錯哦~錯題本越來越厚，代表妳越來越強。",
    "像〈稻香〉那樣回到初心：一題一題慢慢來。",
    "節奏抓對了，讀書也可以很有 fu。",
    "唉呦不錯哦~專心的樣子超酷的。",
    "不用跟別人比，跟昨天的自己比就好。",
    "唉呦不錯哦~今天的進度條又往前走了。",
    "會考那天放輕鬆，妳已經準備好了。",
  ],
};
const idolLineFor = (name: string): string =>
  pick(IDOL_SAYS[name] || IDOL_LINES);
const CONFETTI: string[] = [
  "#DB6A41",
  "#F2C14E",
  "#5E9FB5",
  "#8FAE6A",
  "#E07A6A",
  "#8C88B8",
  "#FFFFFF",
  "#C46A4E",
];

const unitById = (id: string): Unit | undefined =>
  UNITS.find((u: Unit) => u.id === id);
const islandById = (id: string): Island | undefined =>
  ISLANDS.find((i: Island) => i.id === id);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const CSS = `
.gi-wave{animation:giwave 6s ease-in-out infinite alternate}
.gi-cloud{animation:gicloud 80s linear infinite}
.gi-float{animation:gifloat 5s ease-in-out infinite}
.gi-bld{transform-box:fill-box;transform-origin:50% 100%;transition:transform .25s ease;cursor:pointer}
.gi-bld:hover{transform:translateY(-4px)}
.gi-isl{cursor:pointer}
.gi-pulse{animation:gipulse 1.6s ease-in-out infinite}
.gi-twinkle{animation:gipulse 2.6s ease-in-out infinite}
.gi-bob{animation:gibob 1.8s ease-in-out infinite}
.gi-step{animation:gistep .5s ease-in-out infinite}
.gi-dance{animation:gidance .6s ease-in-out infinite}
.gi-hop{animation:gihop .6s ease-out}
.gi-legA,.gi-legB,.gi-armA,.gi-armB{transform-box:fill-box;transform-origin:50% 0%}
.gi-legA{animation:gileg .5s ease-in-out infinite alternate}
.gi-legB{animation:gileg .5s ease-in-out infinite alternate-reverse}
.gi-armA{animation:giarm .5s ease-in-out infinite alternate}
.gi-armB{animation:giarm .5s ease-in-out infinite alternate-reverse}
.gi-wing{transform-box:fill-box;transform-origin:0% 0%;animation:giwing .3s ease-in-out infinite alternate}
.gi-tail{transform-box:fill-box;transform-origin:0% 100%;animation:gisway 1s ease-in-out infinite alternate}
.gi-flag{transform-box:fill-box;transform-origin:0% 50%;animation:giflag 1s ease-in-out infinite alternate}
.gi-smoke{transform-box:fill-box;transform-origin:50% 50%;animation:gismoke 3s ease-out infinite}
.gi-sway{transform-box:fill-box;transform-origin:50% 100%;animation:gisway 3.2s ease-in-out infinite alternate}
.gi-fw{transform-box:fill-box;transform-origin:50% 50%;animation:gifw 1.8s ease-out infinite}
.gi-pop{animation:gipop .5s cubic-bezier(.2,1.6,.4,1) both}
.gi-spin{animation:gispin .9s ease-in-out}
.gi-char{cursor:pointer}
.gi-conf{position:absolute;top:-12px;width:8px;height:12px;border-radius:2px;animation:gifall 2.4s linear forwards}
@keyframes giwave{from{transform:translateX(-14px)}to{transform:translateX(14px)}}
@keyframes gicloud{from{transform:translateX(-300px)}to{transform:translateX(1580px)}}
@keyframes gifloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes gipulse{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes gibob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes gistep{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
@keyframes gidance{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-6px) rotate(8deg)}}
@keyframes gihop{0%{transform:translateY(0)}40%{transform:translateY(-16px)}100%{transform:translateY(0)}}
@keyframes gileg{from{transform:rotate(24deg)}to{transform:rotate(-24deg)}}
@keyframes giarm{from{transform:rotate(-32deg)}to{transform:rotate(32deg)}}
@keyframes giwing{from{transform:rotate(-10deg)}to{transform:rotate(-40deg)}}
@keyframes giflag{from{transform:skewY(-8deg) scaleX(.9)}to{transform:skewY(8deg) scaleX(1)}}
@keyframes gismoke{0%{transform:translateY(0) scale(.6);opacity:.8}100%{transform:translateY(-22px) scale(1.5);opacity:0}}
@keyframes gisway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes gifw{0%{transform:scale(.1);opacity:1}70%{opacity:1}100%{transform:scale(1.25);opacity:0}}
@keyframes gipop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes gispin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(200deg) scale(1.2)}100%{transform:rotate(360deg) scale(1)}}
@keyframes gifall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(260px) rotate(540deg);opacity:0}}
.gi-still *{animation:none!important}
@media (prefers-reduced-motion: reduce){.gi-wave,.gi-cloud,.gi-float,.gi-pulse,.gi-twinkle,.gi-bob,.gi-step,.gi-dance,.gi-hop,.gi-legA,.gi-legB,.gi-armA,.gi-armB,.gi-wing,.gi-tail,.gi-flag,.gi-smoke,.gi-sway,.gi-fw,.gi-pop,.gi-spin,.gi-conf{animation:none!important}.gi-bld{transition:none!important}}
`;

const C30 = 0.866;
const S30 = 0.5;
type Pt = [number, number];
const pts = (arr: Pt[]): string =>
  arr.map(([x, y]: Pt) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number): number =>
    Math.max(
      0,
      Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)),
    );
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function mix(h1: string, h2: string, t: number): string {
  const p = (h: string): number[] =>
    [1, 3, 5].map((i: number) => parseInt(h.slice(i, i + 2), 16));
  const A = p(h1);
  const B = p(h2);
  return `#${A.map((v: number, i: number) =>
    Math.round(v + (B[i] - v) * t)
      .toString(16)
      .padStart(2, "0"),
  ).join("")}`;
}

function hexPath(cx: number, cy: number, r: number): string {
  const p: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    p.push(
      `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`,
    );
  }
  return `M${p.join("L")}Z`;
}

// 等角方塊：原點是底部前角；光從左上來，左面亮、右面暗
function isoBox(
  w: number,
  d: number,
  h: number,
  left: string,
  right: string,
  top: string,
) {
  const L: Pt = [-w * C30, -w * S30];
  const R: Pt = [d * C30, -d * S30];
  return (
    <g>
      <polygon
        points={pts([[0, 0], L, [L[0], L[1] - h], [0, -h]])}
        fill={left}
      />
      <polygon
        points={pts([[0, 0], R, [R[0], R[1] - h], [0, -h]])}
        fill={right}
      />
      <polygon
        points={pts([
          [0, -h],
          [L[0], L[1] - h],
          [L[0] + R[0], L[1] + R[1] - h],
          [R[0], R[1] - h],
        ])}
        fill={top}
      />
    </g>
  );
}
function gable(
  w: number,
  d: number,
  h: number,
  rh: number,
  slope: string,
  slopeDark: string,
  end: string,
) {
  const L: Pt = [-w * C30, -w * S30];
  const R: Pt = [d * C30, -d * S30];
  const A: Pt = [R[0] / 2, R[1] / 2 - h - rh];
  const B: Pt = [L[0] + R[0] / 2, L[1] + R[1] / 2 - h - rh];
  return (
    <g>
      <polygon
        points={pts([[R[0], R[1] - h], [L[0] + R[0], L[1] + R[1] - h], B, A])}
        fill={slopeDark}
      />
      <polygon points={pts([[0, -h], [R[0], R[1] - h], A])} fill={end} />
      <polygon
        points={pts([[0 - 1.5, -h + 1.5], [L[0] - 1.5, L[1] - h + 1.5], B, A])}
        fill={slope}
      />
    </g>
  );
}
function pyramid(
  w: number,
  d: number,
  h: number,
  rh: number,
  cl: string,
  cr: string,
) {
  const L: Pt = [-w * C30, -w * S30];
  const R: Pt = [d * C30, -d * S30];
  const A: Pt = [(L[0] + R[0]) / 2, (L[1] + R[1]) / 2 - h - rh];
  return (
    <g>
      <polygon
        points={pts([[0, -h + 2], [L[0] - 2, L[1] - h + 1], A])}
        fill={cl}
      />
      <polygon
        points={pts([[0, -h + 2], [R[0] + 2, R[1] - h + 1], A])}
        fill={cr}
      />
    </g>
  );
}
const LF = "matrix(-0.866,-0.5,0,1,0,0)";
const RF = "matrix(0.866,-0.5,0,1,0,0)";
const center = (w: number, d: number): string =>
  `translate(${(((w - d) * C30) / 2).toFixed(1)},${(((w + d) * S30) / 2).toFixed(1)})`;

function tree(
  x: number,
  y: number,
  s: number,
  k: string,
  motion: boolean,
  v: number,
) {
  return (
    <g key={k} transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={4} cy={1} rx={9} ry={3} fill="#3D4A3A" opacity={0.16} />
      <rect x={-1.6} y={-9} width={3.2} height={9} fill={TRUNK} />
      <g className={motion ? "gi-sway" : undefined}>
        {v === 1 ? (
          <g>
            <polygon points="0,-34 -8,-16 8,-16" fill={PINE} />
            <polygon points="0,-34 -8,-16 0,-16" fill={shade(PINE, 1.18)} />
            <polygon points="0,-26 -10,-8 10,-8" fill={PINE} />
            <polygon points="0,-26 -10,-8 0,-8" fill={shade(PINE, 1.18)} />
          </g>
        ) : v === 2 ? (
          lpBlob(0, -8, 10, 7, "#9DB076")
        ) : (
          lpBlob(0, -18, 10, 10.5, "#8FA37C")
        )}
      </g>
    </g>
  );
}
function rock(x: number, y: number, s: number, k: string) {
  return (
    <g key={k} transform={`translate(${x},${y}) scale(${s})`}>
      <polygon points="-7,0 -5,-6 1,-8 7,-4 8,0" fill="#C9BFAC" />
      <polygon points="1,-8 7,-4 8,0 2,0" fill="#A99E8A" />
    </g>
  );
}
function flowers(x: number, y: number, k: string) {
  return (
    <g key={k}>
      <circle cx={x} cy={y} r={1.6} fill={ORANGE} />
      <circle cx={x + 4} cy={y + 1.5} r={1.6} fill="#F2C14E" />
      <circle cx={x + 2} cy={y - 2.5} r={1.6} fill="#FFFFFF" />
      <circle cx={x - 3.5} cy={y + 2} r={1.4} fill="#E07A6A" />
    </g>
  );
}
function smallHouse(
  x: number,
  y: number,
  color: string,
  lit: boolean,
  k: string,
  motion: boolean,
) {
  return (
    <g key={k} transform={`translate(${x},${y}) ${center(12, 10)}`}>
      <ellipse cx={4} cy={-4} rx={14} ry={6} fill="#3D4A3A" opacity={0.14} />
      {isoBox(12, 10, 10, WALL, WALL_S, CREAM)}
      <g transform={LF}>
        <rect
          x={3.5}
          y={-7.5}
          width={4}
          height={4}
          fill={lit ? LIT : WIN}
          className={lit && motion ? "gi-twinkle" : undefined}
        />
      </g>
      {gable(12, 10, 10, 7, color, shade(color, 0.8), WALL_S)}
    </g>
  );
}
function lamp(x: number, y: number, on: boolean, k: string, motion: boolean) {
  return (
    <g key={k} transform={`translate(${x},${y})`}>
      <rect x={-0.8} y={-15} width={1.6} height={15} fill="#5B5A52" />
      {on ? (
        <circle
          cx={0}
          cy={-16}
          r={6.5}
          fill={LIGHT}
          opacity={0.7}
          className={motion ? "gi-twinkle" : undefined}
        />
      ) : null}
      <circle cx={0} cy={-16} r={2.4} fill={on ? "#FFD34D" : "#D6D2C8"} />
    </g>
  );
}

// 一棟設施（科目地標），原點在地面中央
function facility(
  kind: string,
  level: number,
  x: number,
  y: number,
  s: number,
  motion: boolean,
) {
  const gray = level === 0;
  const a = gray ? mix(ACC[kind], "#C9C2B6", 0.45) : ACC[kind];
  const ad = shade(a, 0.78);
  const wl = WALL;
  const ws = WALL_S;
  const win = level >= 2 ? LIT : WIN;
  const tw = level >= 2 && motion ? "gi-twinkle" : undefined;
  const sc = s * [0.9, 0.97, 1.04, 1.1][level];
  let body: ReactNode = null;
  if (kind === "math") {
    body = (
      <g transform={center(16, 16)}>
        {isoBox(16, 16, 46, wl, ws, CREAM)}
        <g transform={LF}>
          <circle cx={8} cy={-34} r={5.4} fill="#FFFFFF" />
          <circle
            cx={8}
            cy={-34}
            r={5.4}
            fill="none"
            stroke={ad}
            strokeWidth={1}
          />
          <line
            x1={8}
            y1={-34}
            x2={8}
            y2={-38}
            stroke={INK}
            strokeWidth={1.1}
            strokeLinecap="round"
          >
            {motion ? (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 8 -34"
                to="360 8 -34"
                dur="8s"
                repeatCount="indefinite"
              />
            ) : null}
          </line>
          <line
            x1={8}
            y1={-34}
            x2={10.6}
            y2={-34}
            stroke={INK}
            strokeWidth={1.3}
            strokeLinecap="round"
          >
            {motion ? (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 8 -34"
                to="360 8 -34"
                dur="60s"
                repeatCount="indefinite"
              />
            ) : null}
          </line>
          <rect x={5} y={-21} width={6} height={6} fill={win} className={tw} />
          <rect x={5.5} y={-9} width={5} height={9} rx={2.5} fill={ad} />
        </g>
        <g transform={RF}>
          <rect x={5} y={-21} width={6} height={6} fill={win} className={tw} />
          <rect x={5} y={-36} width={6} height={6} fill={win} className={tw} />
        </g>
        {pyramid(16, 16, 46, 18, a, ad)}
      </g>
    );
  } else if (kind === "phy") {
    body = (
      <g transform={center(30, 22)}>
        {isoBox(30, 22, 20, wl, ws, shade(a, 1.35))}
        <g transform={LF}>
          {[4, 12, 20].map((u: number) => (
            <rect
              key={u}
              x={u}
              y={-15}
              width={5.5}
              height={6}
              fill={win}
              className={tw}
            />
          ))}
          <rect x={24.5} y={-10} width={4} height={10} fill={ad} />
        </g>
        <g transform={RF}>
          {[4, 12].map((u: number) => (
            <rect
              key={u}
              x={u}
              y={-15}
              width={5.5}
              height={6}
              fill={win}
              className={tw}
            />
          ))}
        </g>
        <g transform="translate(-4,-36)">
          <rect x={-2} y={-12} width={4} height={6} fill="#EAF6F8" />
          <path d="M-2,-6 L-8,4 Q0,8 8,4 L2,-6 Z" fill="#EAF6F8" />
          <path d="M-6,1 Q0,4 6,1 L8,4 Q0,8 -8,4 Z" fill="#7FD3A8" />
          {motion
            ? [0, 1, 2].map((i: number) => (
                <circle
                  key={i}
                  cx={-1.5 + i * 1.6}
                  cy={-14}
                  r={1.6}
                  fill="#BDEBD3"
                  className="gi-smoke"
                  style={{ animationDelay: `${i * 0.9}s` }}
                />
              ))
            : null}
        </g>
      </g>
    );
  } else if (kind === "bio") {
    body = (
      <g transform={center(30, 20)}>
        {isoBox(30, 20, 5, wl, ws, CREAM)}
        <g transform="translate(0,-5)">
          {isoBox(30, 20, 14, "#D7EBDD", "#BFDCCB", "#E8F3EC")}
          <g transform={LF}>
            {[7.5, 15, 22.5].map((u: number) => (
              <line
                key={u}
                x1={u}
                y1={0}
                x2={u}
                y2={-14}
                stroke="#FFFFFF"
                strokeWidth={1}
              />
            ))}
          </g>
          {gable(30, 20, 14, 10, "#C9E5D3", "#A9D2BA", "#B6D9C4")}
          <circle cx={-10} cy={-6} r={3.2} fill={LEAF_D} />
          <circle cx={-18} cy={-10} r={3.6} fill="#E07A6A" opacity={0.85} />
        </g>
        <g
          transform="translate(-6,-36)"
          className={motion ? "gi-sway" : undefined}
        >
          <rect x={-0.6} y={-4} width={1.2} height={6} fill={TRUNK} />
          <ellipse
            cx={-3}
            cy={-6}
            rx={4}
            ry={2.4}
            fill={LEAF_L}
            transform="rotate(-25 -3 -6)"
          />
          <ellipse
            cx={3}
            cy={-7}
            rx={4}
            ry={2.4}
            fill={LEAF_D}
            transform="rotate(25 3 -7)"
          />
        </g>
      </g>
    );
  } else if (kind === "earth") {
    body = (
      <g>
        <ellipse cx={0} cy={0} rx={15} ry={8} fill={ws} />
        <rect x={-15} y={-20} width={30} height={20} fill={wl} />
        <rect x={0} y={-20} width={15} height={20} fill={ws} />
        <path
          d="M-15,0 A15,8 0 0 0 15,0 L15,-1 A15,8 0 0 1 -15,-1 Z"
          fill={ws}
        />
        <rect x={-9} y={-14} width={5} height={6} fill={win} className={tw} />
        <ellipse cx={0} cy={-20} rx={15} ry={8} fill={a} />
        <path d="M-14,-21 A14,15 0 0 1 14,-21 Z" fill={CREAM} />
        <path d="M0,-36 A14,15 0 0 1 14,-21 L0,-21 Z" fill="#E4DFD3" />
        <g>
          {motion ? (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 0 -26;-14 0 -26;0 0 -26"
              dur="6s"
              repeatCount="indefinite"
            />
          ) : null}
          <line
            x1={0}
            y1={-26}
            x2={13}
            y2={-41}
            stroke={ad}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        </g>
        {level >= 1 ? (
          <circle
            cx={-14}
            cy={-44}
            r={1.8}
            fill="#FFE58A"
            className={motion ? "gi-twinkle" : undefined}
          />
        ) : null}
        {level >= 1 ? (
          <circle
            cx={20}
            cy={-50}
            r={1.4}
            fill="#FFE58A"
            className={motion ? "gi-twinkle" : undefined}
            style={{ animationDelay: "1s" }}
          />
        ) : null}
      </g>
    );
  } else if (kind === "his") {
    const wall = shade(a, 1.55);
    const wallS = shade(a, 1.3);
    body = (
      <g transform={center(26, 20)}>
        {isoBox(26, 20, 24, wall, wallS, CREAM)}
        <g transform={LF}>
          {[1, 7, 13, 19].map((u: number) => (
            <rect key={u} x={u} y={-28} width={4} height={4} fill={wall} />
          ))}
          <path
            d="M9,0 L9,-8 A4,4 0 0 1 17,-8 L17,0 Z"
            fill={win}
            className={tw}
          />
        </g>
        <g transform={RF}>
          {[1, 7, 13].map((u: number) => (
            <rect key={u} x={u} y={-28} width={4} height={4} fill={wallS} />
          ))}
          <rect x={8} y={-17} width={4} height={6} fill={win} className={tw} />
        </g>
        <g>
          {isoBox(9, 9, 40, wall, wallS, CREAM)}
          {pyramid(9, 9, 40, 12, a, ad)}
          <g transform="translate(-0.5,-58)">
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={10}
              stroke="#5B5A52"
              strokeWidth={1.2}
            />
            <polygon
              points="0,0 12,3 0,6"
              fill={ORANGE}
              className={motion ? "gi-flag" : undefined}
            />
          </g>
        </g>
      </g>
    );
  } else if (kind === "geo") {
    body = (
      <g>
        <g transform={center(18, 18)}>{isoBox(18, 18, 5, wl, ws, CREAM)}</g>
        <polygon points="-8,0 8,0 5.5,-44 -5.5,-44" fill="#FFFFFF" />
        <polygon points="0,0 8,0 5.5,-44 0,-44" fill="#E7E2D6" />
        <polygon points="-7.3,-12 7.3,-12 6.8,-20 -6.8,-20" fill={a} />
        <polygon points="-6.3,-29 6.3,-29 5.9,-36 -5.9,-36" fill={a} />
        <rect
          x={-6.5}
          y={-53}
          width={13}
          height={9}
          fill={level >= 1 ? LIT : WIN}
          className={tw}
        />
        <polygon points="-8.5,-53 8.5,-53 0,-62" fill={a} />
        <polygon points="0,-53 8.5,-53 0,-62" fill={ad} />
        {level >= 1 ? (
          <polygon points="0,-48 74,-62 74,-34" fill="#FFF6C8" opacity={0.5}>
            {motion ? (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 -48"
                to="360 0 -48"
                dur="7s"
                repeatCount="indefinite"
              />
            ) : null}
          </polygon>
        ) : null}
      </g>
    );
  } else if (kind === "civ") {
    body = (
      <g transform={center(34, 22)}>
        {isoBox(34, 22, 20, wl, ws, CREAM)}
        <g transform={LF}>
          {[4, 11, 18, 25].map((u: number) => (
            <rect key={u} x={u} y={-18} width={3} height={18} fill="#FFFFFF" />
          ))}
          {[7.5, 14.5, 21.5].map((u: number) => (
            <rect
              key={u}
              x={u}
              y={-14}
              width={3}
              height={6}
              fill={win}
              className={tw}
            />
          ))}
        </g>
        <g transform={RF}>
          {[5, 13].map((u: number) => (
            <rect
              key={u}
              x={u}
              y={-14}
              width={5}
              height={6}
              fill={win}
              className={tw}
            />
          ))}
        </g>
        {gable(34, 22, 20, 12, a, ad, shade(a, 1.25))}
        <g transform="translate(5,-41)">
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={12}
            stroke="#5B5A52"
            strokeWidth={1.2}
          />
          <polygon
            points="0,0 11,3 0,6"
            fill={ACC.phy}
            className={motion ? "gi-flag" : undefined}
          />
        </g>
      </g>
    );
  } else if (kind === "eng") {
    body = (
      <g transform={center(26, 22)}>
        {isoBox(26, 22, 20, wl, ws, CREAM)}
        <g transform={LF}>
          <rect x={3} y={-13} width={9} height={8} fill={win} className={tw} />
          <rect x={16} y={-11} width={5} height={11} fill={ad} />
          {[0, 1, 2, 3, 4, 5].map((i: number) => (
            <polygon
              key={i}
              points={`${2 + i * 3.7},-17 ${5.7 + i * 3.7},-17 ${5.7 + i * 3.7 + 0.5},-13 ${2 + i * 3.7 + 0.5},-13`}
              fill={i % 2 === 0 ? a : "#FFFFFF"}
            />
          ))}
        </g>
        <g transform={RF}>
          <rect x={6} y={-13} width={9} height={8} fill={win} className={tw} />
        </g>
        {gable(26, 22, 20, 11, a, ad, shade(a, 1.3))}
        <g transform="translate(6,-38)">
          {isoBox(4, 4, 7, "#B8AFA2", "#9E9588", "#C9C1B5")}
          {motion
            ? [0, 1].map((i: number) => (
                <circle
                  key={i}
                  cx={0}
                  cy={-11}
                  r={3}
                  fill="#FFFFFF"
                  opacity={0.85}
                  className="gi-smoke"
                  style={{ animationDelay: `${i * 1.5}s` }}
                />
              ))
            : null}
        </g>
        <g transform="translate(-30,2)">
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-14}
            stroke="#8A7F72"
            strokeWidth={1}
          />
          <path d="M-8,-12 Q0,-20 8,-12 Z" fill={a} />
          <ellipse cx={0} cy={-3} rx={4} ry={1.6} fill="#FFFFFF" />
        </g>
      </g>
    );
  } else {
    body = (
      <g transform={center(28, 28)}>
        {isoBox(28, 28, 4, "#E2D8C4", "#CBBFA8", PAVE)}
        {[
          [0, 0],
          [-24.2 + 1.5, -14 + 1],
          [24.2 - 1.5, -14 + 1],
          [0, -28 + 2],
        ].map(([px, py]: number[], i: number) => (
          <rect
            key={i}
            x={px - 1.4}
            y={py - 22}
            width={2.8}
            height={18}
            fill={shade(a, 0.7)}
          />
        ))}
        {pyramid(28, 28, 22, 14, a, ad)}
        <g
          transform="translate(-14,-20)"
          className={motion ? "gi-sway" : undefined}
        >
          <line
            x1={0}
            y1={-4}
            x2={0}
            y2={0}
            stroke="#5B5A52"
            strokeWidth={0.8}
          />
          <ellipse cx={0} cy={3.5} rx={3} ry={4} fill="#E05A3E" />
        </g>
        <circle
          cx={0}
          cy={-39}
          r={2.4}
          fill={level >= 2 ? LIT : CREAM}
          className={tw}
        />
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(${sc})`}>
      <ellipse cx={6} cy={2} rx={28} ry={10} fill="#3D4A3A" opacity={0.16} />
      {level >= 2 ? (
        <ellipse
          cx={0}
          cy={-6}
          rx={level === 3 ? 40 : 32}
          ry={level === 3 ? 26 : 20}
          fill={LIGHT}
          opacity={level === 3 ? 0.8 : 0.5}
          className={level === 3 && motion ? "gi-pulse" : undefined}
        />
      ) : null}
      {body}
      {level === 3 ? (
        <polygon
          points="0,-82 3,-75 10,-75 4.5,-70.5 6.5,-63.5 0,-67.5 -6.5,-63.5 -4.5,-70.5 -10,-75 -3,-75"
          fill="#F2C14E"
          stroke="#FFFFFF"
          strokeWidth={1.2}
        />
      ) : null}
    </g>
  );
}

// Q 版原創角色：學生（多種髮型、服裝）、島島獺、小貓、小雞
const SHIRTS: string[] = [
  ORANGE,
  ACC.phy,
  ACC.civ,
  ACC.bio,
  ACC.eng,
  ACC.earth,
];
const BOTTOMS: string[] = ["#3F4A5A", "#6B5B4E", "#2F3E46", "#5A4E6B"];
const HAIRS: string[] = ["#3A2A24", "#5A3A2A", "#2B2626", "#7A4E32"];

function face(cy: number) {
  return (
    <g>
      <ellipse cx={-3.6} cy={cy} rx={1.35} ry={1.75} fill={OL} />
      <ellipse cx={3.6} cy={cy} rx={1.35} ry={1.75} fill={OL} />
      <circle cx={-3.2} cy={cy - 0.7} r={0.5} fill="#FFFFFF" />
      <circle cx={4} cy={cy - 0.7} r={0.5} fill="#FFFFFF" />
      <ellipse
        cx={-6.4}
        cy={cy + 3.2}
        rx={2}
        ry={1.2}
        fill="#FF9E9E"
        opacity={0.65}
      />
      <ellipse
        cx={6.4}
        cy={cy + 3.2}
        rx={2}
        ry={1.2}
        fill="#FF9E9E"
        opacity={0.65}
      />
      <path
        d={`M-1.4,${cy + 3} Q0,${cy + 4.4} 1.4,${cy + 3}`}
        stroke={OL}
        strokeWidth={0.9}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function chibiLegacy(
  kind: number,
  seed: number,
  motion: boolean,
  dancing: boolean,
) {
  const sw = 0.9;
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const armA = motion ? "gi-armA" : undefined;
  const armB = motion ? "gi-armB" : undefined;
  const cls = dancing ? "gi-dance" : motion ? "gi-step" : undefined;
  if (kind === 1) {
    const fur = "#B9875C";
    return (
      <g className={cls}>
        <ellipse cx={0} cy={0.5} rx={8} ry={2.4} fill="#2D3A36" opacity={0.2} />
        <g className={motion ? "gi-tail" : undefined}>
          <path
            d="M5,-5 Q13,-6 12,-13 Q9,-8 5,-8 Z"
            fill={shade(fur, 0.85)}
            stroke={OL}
            strokeWidth={sw}
          />
        </g>
        <rect
          x={-4.5}
          y={-4}
          width={3.4}
          height={4}
          rx={1.7}
          fill={shade(fur, 0.85)}
          className={legA}
        />
        <rect
          x={1.1}
          y={-4}
          width={3.4}
          height={4}
          rx={1.7}
          fill={shade(fur, 0.85)}
          className={legB}
        />
        <ellipse
          cx={0}
          cy={-9}
          rx={7.5}
          ry={7}
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
        />
        <ellipse cx={0} cy={-8} rx={4.6} ry={4.6} fill="#F6E6D2" />
        <rect
          x={-9.5}
          y={-13}
          width={3}
          height={6}
          rx={1.5}
          fill={fur}
          stroke={OL}
          strokeWidth={0.7}
          className={armA}
        />
        <rect
          x={6.5}
          y={-13}
          width={3}
          height={6}
          rx={1.5}
          fill={fur}
          stroke={OL}
          strokeWidth={0.7}
          className={armB}
        />
        <circle
          cx={-7.6}
          cy={-27}
          r={2.8}
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
        />
        <circle
          cx={7.6}
          cy={-27}
          r={2.8}
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
        />
        <circle
          cx={0}
          cy={-21}
          r={10}
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
        />
        <ellipse cx={0} cy={-17.5} rx={6} ry={4.4} fill="#F6E6D2" />
        {face(-21.5)}
        <ellipse cx={0} cy={-19} rx={1.6} ry={1.1} fill={OL} />
      </g>
    );
  }
  if (kind === 2) {
    const fur = "#F2B277";
    return (
      <g className={cls}>
        <ellipse cx={0} cy={0.5} rx={7} ry={2.2} fill="#2D3A36" opacity={0.2} />
        <g className={motion ? "gi-tail" : undefined}>
          <path
            d="M5,-4 Q12,-6 10,-15"
            stroke={fur}
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <rect
          x={-4}
          y={-4}
          width={3}
          height={4}
          rx={1.5}
          fill={fur}
          className={legA}
        />
        <rect
          x={1}
          y={-4}
          width={3}
          height={4}
          rx={1.5}
          fill={fur}
          className={legB}
        />
        <ellipse
          cx={0}
          cy={-7}
          rx={6}
          ry={5}
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
        />
        <polygon
          points="-7.5,-19 -6.5,-27 -2,-21"
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <polygon
          points="7.5,-19 6.5,-27 2,-21"
          fill={fur}
          stroke={OL}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <circle cx={0} cy={-16} r={8} fill={fur} stroke={OL} strokeWidth={sw} />
        <path
          d="M-2,-23.5 L-2,-20 M0,-24 L0,-20.5 M2,-23.5 L2,-20"
          stroke={shade(fur, 0.75)}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <g transform="scale(0.8) translate(0,-3)">{face(-17)}</g>
      </g>
    );
  }
  if (kind === 3) {
    return (
      <g className={cls}>
        <ellipse
          cx={0}
          cy={0.5}
          rx={5.5}
          ry={1.8}
          fill="#2D3A36"
          opacity={0.2}
        />
        <line
          x1={-2}
          y1={-3}
          x2={-2}
          y2={0}
          stroke="#E08A3A"
          strokeWidth={1.2}
          className={legA}
        />
        <line
          x1={2}
          y1={-3}
          x2={2}
          y2={0}
          stroke="#E08A3A"
          strokeWidth={1.2}
          className={legB}
        />
        <circle
          cx={0}
          cy={-8}
          r={6.5}
          fill="#F7D65A"
          stroke={OL}
          strokeWidth={sw}
        />
        <g className={motion ? "gi-wing" : undefined}>
          <ellipse
            cx={-5.5}
            cy={-7.5}
            rx={2.5}
            ry={3.5}
            fill="#EFC53F"
            stroke={OL}
            strokeWidth={0.6}
          />
        </g>
        <path
          d="M-1,-15 Q0,-18 1.5,-15"
          stroke={OL}
          strokeWidth={0.8}
          fill="none"
        />
        <circle cx={-2.2} cy={-9.5} r={0.9} fill={OL} />
        <circle cx={2.2} cy={-9.5} r={0.9} fill={OL} />
        <polygon points="-1.3,-7.8 1.3,-7.8 0,-6" fill="#E08A3A" />
        <ellipse
          cx={-3.8}
          cy={-7}
          rx={1.3}
          ry={0.8}
          fill="#FF9E9E"
          opacity={0.7}
        />
        <ellipse
          cx={3.8}
          cy={-7}
          rx={1.3}
          ry={0.8}
          fill="#FF9E9E"
          opacity={0.7}
        />
      </g>
    );
  }
  if (kind === 4 || kind === 5) {
    // 粉絲自製 Q 版角色（依 James 提供的插畫特徵，簡化為島上畫風）
    const xu = kind === 4;
    return (
      <g className={cls}>
        <ellipse
          cx={0}
          cy={0.5}
          rx={7.5}
          ry={2.4}
          fill="#2D3A36"
          opacity={0.2}
        />
        <g className={legA}>
          <rect
            x={-3.6}
            y={-7}
            width={3}
            height={6.5}
            rx={1.2}
            fill="#24252A"
          />
          <ellipse cx={-2.1} cy={-0.4} rx={2.2} ry={1.3} fill="#3A2E28" />
        </g>
        <g className={legB}>
          <rect x={0.6} y={-7} width={3} height={6.5} rx={1.2} fill="#24252A" />
          <ellipse cx={2.1} cy={-0.4} rx={2.2} ry={1.3} fill="#3A2E28" />
        </g>
        <rect
          x={-6.5}
          y={-15.5}
          width={13}
          height={10}
          rx={5}
          fill="#2A2B30"
          stroke={OL}
          strokeWidth={sw}
        />
        {xu ? (
          <g>
            <path
              d="M-4.6,-13.5 L4.6,-13.5 L5.2,-5.6 L-5.2,-5.6 Z"
              fill="#DCD6CB"
            />
            <line
              x1={-3.6}
              y1={-15.6}
              x2={-3}
              y2={-13.5}
              stroke="#B8875A"
              strokeWidth={1.3}
            />
            <line
              x1={3.6}
              y1={-15.6}
              x2={3}
              y2={-13.5}
              stroke="#B8875A"
              strokeWidth={1.3}
            />
            <rect x={-3.4} y={-10.2} width={4} height={3} fill="#CFC7B8" />
            <line
              x1={-2.6}
              y1={-11.6}
              x2={-2.6}
              y2={-9.6}
              stroke="#5E9FB5"
              strokeWidth={0.7}
            />
            <line
              x1={-1.5}
              y1={-11.8}
              x2={-1.5}
              y2={-9.6}
              stroke={ORANGE}
              strokeWidth={0.7}
            />
            <path
              d="M-2.2,-15.4 Q0,-13.2 2.2,-15.4"
              stroke="#E2C27A"
              strokeWidth={0.6}
              fill="none"
            />
          </g>
        ) : (
          <g>
            <polygon
              points="-2.6,-15.5 2.6,-15.5 1.6,-6 -1.6,-6"
              fill="#FFFFFF"
            />
            {[-14, -12, -10, -8].map((yy: number) => (
              <line
                key={yy}
                x1={-2.4}
                y1={yy}
                x2={2.4}
                y2={yy}
                stroke="#2A2B30"
                strokeWidth={0.8}
              />
            ))}
            <circle cx={-3.6} cy={-11.5} r={0.55} fill="#8A8478" />
            <circle cx={-3.6} cy={-8.5} r={0.55} fill="#8A8478" />
          </g>
        )}
        {xu ? (
          <g>
            <g className={dancing ? undefined : armA}>
              <rect
                x={-9}
                y={-14.5}
                width={3}
                height={7}
                rx={1.5}
                fill="#2A2B30"
                stroke={OL}
                strokeWidth={0.7}
              />
              <circle cx={-7.5} cy={-7.3} r={1.5} fill={SKIN} />
            </g>
            <g className={dancing ? undefined : armB}>
              <rect
                x={6}
                y={-14.5}
                width={3}
                height={7}
                rx={1.5}
                fill="#2A2B30"
                stroke={OL}
                strokeWidth={0.7}
              />
              <circle cx={7.5} cy={-7.3} r={1.5} fill={SKIN} />
            </g>
          </g>
        ) : (
          <g>
            <path
              d="M-6,-12 Q-7,-15 -2.6,-14.8"
              stroke="#2A2B30"
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M6,-12 Q7,-15 2.6,-14.8"
              stroke="#2A2B30"
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        <circle
          cx={0}
          cy={-25}
          r={10.5}
          fill={SKIN}
          stroke={OL}
          strokeWidth={sw}
        />
        {xu ? (
          <path
            d="M-10.8,-22 Q-12.5,-31 -7,-35 Q-3,-38.5 2,-37 Q8,-37.5 10.5,-32 Q12,-27 10.8,-22 Q9.5,-27.5 7,-28.5 L6,-26 L4,-29 L1.5,-26.5 L-1,-29.5 L-3.5,-26.5 L-6,-29 Q-9,-27.5 -10.8,-22 Z"
            fill="#1F1C1E"
            stroke={OL}
            strokeWidth={0.7}
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M-10.6,-24 Q-11.5,-30 -9,-32 L-8,-35 L-5,-33.5 L-3,-37 L0,-34.5 L3,-37 L5,-33.5 L8,-35 L9,-32 Q11.5,-30 10.6,-24 L8,-27.5 L5,-26.5 L2,-28.5 L-1,-26.5 L-4,-28.5 L-8,-27 Z"
            fill="#1F1C1E"
            stroke={OL}
            strokeWidth={0.7}
            strokeLinejoin="round"
          />
        )}
        <path
          d={
            xu
              ? "M-5.2,-24 Q-3.6,-25.8 -2,-24"
              : "M-5.2,-24.4 Q-3.6,-26.4 -2,-24.4"
          }
          stroke={OL}
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={xu ? "M2,-24 Q3.6,-25.8 5.2,-24" : "M2,-24.4 Q3.6,-26.4 5.2,-24.4"}
          stroke={OL}
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse
          cx={-6.4}
          cy={-20.5}
          rx={2}
          ry={1.2}
          fill="#FF9E9E"
          opacity={0.65}
        />
        <ellipse
          cx={6.4}
          cy={-20.5}
          rx={2}
          ry={1.2}
          fill="#FF9E9E"
          opacity={0.65}
        />
        {xu ? (
          <path
            d="M-2.4,-20.6 Q0,-18 2.4,-20.6 Z"
            fill="#FFFFFF"
            stroke={OL}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M-3.4,-21 Q0,-16.2 3.4,-21 Z"
            fill="#FFFFFF"
            stroke={OL}
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
        )}
        {xu ? null : (
          <g>
            <circle
              cx={-1.5}
              cy={-14.6}
              r={1.6}
              fill={SKIN}
              stroke={OL}
              strokeWidth={0.5}
            />
            <circle
              cx={1.5}
              cy={-14.6}
              r={1.6}
              fill={SKIN}
              stroke={OL}
              strokeWidth={0.5}
            />
          </g>
        )}
      </g>
    );
  }
  const shirt = SHIRTS[seed % SHIRTS.length];
  const bottom = BOTTOMS[seed % BOTTOMS.length];
  const hair = HAIRS[(seed * 3) % HAIRS.length];
  const style = seed % 3;
  const cap = seed % 5 === 4;
  return (
    <g className={cls}>
      <ellipse cx={0} cy={0.5} rx={7.5} ry={2.4} fill="#2D3A36" opacity={0.2} />
      <g className={legA}>
        <rect x={-3.6} y={-7} width={3} height={6.5} rx={1.2} fill={bottom} />
        <ellipse cx={-2.1} cy={-0.4} rx={2.2} ry={1.3} fill="#4A3B33" />
      </g>
      <g className={legB}>
        <rect x={0.6} y={-7} width={3} height={6.5} rx={1.2} fill={bottom} />
        <ellipse cx={2.1} cy={-0.4} rx={2.2} ry={1.3} fill="#4A3B33" />
      </g>
      <rect
        x={-6.5}
        y={-15.5}
        width={13}
        height={10}
        rx={5}
        fill={shirt}
        stroke={OL}
        strokeWidth={sw}
      />
      <polygon points="-3,-15.5 3,-15.5 0,-12" fill="#FFFFFF" />
      <g className={dancing ? undefined : armA}>
        <rect
          x={-9}
          y={-14.5}
          width={3}
          height={7}
          rx={1.5}
          fill={shirt}
          stroke={OL}
          strokeWidth={0.7}
        />
        <circle cx={-7.5} cy={-7.3} r={1.5} fill={SKIN} />
      </g>
      <g className={dancing ? undefined : armB}>
        <rect
          x={6}
          y={-14.5}
          width={3}
          height={7}
          rx={1.5}
          fill={shirt}
          stroke={OL}
          strokeWidth={0.7}
        />
        <circle cx={7.5} cy={-7.3} r={1.5} fill={SKIN} />
      </g>
      {style === 1 ? (
        <circle
          cx={9.5}
          cy={-25}
          r={3.6}
          fill={hair}
          stroke={OL}
          strokeWidth={0.7}
        />
      ) : null}
      {style === 0 ? (
        <path
          d="M-11,-25 Q-11.5,-14 -7,-15 L7,-15 Q11.5,-14 11,-25 Z"
          fill={hair}
        />
      ) : null}
      <circle
        cx={0}
        cy={-25}
        r={10.5}
        fill={SKIN}
        stroke={OL}
        strokeWidth={sw}
      />
      {style === 2 ? (
        <path
          d="M-10.6,-24 Q-11,-36.5 0,-36 Q11,-36.5 10.6,-24 L8,-27 L5,-25 L2,-28 L-1,-25.5 L-4,-28 L-7,-25.5 Z"
          fill={hair}
          stroke={OL}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M-10.8,-23 Q-11.5,-36.5 0,-36 Q11.5,-36.5 10.8,-23 Q8,-30 2,-29 Q-1,-27 -4,-29.5 Q-9,-29 -10.8,-23 Z"
          fill={hair}
          stroke={OL}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      )}
      {cap ? (
        <path
          d="M-10.5,-29 Q0,-41 10.5,-29 Z"
          fill="#F2C14E"
          stroke={OL}
          strokeWidth={0.7}
        />
      ) : null}
      {face(-23.5)}
    </g>
  );
}

// Q 版角色 v4：學生、固定角色、島島獺、小貓、小雞（臉一律淺膚色、淺色描邊，小尺寸也看得清楚）
const SKIN = "#FFE6D3";
const OLS = "#A3826F";
const EYE = "#4A3B33";

interface Look {
  hair: string;
  hairStyle: string;
  top: string;
  topC: string;
  topC2: string;
  bottom: string;
  bottomC: string;
  shoe: string;
  acc: string;
  accC: string;
  mouth: string;
  hands: string;
}

const PASTEL_TOPS: string[] = [
  "#FFD3DC",
  "#CDE7F7",
  "#FFF1B8",
  "#D6F0D2",
  "#E5DAF7",
  "#FFDCC2",
];
const PASTEL_BOTTOMS: string[] = [
  "#8FB8DE",
  "#F4A9B8",
  "#B9A9E0",
  "#9CCFC0",
  "#F2C98A",
];
const HAIR_SOFT: string[] = ["#6B4A3A", "#8A5A3C", "#4E3A33", "#A8714A"];
const STYLES: string[] = ["bob", "pony", "short", "long", "bun", "short"];
const TOPS: string[] = [
  "uniform",
  "hoodie",
  "overalls",
  "tee",
  "dress",
  "uniform",
];
const ACCS: string[] = ["bow", "", "cap", "clip", "", "headband", "backpack"];

function studentLook(seed: number): Look {
  const top = TOPS[seed % TOPS.length];
  return {
    hair: HAIR_SOFT[(seed * 3) % HAIR_SOFT.length],
    hairStyle: STYLES[(seed * 5 + 1) % STYLES.length],
    top,
    topC:
      top === "uniform" ? "#FFFFFF" : PASTEL_TOPS[seed % PASTEL_TOPS.length],
    topC2: PASTEL_BOTTOMS[(seed + 2) % PASTEL_BOTTOMS.length],
    bottom: top === "dress" ? "none" : seed % 2 === 0 ? "skirt" : "shorts",
    bottomC: PASTEL_BOTTOMS[(seed + 1) % PASTEL_BOTTOMS.length],
    shoe: PASTEL_BOTTOMS[(seed + 3) % PASTEL_BOTTOMS.length],
    acc: ACCS[seed % ACCS.length],
    accC: ["#FF8FA3", "#F2C14E", "#8FB8DE", "#9CCFC0"][seed % 4],
    mouth: seed % 3 === 0 ? "open" : "smile",
    hands: "",
  };
}

const LOOKS: Record<number, Look> = {
  4: {
    hair: "#2E2628",
    hairStyle: "messy",
    top: "apron",
    topC: "#4A4E5A",
    topC2: "#ECE6DA",
    bottom: "pants",
    bottomC: "#5A6070",
    shoe: "#FFFFFF",
    acc: "necklace",
    accC: "#E2C27A",
    mouth: "smile",
    hands: "",
  },
  5: {
    hair: "#2E2628",
    hairStyle: "spiky",
    top: "jacket",
    topC: "#4A4E5A",
    topC2: "#FFFFFF",
    bottom: "pants",
    bottomC: "#4A4E5A",
    shoe: "#FFFFFF",
    acc: "",
    accC: "",
    mouth: "open",
    hands: "chin",
  },
  10: {
    hair: "#3E2E28",
    hairStyle: "messy",
    top: "hoodie",
    topC: "#9CCFC0",
    topC2: "#5E8F86",
    bottom: "pants",
    bottomC: "#5A6070",
    shoe: "#FFFFFF",
    acc: "glasses",
    accC: "#4A3B33",
    mouth: "smile",
    hands: "",
  },
  11: {
    hair: "#7A5238",
    hairStyle: "pony",
    top: "uniform",
    topC: "#FFFFFF",
    topC2: "#F2C14E",
    bottom: "skirt",
    bottomC: "#F4A9B8",
    shoe: "#F2C14E",
    acc: "headband",
    accC: "#FF8FA3",
    mouth: "open",
    hands: "",
  },
  12: {
    hair: "#4E3A33",
    hairStyle: "long",
    top: "dress",
    topC: "#E5DAF7",
    topC2: "#B9A9E0",
    bottom: "none",
    bottomC: "#B9A9E0",
    shoe: "#B9A9E0",
    acc: "clip",
    accC: "#FF8FA3",
    mouth: "smile",
    hands: "",
  },
  13: {
    hair: "#6B4A3A",
    hairStyle: "spiky",
    top: "hoodie",
    topC: "#CDE7F7",
    topC2: "#8FB8DE",
    bottom: "shorts",
    bottomC: "#F2C98A",
    shoe: "#F2C14E",
    acc: "bolt",
    accC: "#F2C14E",
    mouth: "open",
    hands: "",
  },
  18: {
    hair: "#2A2426",
    hairStyle: "fringe",
    top: "uniform",
    topC: "#FFFFFF",
    topC2: "#22396B",
    bottom: "pants",
    bottomC: "#2F3A52",
    shoe: "#2E2628",
    acc: "glasses",
    accC: "#2E2628",
    mouth: "smile",
    hands: "",
  },
  15: {
    hair: "#6B4A3A",
    hairStyle: "short",
    top: "overalls",
    topC: "#FFF1B8",
    topC2: "#9CCFC0",
    bottom: "shorts",
    bottomC: "#9CCFC0",
    shoe: "#FF8FA3",
    acc: "propeller",
    accC: "#FF8FA3",
    mouth: "open",
    hands: "",
  },
};

function kidFace(mouth: string) {
  return (
    <g>
      <ellipse cx={-3.7} cy={-23} rx={1.25} ry={1.6} fill={EYE} />
      <ellipse cx={3.7} cy={-23} rx={1.25} ry={1.6} fill={EYE} />
      <circle cx={-3.3} cy={-23.6} r={0.5} fill="#FFFFFF" />
      <circle cx={4.1} cy={-23.6} r={0.5} fill="#FFFFFF" />
      <ellipse
        cx={-6.3}
        cy={-19.8}
        rx={2.2}
        ry={1.3}
        fill="#FF9AA8"
        opacity={0.75}
      />
      <ellipse
        cx={6.3}
        cy={-19.8}
        rx={2.2}
        ry={1.3}
        fill="#FF9AA8"
        opacity={0.75}
      />
      {mouth === "open" ? (
        <path
          d="M-2.2,-20 Q0,-16.8 2.2,-20 Z"
          fill="#E86F72"
          stroke="#B5615A"
          strokeWidth={0.5}
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M-1.6,-19.6 Q0,-18 1.6,-19.6"
          stroke="#B5615A"
          strokeWidth={0.9}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function hairBack(L: Look) {
  if (L.hairStyle === "bob")
    return (
      <path
        d="M-11,-26 Q-12,-16 -7.5,-16.5 L7.5,-16.5 Q12,-16 11,-26 Z"
        fill={L.hair}
      />
    );
  if (L.hairStyle === "long")
    return (
      <path
        d="M-11,-26 Q-12.5,-10 -7,-9.5 L7,-9.5 Q12.5,-10 11,-26 Z"
        fill={L.hair}
      />
    );
  if (L.hairStyle === "pony")
    return <path d="M9,-30 Q16,-28 14,-18 Q12,-22 9.5,-24 Z" fill={L.hair} />;
  if (L.hairStyle === "bun")
    return <circle cx={0} cy={-36.5} r={4.2} fill={L.hair} />;
  return null;
}

function hairFront(L: Look) {
  if (L.hairStyle === "spiky")
    return (
      <path
        d="M-10.6,-24 Q-11.5,-30 -9,-32 L-8,-35 L-5,-33.5 L-3,-37 L0,-34.5 L3,-37 L5,-33.5 L8,-35 L9,-32 Q11.5,-30 10.6,-24 L8.5,-27.5 L5,-27.5 L2,-29 L-1,-27.5 L-4,-29 L-8.5,-27.5 Z"
        fill={L.hair}
      />
    );
  if (L.hairStyle === "messy")
    return (
      <path
        d="M-10.8,-22.5 Q-12.5,-31 -7,-35 Q-3,-38.5 2,-37 Q8,-37.5 10.5,-32 Q12,-27 10.8,-22.5 Q9.5,-27.5 7,-28.5 L5.5,-27 L4,-29.2 L1.5,-27.4 L-1,-29.5 L-3.5,-27.4 L-6,-29.2 Q-9,-28 -10.8,-22.5 Z"
        fill={L.hair}
      />
    );
  return (
    <path
      d="M-10.7,-23.5 Q-11.2,-35.8 0,-36.2 Q11.2,-35.8 10.7,-23.5 Q9.2,-28.4 6,-28.8 Q2.5,-27.6 0,-29.2 Q-2.5,-27.6 -6,-28.8 Q-9.2,-28.4 -10.7,-23.5 Z"
      fill={L.hair}
    />
  );
}

function person(L: Look, motion: boolean, dancing: boolean) {
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const armA = motion && !dancing && L.hands !== "chin" ? "gi-armA" : undefined;
  const armB = motion && !dancing && L.hands !== "chin" ? "gi-armB" : undefined;
  const bare = L.bottom !== "pants";
  const legC = bare ? SKIN : L.bottomC;
  const sleeve = L.topC;
  const leg = (x: number, cls: string | undefined) => (
    <g className={cls}>
      <rect
        x={x}
        y={-7}
        width={2.8}
        height={6.4}
        rx={1.3}
        fill={legC}
        stroke={OLS}
        strokeWidth={0.4}
      />
      {bare ? (
        <rect x={x} y={-2.6} width={2.8} height={1.6} fill="#FFFFFF" />
      ) : null}
      <ellipse
        cx={x + 1.4 + (x < 0 ? -0.5 : 0.5)}
        cy={-0.5}
        rx={2.3}
        ry={1.35}
        fill="#FFFFFF"
        stroke={OLS}
        strokeWidth={0.5}
      />
      <rect
        x={x - 0.9 + (x < 0 ? -0.5 : 0.5)}
        y={-0.3}
        width={4.6}
        height={0.9}
        rx={0.4}
        fill={L.shoe}
      />
    </g>
  );
  return (
    <g>
      <ellipse
        cx={0}
        cy={0.5}
        rx={7.5}
        ry={2.3}
        fill="#2D3A36"
        opacity={0.16}
      />
      {L.acc === "backpack" ? (
        <rect x={-6.5} y={-15} width={13} height={9} rx={3} fill={L.accC} />
      ) : null}
      {leg(-3.5, legA)}
      {leg(0.7, legB)}
      {L.bottom === "skirt" ? (
        <path
          d="M-6,-8.5 L6,-8.5 L8,-4 L-8,-4 Z"
          fill={L.bottomC}
          stroke={OLS}
          strokeWidth={0.5}
          strokeLinejoin="round"
        />
      ) : null}
      {L.bottom === "shorts" ? (
        <path
          d="M-5.8,-8.5 L5.8,-8.5 L6.2,-5 L0.6,-5 L0,-6.5 L-0.6,-5 L-6.2,-5 Z"
          fill={L.bottomC}
          stroke={OLS}
          strokeWidth={0.5}
          strokeLinejoin="round"
        />
      ) : null}
      {L.top === "dress" ? (
        <path
          d="M-5.5,-15.5 L5.5,-15.5 L8.5,-4 L-8.5,-4 Z"
          fill={L.topC}
          stroke={OLS}
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      ) : null}
      {L.top === "hoodie" ? (
        <ellipse cx={0} cy={-15.5} rx={6} ry={2.4} fill={L.topC2} />
      ) : null}
      {L.top !== "dress" ? (
        <rect
          x={-6.3}
          y={-15.8}
          width={12.6}
          height={9}
          rx={4.2}
          fill={L.topC}
          stroke={OLS}
          strokeWidth={0.6}
        />
      ) : null}
      {L.top === "uniform" ? (
        <g>
          <path d="M-5.5,-15.6 L5.5,-15.6 L0,-10.5 Z" fill={L.topC2} />
          <path d="M-3.2,-15.6 L3.2,-15.6 L0,-12.6 Z" fill="#FFFFFF" />
          <path
            d="M-1.8,-12 L0,-11 L1.8,-12 L1.4,-10 L0,-10.6 L-1.4,-10 Z"
            fill="#FF7A85"
          />
        </g>
      ) : null}
      {L.top === "hoodie" ? (
        <g>
          <rect
            x={-3.6}
            y={-10.2}
            width={7.2}
            height={2.8}
            rx={1.2}
            fill={L.topC2}
            opacity={0.8}
          />
          <line
            x1={-1.4}
            y1={-15}
            x2={-1.4}
            y2={-12}
            stroke="#FFFFFF"
            strokeWidth={0.7}
            strokeLinecap="round"
          />
          <line
            x1={1.4}
            y1={-15}
            x2={1.4}
            y2={-12}
            stroke="#FFFFFF"
            strokeWidth={0.7}
            strokeLinecap="round"
          />
        </g>
      ) : null}
      {L.top === "overalls" ? (
        <g>
          <rect
            x={-4.6}
            y={-12.4}
            width={9.2}
            height={5.8}
            rx={1.6}
            fill={L.topC2}
          />
          <line
            x1={-3.8}
            y1={-15.6}
            x2={-3.4}
            y2={-12.2}
            stroke={L.topC2}
            strokeWidth={1.4}
          />
          <line
            x1={3.8}
            y1={-15.6}
            x2={3.4}
            y2={-12.2}
            stroke={L.topC2}
            strokeWidth={1.4}
          />
          <circle cx={-3.3} cy={-11.6} r={0.6} fill="#FFFFFF" />
          <circle cx={3.3} cy={-11.6} r={0.6} fill="#FFFFFF" />
        </g>
      ) : null}
      {L.top === "apron" ? (
        <g>
          <path d="M-4.4,-13.6 L4.4,-13.6 L5,-6.2 L-5,-6.2 Z" fill={L.topC2} />
          <line
            x1={-3.6}
            y1={-15.7}
            x2={-3}
            y2={-13.6}
            stroke="#C79A6B"
            strokeWidth={1.3}
          />
          <line
            x1={3.6}
            y1={-15.7}
            x2={3}
            y2={-13.6}
            stroke="#C79A6B"
            strokeWidth={1.3}
          />
          <rect x={-3.3} y={-10.4} width={4} height={2.8} fill="#DCD3C3" />
          <line
            x1={-2.5}
            y1={-11.8}
            x2={-2.5}
            y2={-9.8}
            stroke="#5E9FB5"
            strokeWidth={0.7}
          />
          <line
            x1={-1.4}
            y1={-12}
            x2={-1.4}
            y2={-9.8}
            stroke={ORANGE}
            strokeWidth={0.7}
          />
        </g>
      ) : null}
      {L.top === "jacket" ? (
        <g>
          <polygon
            points="-2.6,-15.6 2.6,-15.6 1.8,-6.9 -1.8,-6.9"
            fill={L.topC2}
          />
          {[-14.2, -12.4, -10.6, -8.8].map((yy: number) => (
            <line
              key={yy}
              x1={-2.3}
              y1={yy}
              x2={2.3}
              y2={yy}
              stroke="#4A4E5A"
              strokeWidth={0.8}
            />
          ))}
          <circle cx={-3.8} cy={-12} r={0.55} fill="#C9C2B6" />
          <circle cx={-3.8} cy={-9.4} r={0.55} fill="#C9C2B6" />
        </g>
      ) : null}
      {L.hands === "chin" ? (
        <g>
          <path
            d="M-5.8,-12.5 Q-6.8,-15.5 -2.6,-15.2"
            stroke={sleeve}
            strokeWidth={2.8}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M5.8,-12.5 Q6.8,-15.5 2.6,-15.2"
            stroke={sleeve}
            strokeWidth={2.8}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          <g className={armA}>
            <rect
              x={-8.8}
              y={-15}
              width={2.8}
              height={6.8}
              rx={1.4}
              fill={sleeve}
              stroke={OLS}
              strokeWidth={0.5}
            />
            <circle
              cx={-7.4}
              cy={-7.8}
              r={1.5}
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.4}
            />
          </g>
          <g className={armB}>
            <rect
              x={6}
              y={-15}
              width={2.8}
              height={6.8}
              rx={1.4}
              fill={sleeve}
              stroke={OLS}
              strokeWidth={0.5}
            />
            <circle
              cx={7.4}
              cy={-7.8}
              r={1.5}
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.4}
            />
          </g>
        </g>
      )}
      {L.acc === "necklace" ? (
        <path
          d="M-2.2,-15.5 Q0,-13.3 2.2,-15.5"
          stroke={L.accC}
          strokeWidth={0.6}
          fill="none"
        />
      ) : null}
      {hairBack(L)}
      <circle
        cx={0}
        cy={-25}
        r={10.5}
        fill={SKIN}
        stroke={OLS}
        strokeWidth={0.6}
      />
      {hairFront(L)}
      {L.acc === "bow" ? (
        <path
          d="M3.5,-34.5 L8.5,-37 L8.5,-32 Z M3.5,-34.5 L-1.5,-37 L-1.5,-32 Z"
          fill={L.accC}
        />
      ) : null}
      {L.acc === "clip" ? (
        <g>
          <circle cx={7.6} cy={-31.5} r={1.4} fill={L.accC} />
          <circle cx={9.4} cy={-30.5} r={1.4} fill={L.accC} />
          <circle cx={8.6} cy={-29} r={1.4} fill={L.accC} />
          <circle cx={8.5} cy={-30.4} r={0.8} fill="#FFF3B0" />
        </g>
      ) : null}
      {L.acc === "headband" ? (
        <path
          d="M-10.4,-28.6 Q0,-38.5 10.4,-28.6"
          stroke={L.accC}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
      ) : null}
      {L.acc === "cap" ? (
        <g>
          <path d="M-10.6,-29 Q0,-41 10.6,-29 Z" fill={L.accC} />
          <path d="M-11,-29 L-15,-28.4 L-10.6,-27.6 Z" fill={L.accC} />
        </g>
      ) : null}
      {L.acc === "propeller" ? (
        <g>
          <path d="M-10.4,-29.5 Q0,-40.5 10.4,-29.5 Z" fill="#FFF1B8" />
          <path
            d="M-10.4,-29.5 Q0,-40.5 0,-29.5 Z"
            fill={L.accC}
            opacity={0.85}
          />
          <line
            x1={0}
            y1={-35.2}
            x2={0}
            y2={-38.6}
            stroke="#8A6E5D"
            strokeWidth={0.8}
          />
          <ellipse cx={0} cy={-39} rx={5} ry={1.1} fill="#8FB8DE">
            {motion ? (
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1;0.2 1;1 1"
                additive="sum"
                dur="0.6s"
                repeatCount="indefinite"
              />
            ) : null}
          </ellipse>
        </g>
      ) : null}
      {L.acc === "bolt" ? (
        <polygon
          points="5,-38 9,-38 6.6,-34.6 9.4,-34.6 4.4,-29.6 6.2,-33.2 3.6,-33.2"
          fill={L.accC}
          stroke="#C9962C"
          strokeWidth={0.4}
        />
      ) : null}
      {kidFace(L.mouth)}
      {L.acc === "glasses" ? (
        <g fill="none" stroke={L.accC} strokeWidth={0.7}>
          <circle cx={-3.7} cy={-23} r={2.6} />
          <circle cx={3.7} cy={-23} r={2.6} />
          <line x1={-1.1} y1={-23} x2={1.1} y2={-23} />
        </g>
      ) : null}
      {L.hands === "chin" ? (
        <g>
          <circle
            cx={-1.5}
            cy={-14.6}
            r={1.6}
            fill={SKIN}
            stroke={OLS}
            strokeWidth={0.4}
          />
          <circle
            cx={1.5}
            cy={-14.6}
            r={1.6}
            fill={SKIN}
            stroke={OLS}
            strokeWidth={0.4}
          />
        </g>
      ) : null}
    </g>
  );
}

// 詹姆獅：獅子造型原創角色
function lion(motion: boolean, dancing: boolean) {
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const armA = motion && !dancing ? "gi-armA" : undefined;
  const armB = motion && !dancing ? "gi-armB" : undefined;
  const mane = "#F2A65A";
  const fur = "#FFD79A";
  return (
    <g>
      <ellipse cx={0} cy={0.5} rx={8} ry={2.4} fill="#2D3A36" opacity={0.16} />
      <g className={motion ? "gi-tail" : undefined}>
        <path
          d="M5,-6 Q12,-6 11,-12"
          stroke={fur}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={11} cy={-13} r={2} fill={mane} />
      </g>
      <rect
        x={-4}
        y={-5}
        width={3.2}
        height={5}
        rx={1.6}
        fill={fur}
        stroke={OLS}
        strokeWidth={0.5}
        className={legA}
      />
      <rect
        x={0.8}
        y={-5}
        width={3.2}
        height={5}
        rx={1.6}
        fill={fur}
        stroke={OLS}
        strokeWidth={0.5}
        className={legB}
      />
      <rect
        x={-6.3}
        y={-15}
        width={12.6}
        height={10.5}
        rx={5}
        fill="#FFF1B8"
        stroke={OLS}
        strokeWidth={0.6}
      />
      <path
        d="M-2.4,-14.6 L0,-13 L2.4,-14.6 L2.4,-11.6 L0,-13 L-2.4,-11.6 Z"
        fill="#FF8FA3"
      />
      <g className={armA}>
        <rect
          x={-8.8}
          y={-14.5}
          width={2.8}
          height={6.5}
          rx={1.4}
          fill={fur}
          stroke={OLS}
          strokeWidth={0.5}
        />
      </g>
      <g className={armB}>
        <rect
          x={6}
          y={-14.5}
          width={2.8}
          height={6.5}
          rx={1.4}
          fill={fur}
          stroke={OLS}
          strokeWidth={0.5}
        />
      </g>
      {Array.from({ length: 12 }).map((_: unknown, i: number) => {
        const a = (Math.PI * 2 * i) / 12;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * 11}
            cy={-25 + Math.sin(a) * 11}
            r={3.6}
            fill={mane}
          />
        );
      })}
      <circle
        cx={-7.5}
        cy={-33}
        r={2.6}
        fill={fur}
        stroke={OLS}
        strokeWidth={0.5}
      />
      <circle
        cx={7.5}
        cy={-33}
        r={2.6}
        fill={fur}
        stroke={OLS}
        strokeWidth={0.5}
      />
      <circle
        cx={0}
        cy={-25}
        r={9.5}
        fill={fur}
        stroke={OLS}
        strokeWidth={0.6}
      />
      <ellipse cx={0} cy={-21} rx={4.6} ry={3.4} fill="#FFF3DD" />
      <ellipse cx={-3.6} cy={-25.5} rx={1.2} ry={1.5} fill={EYE} />
      <ellipse cx={3.6} cy={-25.5} rx={1.2} ry={1.5} fill={EYE} />
      <circle cx={-3.2} cy={-26} r={0.45} fill="#FFFFFF" />
      <circle cx={4} cy={-26} r={0.45} fill="#FFFFFF" />
      <path d="M-1.2,-22.6 L1.2,-22.6 L0,-21.3 Z" fill="#B5615A" />
      <path
        d="M-2.2,-20.4 Q-1,-19 0,-20.4 Q1,-19 2.2,-20.4"
        stroke="#B5615A"
        strokeWidth={0.7}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={-6}
        cy={-21.5}
        rx={1.8}
        ry={1.1}
        fill="#FF9AA8"
        opacity={0.7}
      />
      <ellipse
        cx={6}
        cy={-21.5}
        rx={1.8}
        ry={1.1}
        fill="#FF9AA8"
        opacity={0.7}
      />
    </g>
  );
}

// 偶像 Q 版（依 James 提供的參考插畫特徵繪製；粉絲自製，非本人）
const TEE_BLACK = "#2A2A2E";
const SILVER = "#D5DAE0";
const SILVER_D = "#9AA3AD";
const APRON = "#D8D2C4";
const APRON_S = "#BDB5A5";
const STRAP = "#C68A4E";
const HAIR_BLACK = "#24201F";

function idolHead(kind: number) {
  const hsu = kind === 4;
  return (
    <g>
      <ellipse
        cx={-10.2}
        cy={-23.5}
        rx={1.7}
        ry={2.3}
        fill={SKIN}
        stroke={OLS}
        strokeWidth={0.5}
      />
      <ellipse
        cx={10.2}
        cy={-23.5}
        rx={1.7}
        ry={2.3}
        fill={SKIN}
        stroke={OLS}
        strokeWidth={0.5}
      />
      {hsu ? (
        <ellipse
          cx={0}
          cy={-25}
          rx={9.8}
          ry={10.6}
          fill={SKIN}
          stroke={OLS}
          strokeWidth={0.6}
        />
      ) : (
        <circle
          cx={0}
          cy={-24.6}
          r={10.8}
          fill={SKIN}
          stroke={OLS}
          strokeWidth={0.6}
        />
      )}
      {hsu ? (
        <g>
          <path
            d="M-10.6,-23 Q-12.6,-33.5 -5,-36.8 Q2,-39 8.2,-35.6 Q12.4,-32 10.6,-23.5 Q10,-27.4 8.6,-28.8 Q5.4,-26.6 0.8,-27.6 Q-3.6,-28.2 -6.6,-29.8 Q-8.8,-27.6 -10.6,-23 Z"
            fill={HAIR_BLACK}
          />
          <path
            d="M-3.4,-36.6 L-1.8,-39.6 L0.2,-37 Z M2.2,-37.6 L4.8,-39.8 L5.6,-36.6 Z M-7.4,-34.6 L-8.4,-37.4 L-5,-36 Z"
            fill={HAIR_BLACK}
          />
          <path
            d="M-5.5,-33.6 Q-1,-31.6 3,-29.4 M-1.5,-35.6 Q3,-33 6.2,-30.2"
            stroke="#4A4448"
            strokeWidth={0.6}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <path
          d="M-10.8,-22.6 Q-11.8,-31 -8.6,-33.2 L-9.8,-37.8 L-5.6,-35.2 L-5.2,-40.4 L-1.6,-36.2 L0.4,-41.4 L3,-36.4 L6.2,-40 L6.6,-35.2 L10.4,-37.2 L9.2,-32 Q11.8,-30 10.8,-22.6 Q10,-28.6 7.2,-30.2 Q2,-31.8 -2,-31.6 Q-6.8,-31.2 -8.6,-29.6 Q-10.2,-27.6 -10.8,-22.6 Z"
          fill={HAIR_BLACK}
        />
      )}
      {hsu ? (
        <g>
          <path
            d="M-6.2,-26 L-1.8,-26.8"
            stroke={HAIR_BLACK}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          <path
            d="M6.2,-26 L1.8,-26.8"
            stroke={HAIR_BLACK}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          <ellipse cx={-3.7} cy={-23.2} rx={1.2} ry={1.5} fill={EYE} />
          <ellipse cx={3.7} cy={-23.2} rx={1.2} ry={1.5} fill={EYE} />
          <circle cx={-3.3} cy={-23.8} r={0.45} fill="#FFFFFF" />
          <circle cx={4.1} cy={-23.8} r={0.45} fill="#FFFFFF" />
          <path
            d="M-3,-20.2 Q0,-15.8 3,-20.2 Z"
            fill="#E86F72"
            stroke="#B5615A"
            strokeWidth={0.45}
            strokeLinejoin="round"
          />
          <path
            d="M-2.7,-20 L2.7,-20 Q2.3,-18.8 0,-18.8 Q-2.3,-18.8 -2.7,-20 Z"
            fill="#FFFFFF"
          />
          <circle
            cx={-10.4}
            cy={-21.6}
            r={0.75}
            fill={SILVER}
            stroke={SILVER_D}
            strokeWidth={0.3}
          />
        </g>
      ) : (
        <g>
          <path
            d="M-6.8,-27.6 Q-4.4,-29.2 -1.8,-28"
            stroke={HAIR_BLACK}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M6.8,-27.6 Q4.4,-29.2 1.8,-28"
            stroke={HAIR_BLACK}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-5.6,-23.4 Q-3.8,-25.8 -2,-23.4"
            stroke={EYE}
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M5.6,-23.4 Q3.8,-25.8 2,-23.4"
            stroke={EYE}
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-3.8,-20.6 Q0,-14.6 3.8,-20.6 Z"
            fill="#E86F72"
            stroke="#B5615A"
            strokeWidth={0.45}
            strokeLinejoin="round"
          />
          <path
            d="M-3.5,-20.4 L3.5,-20.4 Q3,-19 0,-19 Q-3,-19 -3.5,-20.4 Z"
            fill="#FFFFFF"
          />
        </g>
      )}
      <ellipse
        cx={-6.6}
        cy={-20}
        rx={2.1}
        ry={1.2}
        fill="#FF9AA8"
        opacity={0.7}
      />
      <ellipse
        cx={6.6}
        cy={-20}
        rx={2.1}
        ry={1.2}
        fill="#FF9AA8"
        opacity={0.7}
      />
    </g>
  );
}

function idolBody(kind: number, motion: boolean, dancing: boolean) {
  const hsu = kind === 4;
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const armA = motion && !dancing && hsu ? "gi-armA" : undefined;
  const armB = motion && !dancing && hsu ? "gi-armB" : undefined;
  const pants = hsu ? "#4B4F5C" : TEE_BLACK;
  const leg = (x: number, cls: string | undefined) => (
    <g className={cls}>
      <rect x={x} y={-7.2} width={2.9} height={6.6} rx={1.2} fill={pants} />
      <ellipse
        cx={x + 1.45 + (x < 0 ? -0.5 : 0.5)}
        cy={-0.5}
        rx={2.4}
        ry={1.35}
        fill="#FFFFFF"
        stroke={OLS}
        strokeWidth={0.5}
      />
    </g>
  );
  return (
    <g>
      <ellipse
        cx={0}
        cy={0.5}
        rx={7.5}
        ry={2.3}
        fill="#2D3A36"
        opacity={0.16}
      />
      {leg(-3.6, legA)}
      {leg(0.7, legB)}
      <rect
        x={-6.4}
        y={-15.8}
        width={12.8}
        height={9.4}
        rx={4}
        fill={TEE_BLACK}
      />
      {hsu ? (
        <g>
          <path
            d="M-2.6,-15.8 Q0,-13.4 2.6,-15.8"
            stroke="#45454B"
            strokeWidth={0.7}
            fill="none"
          />
          <path
            d="M-2.4,-15.6 Q0,-12.6 2.4,-15.6"
            stroke={SILVER}
            strokeWidth={0.45}
            fill="none"
          />
          <path
            d="M-4.6,-12.8 L4.6,-12.8 L5.4,-5.6 L-5.4,-5.6 Z"
            fill={APRON}
            stroke={APRON_S}
            strokeWidth={0.4}
          />
          <line
            x1={-4.2}
            y1={-15.7}
            x2={-4.2}
            y2={-12.6}
            stroke={STRAP}
            strokeWidth={1.2}
          />
          <line
            x1={4.2}
            y1={-15.7}
            x2={4.2}
            y2={-12.6}
            stroke={STRAP}
            strokeWidth={1.2}
          />
          <rect
            x={-4.9}
            y={-13.5}
            width={1.4}
            height={1.2}
            fill="none"
            stroke={SILVER}
            strokeWidth={0.4}
          />
          <rect
            x={3.5}
            y={-13.5}
            width={1.4}
            height={1.2}
            fill="none"
            stroke={SILVER}
            strokeWidth={0.4}
          />
          <rect
            x={-3.6}
            y={-10.6}
            width={4.2}
            height={2.8}
            rx={0.4}
            fill="#CCC5B5"
          />
          <line
            x1={-2.8}
            y1={-12}
            x2={-2.8}
            y2={-9.8}
            stroke="#1E1E22"
            strokeWidth={0.6}
          />
          <line
            x1={-1.8}
            y1={-12.2}
            x2={-1.8}
            y2={-9.8}
            stroke="#1E1E22"
            strokeWidth={0.6}
          />
          <circle
            cx={-0.4}
            cy={-9.3}
            r={0.75}
            fill="#F2C14E"
            stroke={ORANGE}
            strokeWidth={0.3}
          />
        </g>
      ) : (
        <g>
          <polygon
            points="-2.6,-15.6 2.6,-15.6 2,-6.6 -2,-6.6"
            fill="#FFFFFF"
          />
          {[-14.6, -13, -11.4, -9.8, -8.2].map((yy: number) => (
            <line
              key={yy}
              x1={-2.4}
              y1={yy}
              x2={2.4}
              y2={yy}
              stroke={TEE_BLACK}
              strokeWidth={0.75}
            />
          ))}
          <circle cx={-3.8} cy={-12.4} r={0.5} fill={SILVER} />
          <circle cx={-3.8} cy={-9.4} r={0.5} fill={SILVER} />
          <circle cx={3.8} cy={-12.4} r={0.5} fill={SILVER} />
          <circle cx={3.8} cy={-9.4} r={0.5} fill={SILVER} />
        </g>
      )}
      {hsu ? (
        <g>
          <g className={armA}>
            <rect
              x={-8.9}
              y={-15}
              width={2.9}
              height={6.8}
              rx={1.4}
              fill={TEE_BLACK}
            />
            <circle
              cx={-7.45}
              cy={-7.8}
              r={1.5}
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.4}
            />
          </g>
          <g className={armB}>
            <rect
              x={6}
              y={-15}
              width={2.9}
              height={6.8}
              rx={1.4}
              fill={TEE_BLACK}
            />
            <circle
              cx={7.45}
              cy={-7.8}
              r={1.5}
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.4}
            />
          </g>
        </g>
      ) : (
        <g>
          <path
            d="M-6,-12.6 Q-7,-15.8 -2.4,-15.4"
            stroke={TEE_BLACK}
            strokeWidth={2.9}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M6,-12.6 Q7,-15.8 2.4,-15.4"
            stroke={TEE_BLACK}
            strokeWidth={2.9}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
      {idolHead(kind)}
      {hsu ? null : (
        <g>
          <ellipse
            cx={0}
            cy={-14.4}
            rx={3.2}
            ry={2}
            fill={SKIN}
            stroke={OLS}
            strokeWidth={0.45}
          />
          <path
            d="M-1.1,-15.6 L-1.1,-13.4 M0,-15.8 L0,-13.2 M1.1,-15.6 L1.1,-13.4"
            stroke={OLS}
            strokeWidth={0.35}
          />
        </g>
      )}
    </g>
  );
}

// 應援卡上的大頭半身像：許光漢微微側身穿圍裙；曾敬驊坐在灰沙發、雙手合握在下巴
function idolBust(kind: number) {
  const hsu = kind === 4;
  return (
    <g>
      <circle cx={0} cy={-6} r={38} fill={hsu ? "#FCE6D8" : "#E1EEF3"} />
      {hsu ? null : (
        <g>
          <rect x={-38} y={-4} width={76} height={40} rx={12} fill="#B9BCC2" />
          <rect x={-34} y={2} width={22} height={18} rx={6} fill="#C9CCD1" />
          <rect x={12} y={2} width={22} height={18} rx={6} fill="#C9CCD1" />
        </g>
      )}
      <g transform={hsu ? "rotate(-7 0 34)" : undefined}>
        <path d="M-25,34 Q-25,8 -9,3 L9,3 Q25,8 25,34 Z" fill={TEE_BLACK} />
        {hsu ? (
          <g>
            <path
              d="M-6,3.4 Q0,9 6,3.4"
              stroke="#45454B"
              strokeWidth={1.4}
              fill="none"
            />
            <path
              d="M-5.4,4 Q0,11.5 5.4,4"
              stroke={SILVER}
              strokeWidth={0.8}
              fill="none"
            />
            <path
              d="M-12,12 L12,12 L14,34 L-14,34 Z"
              fill={APRON}
              stroke={APRON_S}
              strokeWidth={0.8}
            />
            <path
              d="M-11,12.5 L-14.5,4.5"
              stroke={STRAP}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <path
              d="M11,12.5 L14.5,4.5"
              stroke={STRAP}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <rect
              x={-13}
              y={10}
              width={4}
              height={3.4}
              rx={0.6}
              fill="none"
              stroke={SILVER}
              strokeWidth={1}
            />
            <rect
              x={9}
              y={10}
              width={4}
              height={3.4}
              rx={0.6}
              fill="none"
              stroke={SILVER}
              strokeWidth={1}
            />
            <circle
              cx={11}
              cy={17}
              r={1.3}
              fill="none"
              stroke={SILVER}
              strokeWidth={0.8}
            />
            <rect
              x={-9.5}
              y={18}
              width={11}
              height={8}
              rx={1.2}
              fill="#CCC5B5"
              stroke={APRON_S}
              strokeWidth={0.6}
            />
            <rect
              x={-7.8}
              y={13.5}
              width={1.5}
              height={7}
              rx={0.5}
              fill="#1E1E22"
            />
            <rect
              x={-5.4}
              y={14.2}
              width={1.5}
              height={6.3}
              rx={0.5}
              fill="#1E1E22"
            />
            <rect x={-7.6} y={13.2} width={0.6} height={2.2} fill={SILVER} />
            <rect x={-5.2} y={13.9} width={0.6} height={2.2} fill={SILVER} />
            <circle
              cx={-1.6}
              cy={22}
              r={2.1}
              fill="#F2C14E"
              stroke={ORANGE}
              strokeWidth={0.6}
            />
            <circle cx={-1.6} cy={22} r={0.9} fill="#5E9FB5" />
          </g>
        ) : (
          <g>
            <polygon points="-8,3.5 8,3.5 7,34 -7,34" fill="#FFFFFF" />
            {[8, 12, 16, 20, 24, 28, 32].map((yy: number) => (
              <line
                key={yy}
                x1={-7.6}
                y1={yy}
                x2={7.6}
                y2={yy}
                stroke={TEE_BLACK}
                strokeWidth={1.8}
              />
            ))}
            <path d="M-9,3 L-8,16 L-12,9 Z M9,3 L8,16 L12,9 Z" fill="#3A3A40" />
            {[14, 22, 30].map((yy: number) => (
              <g key={yy}>
                <circle cx={-9.6} cy={yy} r={0.9} fill={SILVER} />
                <circle cx={9.6} cy={yy} r={0.9} fill={SILVER} />
              </g>
            ))}
            <path
              d="M-21,30 Q-21,6 -5,3.5"
              stroke={TEE_BLACK}
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M21,30 Q21,6 5,3.5"
              stroke={TEE_BLACK}
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        <g transform="translate(0,22) scale(1.5)">{idolHead(kind)}</g>
        {hsu ? null : (
          <g>
            <ellipse
              cx={-2.6}
              cy={2.4}
              rx={4.6}
              ry={3.4}
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.7}
            />
            <ellipse
              cx={2.6}
              cy={2.4}
              rx={4.6}
              ry={3.4}
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.7}
            />
            <path
              d="M-2,0 L-2,4.6 M0,-0.4 L0,5 M2,0 L2,4.6"
              stroke={OLS}
              strokeWidth={0.6}
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </g>
  );
}

// 蔡小雷：媽媽（大人比例、溫柔低馬尾、針織外套加圍裙）
function mom(motion: boolean, dancing: boolean) {
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const armA = motion && !dancing ? "gi-armA" : undefined;
  const armB = motion && !dancing ? "gi-armB" : undefined;
  const hair = "#7A5240";
  const cardi = "#F4C7B8";
  return (
    <g>
      <ellipse
        cx={0}
        cy={0.5}
        rx={7.5}
        ry={2.3}
        fill="#2D3A36"
        opacity={0.16}
      />
      <path
        d="M-9.6,-38 Q-11.6,-27.5 -7.8,-25.6 L7.8,-25.6 Q11.6,-27.5 9.6,-38 Z"
        fill={hair}
      />
      <circle cx={8.4} cy={-28.6} r={3.6} fill={hair} />
      <g className={legA}>
        <rect
          x={-3.4}
          y={-6}
          width={2.6}
          height={5.6}
          rx={1.2}
          fill={SKIN}
          stroke={OLS}
          strokeWidth={0.4}
        />
        <ellipse cx={-2.4} cy={-0.5} rx={2.2} ry={1.2} fill="#C79A6B" />
      </g>
      <g className={legB}>
        <rect
          x={0.8}
          y={-6}
          width={2.6}
          height={5.6}
          rx={1.2}
          fill={SKIN}
          stroke={OLS}
          strokeWidth={0.4}
        />
        <ellipse cx={2.4} cy={-0.5} rx={2.2} ry={1.2} fill="#C79A6B" />
      </g>
      <path
        d="M-6,-17 L6,-17 L8.4,-5 L-8.4,-5 Z"
        fill="#9CB8D6"
        stroke={OLS}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <rect
        x={-6.8}
        y={-26.6}
        width={13.6}
        height={11.4}
        rx={4.4}
        fill={cardi}
        stroke={OLS}
        strokeWidth={0.6}
      />
      <polygon points="-2.6,-26.4 2.6,-26.4 0,-21.4" fill="#FFFFFF" />
      <path
        d="M-4.6,-21.6 L4.6,-21.6 L5.6,-8 L-5.6,-8 Z"
        fill="#FFF6E5"
        stroke={OLS}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <path
        d="M0,-12.2 C-2.4,-14.4 -2.4,-16.4 -1,-16.4 C-0.4,-16.4 0,-16 0,-15.4 C0,-16 0.4,-16.4 1,-16.4 C2.4,-16.4 2.4,-14.4 0,-12.2 Z"
        fill="#FF8FA3"
      />
      <g className={armA}>
        <rect
          x={-9.4}
          y={-25.6}
          width={2.9}
          height={8.4}
          rx={1.4}
          fill={cardi}
          stroke={OLS}
          strokeWidth={0.5}
        />
        <circle
          cx={-7.95}
          cy={-16.8}
          r={1.5}
          fill={SKIN}
          stroke={OLS}
          strokeWidth={0.4}
        />
      </g>
      <g className={armB}>
        <rect
          x={6.5}
          y={-25.6}
          width={2.9}
          height={8.4}
          rx={1.4}
          fill={cardi}
          stroke={OLS}
          strokeWidth={0.5}
        />
        <circle
          cx={7.95}
          cy={-16.8}
          r={1.5}
          fill={SKIN}
          stroke={OLS}
          strokeWidth={0.4}
        />
      </g>
      <circle
        cx={0}
        cy={-36}
        r={9.8}
        fill={SKIN}
        stroke={OLS}
        strokeWidth={0.6}
      />
      <path
        d="M-10,-34.5 Q-10.6,-46.4 0,-46.6 Q10.6,-46.4 10,-34.5 Q8.6,-41 3.4,-41.6 Q-0.6,-40.6 -2.6,-43 Q-5.8,-40 -10,-34.5 Z"
        fill={hair}
      />
      <g transform="translate(0,-11)">
        <path
          d="M-5.4,-23 Q-3.7,-25 -2,-23"
          stroke={EYE}
          strokeWidth={1.1}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M5.4,-23 Q3.7,-25 2,-23"
          stroke={EYE}
          strokeWidth={1.1}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse
          cx={-6}
          cy={-19.8}
          rx={2.1}
          ry={1.2}
          fill="#FF9AA8"
          opacity={0.75}
        />
        <ellipse
          cx={6}
          cy={-19.8}
          rx={2.1}
          ry={1.2}
          fill="#FF9AA8"
          opacity={0.75}
        />
        <path
          d="M-2,-19.8 Q0,-17.6 2,-19.8"
          stroke="#B5615A"
          strokeWidth={0.9}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

// v6：仿政策島的立體低面數 Q 版人物（大圓頭、深色髮帽、有明暗面的身體）；臉一律淺膚色
const FACE_SH = "#E2B39B";
const LINE = "#2B2422";
const BRASS = "#C9A25A";

function hairBack6(style: string, hair: string) {
  if (style === "long")
    return (
      <path
        d="M-12.2,-32 Q-13.6,-15 -8,-14 L8,-14 Q13.6,-15 12.2,-32 Z"
        fill={hair}
      />
    );
  if (style === "bob")
    return (
      <path
        d="M-12.4,-32 Q-13,-21 -8.5,-20.5 L8.5,-20.5 Q13,-21 12.4,-32 Z"
        fill={hair}
      />
    );
  if (style === "pony")
    return (
      <path d="M10,-37 Q19,-34 16.4,-21 Q14.4,-26.4 11,-28.6 Z" fill={hair} />
    );
  if (style === "bun") return <circle cx={0} cy={-44.6} r={4.8} fill={hair} />;
  if (style === "mom")
    return (
      <g>
        <path
          d="M-11.6,-33 Q-12.6,-22 -9,-21 L9,-21 Q12.6,-22 11.6,-33 Z"
          fill={hair}
        />
        <circle cx={9.8} cy={-23.4} r={4} fill={hair} />
      </g>
    );
  return null;
}

function hairCap6(style: string, hair: string) {
  let d =
    "M-12.4,-27 Q-13.6,-43.6 0,-44 Q13.6,-43.6 12.4,-27 Q11.6,-33 8,-35 Q2,-33.4 0,-34.6 Q-3,-33 -8,-35 Q-11.6,-33 -12.4,-27 Z";
  let tufts = "";
  if (style === "tousled" || style === "messy" || style === "spiky") {
    d =
      "M-12.6,-26.5 Q-14.5,-38 -9,-42.5 Q-3,-46.5 4,-45 Q11,-44 13,-37 Q14,-31 12.6,-26.5 Q11,-31 9.8,-30.4 Q8.6,-29.8 8.1,-31.4 Q7.6,-33 6.1,-31.8 Q4.6,-30.6 4,-32.1 Q3.4,-33.6 1.9,-32.2 Q0.4,-30.8 -0.3,-32.3 Q-1,-33.8 -2.5,-32.4 Q-4,-31 -4.7,-32.3 Q-5.4,-33.6 -6.9,-32.1 Q-8.4,-30.6 -8.9,-31.9 Q-9.4,-33.2 -11,-29.85 L-12.6,-26.5 Z";
    tufts =
      "M-10,-41.6 Q-12.4,-46 -7,-45.2 Q-5,-48.6 -1.4,-46.4 Q2,-49 4.6,-46 Q9.4,-47 8.8,-42.4 Z";
  } else if (style === "fringe") {
    d =
      "M-12.8,-25.5 Q-14,-40 -6,-43.4 Q0,-45.2 6,-43.4 Q14,-40 12.8,-25.5 Q11.6,-30.6 10.4,-31.5 Q9.2,-32.4 8.4,-31.6 Q7.6,-30.8 6.6,-32.4 Q5.6,-34 4.5,-32.8 Q3.4,-31.6 2.3,-32.9 Q1.2,-34.2 0,-33 Q-1.2,-31.8 -2.4,-33.1 Q-3.6,-34.4 -4.7,-33.2 Q-5.8,-32 -6.9,-33 Q-8,-34 -9.1,-32.7 Q-10.2,-31.4 -10.9,-31.6 Q-11.6,-31.8 -12.2,-28.65 L-12.8,-25.5 Z";
    tufts =
      "M-4,-43.2 Q-5,-45.8 -1.8,-44.6 Z M2.6,-44.2 Q4.4,-46.2 5.2,-43.6 Z";
  } else if (style === "mom") {
    d =
      "M-12,-27 Q-13,-43.6 0,-44 Q13,-43.6 12,-27 Q10.5,-35 4,-36.4 Q0,-35.6 -2.4,-39 Q-7,-35.6 -12,-27 Z";
  }
  return (
    <g>
      <path d={d} fill={hair} />
      {tufts ? <path d={tufts} fill={hair} /> : null}
      <path
        d="M-9,-40.5 L-3,-43.4 L2,-42.6 L-4,-38.4 Z"
        fill="#FFFFFF"
        opacity={0.2}
      />
      <path
        d="M7,-42 L12.8,-33 L11.6,-29.8 L6,-37.4 Z"
        fill="#000000"
        opacity={0.22}
      />
    </g>
  );
}

function face6(L: Look, special: string) {
  if (special === "xu") {
    return (
      <g>
        <path
          d="M-6.4,-30.1 L-2.2,-30.6"
          stroke={HAIR_BLACK}
          strokeWidth={0.95}
          strokeLinecap="round"
        />
        <path
          d="M6.4,-30.1 L2.2,-30.6"
          stroke={HAIR_BLACK}
          strokeWidth={0.95}
          strokeLinecap="round"
        />
        <path
          d="M-6.2,-27.3 Q-4,-29.2 -1.9,-27.6 Q-4,-26.3 -6.2,-27.3 Z"
          fill={EYE}
        />
        <path
          d="M6.2,-27.3 Q4,-29.2 1.9,-27.6 Q4,-26.3 6.2,-27.3 Z"
          fill={EYE}
        />
        <circle cx={-3.6} cy={-27.9} r={0.45} fill="#FFFFFF" />
        <circle cx={4.4} cy={-27.9} r={0.45} fill="#FFFFFF" />
        <path d="M-3,-23.8 Q0,-20 3,-23.8 Z" fill="#C0605A" />
        <path
          d="M-2.7,-23.6 L2.7,-23.6 Q2.3,-22.6 0,-22.6 Q-2.3,-22.6 -2.7,-23.6 Z"
          fill="#FFFFFF"
        />
        <ellipse
          cx={-7}
          cy={-24.4}
          rx={2.1}
          ry={1.1}
          fill="#FF9AA8"
          opacity={0.55}
        />
        <ellipse
          cx={7}
          cy={-24.4}
          rx={2.1}
          ry={1.1}
          fill="#FF9AA8"
          opacity={0.55}
        />
      </g>
    );
  }
  if (special === "zeng") {
    return (
      <g>
        <path
          d="M-6.6,-30 Q-4.4,-31.2 -2,-30.3"
          stroke={HAIR_BLACK}
          strokeWidth={1.35}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M6.6,-30 Q4.4,-31.2 2,-30.3"
          stroke={HAIR_BLACK}
          strokeWidth={1.35}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-6.4,-26.6 Q-4,-30 -1.6,-26.6 Q-4,-28.2 -6.4,-26.6 Z"
          fill={EYE}
        />
        <path d="M6.4,-26.6 Q4,-30 1.6,-26.6 Q4,-28.2 6.4,-26.6 Z" fill={EYE} />
        <path d="M-4.2,-24.2 Q0,-18.2 4.2,-24.2 Z" fill="#C0605A" />
        <path
          d="M-3.9,-24 L3.9,-24 Q3.3,-22.4 0,-22.4 Q-3.3,-22.4 -3.9,-24 Z"
          fill="#FFFFFF"
        />
        <ellipse
          cx={-7.2}
          cy={-24}
          rx={2.2}
          ry={1.2}
          fill="#FF9AA8"
          opacity={0.6}
        />
        <ellipse
          cx={7.2}
          cy={-24}
          rx={2.2}
          ry={1.2}
          fill="#FF9AA8"
          opacity={0.6}
        />
      </g>
    );
  }
  const closed = special === "mom";
  return (
    <g>
      {closed ? (
        <g>
          <path
            d="M-6,-27 Q-4,-29.2 -2,-27"
            stroke={EYE}
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M6,-27 Q4,-29.2 2,-27"
            stroke={EYE}
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          <ellipse cx={-4} cy={-27.4} rx={1.35} ry={1.75} fill={EYE} />
          <ellipse cx={4} cy={-27.4} rx={1.35} ry={1.75} fill={EYE} />
          <circle cx={-3.6} cy={-28.1} r={0.55} fill="#FFFFFF" />
          <circle cx={4.4} cy={-28.1} r={0.55} fill="#FFFFFF" />
        </g>
      )}
      <ellipse
        cx={-6.9}
        cy={-24.2}
        rx={2.3}
        ry={1.3}
        fill="#FF9AA8"
        opacity={0.7}
      />
      <ellipse
        cx={6.9}
        cy={-24.2}
        rx={2.3}
        ry={1.3}
        fill="#FF9AA8"
        opacity={0.7}
      />
      {L.mouth === "open" ? (
        <path d="M-2.3,-24 Q0,-20.6 2.3,-24 Z" fill="#E86F72" />
      ) : (
        <path
          d="M-1.8,-23.6 Q0,-21.9 1.8,-23.6"
          stroke="#B5615A"
          strokeWidth={0.95}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function figure(L: Look, motion: boolean, dancing: boolean, special: string) {
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const chin = L.hands === "chin";
  const armA = motion && !dancing && !chin ? "gi-armA" : undefined;
  const armB = motion && !dancing && !chin ? "gi-armB" : undefined;
  const lift = special === "mom" ? 3 : 0;
  const bare = L.bottom !== "pants";
  const legC = bare ? SKIN : L.bottomC;
  const sleeve = L.topC;
  const T =
    "M-6.6,-20 Q-7.8,-20 -7.8,-17.6 L-7.2,-8.6 Q-7,-7.4 -5.8,-7.4 L5.8,-7.4 Q7,-7.4 7.2,-8.6 L7.8,-17.6 Q7.8,-20 6.6,-20 Z";
  const leg = (x: number, cls: string | undefined) => (
    <g className={cls}>
      <rect
        x={x}
        y={-9 - lift}
        width={3.4}
        height={8.4 + lift}
        rx={1.6}
        fill={legC}
      />
      {bare ? (
        <rect x={x} y={-3.4} width={3.4} height={2} fill="#FFFFFF" />
      ) : null}
      <rect
        x={x + 1.8}
        y={-9 - lift}
        width={1.6}
        height={8.4 + lift}
        rx={0.8}
        fill="#000000"
        opacity={0.1}
      />
      <ellipse
        cx={x + 1.7 + (x < 0 ? -0.5 : 0.5)}
        cy={-0.7}
        rx={2.7}
        ry={1.5}
        fill="#FFFFFF"
      />
      <rect
        x={x - 1 + (x < 0 ? -0.5 : 0.5)}
        y={-0.4}
        width={5.4}
        height={1}
        rx={0.5}
        fill={L.shoe}
      />
    </g>
  );
  return (
    <g>
      <ellipse
        cx={0}
        cy={0.4}
        rx={8.5}
        ry={2.6}
        fill="#2D3A36"
        opacity={0.18}
      />
      {leg(-4.4, legA)}
      {leg(1, legB)}
      <g transform={lift ? `translate(0,${-lift})` : undefined}>
        {hairBack6(L.hairStyle, L.hair)}
        {L.acc === "backpack" ? (
          <rect
            x={-9}
            y={-19.4}
            width={18}
            height={11.6}
            rx={3.4}
            fill={L.accC}
          />
        ) : null}
        <path
          d={T}
          fill={L.top === "dress" || L.top === "cardigan" ? L.topC : L.topC}
        />
        {L.bottom === "skirt" ? (
          <path d="M-6.8,-9.8 L6.8,-9.8 L9,-4.4 L-9,-4.4 Z" fill={L.bottomC} />
        ) : null}
        {L.bottom === "shorts" ? (
          <path
            d="M-6.9,-9.8 L6.9,-9.8 L7.3,-5.4 L0.6,-5.4 L0,-6.8 L-0.6,-5.4 L-7.3,-5.4 Z"
            fill={L.bottomC}
          />
        ) : null}
        {L.bottom === "longskirt" ? (
          <path
            d="M-7,-10.4 L7,-10.4 L8.8,-1.2 L-8.8,-1.2 Z"
            fill={L.bottomC}
          />
        ) : null}
        {L.top === "dress" ? (
          <path d="M-7.4,-12 L7.4,-12 L9.8,-4.2 L-9.8,-4.2 Z" fill={L.topC} />
        ) : null}
        {L.top === "uniform" ? (
          <g>
            <path d="M-6,-19.8 L6,-19.8 L0,-14 Z" fill={L.topC2} />
            <path d="M-3.4,-19.8 L3.4,-19.8 L0,-16.4 Z" fill="#FFFFFF" />
            <path
              d="M-2,-15.2 L0,-14 L2,-15.2 L1.6,-13 L0,-13.7 L-1.6,-13 Z"
              fill={special === "goal" ? "#22396B" : "#FF7A85"}
            />
            {special === "goal" ? (
              <g>
                <rect
                  x={-7}
                  y={-13.4}
                  width={7.6}
                  height={2.8}
                  rx={0.6}
                  fill="#22396B"
                />
                <text
                  x={-3.2}
                  y={-11.4}
                  fontSize={2}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontWeight={700}
                >
                  {GOAL_SCHOOL}
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
        {L.top === "hoodie" ? (
          <g>
            <ellipse cx={0} cy={-19.6} rx={6.4} ry={2.6} fill={L.topC2} />
            <rect
              x={-4}
              y={-12.8}
              width={8}
              height={3.4}
              rx={1.4}
              fill={L.topC2}
              opacity={0.85}
            />
            <line
              x1={-1.5}
              y1={-18.6}
              x2={-1.5}
              y2={-15.4}
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeLinecap="round"
            />
            <line
              x1={1.5}
              y1={-18.6}
              x2={1.5}
              y2={-15.4}
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          </g>
        ) : null}
        {L.top === "overalls" ? (
          <g>
            <rect
              x={-5}
              y={-15.6}
              width={10}
              height={8}
              rx={1.8}
              fill={L.topC2}
            />
            <line
              x1={-4.2}
              y1={-19.8}
              x2={-3.8}
              y2={-15.2}
              stroke={L.topC2}
              strokeWidth={1.5}
            />
            <line
              x1={4.2}
              y1={-19.8}
              x2={3.8}
              y2={-15.2}
              stroke={L.topC2}
              strokeWidth={1.5}
            />
            <circle cx={-3.6} cy={-14.6} r={0.65} fill="#FFFFFF" />
            <circle cx={3.6} cy={-14.6} r={0.65} fill="#FFFFFF" />
          </g>
        ) : null}
        {L.top === "apron" ? (
          <g>
            <path
              d="M-2.8,-20 Q0,-17.6 2.8,-20"
              stroke="#4A4A50"
              strokeWidth={0.8}
              fill="none"
            />
            <path
              d="M-2.4,-19.6 Q0.6,-15.6 2.8,-18.4"
              stroke={SILVER}
              strokeWidth={0.5}
              fill="none"
            />
            <path d="M-5,-15.8 L5,-15.8 L5.8,-7 L-5.8,-7 Z" fill={APRON} />
            <line
              x1={-4.6}
              y1={-19.9}
              x2={-4.6}
              y2={-15.6}
              stroke={STRAP}
              strokeWidth={1.3}
            />
            <line
              x1={4.6}
              y1={-19.9}
              x2={4.6}
              y2={-15.6}
              stroke={STRAP}
              strokeWidth={1.3}
            />
            <circle
              cx={-4.6}
              cy={-15.6}
              r={0.8}
              fill="none"
              stroke={BRASS}
              strokeWidth={0.5}
            />
            <circle
              cx={4.6}
              cy={-15.6}
              r={0.8}
              fill="none"
              stroke={BRASS}
              strokeWidth={0.5}
            />
            <rect
              x={-3.8}
              y={-12.6}
              width={4.6}
              height={3.2}
              rx={0.4}
              fill="#CCC5B5"
            />
            <line
              x1={-3}
              y1={-14}
              x2={-3}
              y2={-11.4}
              stroke="#1E1E22"
              strokeWidth={0.65}
            />
            <line
              x1={-1.9}
              y1={-14.2}
              x2={-1.9}
              y2={-11.4}
              stroke="#1E1E22"
              strokeWidth={0.65}
            />
            <rect x={-0.6} y={-11.9} width={1.4} height={1.9} fill="#2F6DB5" />
            <rect x={-0.6} y={-11.9} width={1.4} height={0.6} fill="#D94A3A" />
          </g>
        ) : null}
        {L.top === "jacket" ? (
          <g>
            <polygon
              points="-2.8,-19.8 2.8,-19.8 2.2,-7.6 -2.2,-7.6"
              fill="#FFFFFF"
            />
            {[-18.4, -16.6, -14.8, -13, -11.2, -9.4].map((yy: number) => (
              <line
                key={yy}
                x1={-2.6}
                y1={yy}
                x2={2.6}
                y2={yy}
                stroke={TEE_BLACK}
                strokeWidth={0.8}
              />
            ))}
            <circle cx={-4.2} cy={-15} r={0.55} fill={SILVER} />
            <circle cx={-4.2} cy={-11.4} r={0.55} fill={SILVER} />
            <circle cx={4.2} cy={-15} r={0.55} fill={SILVER} />
            <circle cx={4.2} cy={-11.4} r={0.55} fill={SILVER} />
          </g>
        ) : null}
        {L.top === "suit" ? (
          <g>
            <polygon
              points="-2.6,-19.8 2.6,-19.8 1.4,-11.4 -1.4,-11.4"
              fill="#FFFFFF"
            />
            <polygon
              points="-0.9,-19.2 0.9,-19.2 1.1,-12.6 0,-11 -1.1,-12.6"
              fill={L.topC2}
            />
            <path
              d="M-2.6,-19.8 L-0.8,-13.4 L-4,-15.8 Z"
              fill={shade(L.topC, 0.78)}
            />
            <path
              d="M2.6,-19.8 L0.8,-13.4 L4,-15.8 Z"
              fill={shade(L.topC, 0.78)}
            />
            <circle cx={0} cy={-9.4} r={0.55} fill={shade(L.topC, 0.6)} />
          </g>
        ) : null}
        {L.top === "blazer" ? (
          <g>
            <polygon
              points="-2.8,-19.8 2.8,-19.8 2.2,-7.6 -2.2,-7.6"
              fill={L.topC2}
            />
            <path d="M-2.8,-19.8 L-0.6,-12 L-4.4,-14.8 Z" fill={L.topC2} />
            <path d="M2.8,-19.8 L0.6,-12 L4.4,-14.8 Z" fill={L.topC2} />
            <path
              d="M-7,-12.4 L-2.6,-12.4 L-2.8,-7.4 L-5.8,-7.4 Q-7,-7.4 -7.2,-8.6 Z"
              fill={L.topC2}
            />
          </g>
        ) : null}
        {L.top === "cardigan" ? (
          <g>
            <polygon points="-2.8,-19.8 2.8,-19.8 0,-14.8" fill="#FFFFFF" />
            <path
              d="M-4.8,-15.4 L4.8,-15.4 L5.8,-6 L-5.8,-6 Z"
              fill={L.topC2}
            />
            <path
              d="M0,-8 C-2.4,-10.2 -2.4,-12.2 -1,-12.2 C-0.4,-12.2 0,-11.8 0,-11.2 C0,-11.8 0.4,-12.2 1,-12.2 C2.4,-12.2 2.4,-10.2 0,-8 Z"
              fill="#FF8FA3"
            />
          </g>
        ) : null}
        {L.acc === "backpack" ? (
          <g>
            <line
              x1={-4.8}
              y1={-19.8}
              x2={-4.4}
              y2={-9}
              stroke={shade(L.accC, 0.8)}
              strokeWidth={1.2}
            />
            <line
              x1={4.8}
              y1={-19.8}
              x2={4.4}
              y2={-9}
              stroke={shade(L.accC, 0.8)}
              strokeWidth={1.2}
            />
          </g>
        ) : null}
        <path
          d="M2,-20 L6.6,-20 Q7.8,-20 7.8,-17.6 L7.2,-8.6 Q7,-7.4 5.8,-7.4 L3,-7.4 Z"
          fill="#000000"
          opacity={0.14}
        />
        <path
          d="M-6.6,-20 L-2.4,-20 L-3.4,-7.4 L-5.8,-7.4 Q-7,-7.4 -7.2,-8.6 L-7.8,-17.6 Q-7.8,-20 -6.6,-20 Z"
          fill="#FFFFFF"
          opacity={0.16}
        />
        {chin ? (
          <g>
            <path
              d="M-7.2,-12.6 Q-8.8,-17.4 -2.6,-16.8"
              stroke={sleeve}
              strokeWidth={3.4}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M7.2,-12.6 Q8.8,-17.4 2.6,-16.8"
              stroke={sleeve}
              strokeWidth={3.4}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g>
            <g className={armA}>
              <rect
                x={-10.9}
                y={-19.4}
                width={3.4}
                height={9.6}
                rx={1.7}
                fill={sleeve}
              />
              <rect
                x={-10.9}
                y={-19.4}
                width={1.4}
                height={9.6}
                rx={0.7}
                fill="#FFFFFF"
                opacity={0.18}
              />
              <circle cx={-9.2} cy={-9.6} r={1.75} fill={SKIN} />
            </g>
            {L.hands === "fist" || L.hands === "finger" ? (
              <g>
                <path
                  d="M9.2,-18.4 L12.6,-28.6"
                  stroke={sleeve}
                  strokeWidth={3.4}
                  strokeLinecap="round"
                  fill="none"
                />
                {L.hands === "fist" ? (
                  <circle
                    cx={13}
                    cy={-30.4}
                    r={2.2}
                    fill={SKIN}
                    stroke={OLS}
                    strokeWidth={0.35}
                  />
                ) : (
                  <g>
                    <rect
                      x={12.5}
                      y={-36}
                      width={1.3}
                      height={4.4}
                      rx={0.65}
                      fill={SKIN}
                    />
                    <circle
                      cx={13}
                      cy={-30.6}
                      r={1.9}
                      fill={SKIN}
                      stroke={OLS}
                      strokeWidth={0.35}
                    />
                  </g>
                )}
              </g>
            ) : (
              <g className={armB}>
                <rect
                  x={7.5}
                  y={-19.4}
                  width={3.4}
                  height={9.6}
                  rx={1.7}
                  fill={sleeve}
                />
                <rect
                  x={9.5}
                  y={-19.4}
                  width={1.4}
                  height={9.6}
                  rx={0.7}
                  fill="#000000"
                  opacity={0.16}
                />
                <circle cx={9.2} cy={-9.6} r={1.75} fill={SKIN} />
              </g>
            )}
          </g>
        )}
        <ellipse cx={-11.4} cy={-28} rx={1.9} ry={2.5} fill={SKIN} />
        <ellipse cx={11.4} cy={-28} rx={1.9} ry={2.5} fill={SKIN} />
        <ellipse
          cx={0}
          cy={-30}
          rx={special === "xu" ? 10.9 : special === "zeng" ? 12 : 11.5}
          ry={11.5}
          fill={SKIN}
        />
        <path
          d="M2.5,-41.2 A11.5,11.5 0 0 1 2.5,-18.8 A8.5,11.5 0 0 0 2.5,-41.2 Z"
          fill={FACE_SH}
          opacity={0.45}
        />
        <ellipse
          cx={-5.6}
          cy={-31}
          rx={2.6}
          ry={1.4}
          fill="#FFFFFF"
          opacity={0.3}
        />
        {special === "xu" ? (
          <circle
            cx={11.9}
            cy={-26.4}
            r={0.8}
            fill={SILVER}
            stroke={SILVER_D}
            strokeWidth={0.3}
          />
        ) : null}
        {hairCap6(L.hairStyle, L.hair)}
        <g transform="translate(0,-2.5) scale(1.1)">
          {L.acc === "bow" ? (
            <path
              d="M3.5,-34.5 L8.5,-37 L8.5,-32 Z M3.5,-34.5 L-1.5,-37 L-1.5,-32 Z"
              fill={L.accC}
            />
          ) : null}
          {L.acc === "clip" ? (
            <g>
              <circle cx={7.6} cy={-31.5} r={1.4} fill={L.accC} />
              <circle cx={9.4} cy={-30.5} r={1.4} fill={L.accC} />
              <circle cx={8.6} cy={-29} r={1.4} fill={L.accC} />
              <circle cx={8.5} cy={-30.4} r={0.8} fill="#FFF3B0" />
            </g>
          ) : null}
          {L.acc === "headband" ? (
            <path
              d="M-10.4,-28.6 Q0,-38.5 10.4,-28.6"
              stroke={L.accC}
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          {L.acc === "cap" ? (
            <g>
              <path d="M-10.6,-29 Q0,-41 10.6,-29 Z" fill={L.accC} />
              <path d="M-11,-29 L-15,-28.4 L-10.6,-27.6 Z" fill={L.accC} />
              <path
                d="M-10.6,-29 Q-4,-38 2,-39.6 Q-6,-35 -6,-29 Z"
                fill="#FFFFFF"
                opacity={0.2}
              />
            </g>
          ) : null}
          {L.acc === "propeller" ? (
            <g>
              <path d="M-10.4,-29.5 Q0,-40.5 10.4,-29.5 Z" fill="#FFF1B8" />
              <path
                d="M-10.4,-29.5 Q0,-40.5 0,-29.5 Z"
                fill={L.accC}
                opacity={0.85}
              />
              <line
                x1={0}
                y1={-35.2}
                x2={0}
                y2={-38.6}
                stroke="#8A6E5D"
                strokeWidth={0.8}
              />
              <ellipse cx={0} cy={-39} rx={5} ry={1.1} fill="#8FB8DE">
                {motion ? (
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1 1;0.2 1;1 1"
                    additive="sum"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                ) : null}
              </ellipse>
            </g>
          ) : null}
          {L.acc === "bolt" ? (
            <polygon
              points="5,-38 9,-38 6.6,-34.6 9.4,-34.6 4.4,-29.6 6.2,-33.2 3.6,-33.2"
              fill={L.accC}
              stroke="#C9962C"
              strokeWidth={0.4}
            />
          ) : null}
        </g>
        {face6(L, special)}
        {L.acc === "glasses" ? (
          <g fill="none" stroke={L.accC} strokeWidth={0.75}>
            <circle cx={-4} cy={-27.4} r={2.8} />
            <circle cx={4} cy={-27.4} r={2.8} />
            <line x1={-1.2} y1={-27.4} x2={1.2} y2={-27.4} />
          </g>
        ) : null}
        {chin ? (
          <g>
            <path
              d="M-3.6,-17.6 Q-3.8,-14.6 0,-13.4 Q3.8,-14.6 3.6,-17.6 Q1.8,-18.4 0,-17.6 Q-1.8,-18.4 -3.6,-17.6 Z"
              fill={SKIN}
              stroke={OLS}
              strokeWidth={0.4}
            />
            <path
              d="M0,-17.6 L0,-13.8"
              stroke={OLS}
              strokeWidth={0.35}
              fill="none"
            />
          </g>
        ) : null}
      </g>
    </g>
  );
}

const XU_LOOK: Look = {
  hair: HAIR_BLACK,
  hairStyle: "tousled",
  top: "apron",
  topC: TEE_BLACK,
  topC2: APRON,
  bottom: "pants",
  bottomC: "#4B4F5C",
  shoe: "#FFFFFF",
  acc: "",
  accC: "",
  mouth: "teeth",
  hands: "",
};
const ZENG_LOOK: Look = {
  hair: HAIR_BLACK,
  hairStyle: "fringe",
  top: "jacket",
  topC: TEE_BLACK,
  topC2: "#FFFFFF",
  bottom: "pants",
  bottomC: TEE_BLACK,
  shoe: "#FFFFFF",
  acc: "",
  accC: "",
  mouth: "teeth",
  hands: "chin",
};
const SHEN_LOOK: Look = {
  hair: HAIR_BLACK,
  hairStyle: "tousled",
  top: "suit",
  topC: "#22396B",
  topC2: "#7A1F2B",
  bottom: "pants",
  bottomC: "#22396B",
  shoe: "#2A2A2A",
  acc: "glasses",
  accC: "#2A2A2A",
  mouth: "smile",
  hands: "fist",
};
const JAY_LOOK: Look = {
  hair: HAIR_BLACK,
  hairStyle: "spiky",
  top: "blazer",
  topC: "#F1F1EE",
  topC2: "#1E1E22",
  bottom: "pants",
  bottomC: "#1E1E22",
  shoe: "#1E1E22",
  acc: "",
  accC: "",
  mouth: "",
  hands: "finger",
};
const MOM_LOOK: Look = {
  hair: "#7A5240",
  hairStyle: "mom",
  top: "cardigan",
  topC: "#F4C7B8",
  topC2: "#FFF6E5",
  bottom: "longskirt",
  bottomC: "#9CB8D6",
  shoe: "#C79A6B",
  acc: "",
  accC: "",
  mouth: "smile",
  hands: "",
};

// 應援卡半身像 v6：依參考插畫的漫畫風（乾淨線條、淺膚色），非照片
function idolPortrait(kind: number) {
  const xu = kind === 4;
  const sw = 0.8;
  if (xu) {
    return (
      <g>
        <circle cx={0} cy={-6} r={38} fill="#F1E6DA" />
        <rect
          x={-30}
          y={-40}
          width={16}
          height={22}
          rx={2}
          fill="#E9C9C0"
          opacity={0.7}
        />
        <rect
          x={16}
          y={-36}
          width={14}
          height={18}
          rx={2}
          fill="#D7E3CF"
          opacity={0.7}
        />
        <g transform="rotate(-5 0 30)">
          <path
            d="M-31,36 Q-31,14 -16,9 Q-8,6 -5,5 L5,5 Q8,6 16,9 Q31,14 31,36 Z"
            fill={TEE_BLACK}
            stroke={LINE}
            strokeWidth={sw}
          />
          <path
            d="M-22,22 Q-20,28 -21,35 M22,22 Q20,28 21,35"
            stroke="#45454B"
            strokeWidth={0.8}
            fill="none"
          />
          <path
            d="M-5.5,-2 L-5.5,7 Q0,10 5.5,7 L5.5,-2 Z"
            fill={SKIN}
            stroke={LINE}
            strokeWidth={0.7}
          />
          <path
            d="M-5.5,0.6 Q0,5 5.5,0.6 L5.5,-2 L-5.5,-2 Z"
            fill={FACE_SH}
            opacity={0.7}
          />
          <path
            d="M-7.4,5.4 Q0,11.4 7.4,5.4"
            stroke="#3C3C42"
            strokeWidth={2.2}
            fill="none"
          />
          <path
            d="M3,3 Q5.4,8 6,13 Q4,17 1.4,19"
            stroke={SILVER}
            strokeWidth={0.7}
            fill="none"
          />
          <path
            d="M-13,16 L13,16 L15.4,36 L-15.4,36 Z"
            fill={APRON}
            stroke={LINE}
            strokeWidth={0.7}
          />
          <path
            d="M-11.6,17.6 L11.6,17.6"
            stroke="#A9A090"
            strokeWidth={0.5}
            strokeDasharray="1 1"
          />
          <path
            d="M-12,16.6 L-17.4,6.6"
            stroke={STRAP}
            strokeWidth={3.4}
            strokeLinecap="round"
          />
          <path
            d="M12,16.6 L17.4,6.6"
            stroke={STRAP}
            strokeWidth={3.4}
            strokeLinecap="round"
          />
          <rect
            x={-17.6}
            y={9.4}
            width={3.6}
            height={3.2}
            rx={0.5}
            fill="none"
            stroke={BRASS}
            strokeWidth={0.9}
            transform="rotate(28 -15.8 11)"
          />
          <rect
            x={14}
            y={9.4}
            width={3.6}
            height={3.2}
            rx={0.5}
            fill="none"
            stroke={BRASS}
            strokeWidth={0.9}
            transform="rotate(-28 15.8 11)"
          />
          <circle
            cx={-12.2}
            cy={18.2}
            r={2}
            fill="none"
            stroke={BRASS}
            strokeWidth={1}
          />
          <circle
            cx={12.2}
            cy={18.2}
            r={2}
            fill="none"
            stroke={BRASS}
            strokeWidth={1}
          />
          <rect
            x={-10.4}
            y={22}
            width={11.4}
            height={9.4}
            rx={1}
            fill="#CBC3B3"
            stroke={LINE}
            strokeWidth={0.6}
          />
          <rect
            x={-8.4}
            y={17.8}
            width={1.7}
            height={7.6}
            rx={0.6}
            fill="#1E1E22"
          />
          <rect
            x={-6.2}
            y={18.4}
            width={1.7}
            height={7}
            rx={0.6}
            fill="#1E1E22"
          />
          <rect
            x={-3.8}
            y={25}
            width={4.2}
            height={5}
            rx={0.6}
            fill="#2F6DB5"
            stroke="#FFFFFF"
            strokeWidth={0.4}
          />
          <rect x={-3.8} y={25} width={4.2} height={1.5} fill="#D94A3A" />
          <ellipse
            cx={-13.4}
            cy={-9}
            rx={2.6}
            ry={4}
            fill={SKIN}
            stroke={LINE}
            strokeWidth={0.7}
          />
          <ellipse
            cx={13.6}
            cy={-9}
            rx={3}
            ry={4.4}
            fill={SKIN}
            stroke={LINE}
            strokeWidth={0.7}
          />
          <path
            d="M13.2,-11 Q14.8,-9 13.4,-6.6"
            stroke={FACE_SH}
            strokeWidth={0.8}
            fill="none"
          />
          <circle cx={14.3} cy={-5.2} r={0.9} fill="#3A3A40" />
          <path
            d="M-12.8,-14 C-13,-3 -9.6,5 -4.2,9.8 Q0,12.4 4.2,9.8 C9.6,5 13,-3 12.8,-14 C12.6,-27 -12.6,-27 -12.8,-14 Z"
            fill={SKIN}
            stroke={LINE}
            strokeWidth={sw}
          />
          <path
            d="M12.8,-14 C13,-3 9.6,5 4.2,9.8 Q8.2,2.4 9.6,-6 Q10.6,-12 12.8,-14 Z"
            fill={FACE_SH}
            opacity={0.5}
          />
          <path
            d="M-14.9,-13 Q-15.8,-15 -15.7,-16.5 Q-15.5,-18 -16.9,-19.5 Q-18.3,-21 -17.5,-22.5 Q-16.5,-24 -17.3,-25.6 Q-18,-27.2 -16.1,-27.8 Q-14.1,-28.5 -14.3,-30 Q-14.5,-31.5 -12.4,-31.4 Q-10.3,-31.2 -9.9,-32.8 Q-9.5,-34.4 -7.5,-33.6 Q-5.5,-32.8 -4.4,-34.2 Q-3.3,-35.7 -1.6,-34.5 Q0,-33.3 1.6,-34.4 Q3.3,-35.5 4.2,-34.2 Q5.1,-32.8 7.2,-33.6 Q9.2,-34.4 9.5,-32.8 Q9.7,-31.2 11.8,-31.6 Q13.9,-32 13.5,-30.4 Q13.2,-28.8 15.2,-28.4 Q17.2,-28 16.5,-26.6 Q15.8,-25.3 17.1,-24.2 Q18.3,-23 17.2,-21.5 Q15.9,-20 15.9,-18 Q15.8,-16 14.9,-14 Q14.4,-12 13.5,-13.5 Q12.8,-15 11.8,-12.8 Q11,-10.6 10.6,-13.1 Q10.4,-15.6 8.8,-12.9 Q7.4,-10.2 7.2,-13 Q7.2,-15.8 5.5,-13.2 Q4,-10.6 3.9,-13.3 Q3.9,-16 2.2,-13.4 Q0.6,-10.8 0.3,-13.5 Q0,-16.2 -1.6,-13.7 Q-3.2,-11.2 -3.4,-13.6 Q-3.7,-16 -5.3,-13.7 Q-7,-11.4 -7.2,-13.5 Q-7.5,-15.6 -9,-13.6 Q-10.6,-11.6 -10.8,-13.3 Q-11.1,-15 -12.2,-13.1 Q-13.4,-11.2 -13.8,-11.1 Q-14.2,-11 -14.9,-13 Z"
            fill={HAIR_BLACK}
            stroke={LINE}
            strokeWidth={0.5}
            strokeLinejoin="round"
          />
          <path
            d="M9,-31 Q6,-22 -1,-17 M3,-32 Q-1,-25 -6,-17 M14,-27 Q11,-20 5,-15 M-5,-31 Q-10,-26 -11,-17 M16,-21 Q13,-16 10,-14 M-13,-26 Q-16,-22 -15,-16 M-1,-29 Q-4,-24 -3,-20"
            stroke="#5A5458"
            strokeWidth={0.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M4,-34 Q1,-29 -2,-24 M10,-30 Q8,-26 6,-22"
            stroke="#FFFFFF"
            strokeWidth={0.5}
            opacity={0.35}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-10.6,-9.4 L-3.4,-10.4 L-3.2,-9.2 L-10.4,-8.2 Z"
            fill={HAIR_BLACK}
          />
          <path
            d="M10.6,-9.4 L3.4,-10.4 L3.2,-9.2 L10.4,-8.2 Z"
            fill={HAIR_BLACK}
          />
          <path
            d="M-10.4,-4.6 Q-6.8,-7.8 -3,-5 Q-6.8,-2.8 -10.4,-4.6 Z"
            fill="#FFFFFF"
          />
          <path
            d="M10.4,-4.6 Q6.8,-7.8 3,-5 Q6.8,-2.8 10.4,-4.6 Z"
            fill="#FFFFFF"
          />
          <circle cx={-6.6} cy={-5} r={2.05} fill="#4A3226" />
          <circle cx={6.6} cy={-5} r={2.05} fill="#4A3226" />
          <circle cx={-6} cy={-5.7} r={0.6} fill="#FFFFFF" />
          <circle cx={7.2} cy={-5.7} r={0.6} fill="#FFFFFF" />
          <path
            d="M-10.8,-4.4 Q-6.8,-8.2 -2.8,-5"
            stroke={LINE}
            strokeWidth={1.15}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M10.8,-4.4 Q6.8,-8.2 2.8,-5"
            stroke={LINE}
            strokeWidth={1.15}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-9.8,-6.8 Q-6.6,-8.8 -3.8,-6.8 M9.8,-6.8 Q6.6,-8.8 3.8,-6.8"
            stroke="#C08B74"
            strokeWidth={0.5}
            fill="none"
          />
          <path
            d="M0.6,-3 L-0.8,2 Q0.4,2.8 1.8,2.2"
            stroke="#C08B74"
            strokeWidth={0.7}
            fill="none"
          />
          <path
            d="M-4,5.4 Q0,6.6 4.2,5.2 Q3,8.4 0,8.6 Q-3,8.4 -4,5.4 Z"
            fill="#B9524E"
            stroke={LINE}
            strokeWidth={0.6}
          />
          <path
            d="M-3.6,5.7 Q0,6.8 3.8,5.5 L3.2,6.6 Q0,7.4 -3.1,6.7 Z"
            fill="#FFFFFF"
          />
          <ellipse
            cx={-8}
            cy={1}
            rx={2.6}
            ry={1.3}
            fill="#FF9AA8"
            opacity={0.4}
          />
          <ellipse
            cx={8}
            cy={1}
            rx={2.6}
            ry={1.3}
            fill="#FF9AA8"
            opacity={0.4}
          />
        </g>
      </g>
    );
  }
  return (
    <g>
      <circle cx={0} cy={-6} r={38} fill="#DCEBF2" />
      <path
        d="M-14,-44 L-14,4 M12,-44 L12,4 M-40,-20 L40,-20"
        stroke="#FFFFFF"
        strokeWidth={1.8}
      />
      <circle cx={26} cy={-30} r={7} fill="#B9D3A8" />
      <rect x={-40} y={2} width={80} height={36} rx={8} fill="#8F9196" />
      <rect x={-36} y={-3} width={30} height={16} rx={6} fill="#9C9EA3" />
      <rect x={6} y={-3} width={30} height={16} rx={6} fill="#9C9EA3" />
      <path
        d="M-32,36 Q-32,12 -16,8 Q-8,6 -5,5 L5,5 Q8,6 16,8 Q32,12 32,36 Z"
        fill={TEE_BLACK}
        stroke={LINE}
        strokeWidth={sw}
      />
      <polygon points="-8,5 8,5 7,36 -7,36" fill="#FFFFFF" />
      {[9, 12, 15, 18, 21, 24, 27, 30, 33].map((yy: number) => (
        <line
          key={yy}
          x1={-7.6}
          y1={yy}
          x2={7.6}
          y2={yy}
          stroke={TEE_BLACK}
          strokeWidth={1.4}
        />
      ))}
      <path
        d="M-8.4,4.6 L-6.4,16 L-10.4,9 Z M8.4,4.6 L6.4,16 L10.4,9 Z"
        fill="#3A3A40"
      />
      {[22, 30].map((yy: number) => (
        <g key={yy}>
          <circle
            cx={-9.6}
            cy={yy}
            r={1}
            fill={SILVER}
            stroke="#8A9099"
            strokeWidth={0.4}
          />
          <circle
            cx={9.6}
            cy={yy}
            r={1}
            fill={SILVER}
            stroke="#8A9099"
            strokeWidth={0.4}
          />
        </g>
      ))}
      <path
        d="M-5.5,-2 L-5.5,7 Q0,10 5.5,7 L5.5,-2 Z"
        fill={SKIN}
        stroke={LINE}
        strokeWidth={0.7}
      />
      <path
        d="M-5.5,0.6 Q0,5 5.5,0.6 L5.5,-2 L-5.5,-2 Z"
        fill={FACE_SH}
        opacity={0.7}
      />

      <ellipse
        cx={-14.6}
        cy={-8}
        rx={3}
        ry={4.4}
        fill={SKIN}
        stroke={LINE}
        strokeWidth={0.7}
      />
      <ellipse
        cx={14.6}
        cy={-8}
        rx={3}
        ry={4.4}
        fill={SKIN}
        stroke={LINE}
        strokeWidth={0.7}
      />
      <path
        d="M-14.4,-14 C-14.6,-3 -10.6,5 -5,9 Q0,11.6 5,9 C10.6,5 14.6,-3 14.4,-14 C14.2,-28 -14.2,-28 -14.4,-14 Z"
        fill={SKIN}
        stroke={LINE}
        strokeWidth={sw}
      />
      <path
        d="M14.4,-14 C14.6,-3 10.6,5 5,9 Q9.4,2 10.8,-6 Q11.8,-12 14.4,-14 Z"
        fill={FACE_SH}
        opacity={0.45}
      />
      <path
        d="M-15.6,-12 Q-16.2,-14 -15.9,-15.5 Q-15.7,-17 -16.6,-19 Q-17.5,-21 -16.6,-22.8 Q-15.5,-24.5 -15.8,-25.9 Q-16,-27.4 -14.1,-28.1 Q-12.2,-28.8 -11.9,-30.1 Q-11.6,-31.4 -9.6,-31.2 Q-7.6,-31 -6.3,-32 Q-5,-33 -3.3,-32.3 Q-1.5,-31.7 0.2,-32.4 Q1.9,-33.1 3.3,-32.3 Q4.6,-31.5 6.4,-31.8 Q8.2,-32.2 8.8,-31 Q9.4,-29.9 11.2,-29.8 Q13,-29.6 13.3,-28.2 Q13.7,-26.9 15.1,-26.1 Q16.6,-25.3 16.1,-23.8 Q15.5,-22 16.2,-20 Q16.8,-18 15.9,-16.3 Q15.1,-14.6 15,-12.3 Q15,-10 14.2,-12.2 Q13.4,-14.4 12.6,-13.5 Q11.8,-12.6 11.4,-15 Q11,-17.4 9.7,-15.4 Q8.4,-13.4 7.9,-15.7 Q7.4,-18 6,-16 Q4.6,-14 4,-16.2 Q3.5,-18.4 2.2,-16.3 Q1,-14.2 0.2,-16.4 Q-0.6,-18.6 -1.8,-16.5 Q-3,-14.4 -3.9,-16.4 Q-4.7,-18.4 -5.9,-16.2 Q-7,-14 -7.8,-15.8 Q-8.6,-17.6 -9.6,-15.6 Q-10.6,-13.6 -11.4,-14.8 Q-12.2,-16 -12.8,-14.1 Q-13.6,-12.2 -14.3,-11.1 Q-15,-10 -15.6,-12 Z"
        fill={HAIR_BLACK}
        stroke={LINE}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <path
        d="M-6,-29 Q-8,-23 -7.6,-17 M0,-30 Q1.4,-24 0.2,-17.8 M6,-29 Q8,-23 6.4,-17 M12,-25 Q13,-20 11.6,-15.6"
        stroke="#5A5458"
        strokeWidth={0.6}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-11.6,-9.8 Q-7.6,-12.2 -3,-10.4 L-3.2,-8.8 Q-7.6,-10.4 -11.4,-8.2 Z"
        fill={HAIR_BLACK}
      />
      <path
        d="M11.6,-9.8 Q7.6,-12.2 3,-10.4 L3.2,-8.8 Q7.6,-10.4 11.4,-8.2 Z"
        fill={HAIR_BLACK}
      />
      <path
        d="M-10,-4.6 Q-6.6,-8 -3.2,-4.6 Q-6.6,-3.4 -10,-4.6 Z"
        fill="#FFFFFF"
      />
      <path d="M10,-4.6 Q6.6,-8 3.2,-4.6 Q6.6,-3.4 10,-4.6 Z" fill="#FFFFFF" />
      <circle cx={-6.4} cy={-5.1} r={1.45} fill="#3A2622" />
      <circle cx={6.4} cy={-5.1} r={1.45} fill="#3A2622" />
      <circle cx={-5.9} cy={-5.6} r={0.45} fill="#FFFFFF" />
      <circle cx={6.9} cy={-5.6} r={0.45} fill="#FFFFFF" />
      <path
        d="M-10.4,-4.4 Q-6.6,-8.2 -2.8,-4.4"
        stroke={LINE}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10.4,-4.4 Q6.6,-8.2 2.8,-4.4"
        stroke={LINE}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-9.2,-3.4 Q-6.6,-2.2 -4,-3.4 M9.2,-3.4 Q6.6,-2.2 4,-3.4"
        stroke="#C08B74"
        strokeWidth={0.6}
        fill="none"
      />
      <path
        d="M0.4,-2.6 L-1.2,2.4 Q0.4,3.4 2,2.6"
        stroke="#C08B74"
        strokeWidth={0.7}
        fill="none"
      />
      <path
        d="M-5.8,4 Q0,5.8 5.8,4 Q4.2,9 0,9.2 Q-4.2,9 -5.8,4 Z"
        fill="#B9524E"
        stroke={LINE}
        strokeWidth={0.6}
      />
      <path
        d="M-5.3,4.4 Q0,6.2 5.3,4.4 L4.6,6.4 Q0,7.6 -4.6,6.4 Z"
        fill="#FFFFFF"
      />
      <path
        d="M-9.4,3 Q-8.6,5.6 -7,6.8 M9.4,3 Q8.6,5.6 7,6.8"
        stroke="#C08B74"
        strokeWidth={0.6}
        fill="none"
      />
      <circle cx={9.8} cy={1.4} r={0.45} fill="#6B4A3A" />
      <ellipse
        cx={-8.6}
        cy={0.6}
        rx={2.6}
        ry={1.3}
        fill="#FF9AA8"
        opacity={0.4}
      />
      <ellipse
        cx={8.6}
        cy={0.6}
        rx={2.6}
        ry={1.3}
        fill="#FF9AA8"
        opacity={0.4}
      />
      <path
        d="M-24,46 Q-18,34 -6.4,24.6"
        stroke={TEE_BLACK}
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24,46 Q18,34 6.4,24.6"
        stroke={TEE_BLACK}
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-24,46 Q-18,34 -6.4,24.6"
        stroke="#FFFFFF"
        strokeWidth={0.5}
        opacity={0.25}
        fill="none"
      />
      <path
        d="M-10.6,28 L-6.4,24.4"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M-10.6,28 L-6.4,24.4"
        stroke={TEE_BLACK}
        strokeWidth={5}
        strokeDasharray="0.9 0.9"
      />
      <path
        d="M10.6,28 L6.4,24.4"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M10.6,28 L6.4,24.4"
        stroke={TEE_BLACK}
        strokeWidth={5}
        strokeDasharray="0.9 0.9"
      />
      <path
        d="M0,11.2 Q-2.6,10.2 -5,11.6 Q-7.4,13.4 -7.2,17.6 Q-7,21.4 -4.4,23.6 L0,24.2 Z"
        fill={SKIN}
        stroke={LINE}
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      <path
        d="M0,11.2 Q2.6,10.2 5,11.6 Q7.4,13.4 7.2,17.6 Q7,21.4 4.4,23.6 L0,24.2 Z"
        fill={SKIN}
        stroke={LINE}
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      <path
        d="M-1.8,10.8 L-1.8,14.6 M-3.6,11 L-3.6,14.2 M-5.4,11.8 L-5.4,14.6 M1.8,10.8 L1.8,14.6 M3.6,11 L3.6,14.2 M5.4,11.8 L5.4,14.6"
        stroke="#C08B74"
        strokeWidth={0.55}
        strokeLinecap="round"
      />
      <path
        d="M-0.8,16 Q-2.8,18.6 -2.4,21.6 M0.8,16 Q2.8,18.6 2.4,21.6"
        stroke="#C08B74"
        strokeWidth={0.6}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M0,11.4 L0,24" stroke={LINE} strokeWidth={0.5} />
    </g>
  );
}

// 島上細節：低面數樹叢、長椅、花盆（拉近時看得到）
const LP_F = [1.22, 1.12, 0.98, 0.84, 0.78, 0.9, 1.04, 1.16];
function lpBlob(cx: number, cy: number, rx: number, ry: number, c: string) {
  const pts: Pt[] = Array.from({ length: 8 }).map((_: unknown, i: number) => {
    const a = (Math.PI * 2 * i) / 8 - (Math.PI * 5) / 8;
    const j = i % 2 ? 0.9 : 1;
    return [cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j];
  });
  const ctr: Pt = [cx - rx * 0.15, cy - ry * 0.2];
  return (
    <g>
      {pts.map((p: Pt, i: number) => {
        const q = pts[(i + 1) % 8];
        const f = shade(c, LP_F[i]);
        return (
          <polygon
            key={i}
            points={`${ctr[0]},${ctr[1]} ${p[0]},${p[1]} ${q[0]},${q[1]}`}
            fill={f}
            stroke={f}
            strokeWidth={0.4}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}
function bench(x: number, y: number, k: string) {
  return (
    <g key={k} transform={`translate(${x},${y})`}>
      <ellipse cx={1} cy={1.5} rx={9} ry={2.4} fill="#3D4A3A" opacity={0.15} />
      <rect x={-6.5} y={-3.2} width={1.4} height={4} fill="#6E5A4A" />
      <rect x={5.1} y={-3.2} width={1.4} height={4} fill="#6E5A4A" />
      <polygon points="-8,-4.6 8,-4.6 9,-3 -7,-3" fill="#D9A86C" />
      <polygon points="-7,-3 9,-3 9,-2 -7,-2" fill="#B9874F" />
      <polygon points="-8,-9 8,-9 8,-6.6 -8,-6.6" fill="#C9965C" />
      <rect x={-7.4} y={-6.6} width={1} height={2} fill="#6E5A4A" />
      <rect x={6.4} y={-6.6} width={1} height={2} fill="#6E5A4A" />
    </g>
  );
}
function planter(x: number, y: number, k: string, v: number) {
  const c = ["#C9764F", "#D9C7A7", "#8FA6A0"][v % 3];
  return (
    <g key={k} transform={`translate(${x},${y})`}>
      <ellipse cx={1} cy={1.6} rx={8} ry={2.4} fill="#3D4A3A" opacity={0.15} />
      <polygon points="-6,-6 0,-9 6,-6 0,-3" fill={shade(c, 1.15)} />
      <polygon points="-6,-6 0,-3 0,2 -6,-1" fill={c} />
      <polygon points="0,-3 6,-6 6,-1 0,2" fill={shade(c, 0.82)} />
      {lpBlob(0, -10, 6, 5, "#8FA37C")}
    </g>
  );
}

function chibi(kind: number, seed: number, motion: boolean, dancing: boolean) {
  const sw = 0.6;
  const legA = motion && !dancing ? "gi-legA" : undefined;
  const legB = motion && !dancing ? "gi-legB" : undefined;
  const armA = motion ? "gi-armA" : undefined;
  const armB = motion ? "gi-armB" : undefined;
  const cls = dancing ? "gi-dance" : motion ? "gi-step" : undefined;
  if (kind === 14) return <g className={cls}>{lion(motion, dancing)}</g>;
  if (kind === 15)
    return (
      <g className={cls} transform="scale(0.84)">
        {figure(LOOKS[15], motion, dancing, "")}
      </g>
    );
  if (kind === 4)
    return <g className={cls}>{figure(XU_LOOK, motion, dancing, "xu")}</g>;
  if (kind === 5)
    return <g className={cls}>{figure(ZENG_LOOK, motion, dancing, "zeng")}</g>;
  if (kind === 13)
    return <g className={cls}>{figure(MOM_LOOK, motion, dancing, "mom")}</g>;
  if (kind === 16)
    return <g className={cls}>{figure(SHEN_LOOK, motion, dancing, "shen")}</g>;
  if (kind === 17)
    return <g className={cls}>{figure(JAY_LOOK, motion, dancing, "jay")}</g>;
  if (kind === 18)
    return <g className={cls}>{figure(LOOKS[18], motion, dancing, "goal")}</g>;
  if (LOOKS[kind])
    return <g className={cls}>{figure(LOOKS[kind], motion, dancing, "")}</g>;
  if (kind === 1) {
    const fur = "#C99A6E";
    return (
      <g className={cls}>
        <ellipse
          cx={0}
          cy={0.5}
          rx={8}
          ry={2.4}
          fill="#2D3A36"
          opacity={0.16}
        />
        <g className={motion ? "gi-tail" : undefined}>
          <path
            d="M5,-5 Q13,-6 12,-13 Q9,-8 5,-8 Z"
            fill={shade(fur, 0.9)}
            stroke={OLS}
            strokeWidth={sw}
          />
        </g>
        <rect
          x={-4.5}
          y={-4}
          width={3.4}
          height={4}
          rx={1.7}
          fill={shade(fur, 0.9)}
          className={legA}
        />
        <rect
          x={1.1}
          y={-4}
          width={3.4}
          height={4}
          rx={1.7}
          fill={shade(fur, 0.9)}
          className={legB}
        />
        <ellipse
          cx={0}
          cy={-9}
          rx={7.5}
          ry={7}
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
        />
        <ellipse cx={0} cy={-8} rx={4.6} ry={4.6} fill="#FBEBD8" />
        <rect
          x={-9.5}
          y={-13}
          width={3}
          height={6}
          rx={1.5}
          fill={fur}
          stroke={OLS}
          strokeWidth={0.5}
          className={armA}
        />
        <rect
          x={6.5}
          y={-13}
          width={3}
          height={6}
          rx={1.5}
          fill={fur}
          stroke={OLS}
          strokeWidth={0.5}
          className={armB}
        />
        <circle
          cx={-7.6}
          cy={-27}
          r={2.8}
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
        />
        <circle
          cx={7.6}
          cy={-27}
          r={2.8}
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
        />
        <circle
          cx={0}
          cy={-21}
          r={10}
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
        />
        <ellipse cx={0} cy={-18} rx={6.4} ry={5} fill="#FBEBD8" />
        <ellipse cx={-3.6} cy={-22.5} rx={1.25} ry={1.6} fill={EYE} />
        <ellipse cx={3.6} cy={-22.5} rx={1.25} ry={1.6} fill={EYE} />
        <circle cx={-3.2} cy={-23.1} r={0.5} fill="#FFFFFF" />
        <circle cx={4} cy={-23.1} r={0.5} fill="#FFFFFF" />
        <ellipse cx={0} cy={-19.4} rx={1.5} ry={1} fill={EYE} />
        <path
          d="M-1.8,-17.6 Q-0.9,-16.6 0,-17.6 Q0.9,-16.6 1.8,-17.6"
          stroke="#B5615A"
          strokeWidth={0.6}
          fill="none"
        />
        <ellipse
          cx={-6.2}
          cy={-18.6}
          rx={1.9}
          ry={1.1}
          fill="#FF9AA8"
          opacity={0.75}
        />
        <ellipse
          cx={6.2}
          cy={-18.6}
          rx={1.9}
          ry={1.1}
          fill="#FF9AA8"
          opacity={0.75}
        />
      </g>
    );
  }
  if (kind === 2) {
    const fur = "#F7C08E";
    return (
      <g className={cls}>
        <ellipse
          cx={0}
          cy={0.5}
          rx={7}
          ry={2.2}
          fill="#2D3A36"
          opacity={0.16}
        />
        <g className={motion ? "gi-tail" : undefined}>
          <path
            d="M5,-4 Q12,-6 10,-15"
            stroke={fur}
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <rect
          x={-4}
          y={-4}
          width={3}
          height={4}
          rx={1.5}
          fill={fur}
          className={legA}
        />
        <rect
          x={1}
          y={-4}
          width={3}
          height={4}
          rx={1.5}
          fill={fur}
          className={legB}
        />
        <ellipse
          cx={0}
          cy={-7}
          rx={6}
          ry={5}
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
        />
        <polygon
          points="-7.5,-19 -6.5,-27 -2,-21"
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <polygon
          points="7.5,-19 6.5,-27 2,-21"
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <circle
          cx={0}
          cy={-16}
          r={8}
          fill={fur}
          stroke={OLS}
          strokeWidth={sw}
        />
        <path
          d="M-2,-23.5 L-2,-20.5 M0,-24 L0,-21 M2,-23.5 L2,-20.5"
          stroke={shade(fur, 0.8)}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <ellipse cx={-2.8} cy={-16} rx={1} ry={1.3} fill={EYE} />
        <ellipse cx={2.8} cy={-16} rx={1} ry={1.3} fill={EYE} />
        <path
          d="M-1.2,-13.4 Q0,-12.4 1.2,-13.4"
          stroke="#B5615A"
          strokeWidth={0.6}
          fill="none"
        />
        <ellipse
          cx={-5}
          cy={-13.4}
          rx={1.5}
          ry={0.9}
          fill="#FF9AA8"
          opacity={0.75}
        />
        <ellipse
          cx={5}
          cy={-13.4}
          rx={1.5}
          ry={0.9}
          fill="#FF9AA8"
          opacity={0.75}
        />
      </g>
    );
  }
  if (kind === 3) {
    return (
      <g className={cls}>
        <ellipse
          cx={0}
          cy={0.5}
          rx={5.5}
          ry={1.8}
          fill="#2D3A36"
          opacity={0.16}
        />
        <line
          x1={-2}
          y1={-3}
          x2={-2}
          y2={0}
          stroke="#E08A3A"
          strokeWidth={1.2}
          className={legA}
        />
        <line
          x1={2}
          y1={-3}
          x2={2}
          y2={0}
          stroke="#E08A3A"
          strokeWidth={1.2}
          className={legB}
        />
        <circle
          cx={0}
          cy={-8}
          r={6.5}
          fill="#F9DE6E"
          stroke={OLS}
          strokeWidth={sw}
        />
        <g className={motion ? "gi-wing" : undefined}>
          <ellipse
            cx={-5.5}
            cy={-7.5}
            rx={2.5}
            ry={3.5}
            fill="#F2CF4E"
            stroke={OLS}
            strokeWidth={0.5}
          />
        </g>
        <path
          d="M-1,-15 Q0,-18 1.5,-15"
          stroke={OLS}
          strokeWidth={0.8}
          fill="none"
        />
        <circle cx={-2.2} cy={-9.5} r={0.9} fill={EYE} />
        <circle cx={2.2} cy={-9.5} r={0.9} fill={EYE} />
        <polygon points="-1.3,-7.8 1.3,-7.8 0,-6" fill="#E08A3A" />
        <ellipse
          cx={-3.8}
          cy={-7}
          rx={1.3}
          ry={0.8}
          fill="#FF9AA8"
          opacity={0.75}
        />
        <ellipse
          cx={3.8}
          cy={-7}
          rx={1.3}
          ry={0.8}
          fill="#FF9AA8"
          opacity={0.75}
        />
      </g>
    );
  }
  return (
    <g className={cls}>{figure(studentLook(seed), motion, dancing, "")}</g>
  );
}

// 固定角色與台詞（原創角色；台詞是角色說的話，不代表任何真人）
// 目標學校：只改這一個常數就能換校名
const GOAL_SCHOOL = "竹北高中";
interface Crew {
  name: string;
  kind: number;
  island: string;
  delay: number;
  lines: string[];
}
// 各島的動物島民（原創角色）
interface Ani {
  kind: number;
  name: string;
  type: string;
  island: string;
  sound: string;
  lines: string[];
}
const ANIMALS: Ani[] = [
  {
    kind: 25,
    name: "墨墨",
    type: "貓頭鷹",
    island: "chi",
    sound: "咕咕～",
    lines: [
      "咕咕～夜深了，背完這首詩就去睡。",
      "我讀了一整晚的唐詩，眼睛還是圓滾滾的！",
      "咕～國文多讀幾遍，意思就會自己飛出來。",
    ],
  },
  {
    kind: 20,
    name: "邦妮",
    type: "兔兔",
    island: "eng",
    sound: "蹦蹦！",
    lines: [
      "Hop hop! 一天背十個單字，蹦一下就到了！",
      "兔兔耳朵很長，所以聽力考試都聽得很清楚～",
      "蹦！讀完這頁我們一起吃紅蘿蔔。",
    ],
  },
  {
    kind: 23,
    name: "小柴",
    type: "柴犬",
    island: "math",
    sound: "汪！",
    lines: [
      "汪！這題我算過了，答案是……汪汪？",
      "尾巴轉一圈是 360 度，汪！",
      "陪妳寫完這張考卷，我再去追球！",
    ],
  },
  {
    kind: 22,
    name: "浣浣",
    type: "浣熊",
    island: "bio",
    sound: "嘰嘰！",
    lines: [
      "我戴著面罩，是讀書界的蒙面俠！",
      "洗手洗乾淨再吃點心，這是浣熊的好習慣喔。",
      "嘰嘰～我的尾巴一圈一圈，像年輪一樣慢慢長大。",
    ],
  },
  {
    kind: 26,
    name: "刺刺",
    type: "刺蝟",
    island: "phy",
    sound: "噗噗～",
    lines: [
      "我身上的刺很多，但我的心很軟喔。",
      "做實驗要小心，像我縮成一顆球一樣安全！",
      "噗～摩擦起電的時候，我的刺會一起豎起來！",
    ],
  },
  {
    kind: 21,
    name: "企企",
    type: "企鵝",
    island: "earth",
    sound: "嘎嘎！",
    lines: [
      "我從南極來看星星，這裡的星空也好美！",
      "嘎嘎～地球自轉一圈是一天，我轉一圈會頭暈。",
      "慢慢走也會到，企鵝都是這樣走到終點的！",
    ],
  },
  {
    kind: 21,
    name: "阿冰",
    type: "企鵝",
    island: "geo",
    sound: "嘎！",
    lines: [
      "我是氣候觀測員，今天沒有下雪，可惜。",
      "嘎！寒流來了要多穿一件，讀書也要保暖。",
      "南極很冷，但大家一起讀書就很溫暖。",
    ],
  },
  {
    kind: 27,
    name: "老夫子",
    type: "貓頭鷹",
    island: "his",
    sound: "咕～",
    lines: [
      "咕～以史為鏡，可以知興替。",
      "我戴著方帽，是歷史島的老學究！",
      "年代背不起來？編成故事就好記了，咕。",
    ],
  },
  {
    kind: 24,
    name: "獺獺",
    type: "水獺",
    island: "civ",
    sound: "吱吱！",
    lines: [
      "吱吱～水獺手牽手才不會漂走，就像大家一起讀書！",
      "各位鄉親，我宣布：讀書累了可以抱一下水獺！",
      "民主就是大家一起決定，今天先讀數學好不好？",
    ],
  },
];
const CREW: Crew[] = [
  {
    name: "心知肚明",
    kind: 10,
    island: "chi",
    delay: 3,
    lines: [
      "欸妳又在數學課點頭了，是聽懂還是在打瞌睡？我心知肚明喔。",
      "珮瑜說她昨天讀到兩點，結果是在看排球比賽重播，笑死。",
      "妳的錯題本比我的還厚，代表妳挖到的寶比較多啦，羨慕。",
      "映桐的筆記超美，但一頁只寫三個字，這樣要畫到會考喔？",
      "不要再說「我數學很爛」了，上次那題妳比我先解出來欸。",
      "下課先別衝福利社，背完五個單字再去，我幫妳顧位子……顧泡麵。",
      "妳睡著的時候筆還握很緊，連夢裡都在寫題目，有夠敬業。",
      "我心知肚明妳手機藏在課本下面，給妳五分鐘，然後專心喔。",
      "珮瑜跑八百都不喘，背公式就喘，到底？",
      "妳說要讀三小時，結果整理桌子整理了一小時，桌子都比妳認真。",
      "這題錯沒關係啦，會考那天它就騙不了妳了。",
      "會考完我們三個去吃到飽，前提是妳數學要贏我。",
      "說真的，妳最近進步超多，只是我嘴巴不想承認而已。",
    ],
  },
  {
    name: "王珮瑜",
    kind: 11,
    island: "eng",
    delay: 8,
    lines: [
      "欸起來！數學課不是午休啦！",
      "妳寫數學的速度跟我跑最後一圈一樣，慢歸慢，但是一定會到終點！",
      "肚明又在那邊「我心知肚明」，明明上次考卷他也錯一樣的題目。",
      "映桐，妳畫的細胞好可愛，可惜考卷不考可愛度啦。",
      "讀完這一節我請妳喝飲料，半糖少冰，不要跟我盧全糖。",
      "妳說妳不會？上次自然小考妳偷偷考贏我，我記仇到現在喔。",
      "我背單字背到睡著，夢到單字追著我跑，妳也要一起被追才公平。",
      "倒數三秒專心！三、二……欸妳不要偷吃餅乾啦！",
      "給妳擊個掌！雖然剛剛那題算錯，但算式寫得超漂亮。",
      "我們三個臭皮匠，合起來至少有半個諸葛亮吧？",
      "肚明說要教我們理化，結果講到一半自己卡住，好啦至少很勇敢。",
      "累了就站起來伸展，不要整個人黏在桌上變成桌子的一部分。",
      "會考那天我在考場門口幫妳加油，大聲到被老師叫我閉嘴那種！",
    ],
  },
  {
    name: "劉映桐",
    kind: 12,
    island: "bio",
    delay: 5,
    lines: [
      "我把妳上課打瞌睡畫成四格漫畫了：點頭、點頭、撞桌子、驚醒，哈哈。",
      "妳的數學筆記好像抽象畫，我看不懂，但我相信妳看得懂……吧？",
      "珮瑜又在喊衝啊，拜託是衝圖書館，不是衝福利社好嗎。",
      "肚明的筆記黑白的超無聊，借妳我的螢光筆，重點會自己發光。",
      "妳每次說「最後一包餅乾」，我已經數到第三個最後一包了。",
      "幫妳把畢氏定理畫成一隻貓，牠叫 a²＋b²＝c²，不准忘記牠。",
      "我色筆帶太多被老師唸，但至少我的筆記漂亮到妳會想讀啊。",
      "妳上課睡著還說夢話「答案是 C」，結果真的是 C，太神了吧。",
      "珮瑜背單字用跑的，我用畫的，妳用睡的……開玩笑啦，妳最認真。",
      "妳卡關的時候好像在跟題目吵架，加油，吵贏它！",
      "我們讀書會：一個畫畫、一個喊口號、一個講冷知識，只有妳負責把我們拉回來。",
      "肚明說他什麼都心知肚明，那他怎麼不知道福利社今天沒有布丁？",
      "等會考完，我要幫我們三個畫一張畢業合照，妳要笑得比考卷分數還燦爛。",
    ],
  },
  {
    name: "蔡小雷",
    kind: 13,
    island: "earth",
    delay: 7,
    lines: [
      "畫起來，這個會考！媽媽幫你把重點圈好了。",
      "全彌陀都喜歡我，可是媽媽最喜歡的是認真的你。",
      "我煮的菜真好吃！吃飽了再讀，頭腦才會轉。",
      "我要走一萬步！你也起來動一動，走完再讀更有精神。",
      "畫起來，這個會考",
      "全彌陀都喜歡我",
      "我煮的菜真好吃",
      "我要走一萬步",
      "水有沒有喝？媽媽切了芭樂放桌上，記得吃喔。",
      "你今天好認真，媽媽都看在眼裡，好驕傲喔！",
      "考不好也沒關係，回家媽媽煮你最愛吃的。我煮的菜真好吃，吃了就有力氣。",
      "肚子餓了吧？媽媽燉了雞湯，喝完再拚。",
      "這題老師上課有講吧？畫起來，這個會考，畫完就記住一半了。",
      "媽媽買菜的時候，菜市場的阿姨都說你很乖。全彌陀都喜歡我，也都喜歡你啦！",
      "讀書讀累了，陪媽媽去散步：我要走一萬步，你走五千步就好。",
      "十一點了喔，再讀下去明天會沒精神，快去睡。",
      "累了就來給媽媽抱一下，充完電再繼續。",
      "不要跟別人比啦，跟昨天的自己比就好。",
      "考前一天不要熬夜，早餐要吃，准考證先放好！",
      "媽媽去拜過文昌帝君了，剩下的就靠你自己囉，加油！",
    ],
  },
  {
    name: "詹姆獅",
    kind: 14,
    island: "loop",
    delay: 0,
    lines: [
      "哈囉我～鉛筆姓什麼？姓蕭，因為每天都被削。你每天都在變尖、變厲害，爸爸看得到，顆顆呵呵啾咪！",
      "考前要吃什麼？粽子，包中！但爸爸覺得你已經很棒了，顆顆呵呵啾咪。",
      "哈囉我！氧跟鉀去約會，結果怎麼樣？O K 啦！你也一定 OK，爸爸挺你，顆顆呵呵啾咪～",
      "哪個數字最勤勞？二，因為一不做，二不休！你比二還勤勞，休息一下也沒關係喔，顆顆呵呵啾咪。",
      "哈囉我～哪個英文字母最多水？C，因為它是 sea！你的努力也像海一樣多，爸爸好驕傲，顆顆呵呵啾咪！",
      "鳳梨為什麼是考生的好朋友？因為台語叫旺來！爸爸祝你旺旺旺，考場上穩穩的，顆顆呵呵啾咪。",
      "布跟紙怕什麼？布怕一萬，紙怕萬一！多練習就不怕萬一，爸爸陪你一起練。",
      "哈囉我！冰塊最想做什麼？退伍，因為它當冰當太久了。你也快退伍了，再撐一下，爸爸在終點等你，顆顆呵呵啾咪～",
      "斑馬為什麼不怕考試？因為牠全身都畫好重點了。你的重點也畫好了，相信自己。",
      "哈囉我～獅子讀到一半睡著了叫什麼？睡獅！所以要睡飽再讀，爸爸幫你關燈，顆顆呵呵啾咪。",
      "再來一碗菜頭湯，好彩頭！不管考幾分，你都是爸爸的好彩頭。",
      "為什麼考 100 分的人最愛吃蛋？因為 1 後面跟著兩顆蛋！分數只是數字，爸爸愛的是認真的你，顆顆呵呵啾咪。",
      "爸爸以你為榮，不是因為分數，是因為你每天都沒放棄。",
      "累了就休息一下，爸爸在客廳，隨時可以來聊聊天。",
      "慢慢來，深呼吸，你比自己想像的還要厲害。",
      "爸爸在這裡，有什麼不會的，我們一起想辦法。",
      "今天讀得差不多了，去睡吧，明天的你會更有精神。",
      "考試只是人生的一小站，爸爸會一直陪你走。",
      "不管結果怎樣，回家都有爸爸的擁抱。",
      "看你這麼認真，爸爸偷偷感動了好幾次。",
      "哈囉我",
      "顆顆呵呵啾咪",
      "哈囉我～爸爸來幫你充電啦！",
      "顆顆呵呵啾咪～讀完這頁陪爸爸喝杯茶！",
      `哈囉我～那個${GOAL_SCHOOL}的同學？先考上${GOAL_SCHOOL}再說！爸爸陪你把數學搞定，顆顆呵呵啾咪。`,
    ],
  },
  {
    name: "啾啾",
    kind: 15,
    island: "math",
    delay: 14,
    lines: [
      "姊姊，你讀完可以陪我玩嗎？",
      "我功課寫完了喔～你還沒？嘿嘿。",
      "姊姊加油！考好的話零食分我一半～",
      "我借走你的橡皮擦了……開玩笑的啦！",
      "數學好難喔？我會算 1+1＝2！",
      "姊姊專心的時候，眉頭皺得像小籠包。",
      "我數到一百了你還在讀，好厲害喔！",
      "可以把你的布丁給我當獎品嗎？",
      "我要比你先睡著！晚安～（才八點）",
      "姊姊最棒了！……這樣可以換一包餅乾嗎？",
      "我幫你看著手機，只會偷玩一下下。",
      "你背英文的聲音好像在唱歌～",
      "等你上高中，你的房間可以給我嗎？",
      "我今天被老師稱讚了，換你了！",
      "我會在旁邊安靜……三分鐘。",
      "你考 5A 的話，我幫你按摩肩膀十秒！",
      "媽媽說不能吵你，所以我小聲說：加——油！",
      `姊姊，那個${GOAL_SCHOOL}的哥哥說你數學要加油喔！嘻嘻。`,
      `爸爸說：先考上${GOAL_SCHOOL}再說！`,
    ],
  },
  {
    name: "努力的目標男朋友",
    kind: 18,
    island: "math",
    delay: 9,
    lines: [
      `我在${GOAL_SCHOOL}等妳一起上課，先把數學這章搞定。`,
      "這題的關鍵是先列式，不要急，我等妳算完。",
      `${GOAL_SCHOOL}的圖書館很安靜，很適合讀書，妳會喜歡的。`,
      "錯題本整理好了嗎？整理完才是真的會了。",
      "今天的進度完成了嗎？完成再休息，效率比較好。",
      "我國三的時候也卡過二次函數，多做三題就通了。",
      "別熬夜，睡飽的腦袋才算得快。",
      `目標是${GOAL_SCHOOL}，那今天就先把英文單字背完。`,
      "理化公式不用死背，懂了原理自然記得住。",
      "妳已經比上個月進步很多了，繼續保持。",
      "考試的時候先寫會的，難題留到最後。",
      `我們${GOAL_SCHOOL}見，到時候換妳教我一題。`,
      "專心四十分鐘，休息十分鐘，比一直硬撐有用。",
      "加油，我相信妳做得到。",
    ],
  },
];
const crewByKind = (k: number): Crew | undefined =>
  CREW.find((c: Crew) => c.kind === k);
const LION_LOOP = "M690,339 L1150,174 L905,169 L1085,409 L690,339";

// 花叢與更多樹木的位置（避開步道與中央建築）
const FLOWER_SPOTS: Pt[] = [
  [-24, -37],
  [24, -37],
  [-30, 37],
  [30, 37],
  [-68, 12],
  [68, 14],
  [-42, 6],
  [44, 2],
  [-14, 30],
  [14, -30],
];
const BUSH_SPOTS: Pt[] = [
  [-72, -8],
  [72, -8],
  [-30, -33],
  [30, -33],
  [0, 37],
];
const FLOWER_SETS: string[][] = [
  [ORANGE, "#F2C14E", "#FFFFFF"],
  ["#F4A9B8", "#FFFFFF", "#F2C14E"],
  ["#B9A9E0", "#FFFFFF", "#F4A9B8"],
  ["#FFFFFF", "#F2C14E", "#E07A6A"],
  ["#8FB8DE", "#FFFFFF", "#F2C14E"],
];
function flowerCluster(x: number, y: number, v: number, k: string) {
  const c = FLOWER_SETS[v % FLOWER_SETS.length];
  const dots: [number, number, number][] = [
    [0, 0, 0],
    [3.4, 1.2, 1],
    [-3.2, 1.6, 2],
    [1.4, -2.2, 1],
    [-1.6, -1.8, 0],
    [4.6, -1.4, 2],
  ];
  return (
    <g key={k}>
      <ellipse
        cx={0.6 + x}
        cy={1.4 + y}
        rx={6.5}
        ry={2.4}
        fill={LEAF_L}
        opacity={0.8}
      />
      <circle cx={x - 4.4} cy={y + 0.4} r={1.1} fill={LEAF_D} />
      <circle cx={x + 5.6} cy={y + 1} r={1.1} fill={LEAF_D} />
      {dots.map(([dx, dy, ci]: [number, number, number], i: number) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={1.5} fill={c[ci]} />
      ))}
      <circle cx={x} cy={y} r={0.6} fill="#F2C14E" />
    </g>
  );
}

function bubble(text: string) {
  const w = Math.min(230, text.length * 12 + 22);
  return (
    <g className="gi-pop" transform="translate(0,-68)">
      <rect
        x={-w / 2 + 1}
        y={-21}
        width={w}
        height={26}
        rx={13}
        fill="#2D3A36"
        opacity={0.15}
      />
      <rect x={-w / 2} y={-23} width={w} height={26} rx={13} fill="#FFFFFF" />
      <polygon points="-5,2.5 5,2.5 0,9" fill="#FFFFFF" />
      <text
        x={0}
        y={-5.5}
        textAnchor="middle"
        fontSize={12}
        fill={INK}
        fontWeight={700}
      >
        {text}
      </text>
    </g>
  );
}

function Mascot(props: { size: number; cls?: string }) {
  // 原創吉祥物「島島獺」
  const fur = "#B9875C";
  return (
    <svg
      data-grok-keep-colors="true"
      width={props.size}
      height={props.size}
      viewBox="0 0 100 100"
      className={props.cls}
      aria-label="島島獺"
    >
      <ellipse cx={52} cy={93} rx={28} ry={5} fill="#2D3A36" opacity={0.15} />
      <path
        d="M70,80 Q92,80 88,58 Q82,70 70,72 Z"
        fill={shade(fur, 0.85)}
        stroke={OL}
        strokeWidth={2}
      />
      <ellipse
        cx={50}
        cy={74}
        rx={24}
        ry={19}
        fill={fur}
        stroke={OL}
        strokeWidth={2}
      />
      <ellipse cx={50} cy={77} rx={15} ry={13} fill="#F6E6D2" />
      <ellipse
        cx={38}
        cy={90}
        rx={7}
        ry={4}
        fill={shade(fur, 0.85)}
        stroke={OL}
        strokeWidth={1.6}
      />
      <ellipse
        cx={62}
        cy={90}
        rx={7}
        ry={4}
        fill={shade(fur, 0.85)}
        stroke={OL}
        strokeWidth={1.6}
      />
      <circle cx={27} cy={20} r={8} fill={fur} stroke={OL} strokeWidth={2} />
      <circle cx={73} cy={20} r={8} fill={fur} stroke={OL} strokeWidth={2} />
      <circle cx={27} cy={20} r={4} fill="#E9B98F" />
      <circle cx={73} cy={20} r={4} fill="#E9B98F" />
      <circle cx={50} cy={40} r={28} fill={fur} stroke={OL} strokeWidth={2} />
      <ellipse cx={50} cy={50} rx={17} ry={12} fill="#F6E6D2" />
      <ellipse cx={39} cy={38} rx={4} ry={5} fill={OL} />
      <ellipse cx={61} cy={38} rx={4} ry={5} fill={OL} />
      <circle cx={40.5} cy={36} r={1.6} fill="#FFFFFF" />
      <circle cx={62.5} cy={36} r={1.6} fill="#FFFFFF" />
      <ellipse cx={50} cy={46} rx={4.2} ry={3} fill={OL} />
      <path
        d="M45,51 Q47.5,54 50,51 Q52.5,54 55,51"
        stroke={OL}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={30} cy={48} rx={5} ry={3} fill="#FF9E9E" opacity={0.7} />
      <ellipse cx={70} cy={48} rx={5} ry={3} fill="#FF9E9E" opacity={0.7} />
      <rect
        x={24}
        y={62}
        width={9}
        height={14}
        rx={4.5}
        fill={fur}
        stroke={OL}
        strokeWidth={1.6}
        transform="rotate(-20 28 64)"
      />
      <rect
        x={67}
        y={60}
        width={9}
        height={14}
        rx={4.5}
        fill={fur}
        stroke={OL}
        strokeWidth={1.6}
        transform="rotate(25 71 62)"
      />
      <g transform="translate(78,52) rotate(25)">
        <rect
          x={-2.5}
          y={-16}
          width={5}
          height={18}
          fill="#F2C14E"
          stroke={OL}
          strokeWidth={1.2}
        />
        <polygon
          points="-2.5,2 2.5,2 0,7"
          fill="#F6E6D2"
          stroke={OL}
          strokeWidth={1.2}
        />
        <rect
          x={-2.5}
          y={-19}
          width={5}
          height={3}
          fill="#E07A6A"
          stroke={OL}
          strokeWidth={1.2}
        />
      </g>
      <polygon
        points="15,58 17,63 22,63 18,66 20,71 15,68 10,71 12,66 8,63 13,63"
        fill="#F2C14E"
        stroke={OL}
        strokeWidth={1.2}
      />
    </svg>
  );
}

function Dice(props: { face: number; rolling: boolean }) {
  const pips: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [
      [30, 30],
      [70, 70],
    ],
    3: [
      [30, 30],
      [50, 50],
      [70, 70],
    ],
    4: [
      [30, 30],
      [70, 30],
      [30, 70],
      [70, 70],
    ],
    5: [
      [30, 30],
      [70, 30],
      [50, 50],
      [30, 70],
      [70, 70],
    ],
    6: [
      [30, 28],
      [70, 28],
      [30, 50],
      [70, 50],
      [30, 72],
      [70, 72],
    ],
  };
  return (
    <svg
      data-grok-keep-colors="true"
      width={64}
      height={64}
      viewBox="0 0 100 100"
      className={props.rolling ? "gi-spin" : undefined}
      aria-label="骰子"
    >
      <rect x={10} y={14} width={84} height={84} rx={18} fill={UI_LINE} />
      <rect x={8} y={8} width={84} height={84} rx={18} fill="#FFFFFF" />
      {(pips[props.face] || pips[1]).map(
        ([cx, cy]: [number, number], i: number) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={8}
            fill={props.face === 1 ? ORANGE : INK}
          />
        ),
      )}
    </svg>
  );
}

function fireworks(x: number, y: number, k: string) {
  const bursts: [number, number, string, number][] = [
    [-55, -120, ORANGE, 0],
    [45, -135, "#F2C14E", 0.6],
    [0, -160, "#FFFFFF", 1.2],
  ];
  return (
    <g key={k}>
      {bursts.map(
        ([dx, dy, col, d]: [number, number, string, number], i: number) => (
          <g key={i} className="gi-fw" style={{ animationDelay: `${d}s` }}>
            {Array.from({ length: 12 }).map((_: unknown, j: number) => {
              const an = (Math.PI * 2 * j) / 12;
              return (
                <line
                  key={j}
                  x1={x + dx + Math.cos(an) * 6}
                  y1={y + dy + Math.sin(an) * 6}
                  x2={x + dx + Math.cos(an) * 22}
                  y2={y + dy + Math.sin(an) * 22}
                  stroke={col}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={x + dx} cy={y + dy} r={3} fill="#FFFFFF" />
          </g>
        ),
      )}
    </g>
  );
}

// 遠方小島裝飾
function islet(kind: number, x: number, y: number, motion: boolean, k: string) {
  return (
    <g key={k} transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={6} rx={44} ry={18} fill={SHALLOW} opacity={0.7} />
      <ellipse cx={0} cy={6} rx={32} ry={12} fill={SIDE_F} />
      <ellipse
        cx={0}
        cy={0}
        rx={32}
        ry={12}
        fill={kind === 1 ? "#E6DCC6" : SAGE}
      />
      {kind === 0 ? (
        <g>
          <polygon points="-6,0 6,0 4,-34 -4,-34" fill="#FFFFFF" />
          <polygon points="0,0 6,0 4,-34 0,-34" fill="#E7E2D6" />
          <polygon points="-5.4,-10 5.4,-10 5,-16 -5,-16" fill={ORANGE} />
          <rect x={-5} y={-41} width={10} height={7} fill={LIT} />
          <polygon points="-6.5,-41 6.5,-41 0,-48" fill={ORANGE} />
        </g>
      ) : kind === 1 ? (
        <g>
          {rock(-8, 2, 2.2, "r1")}
          {rock(12, 0, 1.4, "r2")}
        </g>
      ) : kind === 2 ? (
        <g>
          {[-12, 12].map((tx: number) => (
            <g key={tx} transform={`translate(${tx},0)`}>
              <polygon points="-1.2,0 1.2,0 0.6,-36 -0.6,-36" fill="#FFFFFF" />
              <g>
                {motion ? (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 -36"
                    to="360 0 -36"
                    dur={tx < 0 ? "5s" : "6.5s"}
                    repeatCount="indefinite"
                  />
                ) : null}
                {[0, 120, 240].map((r: number) => (
                  <rect
                    key={r}
                    x={-1}
                    y={-50}
                    width={2}
                    height={14}
                    rx={1}
                    fill="#FFFFFF"
                    transform={`rotate(${r} 0 -36)`}
                  />
                ))}
              </g>
            </g>
          ))}
        </g>
      ) : (
        <g>
          <ellipse cx={0} cy={-4} rx={22} ry={9} fill={LEAF_L} />
          <ellipse cx={0} cy={-9} rx={14} ry={6} fill={LEAF_Y} />
          {tree(-18, 2, 0.8, "t", motion, 0)}
          {tree(16, 3, 0.7, "t2", motion, 1)}
        </g>
      )}
    </g>
  );
}

// 粉絲自製 Q 版角色：依 James 提供的插畫特徵簡化重畫，不使用照片
const IDOL_CHIBI: {
  name: string;
  kind: number;
  island: string;
  delay: number;
}[] = [
  { name: "許光漢", kind: 4, island: "math", delay: 4 },
  { name: "曾敬驊", kind: 5, island: "phy", delay: 10 },
  { name: "沈伯洋", kind: 16, island: "civ", delay: 6 },
  { name: "周杰倫", kind: 17, island: "geo", delay: 12 },
];

// 應援卡圖：James 提供的許光漢漫畫插圖（家用，裁切並壓縮）
const IDOL_PHOTO_XU =
  "data:image/webp;base64," +
  "UklGRp4gAABXRUJQVlA4IJIgAADQkgCdASrYAA4BPpVCmkolo6WpKNbsmSASiUdv6y1hgyKCUX566fwebw8tlKvy3wP+j64NwJzt/pa3pverrUv0q8RfPL8/91PZF0B2n/zL82xp/MpWK0x/YXz7MELVi8O+wD+ZnJVet+wJ+hP2R93X/M8n/1X7B39B/v3XR/Yj2Yv3VbQW+HldV7YSlTqaNuwP1nwyLQ3Jmnry2NAH8he65buntWAja/lamyc3TnLEqDlbMjrP7B17VsLP8FI/XhUK076u7HI/et2dl3XCySNWNmS768GpZPpZbsqnNEWjFiAkQg283sACUg/fp7kHiPfYr0vTdScIDG84wiN7aczOGNc0E1u6hJtF1iqD1pUf2t/4XNptJijCgd5fFgV4Hmbw7Q+mSvd9FIWGfU/5FM4ya6UkwBQeAnbZS3IE0IHhPIIfEA2E6EqqA82XvQuJ2kCHjLnCeLzgv7wMNTu5FY9w0Hyann63yWxS1E2CZ08VYX8BKOJXzytC47LRerTU4osvBcK+Gqf617EBeo2X3lU9lzZnYqn5t12/5auHeJ6GmTnXfTB8mAfBPAbuXGp07oTv/YKO6g/fQHNkGQXM2oDsOdEfyv+92RcfpKVk++MRZywKuUHDT5a7+eP2HT4zO2Mm1ke7xyfYK1kqQ+oZWJHcUc+g8RzMzSbFsPWZAV4UkpyLIrGP5BIuyf6BGzD5fDdU3Bf/uJYUNzau5dJbCxz6bwtv/9wdE9KT2lFuxfFx4P7OtjMHO53k57zSXRrGelXh9nHde6rOJy+nJIeErXAG6gC+Hz3U5bEU181yYRDikfF2/r08S4LyXunuKqW7Cw9u7MevI7f14QsqWwbdGiEywOxZjlhbaRBgOsQ0OMhPzXpv4qQccdz45OBP1Zu6fYvuTrKnj4UYPx2OI62ro//7f5w4cYERRNw/6C6k63tiCjHhMCWKU3e0XOUW9bPPwyETlLxpwrIXVYCp" +
  "FWXduEhxJ+GZOBqFhfdp5EVqqfYhxPqhNFz4naK51L1U02D6bBeeM/oeBZMstqy8WAJ+/vuZ47BD8U6+3waxyXmIeXJMUd/Hxgpp4zN0m1mcosuRTUloRy6ALkLqXfDOPFkE+ABx0WUTGIKD7ztlylfbbrm365IKwmi4zfnk0WITJzPfguRIWRlRXksV9E6RLg/jGkKuxukIPLBfSKoV7k/OPqKn4l9IVERYlvJZf1kShNrYgGsxvfI5dJh0DxOROf42pQ//05gWZ01KPuSUBUv4xxVm/jdheOsUnyCIGKrSB0oVWW20P7jv5PI1bT3KjQxNXKsui+zqDB7ABOf/bddQF5VQDuuQi+hvZpBASnirwdTccXf2W9Kw+5NQ2ELpyNfCPdxRWAmWn/PJzzbzjtZ7HwKZ8JWfODFseLFtkYS2OHzPhpJCy4GeTzvhJ5ZGQxhy11aOvyntZ3oR/OMAQ5ecqqUyLati6eiAPKH3p+OKsXVBTvvEfsTNpeY/PfC3myHpXKaHadSOiCvAoKf/0AFGapJ6c83o9L9uvIPyjx9P451OwoStCsmpAjWi/xxoDU89zV7wxhDv2xt8/w/VAgvhMyAAAP78GFc0d4+9TmxiwvKmrPlm49Ha83mm/QtLjNDYgtvPe8hiewiGt7Pjf/jF26brz4vnPYlgQiwJfg+bQP0NijKB+kPKP380lzXCOvjPAHvrFNEGLn3eR1l2HLTduqbcFg3pA3jeqfHJOTJErbJJ4IggAGqCevsZTcnwj8Ga4XuEaCFaje4jN9cE3u34CZ2mEjT5zX8i6WebQwqfg/XQSNSFgbVYdf8CkuCuGpH8Lsv/Wai5OLh3ukf9C0dFuTIJVnbVskcAi0T8Fccm5zQfRiIxvSO2fSxt7P38SpvcD5crpQQN5s76VekcdCfQL9QnklPPwsDYDp0mCvzkfn4m/Fo6Al9Yc7jmYeRWUkYEeanOcIkJH+8rzT64pWsMbF22LlZgQ25YCGHx" +
  "zRDvvUP0x9cRZBAepj2u7fenghgPEaCMdzrF5fJssxLbu7RehaPWr2/LQGcvO0arzv8v1+13MYnbDe7wZnnVqxe+4Q/OCON05mq1sPHFrQ5StlbUyLMSSGU27vC7RiBKKcAerk3JcQbR6grCLohmDxMjiZBKWG4yt7FxDuNOIWqKfZuBex7mmjWXbWISFiRMLeY8GBLTivFGpWq5OEeBvL9Ft2mKgRXLVaUXPOq6laq25vIj117uw6DiPRxpiHxaxiHSB8hsK4v11PFxp7AhQ4vjb1jABHOQWuRIclbMD0e2i/DKb5IQdZl5ZyUAhr42N9ifQZYTFr//hYGGK9W80W9r7NPidnytzOHBYGFXPGh2EE2c5xom8mWosmlkCGYV4uNtJ2kSslVCh469x2aLr4AQDrN7iLF4SdV0wAsts2DDkkBbyDw8CkZFw3xVndswX+AvOno1HZ85FZTeDP7O0T2yP8irAB8a1v/1GxQoaW9z7dDgQXaXpMdvx4L0rBeCJBEPMGIns2luHVMVopfVFWitLYVU9Gq92QUfHRHwazSrDC/mGV9/ClxHh9tITN8tgH+/BlspHM+27qlZLxG4kLtMCYgL7/e2xd/Qd+6HwOufnRAgDLG6g6Yw4Yrrp2P5o2WnRhVfsIQcmD3OFtNiRN5N0+pfcM6iaW52HZT/t2u4UZQiFbyMgAawc6wkYAdnYh/9SAzeQ0ULWSLP16nfA3+wtP7G7p91Br5sPlm2GVhNZ3E+5XxOOoqfZJmtyc8blOqrkgAbfWiQkD81Ba66YjVaym/6hbDaWXE3/QVvH/IGkFx6SUFAgvrY+nb8Sb/NhXBWdD+yYPwJdCxhX0/jgOlb6/iA0TaTz8xGwPjkDMJqNOxc6vCSjOHXjQUjC0DCh1dIyLgfl+knFFnMKOnprm+HtG/9+z2mRuVPUQvqPG8coXhymUpVDjwC/ZQ05Bokhm9s5A3lSt3VIduqj1HkScELF1mTv1rey/0u0oVa" +
  "cc4f4Jb2bRiT36wHLHvLV6FxiRCxWO42MUMdKV1BqfMj7sePvxUvhJwTwyGJPO9QtcHgx1QZYE57XXkmdYsdZC+xHw3UmcJLdiSr1zZJISyo2Talz/KGPeV79fg2D/v9P0qmhcH7WR9344BxYkm+PLlPtrAZZ42dbLefcGdDS1Y37KtGgCmEIrwuNB4e02HanNz1QaudtvuL+cMrFz2IW7IGhIr4OR+JKYjgcZEDj3S3/ccFODfIzzjIcDhMTdRGoNIymvAKHQ15SknkZL1jYjPKCJ0qbrlr0Z3obwYZ0H9z59XYjmg0ZBIlro0ybbZiTHGXkQmTHhEErceHIdGgFSZrxgQy23MFdgVrP8LmhMS/PXCi1qqPahPq6MJXpRdd8iI3myDPg+Zvb8ke5mRYYCCGZJLvQqRkzdQHqboyMPNfoSVA451wLodeEruskpmDUy9lpoeoSATeh8lngo9/Vn3bgEaBLAda2JtAy7GAE/GLRaLLml2A/cNgq+m4zOTbcvMrJ090sjrqaGPC97C3nuCm7ZZFsQ0tNRq9fR7FSx7waLsXXVmSOGpiP9YFsNN0vHx7ZvEa+aPcLONjMX6AWdc0hr23zREayA0Z7ULGG4Eed0+1K/n5l+OktapNS1Om/xIp/hx1j+p6kzxPCHnnAFqnlJ6wU9GUH3mlSnETa4vEWrEqy9d54qHXldcmNN87vt8gXSKhs73TlozytILab9RbwMesQ+q/kIgzFE2amm+kY3BZ9kMdcMWwGayrOkVOgFBlt9J4DAbRCtXndlwV/EkXRqZ1a8mmI1PSdPCwwkflqetMMJeGW476Xgrl4M+R4vH+szvSEram5Ze9K4igk8upzhpgvz441BUp4uIhyxIOPnIqUU5SzJI0YQfVQHq+kLJ3uy4NN98R1nk51KlZVigYLqACieXT/wc6pAJlVYZnaRpG45Wtco3Juiilw6c1NkbZR+wNxKle8t8ZbGX9wGuJGwkjG9yCSGjR7Bf5" +
  "3Nbhf8pVnPrOPIfw7N//9ijJIgelFcWOMehHEEBvb706YweJHSMtmte7P++UWn/N23HUStx0mH1CH8Y1+IyxB88A7ACm6Lx3k6amTK0CvxHF4tmiUWPOVXzuANQcS6CxWOV9fKwZxRbmsOZ3kbytb9Tzllb4Pgk7YXJmU6YIyd+59r4ImfBiizvy+F75uEYvXJZG0WrrfRV4TjN4sJukxBfRwhSEPDbcNehgE0V7mT4qqzh5I8jfz7d5d9OovPW6phBl1iYb78fmNYlW1tSL48brHw/LEdAvyUyiNoOuCp/57OMM5s8KB/1uDeJKKSa2/21cQaXyKrM3tvwdWg7jx/5Q1kEH3QOh+LCMRbmTtHHDqgdmTem5ueKLL9SQWbgssTN1kWXNhLgdxy/thLxUjQ5DZO76A3BQXx6L+N/dzZtbfrgL6VGOZoiGNWkRkbdxbJu9JJ6LJ3yBfYlQnndrrIfcqHAAKEEoiR0I4dXLrsXpCYXiurT9yfGyHfwH/jqmVgqp5nKGWHFDr59YwtHKlT5UgqMwKooUQV6BlNp8qxVuQYu26YN+xBTaYbbwX3pZs6icKNXXrsHhkIeQotwxGbZrwd9yDZrxi6i1Hunnao/MF06nk9z8mo2g7oxcXWZEwJYdQ3QylmMMmDmQ1Qq9c+woBdUQf+Crdi57SmtP58KuyqEtIb6yyKINeJuRMowicFot4+l66Ht70sFf8vo7LnVLqTw344booFZyNIpGflmjHKjQpmbjDxtYUjGFzrXNUEf9gAUAeyj79mEUY044ceaPYShDtC7q//aWYTQiGQAtEPhysz8eqVvdLsTCLtXxJumEIWMWVVG/H3boB6tDLxDX4fDjNn6DfZeNCKF4xF2eh2046Uae4aVY7OJHRs72qiyZ2kpElD+cMK4EUaXzYMIc0rXe5QZxjFdyewA6+2bTaJicwOyHdYzEel8DZVKZ7mJKsspLZr08DsGhQ6FwxiQ1fcnICwkoxeuWsq5S" +
  "zXGt+GSo9HjMRO24uD4ixRzGMOT1KYwEaT+vzAXoUSxtlAS2l/zC8xcK6uZPNBAIwZaZnVaGA6+SHocwEKpejkMxNwjVYPmm2SJCc9s63Fr5RM97sIuoi0J+WBV8sBAorbIKpiUAnRDyFaGL0j1pZhHgEEU/H8N9bqAZSXz9zPkSPsO/5GYA6iBSJTOmzxGX3T8HLR0pYGY1Aux2/JJTSJcyK6d+LHs4zqACgmcIicckAkEEVvqaE+8CnQcaf4tbkqq+ZxSbrIGDjb0Z7y3Jr9lx6UNQwXTLTJNzweRPwrey2cZXXJKN/RfLi3PMxbLxSVujCyZZexLRS4rU4IOChUxmsxHnTSDiOP2clwuwmChRzSgKNBx5Me8arsy1BebicMRAgvnitN4sKkM+Aft0OS2tihwtTWtnPPLdflMhMXmcUIhhGN8yq9s6rUfO2eyoUPL5h266fpCLYuaI3qQsUd3Ww+vGM2VSNOZ7kd/kPJ4CblbyFIxsS0oz/t5Du/dQxoSU+Xt08qak9SVepyp5NYAariFP7Xd8Z/F9aOH3o2Z90Xi24HGroLc+3ayciUPUXcIUVrYd38jsUo1C0dVk7xR4Tjy+YuURS+A3guZQ8LbyKuz+umxHj1CFySL4o7ImlVfrNIUI3KkdZgVDpbr2wQMaDeNekB/ViwpBLoRauv1txc/mw7aLy06eRDq1E7fMRxVs9yCMHpGK3X+B2reaATFBV4HJ01RqFNtB+hftK49pE8Y3DLI9NPDhXibM9L+DxVHnvCBd6Bgr4OPl2TUjX1s998L75hky/g8IpeKhKn6RPlGTZWmHhwcexxwPXUpRr2HVM8gnw6LkEvzndlmQ2+9zIIHMCm7u/lSXQ8pDO+WZSADqruVPm1LIHLVv+TNSdxs8cT6Nl1b0Mqy+uYTD68tGakm/bSBrtR857GyjD6OOgzJ2SFmuO4Dd6a7Z0lEj3aMYaTPBDaQDWGnbMDeZGHwpd26OkLxMHG0ItIBQ" +
  "CFFSvQEX+gj981NTDIFH9Zf+SX6eH9TVcaI0x77Evk+/fla2lU2GfFX9bUPjC9iJZ8A+5SxqyOsGIQ8AHvxTJBghoD5DMpt6j8JToWenhdHhJJ5rW2gav2XdI3GN9AMGWQYmxu2bxhVyQpcLvShvjC5b+U4mBmz81hC2I2GZMfXtjLhv2w54+Ta/nPtqckWYQQ8LmJKth7KUbKE/Dcz5Oq7NQBprsYGW4y3cuZBbC9tGPPShekRBSbn2CWUFWNrbvP+rZjABLBMFWjn4Ury0DxJx0Ht8S790OezzJxW5eJZ391Xmdw8+JmwNdyiMUTtsJmrSvn8/goqsuv6i6vQobW7jeX2Am5/Wjm+x5Dnk3egYpkod1oJoIZQa7USqWyv6Tcy82JH8qOVVY21egR6mOAFcxuFuxj3Xc6RsGuOegWg8YcXnqXEsSnDjKhQbHTWXdV1CgR+EZlLSmV9DwrYRKlA9PsektDPphz2uRyB3h012xEweSiNy2oGYFW+5cZq/6i92Vw6ndUSV7Hdqyj/uSVM0hYuWcYH5oDYMwTrNwasUTLHwe5KjzSl2Zb4/XhDmnZdja/7N0XA2hO3VDSsjx+yE7PvSv2qLbPaDkEQ175lC2CqdXG4bGKsbsvbunol5PaDZNZnI78rVfgmE7OXn6EP6Vzwpzfwe2Ra/rg8DNVLXBuP9n7Q1JknGEFNVBNnSUBSuRlXSTXYgKTw5yuTP7q+ebMYWOOt6CsxpKX7TQO6UKY4w3l+Zo60hU3Nvs4GF0LBgB1239jkbA00vf0iRg9vAdmoDZL6pfMQYgQ4/6SJSb7Cd2+FdjdKk0CnnF6QeqOmjif1Ue6MeJz8pZ5aYUSnAc5z3kp+rNyCWEi+W0oWo2wVOorOrroKbbwTL6nQ1s3kkoEQUDsHDPEK3DQtDZSexN9tZPxNrlPUcZKrfcy88aVIzaNaN2xi8YNfcDcUOm4HckqBZaF6fNFWENyZ6bmI5ZJigQxsObAh4vlFJ" +
  "yCM0qbLd5oFlc04LRr7KZseXcBjLBmspyMpWbDlG36oYUJS8cxjcb+bQOwqCPVUBcggy0pjcemFLw4uXutEPZFoI6pMlc2S6RAvJ5IIE1BpsoEoxmhfPS+yaUx7muXsn8Ek3bAKLeKSiXGjMqHAnJlAu9B8fgQ/GVr+sAds4ikizi/Q3ChqTolW1LR3PVZwwtdy6tFbLmfSeifyuoxruyXmqmn6oxd+GzxpVy00OakV7s4zq0r0IaUaCbxSJMTo26zTPJMo4Xz3WM+AqeSaHs4LOZ6IWMFN5rrxPibdh7GTk0xaptuu74socDUvKGxToAvtABwWpNBTJ98gyiKrRDx8feb8nybfAx7i5EOugJ0YQSEmC1vKpD2LXgMCjxZsT1GzUIpyQafM0RaH57VmScO3CfQbTJnyHqZd/r5Wf91Lvtzja34GQ1ee6qzxQNevfWoO8qp3/CwrSMtbrz0e2HT/advTTCpVwNTxlzfnc/krAOjpbkq4YGAlptZn03djqgxfX4FRnac4okad+ssD4iWFrJgT/2dvLtLHGmyBQoWDbDv3JzRXw6XMg6HhM4dvIo9tztrZOAIIHTtBD5kIjecGJDoFiEXbnwSWgBeiUBtyj/I7T+W/WUxOt/6LqM0Civ7KRuYdAr5Mp0PoWexgLOXa5zXg2Bze7/v71vY+RsK/9AoOcJdkxn4jcn6dYSWiT4wrZSzYGUgtomU19rIYF/Jurii7xXVUj74vbEHrGm9TTiiC/ksQZ8mV+phhFfqPqTTJx9q0XR89hG0FQ0rT3EVG+q87Qk+T9el49HULAIjP7+kvAnDJi4jhtRF/7KSn7WVU0fcDTghe8cZEeUjkumkEEBNHyDHdX1z9UJf9KOfzPePYq6YPhWTEQ6ByjL4U7+y7u13Vjj30XR7UWRSXoQ4sMSD9MBgxpJly/xL1tOI0EI4haXy79EZpgN9NLTLjLXl+IgCYSYRg/XzZEv0RcoaFMgJDeRK44LkofEpuP" +
  "yV/2Ub6Hipzpg1eSguK69IOFglKRomxffDZvGcIPlyybLzdVdBI3DCHJ4uEbw1pEp8Five1b4NlhOxBjEGY8sI10YKmkOuFI/+POHipZ+OOw7QdFGgJgUsGJDCo3vTI8H+4Bbf0Jb/Jnwc8WfIhd/uDrK3FSEyE4SgnWSC9oK94ICoWEnQ/cdHQJ+DjhgU3v2c5L/lyqzCKlG+NFuVBSC9AGmiJtaGKf2T592RJZym0ZuUZY/ZMGcStyfXfVXiroaG29BEgP+c+facd5MPagxfo7AktEDl3JCXvXuAbpNu2d8k5ntMaemT157kNJHMoyADP+czeyoMoa1J9cMAs2xmvF1XGSZfYkwa1Z3YTj64lem7WddP6RJxeceYcyA8t8M9e5kfWXWuJdOtGjfgZZz+Vv6abcwWmp5XHYt+b+H67xp1GHt72wCBP8LQhSG8XVMNlHex14VI9PNdCxG9sEWbkD0pVhtVUXoHFY6ExtyzY8rWGqBn8BFvwlWM3qy4P8maG4S0RY8D0YanYqp9paNrJk5mTLVkW9uIxL6gPkp87Jag4c/4hdfTPh6P5mSn0o3X1mAPjQa0a7D04WrPg/Aqx36r+k5lAG16XUCkNAhFNHGyjR21IxUpHkaPq2Ltzdhw651u2anFZ5TYW0UgJA5YolG+6htUsLHoBSOtn6ukDzptEJfZzHsWnbAYGUiCbRuba0/WU5X1bIHbm6SKHD0oJgbCkJIfBPL/uYwNXK88ivNnydxNeg0nPzIgLJIASua4nAyS1j+4Va3/ff4gjcKJyM2VjLDYEVhvJTWPaTpzcFwG6VGh8ZMQzWrvhd75exj0Zy2nRXJBQ6Dwib6LLp+fAsoEH9kX6Eje8MPOu/vo1EM+isj/RjmmzouxiAz2xSlEUDWCfI7XAg+InWJU0dCx1iXDLQtvSTcJv1byF0+q6LCqIjtLoOisY+3SnHF6KqejWytPo8T91TYc1XVyhTIe1wfDCmE6SbX4f0ZtA0" +
  "NM44dFBL6OptfmJcL0LmXfH+XT1IjfxcUSVsCzNClFI9sHAFEt+AyeBhTrzyaacX8G6sz4hjaQX5AEiIk3a6CuHD4HjpEMWObDFIimS2ojY3hwtaZhWgFTQh4ww29p3T10Lgx85IIzy+lcDG9QvIu+luJRKtKDI2AbJRCUHSADFWHdlBt2UuELqwKVOC/+JK3TepEICPq4w/4vsk3qW2CcqaQczQxur8kOItj53a1A78fSGSzZag7GJlLD1PGnPsWPcRETpzm1TVLJlpF8OXueKbLKKd8Z/ZoQlBXP8pCffK1hAlIBiuRlqa4Wqeq6dX2K7UHAbyy+x36gG5gSCmQRSzPjSM2LYa1Qs3nyF13leTv/EhmhZL3f7K+5n2PIK0cFsekpKe1WMxhBgXSj2g/LfINY2c7RyrWyzyhx8G2/86rY1Jed8pWib2j3HALuMSlvHnsFkrotmPZr7EqmLMRtBpHZR5m0VWtMepD6pPlwWeBVEMb9zkGbCn/oArXIWtYH4WMIIZ2I7RQfpKoIzA9vYjNieA8uxgpd7Vq6x1RLoZ9qeFjoXgfLcZmutLsNsjaEBY4OcPTqlDOUAfAQeFgd4TA1vR7OBvL3aTr4gw0XPCKCMdTcgatpHI/x2BedTM0I3LtgjRsnXwBXTBsLQWYkZWHn94pGrwtO7D6SswHpA1ppmAMr0TxmyUsIRbLv0qvzsAPpTkWFChfbQBXfEFDSgLI+y8df1U/0eZLozC761fRdRfafivgWTzVKhGCY38bkjZr/lOwTyuoTC2B84/9xTCXe1RKhfKzOHc+jW++im7u+OB9Rwyj/BggcJQCy21ul084fxj09StcgKX+XqUj8S/m67yE6quW4+MrhxdT77ejmwgprIc5OQOykmfMZNhikgXz7Yco2vHb0h1ewypf18pGe9xwTxOA6ChImwJwA7oeIviFfEJG9Cp0K0skAVSz44uSpElg08cSh6aZ5oyqRu89GTbPuTx9QjOtzrT" +
  "8mreiYIwH/rzwvhB74QAUmrr8+4wEW1g8j20P3EtfE5jRTeCCGzJhs0osoEjHAvMQxRmvMRtK8/dFf12RFxctMNQV9bUR2TTXIU4n8Ci8DsHxlkTiii6JbDlftplzxwzbYQ/0wXFwbKnIzvRN2F1u/qRRiRCcZU0bnFbcEUTdivp0ml7XpPmcuWS/wuNmdB4yePiPmjQ8r/anqeXpVnpLVdUCf16Ng238Flz7+pyGd5YqVkiKMwT/grBYYcaIExHXTUhthSvphSXNClwOn5pukz9zNn+q8AF5kNwPRyZ+U+1HB/s1S0ahlaGhdZUt6IbqFFupqNRNxf0qCGDIF18XAJ3LUAPQoX/ypkvX5aguyi2pdbrqTG5PScf+0/0U1puevP6gSzKTSeSHM3CY4ptooFCwdneFdX08sjE+bWaxQ8apwxTHN/4lYQxkjwaooyWyO2K3KNVeEA7LWW/QZa4kqnC3UOb+qHwoKQrzRyj/0iGFAV5egtqMCFEHpxIomj5+ydHWE7elYhpeYBXlKBLEtz0a83V1x59OSveJKhJ0ZWt4yOOZkX+/qBvr5xzGM37o9MD1aqLWNyP9ug+1UVYuTj3Ox6erjZkhDY8chHo7B58vdLmFVUXFE4R0ufHmhw8Ubhd/NoLmxTkEIQZPiDWlXJA8nW6RQ/9zKOOKSbBegNm3qFEUUTPTt8hgi2P4lKtX3hLNFZIBbvQRFv9kzQsahei7xP7jlk4LuWkAO7zs6LKs36+kQHSPDvf13sOjuk6SNcuM9MbljjRSGGjIdJ3TomtfbbnXxC4IV+MGEOWe+vknmou3wNBYfWTmzAXLhvJFWaQ0X0TxchhWmZXSMXjRS1HlKCGkCdE1UavA/UyoOPStCK7BfKW4iZP21Q/bK4jM9ey6m+5rITk05LCco+2RJsI4EFViwpppucX3AfuVNnNqQCfVU433P4JWl6dXhsq8LSag80HUwGyj423h+JmUmwUeCjkpFLCL7X0CSsl" +
  "AO6kpk++n1Uc8IsGue8f2tF/PYSWHy73aX4PiidufFMlWhh029kMeLBSEkNTn5/6DJJ+BGXWGeXZJZ/Od4Rf4gbSNi8uSyniKbJY8Y9qiIvRMbC4DuAX9bYXORXviMOzYO9k20A75YbVMAAA";
// 應援卡圖：James 提供的曾敬驊漫畫插圖（家用，裁切並壓縮）
const IDOL_PHOTO_ZENG =
  "data:image/webp;base64," +
  "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";
// 應援卡圖：James 提供的沈伯洋漫畫插圖（家用，裁切並壓縮）
const IDOL_PHOTO_SHEN =
  "data:image/webp;base64," +
  "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";
// 應援卡圖：James 提供的周杰倫漫畫插圖（家用，裁切並壓縮）
const IDOL_PHOTO_JAY =
  "data:image/webp;base64," +
  "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";
// 應援卡直接用 James 提供的漫畫插圖（不重畫）
const IDOL_PHOTOS: Record<
  string,
  { src: string; h: number; r: number | string }
> = {
  許光漢: { src: IDOL_PHOTO_XU, h: 130, r: 10 },
  曾敬驊: { src: IDOL_PHOTO_ZENG, h: 130, r: 10 },
  沈伯洋: { src: IDOL_PHOTO_SHEN, h: 106, r: "50%" },
  周杰倫: { src: IDOL_PHOTO_JAY, h: 130, r: 10 },
};
function IdolBadge(props: { name: string }) {
  const p = IDOL_PHOTOS[props.name];
  if (!p) return null;
  return (
    <img
      data-grok-keep-colors="true"
      src={p.src}
      width={104}
      height={p.h}
      alt={`${props.name}（James 提供的漫畫插圖，粉絲自製應援）`}
      style={{
        flexShrink: 0,
        display: "block",
        width: 104,
        height: p.h,
        objectFit: "cover",
        borderRadius: p.r,
        filter: "none",
        colorScheme: "light",
      }}
    />
  );
}

interface WorldProps {
  progress: Record<string, number>;
  selected: string;
  hits: Set<string>;
  motion: boolean;
  bubbleNow: Bubble | null;
  reacting: string;
  idolsOn: string[];
  onPick: (id: string) => void;
  onPoke: (id: string) => void;
}

const HR = 92;
const HRY = 52;
const HD = 18;
const DECO: Pt[] = [
  [-66, 2],
  [66, 2],
  [-46, -22],
  [46, -22],
  [-44, 26],
  [44, 26],
];

// 一座等角六角島：赤陶側面、紅白相間島緣、鼠尾草綠地面、步道
function hexIsland(isl: Island) {
  const P = (r: number, ry: number, deg: number, dy: number): Pt => [
    isl.x + r * Math.cos((Math.PI / 180) * deg),
    isl.y + dy + ry * Math.sin((Math.PI / 180) * deg),
  ];
  const top = (r: number, ry: number): string =>
    pts([0, 60, 120, 180, 240, 300].map((d: number) => P(r, ry, d, 0)));
  const side = (d1: number, d2: number): string =>
    pts([
      P(HR, HRY, d1, 0),
      P(HR, HRY, d2, 0),
      P(HR, HRY, d2, HD),
      P(HR, HRY, d1, HD),
    ]);
  return (
    <g>
      <polygon points={side(0, 60)} fill={SIDE_R} />
      <polygon points={side(60, 120)} fill={SIDE_F} />
      <polygon points={side(120, 180)} fill={SIDE_L} />
      <polygon
        points={pts([
          P(HR, HRY, 0, 3),
          P(HR, HRY, 60, 3),
          P(HR, HRY, 120, 3),
          P(HR, HRY, 180, 3),
          P(HR, HRY, 180, 5),
          P(HR, HRY, 120, 5),
          P(HR, HRY, 60, 5),
          P(HR, HRY, 0, 5),
        ])}
        fill="#FFFFFF"
        opacity={0.25}
      />
      <polygon points={top(HR, HRY)} fill={FOAM} />
      <polygon
        points={top(HR - 5, HRY - 2.8)}
        fill="none"
        stroke={ORANGE}
        strokeWidth={6}
        strokeDasharray="9 5"
        strokeLinejoin="round"
      />
      <polygon points={top(HR - 10, HRY - 5.6)} fill={SAGE} />
      <ellipse
        cx={isl.x}
        cy={isl.y + 2}
        rx={60}
        ry={32}
        fill="none"
        stroke={PAVE}
        strokeWidth={9}
      />
      <ellipse
        cx={isl.x}
        cy={isl.y + 4}
        rx={30}
        ry={16}
        fill={PAVE}
        opacity={0.9}
      />
    </g>
  );
}

function IslandWorld(props: WorldProps) {
  const m = props.motion;
  // 縮放與拖曳（手機雙指、桌機滾輪與按鈕）；拖曳中直接改 viewBox，放開才更新狀態
  const [vb, setVb] = useState<{ x: number; y: number; w: number }>({
    x: 0,
    y: 0,
    w: 1280,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vbRef = useRef<{ x: number; y: number; w: number }>({
    x: 0,
    y: 0,
    w: 1280,
  });
  const gest = useRef<{
    pts: Map<number, { x: number; y: number }>;
    sx: number;
    sy: number;
    lx: number;
    ly: number;
    moved: boolean;
    dist: number;
  }>({ pts: new Map(), sx: 0, sy: 0, lx: 0, ly: 0, moved: false, dist: 0 });
  const clampVb = (x: number, y: number, w: number) => {
    const W = Math.min(1280, Math.max(200, w));
    const H = W * 0.5625;
    return {
      x: Math.min(1280 - W, Math.max(0, x)),
      y: Math.min(720 - H, Math.max(0, y)),
      w: W,
    };
  };
  const applyVb = (v: { x: number; y: number; w: number }) => {
    vbRef.current = v;
    const el = svgRef.current;
    if (el) {
      el.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.w * 0.5625}`);
      el.style.touchAction = v.w < 1279 ? "none" : "pan-y";
      el.style.cursor = v.w < 1279 ? "grab" : "default";
    }
  };
  const zoomAt = (f: number, cx: number, cy: number) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const v = vbRef.current;
    const px = v.x + ((cx - r.left) / r.width) * v.w;
    const py = v.y + ((cy - r.top) / r.height) * v.w * 0.5625;
    const w = Math.min(1280, Math.max(200, v.w / f));
    applyVb(
      clampVb(px - ((px - v.x) * w) / v.w, py - ((py - v.y) * w) / v.w, w),
    );
  };
  const zoomCenter = (f: number) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAt(f, r.left + r.width / 2, r.top + r.height / 2);
    setVb(vbRef.current);
  };
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // 全景時一般滾輪留給頁面捲動；按住 Ctrl（含觸控板雙指）或已拉近時才縮放
      if (!e.ctrlKey && vbRef.current.w >= 1279) return;
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY);
      setVb(vbRef.current);
    };
    // 拖曳後放開不算點擊（避免誤觸人物或島嶼）
    const onClk = (e: MouseEvent) => {
      if (gest.current.moved) {
        e.stopPropagation();
        e.preventDefault();
        gest.current.moved = false;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("click", onClk, true);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("click", onClk, true);
    };
  }, []);
  const onDown = (e: {
    pointerId: number;
    clientX: number;
    clientY: number;
  }) => {
    const g = gest.current;
    g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pts.size === 1) {
      g.sx = e.clientX;
      g.sy = e.clientY;
      g.lx = e.clientX;
      g.ly = e.clientY;
      g.moved = false;
    } else if (g.pts.size === 2) {
      const [a, b] = Array.from(g.pts.values());
      g.dist = Math.hypot(a.x - b.x, a.y - b.y);
      g.moved = true;
    }
  };
  const onMove = (e: {
    pointerId: number;
    clientX: number;
    clientY: number;
  }) => {
    const g = gest.current;
    if (!g.pts.has(e.pointerId)) return;
    g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pts.size >= 2) {
      const [a, b] = Array.from(g.pts.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.dist > 0) zoomAt(d / g.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      g.dist = d;
      return;
    }
    if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 6)
      g.moved = true;
    const v = vbRef.current;
    const el = svgRef.current;
    if (g.moved && v.w < 1279 && el) {
      const k = v.w / el.getBoundingClientRect().width;
      applyVb(
        clampVb(
          v.x - (e.clientX - g.lx) * k,
          v.y - (e.clientY - g.ly) * k,
          v.w,
        ),
      );
    }
    g.lx = e.clientX;
    g.ly = e.clientY;
  };
  const onUp = (e: { pointerId: number }) => {
    const g = gest.current;
    g.pts.delete(e.pointerId);
    if (g.pts.size === 0) setVb(vbRef.current);
    else if (g.pts.size === 1) {
      const [a] = Array.from(g.pts.values());
      g.lx = a.x;
      g.ly = a.y;
    }
  };
  const zoomBtn = {
    background: "#FFFFFF",
    color: INK,
    border: `1px solid ${UI_LINE}`,
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(45,58,54,0.18)",
    minWidth: 44,
    minHeight: 34,
  } as const;
  const pairs = new Map<string, number>();
  LINKS.forEach((l: Link2) => {
    const ua = unitById(l.a);
    const ub = unitById(l.b);
    if (!ua || !ub || ua.island === ub.island) return;
    const key = [ua.island, ub.island].sort().join("|");
    pairs.set(key, (pairs.get(key) || 0) + 1);
  });

  const talk = (id: string): ReactNode => {
    if (
      props.reacting === id &&
      !id.startsWith("crew-") &&
      !(props.bubbleNow && props.bubbleNow.id === id)
    )
      return bubble(
        id.startsWith("idol-") ? "（粉絲應援）加油！" : "嘿！一起加油！",
      );
    if (props.bubbleNow && props.bubbleNow.id === id)
      return bubble(props.bubbleNow.text);
    return null;
  };

  const walker = (
    id: string,
    path: string,
    dur: number,
    delay: number,
    kind: number,
    seed: number,
    dancing: boolean,
    sx: number,
    sy: number,
    tag?: string,
    tagLight?: boolean,
  ) => (
    <g
      key={id}
      className="gi-char"
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        props.onPoke(id);
      }}
    >
      <g transform={m ? undefined : `translate(${sx},${sy})`}>
        {m ? (
          <animateMotion
            dur={`${dur}s`}
            begin={`-${delay}s`}
            repeatCount="indefinite"
            path={path}
          />
        ) : null}
        <g
          key={props.reacting === id ? `hop-${id}` : `idle-${id}`}
          className={props.reacting === id ? "gi-hop" : undefined}
        >
          <g transform="scale(1.3)">{chibi(kind, seed, m, dancing)}</g>
        </g>
        {tag ? (
          <g>
            <rect
              x={-tag.length * 6 - 6}
              y={3}
              width={tag.length * 12 + 12}
              height={15}
              rx={7.5}
              fill={tagLight ? "#FFFFFF" : ORANGE}
              stroke={tagLight ? ORANGE : "none"}
              strokeWidth={1}
            />
            <text
              x={0}
              y={14}
              textAnchor="middle"
              fill={tagLight ? INK : "#FFFFFF"}
              fontSize={10}
              fontWeight={700}
            >
              {tag}
            </text>
          </g>
        ) : null}
        {talk(id)}
      </g>
    </g>
  );

  return (
    <div
      data-grok-keep-colors="true"
      style={{ position: "relative", colorScheme: "light" }}
    >
      <svg
        data-grok-keep-colors="true"
        ref={svgRef}
        width="100%"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.w * 0.5625}`}
        role="img"
        aria-label="會考讀書島動態地圖（可縮放）"
        className={m ? undefined : "gi-still"}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
        style={{
          display: "block",
          touchAction: vb.w < 1279 ? "none" : "pan-y",
          cursor: vb.w < 1279 ? "grab" : "default",
          userSelect: "none",
          fontFamily:
            "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
        }}
      >
        <defs>
          <linearGradient id="gi-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6AAEB4" />
            <stop offset="1" stopColor={SEA_DEEP} />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={0}
          width={1280}
          height={720}
          rx={28}
          fill="url(#gi-sea)"
        />
        {[
          [90, 120],
          [300, 260],
          [620, 90],
          [1000, 300],
          [120, 640],
          [560, 690],
          [980, 690],
          [1180, 560],
          [760, 420],
          [340, 380],
        ].map(([wx, wy]: number[], i: number) => (
          <g
            key={`w-${i}`}
            className={m ? "gi-wave" : undefined}
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            <path
              d={`M${wx},${wy} q8,-4 16,0 t16,0`}
              stroke="#8CC6C8"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${wx + 30},${wy + 10} q8,-4 16,0`}
              stroke="#8CC6C8"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
        {[
          [200, 330],
          [560, 440],
          [990, 610],
          [330, 670],
          [1210, 470],
          [760, 70],
          [60, 420],
        ].map(([sx, sy]: number[], i: number) => (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r={1.8}
            fill="#FFFFFF"
            className={m ? "gi-twinkle" : undefined}
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
        {islet(0, 52, 650, m, "is0")}
        {islet(1, 640, 680, m, "is1")}
        {islet(2, 1225, 640, m, "is2")}
        {islet(3, 1235, 300, m, "is3")}

        <g>
          {m ? (
            <animateMotion
              dur="52s"
              repeatCount="indefinite"
              path="M-80,610 C300,580 700,640 1360,600"
            />
          ) : null}
          <g transform={m ? undefined : "translate(330,612)"}>
            <path d="M-18,0 L18,0 L12,8 L-12,8 Z" fill="#FFFFFF" />
            <path d="M0,0 L18,0 L12,8 L0,8 Z" fill="#E4DFD3" />
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-26}
              stroke="#5B5A52"
              strokeWidth={1.3}
            />
            <polygon points="1,-25 1,-3 16,-3" fill={CREAM} />
            <polygon points="-1,-21 -1,-3 -12,-3" fill={ORANGE} />
          </g>
        </g>
        <g>
          {m ? (
            <animateMotion
              dur="64s"
              begin="-24s"
              repeatCount="indefinite"
              path="M1360,270 C1000,300 600,250 -80,290"
            />
          ) : null}
          <g transform={m ? undefined : "translate(1000,270)"}>
            <path d="M-14,0 L14,0 L9,7 L-9,7 Z" fill={ORANGE} />
            {isoBox(8, 6, 7, CREAM, "#E4DFD3", "#FFFFFF")}
          </g>
        </g>
        {[0, 1, 2].map((i: number) => (
          <g key={`bird-${i}`}>
            {m ? (
              <animateMotion
                dur={`${30 + i * 6}s`}
                begin={`-${i * 9}s`}
                repeatCount="indefinite"
                path={`M-60,${120 + i * 26} C400,${90 + i * 30} 800,${150 + i * 10} 1340,${100 + i * 20}`}
              />
            ) : null}
            <path
              transform={
                m ? undefined : `translate(${300 + i * 300},${110 + i * 20})`
              }
              d="M-7,0 Q-3.5,-5 0,0 Q3.5,-5 7,0"
              stroke="#FFFFFF"
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* 島嶼淺灘與陰影 */}
        {ISLANDS.map((isl: Island) => (
          <g key={`sh-${isl.id}`}>
            <ellipse
              cx={isl.x}
              cy={isl.y + 16}
              rx={136}
              ry={80}
              fill={SHALLOW}
              opacity={0.55}
            />
            <ellipse
              cx={isl.x + 10}
              cy={isl.y + 26}
              rx={104}
              ry={60}
              fill="#4C8E96"
              opacity={0.3}
            />
          </g>
        ))}

        {/* 協作棧橋與過橋的角色 */}
        {Array.from(pairs.entries()).map(
          ([key, n]: [string, number], idx: number) => {
            const [ia, ib] = key.split("|");
            const A = islandById(ia);
            const B = islandById(ib);
            if (!A || !B) return null;
            const on = props.selected === ia || props.selected === ib;
            const path = `M${A.x},${A.y + 4} L${B.x},${B.y + 4} L${A.x},${A.y + 4}`;
            const id = `br-${key}`;
            const mx = (A.x + B.x) / 2;
            const my = (A.y + B.y) / 2;
            return (
              <g key={key}>
                <line
                  x1={A.x}
                  y1={A.y + 10}
                  x2={B.x}
                  y2={B.y + 10}
                  stroke={SIDE_R}
                  strokeWidth={12}
                  strokeLinecap="round"
                />
                <line
                  x1={A.x}
                  y1={A.y + 4}
                  x2={B.x}
                  y2={B.y + 4}
                  stroke={on ? "#FFF3DE" : FOAM}
                  strokeWidth={11}
                  strokeLinecap="round"
                />
                <line
                  x1={A.x}
                  y1={A.y + 4}
                  x2={B.x}
                  y2={B.y + 4}
                  stroke={on ? ORANGE : PAVE}
                  strokeWidth={7}
                  strokeDasharray="3 4"
                />
                <rect
                  x={mx - 30}
                  y={my - 7}
                  width={60}
                  height={22}
                  rx={11}
                  fill="#2D3A36"
                  opacity={0.14}
                />
                <rect
                  x={mx - 30}
                  y={my - 9}
                  width={60}
                  height={22}
                  rx={11}
                  fill="#FFFFFF"
                />
                <text
                  x={mx}
                  y={my + 6}
                  textAnchor="middle"
                  fill={on ? ORANGE : INK}
                  fontSize={11.5}
                  fontWeight={700}
                >{`協作 ${n}`}</text>
                {walker(
                  id,
                  path,
                  26 + (idx % 5) * 4,
                  idx * 3,
                  idx % 4 === 1 ? 1 : idx % 4 === 3 ? 2 : 0,
                  idx + 3,
                  false,
                  (A.x * 2 + B.x) / 3,
                  (A.y * 2 + B.y) / 3 + 4,
                )}
              </g>
            );
          },
        )}

        {/* 島嶼 */}
        {ISLANDS.map((isl: Island, ii: number) => {
          const p = props.progress[isl.id] || 0;
          const sel = props.selected === isl.id;
          const hit = props.hits.has(isl.id);
          const lvl = p >= 1 ? 3 : p >= 0.5 ? 2 : p > 0 ? 1 : 0;
          const fest = p >= 1;
          const houses = Math.floor(p * 6);
          const walkers = 2 + Math.floor(p * 3);
          const ring = `M${isl.x - 60},${isl.y + 2} a60,32 0 1,0 120,0 a60,32 0 1,0 -120,0`;
          const num = String(ii + 1).padStart(2, "0");
          const label = `${isl.name}`;
          const lw = 92 + label.length * 15;
          const ly = isl.y + HRY + HD + 6;
          return (
            <g
              key={isl.id}
              className="gi-isl"
              onClick={() => props.onPick(isl.id)}
            >
              <g
                className={m ? "gi-float" : undefined}
                style={{ animationDelay: `${ii * 0.55}s` }}
              >
                {hexIsland(isl)}
                {p > 0 ? (
                  <ellipse
                    cx={isl.x}
                    cy={isl.y}
                    rx={76}
                    ry={42}
                    fill={LIGHT}
                    opacity={0.12 + p * 0.3}
                    className={fest && m ? "gi-pulse" : undefined}
                  />
                ) : null}
                {sel || hit ? (
                  <polygon
                    points={pts(
                      [0, 60, 120, 180, 240, 300].map((d: number): Pt => [
                        isl.x + (HR + 10) * Math.cos((Math.PI / 180) * d),
                        isl.y + (HRY + 6) * Math.sin((Math.PI / 180) * d),
                      ]),
                    )}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    strokeDasharray="10 7"
                    strokeLinejoin="round"
                  />
                ) : null}
                {DECO.slice()
                  .sort((a2: Pt, b2: Pt) => a2[1] - b2[1])
                  .map((v: Pt, k: number) => {
                    const orig = DECO.indexOf(v);
                    return orig < houses ? (
                      smallHouse(
                        isl.x + v[0],
                        isl.y + v[1],
                        ACC[isl.id],
                        true,
                        `h-${orig}`,
                        m,
                      )
                    ) : (
                      <g key={`d-${orig}`}>
                        {tree(
                          isl.x + v[0] - 7,
                          isl.y + v[1],
                          0.95,
                          `ta-${orig}`,
                          m,
                          (orig + ii) % 3,
                        )}
                        {tree(
                          isl.x + v[0] + 9,
                          isl.y + v[1] + 4,
                          0.75,
                          `tb-${orig}`,
                          m,
                          (orig + ii + 1) % 3,
                        )}
                        {k % 2 === 0
                          ? rock(
                              isl.x + v[0] + 2,
                              isl.y + v[1] + 8,
                              0.8,
                              `rk-${orig}`,
                            )
                          : flowers(
                              isl.x + v[0] - 14,
                              isl.y + v[1] + 8,
                              `fl-${orig}`,
                            )}
                      </g>
                    );
                  })}
                {lamp(isl.x - 36, isl.y + 14, p > 0, "l1", m)}
                {lamp(isl.x + 38, isl.y + 12, p >= 0.5, "l2", m)}
                {flowers(isl.x - 22, isl.y - 14, "fc1")}
                {flowers(isl.x + 26, isl.y - 12, "fc2")}
                {BUSH_SPOTS.map((v: Pt, k: number) =>
                  tree(
                    isl.x + v[0],
                    isl.y + v[1],
                    k < 2 ? 0.8 : 0.7,
                    `bs-${k}`,
                    m,
                    (k + ii) % 3,
                  ),
                )}
                {FLOWER_SPOTS.map((v: Pt, k: number) =>
                  flowerCluster(isl.x + v[0], isl.y + v[1], k + ii, `fs-${k}`),
                )}
                {bench(isl.x - 52, isl.y + 18, "bn")}
                {planter(isl.x + 16, isl.y + 44, "pl1", ii)}
                {planter(isl.x - 14, isl.y - 42, "pl2", ii + 1)}
                {facility(isl.id, lvl, isl.x, isl.y + 6, 1.08, m)}
                {isl.id === "math" && (
                  <g aria-label="努力裝飾">
                    {props.hits.has("first-log") &&
                      tree(isl.x + 72, isl.y + 23, 1.2, "effort-tree", m, 1)}
                    {props.hits.has("hour") && (
                      <g>
                        {bench(isl.x - 40, isl.y - 34, "effort-tea")}
                        <path
                          d={`M${isl.x - 56},${isl.y - 58} L${isl.x - 40},${isl.y - 75} L${isl.x - 24},${isl.y - 58}Z`}
                          fill="#DDB977"
                        />
                      </g>
                    )}
                    {props.hits.has("math-three") && (
                      <g transform={`translate(${isl.x + 112},${isl.y + 35})`}>
                        <path d="M-18 0H18L10 9H-10Z" fill="#A47F5B" />
                        <path
                          d="M0 0V-28L15-8H0"
                          fill="#FFF4D8"
                          stroke="#895E43"
                        />
                      </g>
                    )}
                    {props.hits.has("five-hours") && (
                      <g transform={`translate(${isl.x - 73},${isl.y + 30})`}>
                        <rect
                          x="-4"
                          y="-42"
                          width="8"
                          height="42"
                          fill="#FFF5D1"
                        />
                        <circle cy="-45" r="7" fill="#FFD98A" />
                      </g>
                    )}
                  </g>
                )}
                {Array.from({ length: walkers }).map((_: unknown, k: number) =>
                  walker(
                    `isl-${isl.id}-${k}`,
                    ring,
                    20 + k * 5 + (ii % 3) * 2,
                    k * 6 + ii,
                    k === 0 ? 1 : k === 2 ? 2 : k === 3 ? 3 : 0,
                    ii * 2 + k,
                    fest,
                    isl.x - 50 + k * 30,
                    isl.y + 22,
                  ),
                )}
                {fest ? (
                  <g>
                    <path
                      d={`M${isl.x - 86},${isl.y - 44} Q${isl.x},${isl.y - 14} ${isl.x + 86},${isl.y - 44}`}
                      stroke="#5B5A52"
                      strokeWidth={1}
                      fill="none"
                    />
                    {Array.from({ length: 9 }).map((_: unknown, k: number) => {
                      const tt = (k + 0.5) / 9;
                      const fx = isl.x - 86 + 172 * tt;
                      const fy =
                        (1 - tt) * (1 - tt) * (isl.y - 44) +
                        2 * (1 - tt) * tt * (isl.y - 14) +
                        tt * tt * (isl.y - 44);
                      return (
                        <polygon
                          key={k}
                          points={`${fx - 5},${fy} ${fx + 5},${fy} ${fx},${fy + 10}`}
                          fill={[ORANGE, "#F2C14E", "#FFFFFF", ACC.phy][k % 4]}
                        />
                      );
                    })}
                    {m ? fireworks(isl.x, isl.y, "fw") : null}
                  </g>
                ) : null}
                {isl.priority ? (
                  <g transform={`translate(${isl.x + 74},${isl.y - 6})`}>
                    <line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={-44}
                      stroke="#5B5A52"
                      strokeWidth={1.6}
                    />
                    <polygon
                      points="0,-44 30,-37 0,-29"
                      fill={ORANGE}
                      className={m ? "gi-flag" : undefined}
                    />
                    <text
                      x={11}
                      y={-33.5}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={9}
                      fontWeight={700}
                    >
                      優先
                    </text>
                  </g>
                ) : null}
                <rect
                  x={isl.x - lw / 2}
                  y={ly + 2}
                  width={lw}
                  height={30}
                  rx={15}
                  fill="#2D3A36"
                  opacity={0.16}
                />
                <rect
                  x={isl.x - lw / 2}
                  y={ly}
                  width={lw}
                  height={30}
                  rx={15}
                  fill="#FFFFFF"
                  stroke={sel ? ORANGE : "none"}
                  strokeWidth={2}
                />
                <text
                  x={isl.x - lw / 2 + 14}
                  y={ly + 20}
                  fill={ORANGE}
                  fontSize={13}
                  fontWeight={700}
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {num}
                </text>
                <text
                  x={isl.x - lw / 2 + 38}
                  y={ly + 20.5}
                  fill={INK}
                  fontSize={15}
                  fontWeight={700}
                >
                  {fest ? `${label}・慶典` : label}
                </text>
                <text
                  x={isl.x + lw / 2 - 12}
                  y={ly + 20}
                  textAnchor="end"
                  fill="#8A8478"
                  fontSize={11.5}
                >{`建築 ${Math.round(p * 100)}%`}</text>
              </g>
            </g>
          );
        })}

        {/* 粉絲自製 Q 版角色（在應援卡設定裡開關） */}
        {IDOL_CHIBI.filter((c: { name: string }) =>
          props.idolsOn.includes(c.name),
        ).map(
          (c: {
            name: string;
            kind: number;
            island: string;
            delay: number;
          }) => {
            const isl = islandById(c.island);
            if (!isl) return null;
            const ring = `M${isl.x - 60},${isl.y + 2} a60,32 0 1,0 120,0 a60,32 0 1,0 -120,0`;
            return walker(
              `idol-${c.kind}`,
              ring,
              24,
              c.delay,
              c.kind,
              0,
              (props.progress[c.island] || 0) >= 1,
              isl.x + 40,
              isl.y + 26,
              c.name,
            );
          },
        )}

        {/* 固定角色：心知肚明、王珮瑜、劉映桐、蔡小雷、詹姆獅、啾啾 */}
        {CREW.map((c: Crew, ci: number) => {
          if (c.island === "loop")
            return walker(
              `crew-${c.kind}`,
              LION_LOOP,
              70,
              0,
              c.kind,
              0,
              false,
              800,
              290,
              c.name,
              true,
            );
          const isl = islandById(c.island);
          if (!isl) return null;
          const ring = `M${isl.x - 60},${isl.y + 2} a60,32 0 1,0 120,0 a60,32 0 1,0 -120,0`;
          return walker(
            `crew-${c.kind}`,
            ring,
            22 + ci * 2,
            c.delay,
            c.kind,
            0,
            (props.progress[c.island] || 0) >= 1,
            isl.x - 44,
            isl.y + 24,
            c.name,
            true,
          );
        })}

        {/* 介面：標誌卡與圖例（仿政策島的奶油色圓角卡片） */}
        <g>
          <rect
            x={20}
            y={20}
            width={236}
            height={66}
            rx={16}
            fill="#2D3A36"
            opacity={0.12}
          />
          <rect x={18} y={16} width={236} height={66} rx={16} fill="#F2EEE4" />
          <text x={34} y={46} fill={ORANGE} fontSize={24} fontWeight={900}>
            會考 GO!
          </text>
          <text
            x={34}
            y={70}
            fill={ORANGE}
            fontSize={11}
            fontWeight={700}
            fontFamily="ui-monospace, Menlo, monospace"
          >
            考試日期請見設定
          </text>
          <text x={160} y={46} fill={INK} fontSize={18} fontWeight={900}>
            讀書島
          </text>
          <text
            x={160}
            y={70}
            fill={INK}
            fontSize={11}
          >{`${ISLANDS.length} 島・${UNITS.length} 單元`}</text>
        </g>
        <g transform="translate(860,676)">
          <rect
            x={0}
            y={2}
            width={300}
            height={30}
            rx={15}
            fill="#2D3A36"
            opacity={0.12}
          />
          <rect x={0} y={0} width={300} height={30} rx={15} fill="#FFFFFF" />
          {[
            ["未讀", "#CFC9BE"],
            ["讀過", ACC.phy],
            ["複習過", LIT],
            ["考過", "#F2C14E"],
          ].map(([lab, col]: string[], i: number) => (
            <g key={lab} transform={`translate(${18 + i * 70},15)`}>
              <circle cx={0} cy={0} r={5} fill={col} />
              {i === 3 ? (
                <polygon
                  points="0,-4 1.2,-1.2 4,-1.2 1.8,0.6 2.6,3.4 0,1.8 -2.6,3.4 -1.8,0.6 -4,-1.2 -1.2,-1.2"
                  fill="#FFFFFF"
                />
              ) : null}
              <text x={10} y={4} fill={INK} fontSize={11.5}>
                {lab}
              </text>
            </g>
          ))}
        </g>

        {/* 飄過的雲 */}
        {[
          [150, 0],
          [60, 30],
          [230, 55],
        ].map(([cy, d]: number[], i: number) => (
          <g
            key={`cloud-${i}`}
            className={m ? "gi-cloud" : undefined}
            style={{ animationDelay: `-${d}s` }}
            opacity={0.9}
          >
            <g transform={`translate(${m ? 0 : 300 + i * 380},${cy})`}>
              <ellipse cx={0} cy={0} rx={46} ry={14} fill="#FFFFFF" />
              <ellipse cx={-20} cy={-7} rx={20} ry={13} fill="#FFFFFF" />
              <ellipse cx={14} cy={-11} rx={24} ry={16} fill="#FFFFFF" />
              <ellipse cx={4} cy={6} rx={40} ry={6} fill="#E9EEF0" />
            </g>
          </g>
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          type="button"
          aria-label="放大"
          style={zoomBtn}
          onClick={() => zoomCenter(1.5)}
        >
          ＋
        </button>
        <button
          type="button"
          aria-label="縮小"
          style={zoomBtn}
          onClick={() => zoomCenter(1 / 1.5)}
        >
          －
        </button>
        <button
          type="button"
          aria-label="全景"
          style={zoomBtn}
          onClick={() => {
            applyVb({ x: 0, y: 0, w: 1280 });
            setVb({ x: 0, y: 0, w: 1280 });
          }}
        >
          全景
        </button>
      </div>
      {vb.w > 1279 ? (
        <div
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            background: "rgba(255,255,255,0.88)",
            color: INK,
            borderRadius: 8,
            padding: "3px 8px",
            fontSize: 11,
            pointerEvents: "none",
          }}
        >
          雙指、Ctrl＋滾輪或＋鈕縮放・拉近後可拖曳
        </div>
      ) : null}
    </div>
  );
}

// ===== v7：真 3D 讀書島（原生 WebGL，不靠外部函式庫；低面數、平面著色，可旋轉縮放） =====

export {
  CHEERS,
  TALK,
  IDOL_LINES,
  IDOL_OPTIONS,
  IDOL_SAYS,
  idolLineFor,
  CONFETTI,
  unitById,
  islandById,
  pick,
  CSS,
  C30,
  S30,
  pts,
  shade,
  mix,
  hexPath,
  isoBox,
  gable,
  pyramid,
  LF,
  RF,
  center,
  tree,
  rock,
  flowers,
  smallHouse,
  lamp,
  facility,
  SHIRTS,
  BOTTOMS,
  HAIRS,
  face,
  chibiLegacy,
  SKIN,
  OLS,
  EYE,
  PASTEL_TOPS,
  PASTEL_BOTTOMS,
  HAIR_SOFT,
  STYLES,
  TOPS,
  ACCS,
  studentLook,
  LOOKS,
  kidFace,
  hairBack,
  hairFront,
  person,
  lion,
  TEE_BLACK,
  SILVER,
  SILVER_D,
  APRON,
  APRON_S,
  STRAP,
  HAIR_BLACK,
  idolHead,
  idolBody,
  idolBust,
  mom,
  FACE_SH,
  LINE,
  BRASS,
  hairBack6,
  hairCap6,
  face6,
  figure,
  XU_LOOK,
  ZENG_LOOK,
  SHEN_LOOK,
  JAY_LOOK,
  MOM_LOOK,
  idolPortrait,
  LP_F,
  lpBlob,
  bench,
  planter,
  chibi,
  GOAL_SCHOOL,
  ANIMALS,
  CREW,
  crewByKind,
  LION_LOOP,
  FLOWER_SPOTS,
  BUSH_SPOTS,
  FLOWER_SETS,
  flowerCluster,
  bubble,
  Mascot,
  Dice,
  fireworks,
  islet,
  IDOL_CHIBI,
  IDOL_PHOTO_XU,
  IDOL_PHOTO_ZENG,
  IDOL_PHOTO_SHEN,
  IDOL_PHOTO_JAY,
  IDOL_PHOTOS,
  IdolBadge,
  HR,
  HRY,
  HD,
  DECO,
  hexIsland,
  IslandWorld,
};
export type { Pt, Look, Crew, Ani, WorldProps };
