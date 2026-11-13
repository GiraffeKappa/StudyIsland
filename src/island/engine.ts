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
import {
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
} from "./art";
import type { Pt, Look, Crew, Ani, WorldProps } from "./art";
type V3 = [number, number, number];
type TF = (v: V3) => V3;
interface MeshB {
  d: number[];
}
interface GMesh {
  buf: WebGLBuffer | null;
  n: number;
}
const T_TOP = 1.9;
const wx = (x: number): number => (x - 640) / 10;
const wz = (y: number): number => (y - 360) / 5.65;
const rgb = (h: string): V3 => {
  const v = parseInt(h.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};
const mb = (): MeshB => ({ d: [] });
const ID: TF = (v: V3): V3 => v;
const tf = (
  tx: number,
  ty: number,
  tz: number,
  ry = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): TF => {
  const c = Math.cos(ry),
    s = Math.sin(ry);
  return (v: V3): V3 => {
    const x = v[0] * sx,
      y = v[1] * sy,
      z = v[2] * sz;
    return [tx + x * c + z * s, ty + y, tz - x * s + z * c];
  };
};
function tri(m: MeshB, a: V3, b: V3, c: V3, col: V3, ctr: V3, jit = 0.05) {
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2],
    vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  let nx = uy * vz - uz * vy,
    ny = uz * vx - ux * vz,
    nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  const gx = (a[0] + b[0] + c[0]) / 3,
    gy = (a[1] + b[1] + c[1]) / 3,
    gz = (a[2] + b[2] + c[2]) / 3;
  if ((gx - ctr[0]) * nx + (gy - ctr[1]) * ny + (gz - ctr[2]) * nz < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  const h = Math.sin(gx * 12.99 + gy * 78.23 + gz * 37.71) * 43758.5;
  const k = 1 + (h - Math.floor(h) - 0.5) * jit;
  const cr = Math.min(1, col[0] * k),
    cg = Math.min(1, col[1] * k),
    cb = Math.min(1, col[2] * k);
  for (const p of [a, b, c]) m.d.push(p[0], p[1], p[2], nx, ny, nz, cr, cg, cb);
}
function prism(
  m: MeshB,
  T: TF,
  r0: number,
  r1: number,
  y0: number,
  y1: number,
  sides: number,
  col: V3,
  a0 = 0,
  cap = true,
) {
  const ctr = T([0, (y0 + y1) / 2, 0]);
  for (let i = 0; i < sides; i++) {
    const a = a0 + (i * Math.PI * 2) / sides,
      b = a0 + ((i + 1) * Math.PI * 2) / sides;
    const p0: V3 = [r0 * Math.cos(a), y0, r0 * Math.sin(a)],
      p1: V3 = [r0 * Math.cos(b), y0, r0 * Math.sin(b)];
    const q0: V3 = [r1 * Math.cos(a), y1, r1 * Math.sin(a)],
      q1: V3 = [r1 * Math.cos(b), y1, r1 * Math.sin(b)];
    tri(m, T(p0), T(p1), T(q1), col, ctr);
    if (r1 > 0) tri(m, T(p0), T(q1), T(q0), col, ctr);
    if (cap && r1 > 0)
      tri(m, T([0, y1, 0]), T(q0), T(q1), col, T([0, y1 - 5, 0]), 0.02);
  }
}
function ring(
  m: MeshB,
  T: TF,
  ri: number,
  ro: number,
  y: number,
  seg: number,
  col: V3,
) {
  const below = T([0, y - 5, 0]);
  for (let i = 0; i < seg; i++) {
    const a = (i * Math.PI * 2) / seg,
      b = ((i + 1) * Math.PI * 2) / seg;
    const p0 = T([ri * Math.cos(a), y, ri * Math.sin(a)]),
      p1 = T([ri * Math.cos(b), y, ri * Math.sin(b)]);
    const q0 = T([ro * Math.cos(a), y, ro * Math.sin(a)]),
      q1 = T([ro * Math.cos(b), y, ro * Math.sin(b)]);
    tri(m, p0, q0, q1, col, below, 0.02);
    tri(m, p0, q1, p1, col, below, 0.02);
  }
}
function box(
  m: MeshB,
  T: TF,
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  col: V3,
) {
  const x0 = cx - sx / 2,
    x1 = cx + sx / 2,
    y0 = cy - sy / 2,
    y1 = cy + sy / 2,
    z0 = cz - sz / 2,
    z1 = cz + sz / 2;
  const P = (x: number, y: number, z: number): V3 => T([x, y, z]);
  const c = T([cx, cy, cz]);
  const f = (a: V3, b: V3, d: V3, e: V3) => {
    tri(m, a, b, d, col, c, 0.03);
    tri(m, a, d, e, col, c, 0.03);
  };
  f(P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1));
  f(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1));
  f(P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0));
  f(P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0));
  f(P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0));
}
const ICO_V: V3[] = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  return (
    [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1],
    ] as V3[]
  ).map((v: V3): V3 => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  });
})();
const ICO_F: number[][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];
const ICO1: V3[][] = (() => {
  const nrm = (v: V3): V3 => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const mid = (a: V3, b: V3): V3 =>
    nrm([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
  const out: V3[][] = [];
  ICO_F.forEach((f: number[]) => {
    const a = ICO_V[f[0]],
      b = ICO_V[f[1]],
      c = ICO_V[f[2]];
    const ab = mid(a, b),
      bc = mid(b, c),
      ca = mid(c, a);
    out.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
  });
  return out;
})();
const ICO0: V3[][] = ICO_F.map((f: number[]) => [
  ICO_V[f[0]],
  ICO_V[f[1]],
  ICO_V[f[2]],
]);
function ico(
  m: MeshB,
  T: TF,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  col: V3,
  sub = 1,
  keep?: (c: V3) => boolean,
  jit = 0.09,
) {
  const ctr = T([cx, cy, cz]);
  (sub ? ICO1 : ICO0).forEach((f: V3[]) => {
    if (keep) {
      const g: V3 = [
        (f[0][0] + f[1][0] + f[2][0]) / 3,
        (f[0][1] + f[1][1] + f[2][1]) / 3,
        (f[0][2] + f[1][2] + f[2][2]) / 3,
      ];
      if (!keep(g)) return;
    }
    const P = (v: V3): V3 =>
      T([cx + v[0] * rx, cy + v[1] * ry, cz + v[2] * rz]);
    tri(m, P(f[0]), P(f[1]), P(f[2]), col, ctr, jit);
  });
}
function gableHouse(
  m: MeshB,
  T: TF,
  w: number,
  d: number,
  h: number,
  rh: number,
  wall: V3,
  roof: V3,
  win: V3,
) {
  box(m, T, 0, h / 2, 0, w, h, d, wall);
  const c = T([0, h, 0]);
  const A = T([-w / 2 - 0.12, h, -d / 2 - 0.12]),
    B = T([w / 2 + 0.12, h, -d / 2 - 0.12]),
    C = T([w / 2 + 0.12, h, d / 2 + 0.12]),
    D = T([-w / 2 - 0.12, h, d / 2 + 0.12]);
  const R1 = T([-w / 2 - 0.12, h + rh, 0]),
    R2 = T([w / 2 + 0.12, h + rh, 0]);
  tri(m, D, C, R2, roof, c);
  tri(m, D, R2, R1, roof, c);
  tri(m, A, B, R2, roof, c);
  tri(m, A, R2, R1, roof, c);
  tri(m, A, D, R1, roof, c);
  tri(m, B, C, R2, roof, c);
  box(m, T, 0, h * 0.5, d / 2 + 0.02, w * 0.3, h * 0.35, 0.05, win);
}

// ---------- 低面數 Q 版人物（大圓頭、多面體頭髮、簡單身體） ----------
interface Parts3 {
  core: MeshB;
  legL: MeshB;
  legR: MeshB;
  armL: MeshB;
  armR: MeshB;
  arms: boolean;
  raised?: boolean;
}
function person3(L: Look, special: string): Parts3 {
  const P: Parts3 = {
    core: mb(),
    legL: mb(),
    legR: mb(),
    armL: mb(),
    armR: mb(),
    arms: L.hands !== "chin",
  };
  const c = P.core;
  const skin = rgb(SKIN),
    top = rgb(L.topC),
    top2 = rgb(L.topC2 || L.topC),
    bot = rgb(L.bottomC),
    hair = rgb(L.hair),
    shoe = rgb(L.shoe || "#FFFFFF");
  const bare = L.bottom !== "pants";
  const lift = special === "mom" ? 0.08 : 0;
  for (const [mm, x] of [
    [P.legL, -0.13],
    [P.legR, 0.13],
  ] as [MeshB, number][]) {
    box(
      mm,
      ID,
      0,
      -0.22 - lift / 2,
      0,
      0.17,
      0.44 + lift,
      0.2,
      bare ? skin : bot,
    );
    box(mm, ID, 0, -0.42 - lift, 0.04, 0.21, 0.1, 0.3, shoe);
    void x;
  }
  const by = 0.46 + lift;
  prism(c, ID, 0.36, 0.3, by, by + 0.6, 8, top, Math.PI / 8);
  if (L.bottom === "skirt")
    prism(c, ID, 0.47, 0.35, by - 0.06, by + 0.2, 8, bot, Math.PI / 8, false);
  if (L.bottom === "shorts" || L.bottom === "pants")
    prism(c, ID, 0.37, 0.36, by - 0.04, by + 0.14, 8, bot, Math.PI / 8, false);
  if (L.bottom === "longskirt")
    prism(c, ID, 0.5, 0.36, 0.06, by + 0.18, 8, bot, Math.PI / 8, false);
  if (L.top === "dress")
    prism(c, ID, 0.5, 0.33, by - 0.1, by + 0.45, 8, top, Math.PI / 8, false);
  const fz = 0.33;
  if (L.top === "uniform") {
    box(c, ID, 0, by + 0.56, -0.02, 0.56, 0.08, 0.5, top2);
    box(c, ID, 0, by + 0.44, fz, 0.14, 0.1, 0.04, rgb("#FF7A85"));
  }
  if (special === "goal") {
    box(c, ID, 0, by + 0.34, fz + 0.02, 0.1, 0.32, 0.04, rgb("#22396B"));
    box(c, ID, -0.19, by + 0.4, fz + 0.01, 0.15, 0.12, 0.03, rgb("#22396B"));
    box(c, ID, -0.19, by + 0.4, fz + 0.03, 0.07, 0.05, 0.02, rgb("#F2C14E"));
  }
  if (L.top === "hoodie") {
    prism(c, ID, 0.34, 0.36, by + 0.5, by + 0.66, 8, top2, Math.PI / 8, false);
    box(c, ID, 0, by + 0.16, fz - 0.02, 0.34, 0.14, 0.04, top2);
  }
  if (L.top === "overalls") {
    box(c, ID, 0, by + 0.25, fz - 0.02, 0.38, 0.34, 0.05, top2);
    box(c, ID, -0.15, by + 0.47, fz - 0.04, 0.05, 0.2, 0.04, top2);
    box(c, ID, 0.15, by + 0.47, fz - 0.04, 0.05, 0.2, 0.04, top2);
  }
  if (L.top === "apron") {
    box(c, ID, 0, by + 0.22, fz, 0.5, 0.46, 0.04, rgb(APRON));
    box(c, ID, -0.15, by + 0.5, fz - 0.03, 0.06, 0.2, 0.04, rgb(STRAP));
    box(c, ID, 0.15, by + 0.5, fz - 0.03, 0.06, 0.2, 0.04, rgb(STRAP));
    box(c, ID, -0.15, by + 0.4, fz + 0.02, 0.08, 0.06, 0.03, rgb(BRASS));
    box(c, ID, 0.15, by + 0.4, fz + 0.02, 0.08, 0.06, 0.03, rgb(BRASS));
    box(c, ID, -0.08, by + 0.17, fz + 0.03, 0.2, 0.12, 0.03, rgb(APRON_S));
    box(c, ID, -0.13, by + 0.25, fz + 0.04, 0.025, 0.12, 0.02, rgb("#1E1E22"));
    box(c, ID, -0.09, by + 0.25, fz + 0.04, 0.025, 0.12, 0.02, rgb("#1E1E22"));
    box(c, ID, 0.0, by + 0.18, fz + 0.05, 0.06, 0.08, 0.02, rgb("#2F6DB5"));
    box(c, ID, 0, by + 0.6, 0.27, 0.16, 0.03, 0.03, rgb(SILVER));
  }
  if (L.top === "jacket") {
    box(c, ID, 0, by + 0.3, fz - 0.01, 0.2, 0.56, 0.03, rgb("#FFFFFF"));
    for (let i = 0; i < 6; i++)
      box(
        c,
        ID,
        0,
        by + 0.07 + i * 0.09,
        fz + 0.01,
        0.21,
        0.035,
        0.02,
        rgb(TEE_BLACK),
      );
    box(c, ID, -0.16, by + 0.35, fz - 0.005, 0.04, 0.04, 0.03, rgb(SILVER));
    box(c, ID, 0.16, by + 0.35, fz - 0.005, 0.04, 0.04, 0.03, rgb(SILVER));
  }
  if (L.top === "suit") {
    box(c, ID, 0, by + 0.45, fz, 0.2, 0.26, 0.03, rgb("#FFFFFF"));
    box(c, ID, 0, by + 0.33, fz + 0.02, 0.07, 0.4, 0.02, top2);
    box(
      c,
      ID,
      -0.12,
      by + 0.42,
      fz + 0.01,
      0.06,
      0.3,
      0.025,
      rgb(shade(L.topC, 0.78)),
    );
    box(
      c,
      ID,
      0.12,
      by + 0.42,
      fz + 0.01,
      0.06,
      0.3,
      0.025,
      rgb(shade(L.topC, 0.78)),
    );
  }
  if (L.top === "blazer") {
    box(c, ID, 0, by + 0.3, fz - 0.005, 0.2, 0.58, 0.03, top2);
    box(c, ID, -0.13, by + 0.42, fz + 0.01, 0.07, 0.3, 0.025, top2);
    box(c, ID, 0.13, by + 0.42, fz + 0.01, 0.07, 0.3, 0.025, top2);
    box(c, ID, -0.2, by + 0.12, fz, 0.16, 0.2, 0.03, top2);
  }
  if (L.top === "cardigan") {
    box(c, ID, 0, by + 0.22, fz, 0.42, 0.42, 0.04, top2);
    box(c, ID, 0, by + 0.24, fz + 0.025, 0.12, 0.1, 0.03, rgb("#FF8FA3"));
  }
  if (L.acc === "backpack")
    box(c, ID, 0, by + 0.3, -0.36, 0.5, 0.46, 0.18, rgb(L.accC));
  // 手臂（以肩膀為軸）
  const sleeve = top;
  if (L.hands === "fist" || L.hands === "finger") {
    P.raised = true;
    box(c, ID, 0.5, by + 0.5, 0.04, 0.28, 0.15, 0.17, sleeve);
    box(c, ID, 0.67, by + 0.74, 0.06, 0.15, 0.4, 0.17, sleeve);
    if (L.hands === "fist")
      ico(c, ID, 0.67, by + 1.0, 0.08, 0.14, 0.14, 0.14, skin, 0);
    else {
      ico(c, ID, 0.67, by + 0.99, 0.08, 0.12, 0.12, 0.12, skin, 0);
      box(c, ID, 0.67, by + 1.2, 0.1, 0.06, 0.24, 0.06, skin);
    }
  }
  if (P.arms) {
    for (const mm of [P.armL, P.armR]) {
      box(mm, ID, 0, -0.2, 0, 0.15, 0.42, 0.17, sleeve);
      ico(mm, ID, 0, -0.45, 0, 0.1, 0.1, 0.1, skin, 0);
    }
  } else {
    const ct = (x: number): TF => tf(x, by + 0.42, 0.16, 0, 1, 1, 1);
    box(c, ct(-0.3), 0, 0, 0, 0.16, 0.16, 0.42, sleeve);
    box(c, ct(0.3), 0, 0, 0, 0.16, 0.16, 0.42, sleeve);
    box(c, ID, -0.17, by + 0.55, 0.36, 0.2, 0.15, 0.16, sleeve);
    box(c, ID, 0.17, by + 0.55, 0.36, 0.2, 0.15, 0.16, sleeve);
    box(c, ID, -0.17, by + 0.5, 0.36, 0.21, 0.04, 0.17, rgb("#FFFFFF"));
    box(c, ID, 0.17, by + 0.5, 0.36, 0.21, 0.04, 0.17, rgb("#FFFFFF"));
    ico(c, ID, 0, by + 0.68, 0.42, 0.15, 0.13, 0.11, skin, 0);
  }
  // 頭
  const hy = by + 1.05;
  const rx = special === "xu" ? 0.53 : special === "zeng" ? 0.59 : 0.56,
    ry = 0.55,
    rz = 0.54;
  ico(c, ID, -rx + 0.02, hy - 0.02, 0, 0.1, 0.13, 0.08, skin, 0);
  ico(c, ID, rx - 0.02, hy - 0.02, 0, 0.1, 0.13, 0.08, skin, 0);
  ico(c, ID, 0, hy, 0, rx, ry, rz, skin, 1, undefined, 0.05);
  const fzz = (x: number, y: number): number =>
    rz *
      Math.sqrt(
        Math.max(
          0.02,
          1 - (x / rx) * (x / rx) - ((y - hy) / ry) * ((y - hy) / ry),
        ),
      ) +
    0.01;
  const fb = (x: number, y: number, w: number, h: number, col: string) =>
    box(c, ID, x, y, fzz(x, y), w, h, 0.05, rgb(col));
  const eye =
    special === "zeng"
      ? [0.17, 0.05]
      : special === "xu"
        ? [0.14, 0.08]
        : special === "mom"
          ? [0.15, 0.04]
          : [0.1, 0.14];
  fb(-0.2, hy - 0.02, eye[0], eye[1], EYE);
  fb(0.2, hy - 0.02, eye[0], eye[1], EYE);
  if (special === "zeng") {
    fb(-0.2, hy + 0.04, 0.12, 0.03, EYE);
    fb(0.2, hy + 0.04, 0.12, 0.03, EYE);
  }
  if (special === "xu" || special === "zeng") {
    const bw = special === "zeng" ? 0.06 : 0.04;
    fb(-0.21, hy + 0.14, 0.19, bw, HAIR_BLACK);
    fb(0.21, hy + 0.14, 0.19, bw, HAIR_BLACK);
  }
  fb(-0.33, hy - 0.15, 0.13, 0.06, "#FF9AA8");
  fb(0.33, hy - 0.15, 0.13, 0.06, "#FF9AA8");
  if (special === "zeng") {
    fb(0, hy - 0.22, 0.24, 0.1, "#B9524E");
    fb(0, hy - 0.195, 0.2, 0.04, "#FFFFFF");
  } else if (special === "xu") {
    fb(0, hy - 0.22, 0.16, 0.06, "#B9524E");
    fb(0, hy - 0.205, 0.13, 0.025, "#FFFFFF");
  } else if (L.mouth === "open") fb(0, hy - 0.22, 0.1, 0.08, "#E86F72");
  else fb(0, hy - 0.21, 0.1, 0.035, "#B5615A");
  if (special === "xu")
    ico(c, ID, rx + 0.03, hy - 0.12, 0.02, 0.035, 0.035, 0.035, rgb(SILVER), 0);
  if (L.acc === "glasses") {
    const g = rgb(L.accC || "#8A6E5D");
    for (const sx of [-0.2, 0.2]) {
      box(c, ID, sx, hy + 0.08, fzz(sx, hy) + 0.01, 0.24, 0.025, 0.02, g);
      box(c, ID, sx, hy - 0.12, fzz(sx, hy) + 0.01, 0.24, 0.025, 0.02, g);
      box(
        c,
        ID,
        sx - 0.12,
        hy - 0.02,
        fzz(sx - 0.12, hy) + 0.01,
        0.025,
        0.22,
        0.02,
        g,
      );
      box(
        c,
        ID,
        sx + 0.12,
        hy - 0.02,
        fzz(sx + 0.12, hy) + 0.01,
        0.025,
        0.22,
        0.02,
        g,
      );
    }
  }
  // 頭髮：多面體髮帽＋依髮型加髮束
  const st = L.hairStyle;
  const frontCut =
    st === "fringe"
      ? 0.24
      : st === "tousled" || st === "messy" || st === "spiky"
        ? 0.3
        : st === "mom"
          ? 0.42
          : 0.36;
  const hr = 1.09;
  const capTop =
    st === "tousled" || st === "messy" || st === "spiky" ? 1.2 : 1.1;
  ico(
    c,
    ID,
    0,
    hy + 0.02,
    -0.01,
    rx * hr,
    ry * capTop,
    rz * hr,
    hair,
    1,
    (g: V3) => (g[2] > 0.35 ? g[1] > frontCut : g[1] > -0.28),
    0.14,
  );
  if (st === "tousled" || st === "messy" || st === "spiky") {
    const tufts: V3[] = [
      [-0.3, 0.5, 0.25],
      [0.05, 0.6, 0.3],
      [0.32, 0.5, 0.22],
      [-0.15, 0.66, -0.05],
      [0.22, 0.64, -0.08],
      [-0.38, 0.36, -0.15],
      [0.4, 0.38, -0.12],
      [0, 0.55, -0.32],
    ];
    tufts.forEach((t: V3, i: number) =>
      ico(
        c,
        ID,
        t[0],
        hy + t[1],
        t[2],
        0.2 + (i % 3) * 0.03,
        0.14,
        0.2,
        hair,
        0,
        undefined,
        0.2,
      ),
    );
    [
      [-0.3, 0.27],
      [-0.1, 0.24],
      [0.12, 0.26],
      [0.3, 0.29],
    ].forEach(([x, y]: number[]) =>
      ico(
        c,
        ID,
        x - 0.04,
        hy + y,
        fzz(x, hy + y) - 0.03,
        0.11,
        0.12,
        0.07,
        hair,
        0,
        undefined,
        0.2,
      ),
    );
  }
  if (st === "fringe") {
    [
      [-0.34, 0.18],
      [-0.17, 0.15],
      [0, 0.16],
      [0.17, 0.15],
      [0.34, 0.18],
    ].forEach(([x, y]: number[]) =>
      ico(
        c,
        ID,
        x,
        hy + y,
        fzz(x, hy + y) - 0.04,
        0.12,
        0.12,
        0.08,
        hair,
        0,
        undefined,
        0.2,
      ),
    );
    [
      [-0.2, 0.58, 0.1],
      [0.15, 0.6, 0.05],
      [0, 0.56, -0.25],
    ].forEach((t: number[]) =>
      ico(
        c,
        ID,
        t[0],
        hy + t[1],
        t[2],
        0.17,
        0.1,
        0.17,
        hair,
        0,
        undefined,
        0.2,
      ),
    );
  }
  if (st === "long")
    ico(
      c,
      ID,
      0,
      hy - 0.35,
      -0.22,
      0.6,
      0.55,
      0.32,
      hair,
      1,
      (g: V3) => g[2] < 0.2,
    );
  if (st === "bob" || st === "mom")
    ico(
      c,
      ID,
      0,
      hy - 0.12,
      -0.04,
      rx * 1.12,
      0.42,
      rz * 1.1,
      hair,
      1,
      (g: V3) => g[2] < 0.3 && g[1] > -0.7,
    );
  if (st === "mom") ico(c, ID, 0.42, hy - 0.2, -0.32, 0.2, 0.2, 0.2, hair, 0);
  if (st === "pony") {
    ico(c, ID, 0, hy + 0.05, -0.62, 0.2, 0.22, 0.2, hair, 0);
    ico(c, ID, 0, hy - 0.25, -0.66, 0.15, 0.24, 0.14, hair, 0);
  }
  if (st === "bun") ico(c, ID, 0, hy + 0.66, -0.08, 0.24, 0.22, 0.24, hair, 0);
  if (L.acc === "headband")
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (0.12 + (0.76 * i) / 8);
      box(
        c,
        ID,
        Math.cos(a) * rx * 1.12,
        hy + 0.12 + Math.sin(a) * ry * 1.12,
        0.12,
        0.12,
        0.09,
        0.14,
        rgb(L.accC),
      );
    }
  if (L.acc === "clip") {
    ico(c, ID, 0.38, hy + 0.36, 0.3, 0.08, 0.08, 0.08, rgb(L.accC), 0);
    ico(c, ID, 0.47, hy + 0.27, 0.3, 0.08, 0.08, 0.08, rgb(L.accC), 0);
  }
  if (L.acc === "bow") {
    box(c, ID, 0.22, hy + 0.55, 0.12, 0.16, 0.12, 0.08, rgb(L.accC));
    box(c, ID, 0.4, hy + 0.5, 0.12, 0.16, 0.12, 0.08, rgb(L.accC));
  }
  if (L.acc === "cap") {
    prism(c, ID, rx * 1.12, rx * 0.9, hy + 0.28, hy + 0.56, 10, rgb(L.accC));
    box(c, ID, 0, hy + 0.3, 0.55, 0.62, 0.05, 0.36, rgb(L.accC));
  }
  if (L.acc === "propeller") {
    prism(c, ID, 0.42, 0.3, hy + 0.45, hy + 0.62, 10, rgb("#FFF1B8"));
    box(c, ID, 0, hy + 0.72, 0, 0.04, 0.16, 0.04, rgb("#8A6E5D"));
    box(c, ID, 0, hy + 0.8, 0, 0.9, 0.03, 0.12, rgb("#8FB8DE"));
  }
  if (L.acc === "bolt")
    box(c, ID, 0.3, hy + 0.55, 0.1, 0.14, 0.24, 0.06, rgb(L.accC));
  return P;
}
function animal3(kind: number): Parts3 {
  const P: Parts3 = {
    core: mb(),
    legL: mb(),
    legR: mb(),
    armL: mb(),
    armR: mb(),
    arms: false,
  };
  const c = P.core;
  const fur = rgb(
    kind === 14
      ? "#E3B04B"
      : kind === 1
        ? "#C99A6E"
        : kind === 2
          ? "#F0B27A"
          : "#F9DE6E",
  );
  const belly = rgb(kind === 3 ? "#FFF3B0" : "#FBEBD8");
  for (const mm of [P.legL, P.legR])
    box(
      mm,
      ID,
      0,
      -0.16,
      0,
      0.17,
      0.32,
      0.2,
      kind === 3 ? rgb("#E08A3A") : fur,
    );
  ico(c, ID, 0, 0.6, 0, 0.45, 0.42, 0.4, fur, 1);
  ico(c, ID, 0, 0.58, 0.18, 0.3, 0.28, 0.26, belly, 0);
  const hy = kind === 3 ? 0.95 : 1.3;
  if (kind === 14)
    ico(
      c,
      ID,
      0,
      hy,
      -0.05,
      0.78,
      0.76,
      0.6,
      rgb("#B9783A"),
      1,
      (g: V3) => g[2] < 0.45,
      0.16,
    );
  if (kind !== 3)
    ico(
      c,
      ID,
      0,
      hy,
      0.05,
      0.5,
      0.46,
      0.45,
      kind === 14 ? rgb("#F2C66B") : fur,
      1,
    );
  if (kind === 1 || kind === 14) {
    ico(c, ID, -0.36, hy + 0.36, 0, 0.14, 0.14, 0.1, fur, 0);
    ico(c, ID, 0.36, hy + 0.36, 0, 0.14, 0.14, 0.1, fur, 0);
  }
  if (kind === 2) {
    prism(c, tf(-0.27, hy + 0.3, 0.02), 0.14, 0, 0, 0.3, 3, fur, Math.PI / 2);
    prism(c, tf(0.27, hy + 0.3, 0.02), 0.14, 0, 0, 0.3, 3, fur, Math.PI / 2);
    box(c, ID, 0, 0.5, -0.5, 0.1, 0.1, 0.4, fur);
  }
  if (kind === 3) {
    box(c, ID, 0, 0.62, 0.43, 0.14, 0.08, 0.12, rgb("#E08A3A"));
    box(c, ID, -0.44, 0.6, 0, 0.08, 0.3, 0.26, rgb("#F2CF4E"));
    box(c, ID, 0.44, 0.6, 0, 0.08, 0.3, 0.26, rgb("#F2CF4E"));
  }
  const ez = kind === 3 ? 0.38 : 0.48,
    ey = kind === 3 ? 0.72 : hy + 0.04;
  box(c, ID, -0.16, ey, ez, 0.08, 0.1, 0.04, rgb(EYE));
  box(c, ID, 0.16, ey, ez, 0.08, 0.1, 0.04, rgb(EYE));
  if (kind !== 3) {
    box(c, ID, 0, ey - 0.12, ez + 0.03, 0.1, 0.06, 0.04, rgb("#5A3E33"));
    box(c, ID, -0.3, ey - 0.12, ez - 0.06, 0.12, 0.05, 0.03, rgb("#FF9AA8"));
    box(c, ID, 0.3, ey - 0.12, ez - 0.06, 0.12, 0.05, 0.03, rgb("#FF9AA8"));
  }
  if (kind === 14) box(c, ID, 0, 0.5, -0.5, 0.1, 0.1, 0.45, fur);
  return P;
}
function animalX(kind: number): Parts3 {
  const P: Parts3 = {
    core: mb(),
    legL: mb(),
    legR: mb(),
    armL: mb(),
    armR: mb(),
    arms: false,
  };
  const c = P.core;
  const C: Record<number, string[]> = {
    20: ["#F4EFE8", "#FFFFFF", "#F4EFE8"],
    21: ["#2F3A48", "#FFFFFF", "#F29A3A"],
    22: ["#9C9AA2", "#E8E4E0", "#4A4850"],
    23: ["#E39B4E", "#FFF4E6", "#E39B4E"],
    24: ["#8A5E3C", "#E2C29A", "#6E4A2E"],
    25: ["#9A6E4C", "#EBD9B8", "#9A6E4C"],
    26: ["#C9A27A", "#F2DEC2", "#C9A27A"],
    27: ["#A9A4A0", "#E8E2D8", "#A9A4A0"],
  };
  const cs = C[kind] || C[20];
  const fur = rgb(cs[0]),
    belly = rgb(cs[1]),
    legc = rgb(cs[2]),
    dark = rgb("#3A3A40");
  const owl = kind === 25 || kind === 27,
    peng = kind === 21;
  for (const mm of [P.legL, P.legR])
    box(mm, ID, 0, -0.16, 0, 0.17, 0.32, 0.2, legc);
  ico(
    c,
    ID,
    0,
    0.6,
    0,
    owl || peng ? 0.5 : 0.45,
    owl || peng ? 0.55 : 0.42,
    0.42,
    fur,
    1,
  );
  ico(
    c,
    ID,
    0,
    0.58,
    0.18,
    peng ? 0.36 : 0.3,
    peng ? 0.4 : 0.28,
    0.27,
    belly,
    0,
  );
  const hy = owl ? 1.22 : 1.3;
  ico(
    c,
    ID,
    0,
    hy,
    0.05,
    0.5,
    0.46,
    0.45,
    kind === 26 ? rgb("#F2DEC2") : fur,
    1,
  );
  let ez = 0.48;
  const ey = hy + 0.04;
  if (kind === 20) {
    for (const sx of [-0.17, 0.17]) {
      box(c, ID, sx, hy + 0.7, -0.02, 0.15, 0.62, 0.09, fur);
      box(c, ID, sx, hy + 0.7, 0.03, 0.08, 0.48, 0.02, rgb("#FFB3C1"));
    }
    ico(c, ID, 0, 0.45, -0.44, 0.14, 0.14, 0.14, belly, 0);
  }
  if (peng) {
    ico(c, ID, 0, hy - 0.03, 0.2, 0.36, 0.32, 0.3, belly, 0);
    ez = 0.53;
    box(c, ID, 0, ey - 0.14, ez + 0.03, 0.14, 0.08, 0.12, rgb("#F29A3A"));
    box(c, ID, -0.5, 0.65, 0, 0.08, 0.42, 0.22, fur);
    box(c, ID, 0.5, 0.65, 0, 0.08, 0.42, 0.22, fur);
  }
  if (kind === 22) {
    box(c, ID, 0, ey, ez - 0.02, 0.66, 0.17, 0.04, dark);
    for (const sx of [-0.36, 0.36]) {
      ico(c, ID, sx, hy + 0.36, 0, 0.14, 0.14, 0.1, fur, 0);
      ico(c, ID, sx, hy + 0.38, 0.05, 0.07, 0.07, 0.06, dark, 0);
    }
    for (let i = 0; i < 5; i++)
      box(
        c,
        ID,
        0,
        0.42 + i * 0.13,
        -0.5 - i * 0.07,
        0.22,
        0.14,
        0.22,
        i % 2 ? dark : fur,
      );
    box(c, ID, 0, ey - 0.16, ez - 0.02, 0.24, 0.1, 0.05, belly);
  }
  if (kind === 23) {
    prism(c, tf(-0.27, hy + 0.3, 0.02), 0.14, 0, 0, 0.3, 3, fur, Math.PI / 2);
    prism(c, tf(0.27, hy + 0.3, 0.02), 0.14, 0, 0, 0.3, 3, fur, Math.PI / 2);
    ico(c, ID, 0, ey - 0.15, ez - 0.03, 0.22, 0.13, 0.1, belly, 0);
    ico(c, ID, 0, 0.9, -0.42, 0.17, 0.17, 0.17, fur, 0);
    ico(c, ID, 0.05, 0.98, -0.44, 0.09, 0.09, 0.09, belly, 0);
  }
  if (kind === 24) {
    for (const sx of [-0.34, 0.34])
      ico(c, ID, sx, hy + 0.28, 0, 0.1, 0.1, 0.08, fur, 0);
    ico(c, ID, 0, ey - 0.15, ez - 0.03, 0.26, 0.15, 0.1, belly, 0);
    box(c, ID, 0, 0.22, -0.62, 0.24, 0.08, 0.55, rgb("#6E4A2E"));
  }
  if (owl) {
    for (const sx of [-0.18, 0.18]) {
      box(c, ID, sx, ey, ez - 0.01, 0.26, 0.26, 0.04, rgb("#FFFFFF"));
      prism(
        c,
        tf(sx * 1.6, hy + 0.36, 0),
        0.1,
        0,
        0,
        0.24,
        3,
        fur,
        Math.PI / 2,
      );
    }
    box(c, ID, 0, ey - 0.16, ez + 0.02, 0.09, 0.12, 0.06, rgb("#F2B33A"));
    box(c, ID, -0.5, 0.62, 0, 0.08, 0.46, 0.3, fur);
    box(c, ID, 0.5, 0.62, 0, 0.08, 0.46, 0.3, fur);
    if (kind === 27) {
      box(c, ID, 0, hy + 0.5, 0, 0.7, 0.05, 0.7, dark);
      prism(c, ID, 0.22, 0.24, hy + 0.36, hy + 0.5, 8, dark);
      box(c, ID, 0.3, hy + 0.38, 0.3, 0.03, 0.24, 0.03, rgb("#F2C14E"));
    }
  }
  if (kind === 26)
    ico(
      c,
      ID,
      0,
      0.82,
      -0.12,
      0.6,
      0.62,
      0.55,
      rgb("#6B4A34"),
      1,
      (g: V3) => g[2] < 0.15,
      0.28,
    );
  if (kind === 22)
    for (const sx of [-0.16, 0.16]) {
      box(c, ID, sx, ey, ez, 0.12, 0.12, 0.04, rgb("#FFFFFF"));
      box(c, ID, sx, ey, ez + 0.01, 0.07, 0.09, 0.04, rgb(EYE));
    }
  else {
    box(c, ID, -(owl ? 0.18 : 0.16), ey, ez + 0.01, 0.08, 0.1, 0.04, rgb(EYE));
    box(c, ID, owl ? 0.18 : 0.16, ey, ez + 0.01, 0.08, 0.1, 0.04, rgb(EYE));
  }
  if (!owl && !peng)
    box(c, ID, 0, ey - 0.12, ez + 0.03, 0.1, 0.06, 0.04, rgb("#5A3E33"));
  box(c, ID, -0.3, ey - 0.12, ez - 0.06, 0.12, 0.05, 0.03, rgb("#FF9AA8"));
  box(c, ID, 0.3, ey - 0.12, ez - 0.06, 0.12, 0.05, 0.03, rgb("#FF9AA8"));
  return P;
}
function charParts(
  kind: number,
  seed: number,
): { parts: Parts3; scale: number } {
  const r = charParts0(kind, seed);
  return { parts: r.parts, scale: r.scale * 1.6 };
}
function charParts0(
  kind: number,
  seed: number,
): { parts: Parts3; scale: number } {
  if (kind === 14 || kind === 1 || kind === 2 || kind === 3)
    return { parts: animal3(kind), scale: kind === 14 ? 1.15 : 0.85 };
  if (kind >= 20 && kind <= 29) return { parts: animalX(kind), scale: 0.9 };
  if (kind === 18) return { parts: person3(LOOKS[18], "goal"), scale: 1.08 };
  if (kind === 4) return { parts: person3(XU_LOOK, "xu"), scale: 1.05 };
  if (kind === 5) return { parts: person3(ZENG_LOOK, "zeng"), scale: 1.05 };
  if (kind === 13) return { parts: person3(MOM_LOOK, "mom"), scale: 1.05 };
  if (kind === 16) return { parts: person3(SHEN_LOOK, "shen"), scale: 1.05 };
  if (kind === 17) return { parts: person3(JAY_LOOK, "jay"), scale: 1.05 };
  if (kind === 15) return { parts: person3(LOOKS[15], ""), scale: 0.82 };
  if (LOOKS[kind]) return { parts: person3(LOOKS[kind], ""), scale: 1 };
  return { parts: person3(studentLook(seed), ""), scale: 0.95 };
}

// ---------- 場景：島、樹、花、長椅、橋、設施 ----------
const sp = (v: Pt): [number, number] => [v[0] / 10, v[1] / 5.65];
function tree3(m: MeshB, x: number, z: number, s: number, v: number) {
  const T = tf(x, T_TOP, z, v * 1.3, s, s, s);
  prism(m, T, 0.16, 0.12, 0, 0.8, 5, rgb(TRUNK));
  if (v === 1) {
    prism(m, T, 0.85, 0, 0.6, 1.9, 7, rgb(PINE), 0.3);
    prism(m, T, 0.65, 0, 1.3, 2.4, 7, rgb(shade(PINE, 1.08)), 0.7);
  } else
    ico(
      m,
      T,
      0,
      1.35,
      0,
      0.8,
      0.75,
      0.8,
      rgb(v === 0 ? LEAF_D : LEAF_L),
      0,
      undefined,
      0.22,
    );
}
function flowers3(m: MeshB, x: number, z: number, v: number) {
  const cs = FLOWER_SETS[v % FLOWER_SETS.length];
  ico(
    m,
    ID,
    x,
    T_TOP + 0.05,
    z,
    0.55,
    0.12,
    0.35,
    rgb(LEAF_L),
    0,
    undefined,
    0.1,
  );
  [
    [0, 0],
    [0.3, 0.1],
    [-0.28, 0.12],
    [0.12, -0.18],
    [-0.14, -0.15],
  ].forEach(([dx, dz]: number[], i: number) =>
    ico(
      m,
      ID,
      x + dx,
      T_TOP + 0.22,
      z + dz,
      0.09,
      0.07,
      0.09,
      rgb(cs[i % 3]),
      0,
      undefined,
      0.05,
    ),
  );
}
function bench3(m: MeshB, x: number, z: number, ry: number) {
  const T = tf(x, T_TOP, z, ry);
  box(m, T, -0.55, 0.15, 0, 0.08, 0.3, 0.35, rgb("#6E5A4A"));
  box(m, T, 0.55, 0.15, 0, 0.08, 0.3, 0.35, rgb("#6E5A4A"));
  box(m, T, 0, 0.33, 0, 1.4, 0.07, 0.42, rgb("#D9A86C"));
  box(m, T, 0, 0.58, -0.2, 1.4, 0.22, 0.06, rgb("#C9965C"));
}
function lamp3(m: MeshB, x: number, z: number, on: boolean) {
  prism(m, tf(x, T_TOP, z), 0.06, 0.06, 0, 1.6, 5, rgb("#5B5A52"));
  ico(
    m,
    ID,
    x,
    T_TOP + 1.72,
    z,
    0.16,
    0.16,
    0.16,
    rgb(on ? LIT : "#EDE6D6"),
    0,
    undefined,
    0.02,
  );
}
function facility3(m: MeshB, id: string, X: number, Z: number, lvl: number) {
  const T = tf(X, T_TOP, Z);
  const wall = rgb(WALL),
    acc = rgb(ACC[id] || ORANGE),
    win = rgb(lvl > 0 ? LIT : WIN);
  if (id === "math") {
    box(m, T, 0, 2.4, 0, 2, 4.8, 2, wall);
    prism(m, T, 1.75, 0, 4.8, 6.4, 4, acc, Math.PI / 4);
    box(m, T, 0, 3.9, 1.02, 0.9, 0.9, 0.06, rgb("#FFFFFF"));
    box(m, T, 0, 4.0, 1.06, 0.06, 0.4, 0.04, rgb(INK));
    box(m, T, 0.12, 3.9, 1.06, 0.3, 0.05, 0.04, rgb(INK));
    box(m, T, 0, 1.4, 1.02, 0.6, 1.0, 0.06, win);
  } else if (id === "phy") {
    box(m, T, 0, 1.0, 0, 4, 2, 2.8, wall);
    ico(
      m,
      T,
      0.6,
      2.0,
      0,
      1.1,
      1.1,
      1.1,
      rgb("#BFD9E6"),
      1,
      (g: V3) => g[1] > 0,
    );
    prism(m, T, 0.25, 0.25, 2, 3.2, 6, acc);
    box(m, T, -1.2, 1.1, 1.42, 0.8, 0.7, 0.05, win);
    box(m, T, 0.3, 1.1, 1.42, 0.8, 0.7, 0.05, win);
  } else if (id === "bio") {
    box(m, T, 0, 0.9, 0, 4, 1.8, 2.8, rgb("#D6EDE4"));
    gableHouse(
      m,
      tf(X, T_TOP + 1.8, Z),
      4,
      2.8,
      0.01,
      1.1,
      rgb("#D6EDE4"),
      rgb("#A9D3C2"),
      win,
    );
    ico(m, T, -0.9, 1.0, 1.0, 0.5, 0.5, 0.5, rgb(LEAF_D), 0);
    ico(m, T, 0.9, 1.0, 1.0, 0.5, 0.5, 0.5, rgb(LEAF_L), 0);
  } else if (id === "earth") {
    prism(m, T, 1.6, 1.6, 0, 2.2, 10, wall);
    ico(m, T, 0, 2.2, 0, 1.6, 1.6, 1.6, rgb("#B9B4D8"), 1, (g: V3) => g[1] > 0);
    box(m, tf(X, T_TOP + 3.0, Z, 0.6), 0, 0, 0.8, 0.35, 0.35, 1.6, rgb(INK));
    box(m, T, 0, 1.0, 1.62, 0.6, 1.0, 0.05, win);
  } else if (id === "his") {
    box(m, T, 0, 1.2, 0, 3.2, 2.4, 3.2, wall);
    [
      [-1.5, -1.5],
      [1.5, -1.5],
      [-1.5, 1.5],
      [1.5, 1.5],
    ].forEach(([a, b]: number[]) => {
      prism(m, tf(X + a, T_TOP, Z + b), 0.6, 0.6, 0, 3.2, 8, wall);
      prism(m, tf(X + a, T_TOP, Z + b), 0.75, 0, 3.2, 4.4, 8, acc);
    });
    box(m, T, 0, 0.7, 1.62, 0.9, 1.4, 0.05, rgb("#8A6A50"));
    box(m, T, 0, 1.8, 1.62, 0.5, 0.5, 0.05, win);
  } else if (id === "geo") {
    for (let i = 0; i < 5; i++)
      prism(
        m,
        T,
        0.95 - i * 0.07,
        0.95 - (i + 1) * 0.07,
        i * 1.0,
        (i + 1) * 1.0,
        10,
        i % 2 ? rgb("#FFFFFF") : acc,
        0,
        false,
      );
    prism(m, T, 0.75, 0.75, 5, 5.7, 10, win);
    prism(m, T, 0.85, 0, 5.7, 6.5, 10, rgb(INK));
  } else if (id === "civ") {
    box(m, T, 0, 1.1, -0.3, 4, 2.2, 2.4, wall);
    for (let i = 0; i < 4; i++)
      prism(
        m,
        tf(X - 1.5 + i, T_TOP, Z + 1.2),
        0.16,
        0.16,
        0,
        2.2,
        6,
        rgb("#FFFFFF"),
      );
    gableHouse(m, tf(X, T_TOP + 2.2, Z), 4.3, 3, 0.01, 0.9, wall, acc, win);
  } else if (id === "eng") {
    box(m, T, 0, 1.0, -0.2, 3.2, 2, 2.4, wall);
    for (let i = 0; i < 6; i++)
      box(
        m,
        tf(X - 1.33 + i * 0.53, T_TOP + 2.0, Z + 1.3, 0),
        0,
        0,
        0,
        0.53,
        0.08,
        0.9,
        i % 2 ? rgb("#FFFFFF") : acc,
      );
    box(m, T, 0, 1.0, 1.02, 1.6, 0.8, 0.05, win);
    prism(
      m,
      tf(X + 1.6, T_TOP, Z + 2.2),
      0.4,
      0.4,
      0.55,
      0.62,
      8,
      rgb("#FFFFFF"),
    );
    prism(
      m,
      tf(X + 1.6, T_TOP, Z + 2.2),
      0.05,
      0.05,
      0,
      0.55,
      5,
      rgb("#5B5A52"),
    );
  } else {
    [
      [-1.2, -1.2],
      [1.2, -1.2],
      [-1.2, 1.2],
      [1.2, 1.2],
    ].forEach(([a, b]: number[]) =>
      prism(m, tf(X + a, T_TOP, Z + b), 0.15, 0.15, 0, 2, 6, rgb("#8A4A3A")),
    );
    prism(m, T, 2.4, 0.9, 2, 2.8, 6, acc, Math.PI / 6);
    prism(m, T, 1.3, 0, 2.8, 3.6, 6, acc, Math.PI / 6);
    box(m, T, 0, 0.35, 0, 1.4, 0.7, 1.0, rgb("#C9A27A"));
  }
}
interface Data3 {
  progress: Record<string, number>;
  selected: string;
  hits: string[];
  idolsOn: string[];
}
function buildScene(D: Data3): MeshB {
  const m = mb();
  prism(m, tf(4, -0.05, 0), 240, 240, -0.1, 0, 24, rgb(SEA_DEEP), 0);
  ISLANDS.forEach((isl: Island) =>
    prism(
      m,
      tf(wx(isl.x), 0, wz(isl.y)),
      14,
      14,
      -0.04,
      0.02,
      12,
      rgb(SHALLOW),
      0.2,
    ),
  );
  [
    [52, 650, 0],
    [640, 690, 1],
    [1225, 640, 2],
    [1235, 300, 3],
  ].forEach(([x, y, k]: number[]) => {
    const X = wx(x),
      Z = wz(y);
    prism(m, tf(X, 0, Z), 4, 4, -0.04, 0.02, 10, rgb(SHALLOW));
    prism(m, tf(X, 0, Z), 2.6, 2.2, 0, 0.6, 7, rgb("#E8D9B5"), k);
    if (k === 0) {
      prism(m, tf(X, 0.6, Z), 0.5, 0.4, 0, 3, 8, rgb("#FFFFFF"));
      prism(m, tf(X, 3.6, Z), 0.55, 0, 0, 0.8, 8, rgb(ORANGE));
      prism(m, tf(X, 1.2, Z), 0.48, 0.46, 0, 0.5, 8, rgb(ORANGE), 0, false);
    } else if (k === 2) {
      for (const dx of [-0.8, 0.8]) {
        prism(m, tf(X + dx, 0.6, Z), 0.08, 0.06, 0, 3.4, 5, rgb("#FFFFFF"));
        box(
          m,
          tf(X + dx, 4.0, Z + 0.1, dx),
          0,
          0,
          0,
          1.8,
          0.12,
          0.05,
          rgb("#FFFFFF"),
        );
      }
    } else {
      ico(
        m,
        ID,
        X - 0.5,
        0.8,
        Z,
        1.0,
        0.7,
        0.9,
        rgb("#B8AFA0"),
        0,
        undefined,
        0.2,
      );
      tree3(m, X + 0.9, Z + 0.3, 0.6, k % 2);
    }
  });
  // 協作橋
  const pairs = new Map<string, number>();
  LINKS.forEach((l: Link2) => {
    const ua = unitById(l.a),
      ub = unitById(l.b);
    if (!ua || !ub || ua.island === ub.island) return;
    const key = [ua.island, ub.island].sort().join("|");
    pairs.set(key, (pairs.get(key) || 0) + 1);
  });
  pairs.forEach((_n: number, key: string) => {
    const [ia, ib] = key.split("|");
    const A = islandById(ia),
      B = islandById(ib);
    if (!A || !B) return;
    const ax = wx(A.x),
      az = wz(A.y),
      bx = wx(B.x),
      bz = wz(B.y);
    let len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(bx - ax, bz - az);
    const T = tf((ax + bx) / 2, 0, (az + bz) / 2, ang);
    const on = D.selected === ia || D.selected === ib;
    const full = len;
    len = full - 15.6;
    void full;
    box(m, T, 0, 1.78, 0, 1.25, 0.22, len, rgb(FOAM));
    const nS = Math.floor(len / 0.9);
    for (let i = 0; i < nS; i++)
      box(
        m,
        T,
        0,
        1.9,
        -len / 2 + (i + 0.5) * (len / nS),
        0.95,
        0.04,
        (len / nS) * 0.5,
        rgb(on ? "#F6C9A8" : PAVE),
      );
    box(m, T, -0.6, 2.05, 0, 0.07, 0.07, len, rgb(on ? ORANGE : SIDE_R));
    box(m, T, 0.6, 2.05, 0, 0.07, 0.07, len, rgb(on ? ORANGE : SIDE_R));
    for (let s = -len / 2 + 1; s < len / 2 - 0.5; s += 3) {
      box(m, T, -0.6, 1.0, s, 0.12, 2.0, 0.12, rgb(SIDE_R));
      box(m, T, 0.6, 1.0, s, 0.12, 2.0, 0.12, rgb(SIDE_R));
    }
  });
  ISLANDS.forEach((isl: Island, ii: number) => {
    const X = wx(isl.x),
      Z = wz(isl.y);
    const p = D.progress[isl.id] || 0;
    const T = tf(X, 0, Z);
    prism(m, T, 9.2, 9.4, 0, 1.6, 6, rgb(SIDE_F), 0, false);
    prism(m, T, 9.2, 9.2, 1.6, 1.74, 6, rgb(FOAM));
    for (let e = 0; e < 6; e++) {
      const a = (e * Math.PI) / 3,
        b = ((e + 1) * Math.PI) / 3;
      const pa: [number, number] = [8.6 * Math.cos(a), 8.6 * Math.sin(a)],
        pb: [number, number] = [8.6 * Math.cos(b), 8.6 * Math.sin(b)];
      const n = 9;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const cx = pa[0] + (pb[0] - pa[0]) * t,
          cz = pa[1] + (pb[1] - pa[1]) * t;
        box(
          m,
          tf(X + cx, 1.78, Z + cz, Math.atan2(pb[0] - pa[0], pb[1] - pa[1])),
          0,
          0,
          0,
          0.5,
          0.07,
          (0.9 * 8.6) / n,
          rgb(i % 2 ? "#FFFFFF" : ORANGE),
        );
      }
    }
    prism(m, T, 8.1, 8.1, 1.74, 1.85, 6, rgb(SAGE));
    ring(m, T, 5.3, 6.6, 1.87, 20, rgb(PAVE));
    prism(m, T, 3.0, 3.0, 1.85, 1.89, 14, rgb(PAVE));
    if (D.selected === isl.id || D.hits.includes(isl.id))
      for (let i = 0; i < 24; i += 2) {
        const a = (i / 24) * Math.PI * 2;
        box(
          m,
          tf(X + 10 * Math.cos(a), 1.7, Z + 10 * Math.sin(a), -a),
          0,
          0,
          0,
          0.4,
          0.25,
          1.6,
          rgb("#FFFFFF"),
        );
      }
    const houses = Math.floor(p * 6);
    DECO.forEach((v: Pt, k: number) => {
      const [dx, dz] = sp(v);
      if (k < houses)
        gableHouse(
          m,
          tf(X + dx, T_TOP, Z + dz, k % 2 ? 0.3 : -0.3),
          1.6,
          1.3,
          1.1,
          0.7,
          rgb(WALL),
          rgb(ACC[isl.id] || ORANGE),
          rgb(LIT),
        );
      else {
        if (clearAt(X + dx - 0.7, Z + dz))
          tree3(m, X + dx - 0.7, Z + dz, 0.95, (k + ii) % 3);
        if (clearAt(X + dx + 0.9, Z + dz + 0.7))
          tree3(m, X + dx + 0.9, Z + dz + 0.7, 0.75, (k + ii + 1) % 3);
      }
    });
    BUSH_SPOTS.forEach((v: Pt, k: number) => {
      const [dx, dz] = sp(v);
      if (clearAt(X + dx, Z + dz))
        tree3(m, X + dx, Z + dz, k < 2 ? 0.8 : 0.7, (k + ii) % 3);
    });
    FLOWER_SPOTS.forEach((v: Pt, k: number) => {
      const [dx, dz] = sp(v);
      if (clearAt(X + dx, Z + dz)) flowers3(m, X + dx, Z + dz, k + ii);
    });
    bench3(m, X - 5.2, Z + 3.2, 0.3);
    bench3(m, X + 4.6, Z - 3.4, Math.PI + 0.4);
    lamp3(m, X - 3.6, Z + 2.5, p > 0);
    lamp3(m, X + 3.8, Z + 2.1, p >= 0.5);
    lamp3(m, X, Z - 4.4, p >= 1);
    facility3(m, isl.id, X, Z + 0.4, p >= 1 ? 3 : p >= 0.5 ? 2 : p > 0 ? 1 : 0);
    // Effort decorations are independent of mastery, so reassessment never removes them.
    if (isl.id === "math") {
      if (D.hits.includes("first-log")) tree3(m, X + 7, Z + 3, 1.25, 1);
      if (D.hits.includes("hour")) {
        bench3(m, X - 4, Z - 6, 0);
        prism(
          m,
          tf(X - 4, T_TOP + 2.4, Z - 6),
          1.5,
          0,
          0,
          0.7,
          8,
          rgb("#DDB977"),
        );
      }
      if (D.hits.includes("math-three")) rowboat3(m, tf(X + 11, 0.2, Z + 3, 0));
      if (D.hits.includes("five-hours")) {
        prism(
          m,
          tf(X - 7, T_TOP, Z + 4),
          0.45,
          0.38,
          0,
          3.7,
          8,
          rgb("#FFF5D1"),
        );
        ico(m, ID, X - 7, T_TOP + 4, Z + 4, 0.8, 0.8, 0.8, rgb("#FFD98A"));
      }
    }
    if (isl.priority) {
      prism(
        m,
        tf(X + 7.4, T_TOP, Z - 1),
        0.07,
        0.07,
        0,
        4.4,
        5,
        rgb("#5B5A52"),
      );
      tri(
        m,
        [X + 7.4, T_TOP + 4.4, Z - 1],
        [X + 7.4, T_TOP + 3.4, Z - 1],
        [X + 9.2, T_TOP + 3.9, Z - 1],
        rgb(ORANGE),
        [X + 8, T_TOP + 3.9, Z - 2],
      );
    }
    if (p >= 1)
      for (let i = 0; i < 9; i++) {
        const t = (i + 0.5) / 9;
        const x2 = X - 7 + 14 * t;
        const y2 = T_TOP + 3.6 - Math.sin(t * Math.PI) * 1.2;
        tri(
          m,
          [x2 - 0.35, y2, Z - 5],
          [x2 + 0.35, y2, Z - 5],
          [x2, y2 - 0.7, Z - 5],
          rgb([ORANGE, "#F2C14E", "#FFFFFF", ACC.phy][i % 4]),
          [x2, y2, Z - 6],
        );
      }
  });
  STATIONS.forEach((st: Sta) => props3(m, st));
  Object.keys(DOCK_DEG).forEach((id: string) => dock3(m, id));
  return m;
}

// ---------- 矩陣 ----------
type M4 = Float32Array;
const m4 = (): M4 => {
  const o = new Float32Array(16);
  o[0] = o[5] = o[10] = o[15] = 1;
  return o;
};
function mmul(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}
const mT = (x: number, y: number, z: number): M4 => {
  const o = m4();
  o[12] = x;
  o[13] = y;
  o[14] = z;
  return o;
};
const mRY = (a: number): M4 => {
  const o = m4();
  const c = Math.cos(a),
    s = Math.sin(a);
  o[0] = c;
  o[2] = -s;
  o[8] = s;
  o[10] = c;
  return o;
};
const mRX = (a: number): M4 => {
  const o = m4();
  const c = Math.cos(a),
    s = Math.sin(a);
  o[5] = c;
  o[6] = s;
  o[9] = -s;
  o[10] = c;
  return o;
};
const mS = (s: number): M4 => {
  const o = m4();
  o[0] = o[5] = o[10] = s;
  return o;
};
function persp(fy: number, asp: number, n: number, f: number): M4 {
  const t = 1 / Math.tan(fy / 2);
  const o = new Float32Array(16);
  o[0] = t / asp;
  o[5] = t;
  o[10] = (f + n) / (n - f);
  o[11] = -1;
  o[14] = (2 * f * n) / (n - f);
  return o;
}
function lookAt(e: V3, c: V3): M4 {
  let zx = e[0] - c[0],
    zy = e[1] - c[1],
    zz = e[2] - c[2];
  let l = Math.hypot(zx, zy, zz);
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = zz,
    xy = 0,
    xz = -zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx;
  const o = m4();
  o[0] = xx;
  o[4] = xy;
  o[8] = xz;
  o[1] = yx;
  o[5] = yy;
  o[9] = yz;
  o[2] = zx;
  o[6] = zy;
  o[10] = zz;
  o[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
  o[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
  o[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
  return o;
}

// ---------- 角色清單與路線 ----------
interface Walker3 {
  id: string;
  kind: number;
  seed: number;
  tag: string;
  path: (t: number) => [number, number, number, number];
  fest: boolean;
  trav: Trav | null;
  g: {
    parts: Record<string, GMesh>;
    arms: boolean;
    raised: boolean;
    scale: number;
  } | null;
}
function ringPath(X: number, Z: number, r: number, lap: number, ph: number) {
  return (t: number): [number, number, number, number] => {
    const a = ph + (t / lap) * Math.PI * 2;
    return [X + r * Math.cos(a), T_TOP, Z + r * Math.sin(a), -a];
  };
}
function walkerList(D: Data3): Walker3[] {
  const out: Walker3[] = [];
  const mk = (
    id: string,
    kind: number,
    seed: number,
    tag: string,
    path: (t: number) => [number, number, number, number],
    fest: boolean,
  ) => out.push({ id, kind, seed, tag, path, fest, trav: null, g: null });
  ISLANDS.forEach((isl: Island, ii: number) => {
    const p = D.progress[isl.id] || 0;
    const n = 2 + Math.floor(p * 3);
    for (let k = 0; k < n; k++)
      mk(
        `isl-${isl.id}-${k}`,
        k === 0 ? 1 : k === 2 ? 2 : k === 3 ? 3 : 0,
        ii * 2 + k,
        "",
        ringPath(
          wx(isl.x),
          wz(isl.y),
          5.95,
          20 + k * 5 + (ii % 3) * 2,
          (k / n) * Math.PI * 2 + ii,
        ),
        p >= 1,
      );
  });
  const seen: string[] = [];
  LINKS.forEach((l: Link2) => {
    const ua = unitById(l.a),
      ub = unitById(l.b);
    if (!ua || !ub || ua.island === ub.island) return;
    const key = [ua.island, ub.island].sort().join("|");
    if (!seen.includes(key)) seen.push(key);
  });
  seen.forEach((key: string, idx: number) => {
    const [ia, ib] = key.split("|");
    const A = islandById(ia),
      B = islandById(ib);
    if (!A || !B) return;
    const ax = wx(A.x),
      az = wz(A.y),
      bx = wx(B.x),
      bz = wz(B.y);
    const per = 26 + (idx % 5) * 4;
    mk(
      `br-${key}`,
      idx % 4 === 1 ? 1 : idx % 4 === 3 ? 2 : 0,
      idx + 3,
      "",
      (t: number): [number, number, number, number] => {
        const u = ((t + idx * 3) / per) % 1;
        const f = u < 0.5 ? u * 2 : 2 - u * 2;
        const e0 = 6.6 / Math.hypot(bx - ax, bz - az);
        const s = e0 + f * (1 - 2 * e0);
        const h = Math.atan2(bx - ax, bz - az) + (u < 0.5 ? 0 : Math.PI);
        return [ax + (bx - ax) * s, 1.92, az + (bz - az) * s, h];
      },
      false,
    );
  });
  IDOL_CHIBI.filter((c: { name: string }) =>
    D.idolsOn.includes(c.name),
  ).forEach(
    (c: { name: string; kind: number; island: string; delay: number }) => {
      const isl = islandById(c.island);
      if (!isl) return;
      mk(
        `idol-${c.kind}`,
        c.kind,
        0,
        c.name,
        ringPath(wx(isl.x), wz(isl.y), 5.95, 24, c.delay),
        (D.progress[c.island] || 0) >= 1,
      );
    },
  );
  CREW.forEach((c: Crew, ci: number) => {
    if (c.island === "loop") {
      const m2 = islandById("math");
      if (m2)
        mk(
          `crew-${c.kind}`,
          c.kind,
          0,
          c.name,
          ringPath(wx(m2.x), wz(m2.y), 4.1, 40, 1),
          false,
        );
      return;
    }
    const isl = islandById(c.island);
    if (!isl) return;
    mk(
      `crew-${c.kind}`,
      c.kind,
      0,
      c.name,
      ringPath(wx(isl.x), wz(isl.y), 5.95, 22 + ci * 2, c.delay + 2),
      (D.progress[c.island] || 0) >= 1,
    );
  });
  ANIMALS.forEach((a: Ani, ai: number) => {
    const isl = islandById(a.island);
    if (!isl) return;
    mk(
      `ani-${a.island}`,
      a.kind,
      30 + ai,
      `${a.type}・${a.name}`,
      ringPath(wx(isl.x), wz(isl.y), 5.95, 26 + ai, ai * 1.3 + 4),
      (D.progress[a.island] || 0) >= 1,
    );
  });
  // 有名字的角色和每座島的一位島民會到處旅行
  out.forEach((w: Walker3) => {
    const mm = /^isl-(\w+)-0$/.exec(w.id);
    if (mm) {
      w.trav = newTrav(mm[1], w.seed + 1);
      return;
    }
    if (w.id.startsWith("ani-")) {
      w.trav = newTrav(w.id.slice(4), w.seed + 7);
      return;
    }
    const c = CREW.find((x: Crew) => `crew-${x.kind}` === w.id);
    const ic = IDOL_CHIBI.find(
      (x: { kind: number }) => `idol-${x.kind}` === w.id,
    );
    if (c || ic)
      w.trav = newTrav(c ? c.island : ic ? ic.island : "math", w.kind + 3);
  });
  return out;
}

// ---------- v9：島民旅行、碼頭小船、島上小活動 ----------
const RING = 5.95;
const WALK = 1.6;
const BRIDGES: [string, string][] = (() => {
  const out: [string, string][] = [];
  LINKS.forEach((l: Link2) => {
    const ua = unitById(l.a),
      ub = unitById(l.b);
    if (!ua || !ub || ua.island === ub.island) return;
    const k = [ua.island, ub.island].sort();
    if (!out.some((p: [string, string]) => p[0] === k[0] && p[1] === k[1]))
      out.push([k[0], k[1]]);
  });
  return out;
})();
// 沒有橋的國文島、英文島靠碼頭坐船；數學、生物、歷史島也有碼頭，大家都能搭
const DOCK_DEG: Record<string, number> = {
  chi: 40,
  eng: 100,
  math: 235,
  bio: -60,
  his: 165,
};
const BOAT_EDGES: [string, string][] = [
  ["chi", "eng"],
  ["chi", "math"],
  ["chi", "bio"],
  ["eng", "math"],
  ["eng", "bio"],
  ["eng", "his"],
  ["math", "his"],
];
const ctrOf = (id: string): [number, number] => {
  const i = islandById(id === "loop" ? "math" : id);
  return i ? [wx(i.x), wz(i.y)] : [0, 0];
};
const angTo = (a: string, b: string): number => {
  const A = ctrOf(a),
    B = ctrOf(b);
  return Math.atan2(B[1] - A[1], B[0] - A[0]);
};
const nbrs = (id: string): { to: string; boat: boolean }[] => {
  const o: { to: string; boat: boolean }[] = [];
  BRIDGES.forEach((p: [string, string]) => {
    if (p[0] === id) o.push({ to: p[1], boat: false });
    else if (p[1] === id) o.push({ to: p[0], boat: false });
  });
  BOAT_EDGES.forEach((p: [string, string]) => {
    if (p[0] === id) o.push({ to: p[1], boat: true });
    else if (p[1] === id) o.push({ to: p[0], boat: true });
  });
  return o;
};
const HOPS: Record<string, Record<string, number>> = (() => {
  const H: Record<string, Record<string, number>> = {};
  ISLANDS.forEach((s: Island) => {
    const d: Record<string, number> = { [s.id]: 0 };
    const q: string[] = [s.id];
    while (q.length) {
      const c = q.shift() as string;
      nbrs(c).forEach((n: { to: string }) => {
        if (d[n.to] === undefined) {
          d[n.to] = d[c] + 1;
          q.push(n.to);
        }
      });
    }
    H[s.id] = d;
  });
  return H;
})();
type ActK = "spec" | "tea" | "flower";
interface Sta {
  isl: string;
  k: ActK;
  al: number;
  P: V3;
  S: V3;
  beta: number;
  h: number;
  ry: number;
}
const STATIONS: Sta[] = (() => {
  const out: Sta[] = [];
  const d2r = Math.PI / 180;
  ISLANDS.forEach((isl: Island) => {
    const [X, Z] = ctrOf(isl.id);
    const blocked: number[] = nbrs(isl.id)
      .filter((n: { boat: boolean }) => !n.boat)
      .map((n: { to: string }) => angTo(isl.id, n.to));
    if (DOCK_DEG[isl.id] !== undefined) blocked.push(DOCK_DEG[isl.id] * d2r);
    const cand: Record<ActK, number[]> = {
      spec: [90, 65, 115, 40, 140],
      tea: [205, 230, 180, 255, 155],
      flower: [335, 310, 0, 285, 25],
    };
    (["spec", "tea", "flower"] as ActK[]).forEach((k: ActK) => {
      const ok = (a: number): boolean =>
        blocked.every(
          (b: number) =>
            Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) > 0.5,
        );
      let al = cand[k][0] * d2r;
      for (const dg of cand[k]) {
        if (ok(dg * d2r)) {
          al = dg * d2r;
          break;
        }
      }
      blocked.push(al);
      const P: V3 = [X + 6.4 * Math.cos(al), T_TOP, Z + 6.4 * Math.sin(al)];
      const soap = k === "spec" && isl.id === "civ";
      const beta = soap ? al : al - 0.26;
      const S: V3 = soap
        ? [P[0], T_TOP + 0.5, P[2]]
        : [X + RING * Math.cos(beta), T_TOP, Z + RING * Math.sin(beta)];
      const h = soap
        ? Math.atan2(Math.cos(al), Math.sin(al))
        : Math.atan2(P[0] - S[0], P[2] - S[2]);
      out.push({ isl: isl.id, k, al, P, S, beta, h, ry: Math.PI / 2 - al });
    });
  });
  return out;
})();
const CLEAR_PTS: [number, number][] = (() => {
  const o: [number, number][] = [];
  STATIONS.forEach((s: Sta) => {
    o.push([s.P[0], s.P[2]], [s.S[0], s.S[2]]);
  });
  Object.keys(DOCK_DEG).forEach((id: string) => {
    const [X, Z] = ctrOf(id);
    const a = (DOCK_DEG[id] * Math.PI) / 180;
    [6.2, 7.4].forEach((r: number) =>
      o.push([X + r * Math.cos(a), Z + r * Math.sin(a)]),
    );
  });
  return o;
})();
const clearAt = (x: number, z: number): boolean =>
  CLEAR_PTS.every(
    (p: [number, number]) => Math.hypot(p[0] - x, p[1] - z) > 1.35,
  );
const lw = (st: Sta, x: number, y: number, z: number): V3 => {
  const c = Math.cos(st.ry),
    s = Math.sin(st.ry);
  return [st.P[0] + x * c + z * s, st.P[1] + y, st.P[2] - x * s + z * c];
};
const FX_TEXT: Record<string, string[]> = {
  chi: ["春眠不覺曉", "處處聞啼鳥", "上聯：書山有路", "下聯：學海無涯"],
  eng: ["Hello!", "How are you?", "I can do it!", "Good job!"],
  his: ["古人：學而時習之", "古人：溫故而知新", "古人：有志者事竟成"],
  civ: ["早睡早起！", "多喝水！", "錯題要訂正！"],
  geo: ["晴 28°C", "東北季風 3 級", "降雨機率 20%"],
  math: ["12＋30＝42", "3x＋5＝20", "x＝5", "a²＋b²＝c²", "√49＝7"],
  bio: ["汪！", "喵～", "汪汪！", "呼嚕呼嚕"],
  earth: ["地球繞太陽", "月亮繞地球", "★ 一年 365 天"],
  phy: ["啵啵啵", "變色了！", "冒泡中…"],
  tea: ["茶香～", "請喝茶", "回甘！"],
  flower: ["發芽了！", "開花了！", "澆澆水～"],
};
// 島上活動台詞：g 一般島民、dad 詹姆獅、mom 蔡小雷、fr 三個好朋友、kid 啾啾、idol 偶像（粉絲自製）
const ACT_LINES: Record<string, Record<string, string[]>> = {
  chi: {
    g: ["來對對子：上聯書山有路，下聯交給你！", "床前明月光，讀完再上床。"],
    dad: [
      "哈囉我～吟詩作對：粽子包中、考試必中！爸爸寫完了，你也一定行，顆顆呵呵啾咪。",
      "爸爸作一首：讀書累了喝杯茶，考場上面笑哈哈。慢慢來，爸爸陪你。",
    ],
    mom: [
      "畫起來，這個會考！這首詩的作者也要背喔。",
      "媽媽也會對對子：上聯我煮的菜真好吃，下聯全彌陀都喜歡我。",
    ],
    fr: [
      "妳這首詩押韻押到我都想睡了，不過真的寫得不錯啦。",
      "對對子輸我就請飲料，半糖少冰，不准盧！",
    ],
    kid: [
      "我也會作詩：姊姊讀書，我吃餅乾。",
      "鵝鵝鵝，曲項向天歌！我背得比你快～",
    ],
    idol: [
      "一字一句慢慢寫，文字會變成妳的力量。",
      "詩寫得真好，會考作文也穩穩的！",
    ],
  },
  eng: {
    g: [
      "Hello! How are you? I'm fine, thank you!",
      "Practice makes perfect! 一起念一次。",
    ],
    dad: [
      "哈囉我～Hello 就是哈囉我嘛！You can do it，爸爸挺你，顆顆呵呵啾咪。",
      "Dad says: Take a break, then keep going. 爸爸以你為榮。",
    ],
    mom: [
      "Good morning! 媽媽也會說英文喔，畫起來，這個會考！",
      "Apple、banana，我煮的菜 delicious！",
    ],
    fr: [
      "Your English is so good……比妳的數學好一點點啦。",
      "Repeat after me: I will not sleep in class!",
    ],
    kid: [
      "ABCDEFG～我唱完了，換姊姊！",
      "Sister, you are number one! 這樣講對嗎？",
    ],
    idol: [
      "Keep going! You're doing great!",
      "One word a day, step by step. 加油！",
    ],
  },
  his: {
    g: ["古人說：學而時習之，不亦說乎！", "跟古人聊聊：原來他們也要考試。"],
    dad: [
      "哈囉我～孔子說學而時習之，爸爸說時習之後要吃點心！你已經很棒了，顆顆呵呵啾咪。",
      "古人十年寒窗，你已經走了好長一段，爸爸都看到了。",
    ],
    mom: [
      "畫起來，這個會考！朝代順序要背熟喔。",
      "古人走路沒手機計步，我要走一萬步！",
    ],
    fr: [
      "古人看到妳的歷史考卷應該會哭吧……開玩笑，妳很強啦。",
      "妳背年代的樣子好像在背電話號碼，好好笑。",
    ],
    kid: ["古人爺爺，姊姊說你很難背喔！", "我跟古人說姊姊很厲害，他點頭了！"],
    idol: [
      "歷史是一個個故事，記住故事就記住重點了。",
      "跟古人學毅力，妳也做得到！",
    ],
  },
  civ: {
    g: [
      "各位鄉親！早睡早起、多喝水、錯題要訂正！",
      "我宣布：今天讀完這節就休息十分鐘！",
    ],
    dad: [
      "哈囉我～各位聽眾，我宣布：考試必勝、讀書必順！顆顆呵呵啾咪！",
      "爸爸站上肥皂箱只想說一句：不管考幾分，爸爸都以你為榮。",
    ],
    mom: [
      "全彌陀都喜歡我！所以大家都要聽我說：早點睡！",
      "各位，畫起來，這個會考！",
    ],
    fr: [
      "我站上來是要宣布：某人昨天又在數學課睡著了！",
      "各位同學，請給認真的她掌聲鼓勵！雖然她不會承認。",
    ],
    kid: ["我宣布！姊姊讀完書要陪我玩！", "大家好，我是啾啾，我支持姊姊！"],
    idol: ["大家一起把今天的進度完成吧！", "每一份努力都算數！"],
  },
  geo: {
    g: ["風速計轉好快，今天吹東北季風。", "看雲猜天氣：積雨雲來了，記得帶傘！"],
    dad: [
      "哈囉我～颱風來了也不怕，因為我們有好颱運！爸爸幫你擋風，顆顆呵呵啾咪。",
      "天氣會變，爸爸對你的信心不會變。",
    ],
    mom: [
      "今天降雨機率百分之二十，我要走一萬步，帶傘去！",
      "畫起來，這個會考！梅雨季節是五六月。",
    ],
    fr: [
      "妳的心情比梅雨季還多變，剛剛還說不想讀，現在又超認真。",
      "氣候圖妳也看得懂？好啦，有進步。",
    ],
    kid: ["姊姊，雲朵像一隻小狗！", "我測到了！今天是讀書好天氣！"],
    idol: [
      "不管晴天雨天，持續前進最重要。",
      "季風一來一往，妳的進步一天一天。",
    ],
  },
  math: {
    g: ["3x＋5＝20，所以 x＝5！", "黑板寫滿了，這題我會！"],
    dad: [
      "哈囉我～為什麼數學老師都很有錢？因為他們很會算！你也算得很好，爸爸看到了，顆顆呵呵啾咪。",
      "一題一題來，算錯也沒關係，爸爸陪你再算一次。",
    ],
    mom: [
      "畫起來，這個會考！公式抄在黑板上最好記。",
      "我要走一萬步……一步、兩步，這也是數學！",
    ],
    fr: [
      "妳的計算過程寫得比答案還長，但對了啦！",
      "這題我先解出來……好啦是妳先，我認輸。",
    ],
    kid: ["我會算 1＋1＝2！姊姊你會算嗎？", "黑板借我畫一隻貓好不好？"],
    idol: [
      "算式寫得很漂亮，答案就會跟著來！",
      "一步一步列式，數學沒有那麼可怕。",
    ],
  },
  bio: {
    g: [
      "小狗搖尾巴、小貓伸懶腰，大家都在休息。",
      "摸摸小貓：哺乳類、恆溫動物！",
    ],
    dad: [
      "哈囉我～小狗為什麼考試很強？因為牠汪汪汪，好旺！你也很旺，爸爸好驕傲，顆顆呵呵啾咪。",
      "跟小狗小貓玩一下再讀，爸爸說休息也是讀書的一部分。",
    ],
    mom: ["畫起來，這個會考！貓咪是哺乳類。", "小狗陪我走一萬步，好開心！"],
    fr: ["那隻貓跟妳一樣，吃飽就想睡。", "小狗比妳還認真聽我講話，哈哈。"],
    kid: ["小狗是我的！小貓給姊姊！", "姊姊，小貓說你讀太久了，要摸牠一下。"],
    idol: ["療癒一下，再出發！", "和小動物玩一下，心情好讀書更快。"],
  },
  earth: {
    g: ["望遠鏡看到土星環了！", "地球繞太陽一圈是一年。"],
    dad: [
      "哈囉我～星星為什麼都不緊張？因為它們很有心（星）得！你也閃閃發光，顆顆呵呵啾咪。",
      "宇宙很大，但在爸爸心裡你最亮。",
    ],
    mom: [
      "畫起來，這個會考！月相變化要記好。",
      "星星也喜歡我，全彌陀都喜歡我！",
    ],
    fr: [
      "妳看星星看到發呆，跟上課一模一樣。",
      "妳說要研究星體運行，結果在數星星，好啦也算。",
    ],
    kid: ["我看到一顆星星在對姊姊眨眼！", "姊姊，月亮是不是也在讀書？"],
    idol: [
      "星星一直在軌道上，妳也一步一步在前進。",
      "抬頭看看星空，休息一下再出發。",
    ],
  },
  phy: {
    g: ["加一點點試劑……變色了！", "做實驗要戴護目鏡，安全第一！"],
    dad: [
      "哈囉我～氧和鉀約會結果怎樣？OK 啦！實驗成功，你也一定 OK，顆顆呵呵啾咪。",
      "實驗失敗也沒關係，爸爸當年也炸過試管，再來一次就好。",
    ],
    mom: [
      "畫起來，這個會考！酸鹼指示劑的顏色要記。",
      "實驗做完洗手，等一下吃飯，我煮的菜真好吃！",
    ],
    fr: [
      "妳做實驗的表情好像要拆炸彈，冷靜啦。",
      "冒泡了冒泡了！比妳的腦袋還熱。",
    ],
    kid: ["哇！冒泡泡了！我也要玩！", "姊姊是科學家！我是助手！"],
    idol: ["好奇心是最好的老師！", "一次一次試，答案就在泡泡裡。"],
  },
  tea: {
    g: ["泡一壺茶，休息一下再讀。", "茶要慢慢泡，讀書也要慢慢來。"],
    dad: [
      "哈囉我～茶為什麼最懂考生？因為它會回甘！苦過就甜了，爸爸陪你喝一杯，顆顆呵呵啾咪。",
      "來，陪爸爸喝杯茶，什麼都不用想，五分鐘就好。",
    ],
    mom: ["喝茶配水果，媽媽切了芭樂喔。", "我煮的菜真好吃，我泡的茶也不錯！"],
    fr: [
      "一起喝茶吧，但不准偷聊八卦聊一小時。",
      "妳泡的茶太濃了，跟妳的黑眼圈一樣。",
    ],
    kid: ["我也要喝！要加糖！", "姊姊喝茶，我喝養樂多！"],
    idol: ["喝口茶，放鬆一下，再出發。", "好好休息，也是一種努力。"],
  },
  flower: {
    g: ["種下一朵花，等它開花就是會考那天。", "澆澆水，花開了！"],
    dad: [
      "哈囉我～種花為什麼讓人變聰明？因為會發芽，也會發揮！你的努力也會開花，顆顆呵呵啾咪。",
      "花不是一天開的，你的每一天爸爸都看見了。",
    ],
    mom: [
      "種花也要走路，我要走一萬步，來回澆水剛好！",
      "全彌陀都喜歡我種的花！",
    ],
    fr: [
      "妳種的花長得比妳的分數還快……開玩笑啦！",
      "這朵花送妳，會考加油，不准哭。",
    ],
    kid: ["我種的那朵比較大！", "花開了！姊姊也要開花喔！"],
    idol: ["每天澆一點水，就像每天讀一點書。", "努力會開花的，加油！"],
  },
};
const GOAL_ACT: Record<string, string[]> = {
  math: [
    "我來寫一題：設 x 為未知數……好，換妳接下去。",
    "黑板上這題，先找等量關係就解開了。",
  ],
  phy: [
    "先預測結果再做實驗，這樣才學得到東西。",
    "變色是因為酸鹼值改變，這種題目很常考。",
  ],
  eng: [
    "Read it again, slowly. 慢慢念就順了。",
    "單字放進句子裡背，比較不會忘。",
  ],
  chi: [
    "這首詩的重點在最後一句，記住意境就好。",
    "對對子要看詞性，名詞對名詞。",
  ],
  earth: [
    "公轉一圈是一年，自轉一圈是一天，別搞混。",
    "月相變化畫一次圖就記住了。",
  ],
  his: ["把朝代排成時間軸，一眼就清楚。", "先抓因果關係，年代自然記得住。"],
  civ: ["我只宣布一件事：今天的進度今天完成。", "權利和義務要一起記。"],
  geo: ["看懂氣候圖的兩個軸，題目就簡單了。", "季風方向畫成箭頭比較好記。"],
  bio: [
    "牠們是哺乳類，恆溫、胎生，這題會考。",
    "觀察完記錄下來，就是最好的筆記。",
  ],
  tea: ["休息五分鐘，喝口茶，等一下效率更好。", "放鬆一下，等等再衝刺。"],
  flower: [
    "每天澆一點水，跟每天讀一點書一樣。",
    `等花開了，就是妳考上${GOAL_SCHOOL}放榜的時候。`,
  ],
};
const groupOf = (id: string): string =>
  id === "crew-18"
    ? "goal"
    : id === "crew-14"
      ? "dad"
      : id === "crew-13"
        ? "mom"
        : id === "crew-15"
          ? "kid"
          : id.startsWith("crew-")
            ? "fr"
            : id.startsWith("idol-")
              ? "idol"
              : "g";
const actLine = (wid: string, act: string): string => {
  const pool = ACT_LINES[act] || ACT_LINES.tea;
  const grp = groupOf(wid);
  let s = pick((grp === "goal" ? GOAL_ACT[act] : pool[grp]) || pool.g);
  const an = wid.startsWith("ani-")
    ? ANIMALS.find((a: Ani) => `ani-${a.island}` === wid)
    : undefined;
  if (an) s = an.sound + s;
  if (wid === "idol-16" && Math.random() < 0.6) s = "考試順起來！" + s;
  if (wid === "idol-17" && Math.random() < 0.6) s = "唉呦不錯哦~" + s;
  return s;
};
// 群體對話：2–3 句一組（-1 代表道具／雕像說話；數字是第幾位成員）
type DL = [number, string][];
const DLG: Record<string, DL[]> = {
  tea: [
    [
      [0, "來，大家一起舉杯！"],
      [1, "乾杯～以茶代酒！"],
      [2, "祝會考順利！🍵"],
    ],
    [
      [0, "這杯茶好香，是高山茶嗎？"],
      [1, "是「讀書回甘茶」，苦完就甜了。"],
    ],
    [
      [0, "喝完這杯再讀一節？"],
      [1, "好，喝完一起衝！"],
      [2, "我先幫大家倒茶～"],
    ],
  ],
  flower: [
    [
      [0, "一起澆水囉，一、二、三！"],
      [1, "看！冒出花苞了！"],
      [2, "哇，開花了！好漂亮✨"],
    ],
    [
      [0, "每天澆一點，花就會慢慢長大。"],
      [1, "跟讀書一樣耶！"],
    ],
    [
      [0, "這朵是什麼花？"],
      [1, "是會考必勝花！"],
      [2, "那我要多澆一點！"],
    ],
  ],
  civ: [
    [
      [0, "各位鄉親！今天讀書，明天輕鬆！"],
      [1, "說得好！👏"],
      [2, "好耶！✨"],
    ],
    [
      [0, "我宣布：錯題訂正的人，都可以多吃一塊點心！"],
      [1, "贊成！♥"],
      [2, "拍手拍手！👏"],
    ],
    [
      [0, "早睡早起、多喝水、不要熬夜！"],
      [1, "收到！"],
      [2, "演講太精彩了！✨"],
    ],
  ],
  chi: [
    [
      [0, "上聯：書山有路勤為徑"],
      [1, "下聯：學海無涯苦作舟！"],
      [0, "對得好！橫批：會考加油！"],
    ],
    [
      [0, "上聯：春眠不覺曉"],
      [1, "下聯：……讀書不能睡！"],
      [0, "哈哈，不太工整但很有道理。"],
    ],
    [
      [0, "上聯：一寸光陰一寸金"],
      [1, "下聯：寸金難買寸光陰！"],
    ],
  ],
  eng: [
    [
      [0, "How are you today?"],
      [1, "I'm fine, thank you. And you?"],
      [0, "Great! Let's study together!"],
    ],
    [
      [0, "What's your favorite subject?"],
      [1, "I like English! 你呢？"],
      [0, "Math… maybe. 哈哈。"],
    ],
    [
      [0, "Can you spell 'exam'?"],
      [1, "E-X-A-M！"],
      [0, "Perfect! 👍"],
    ],
  ],
  his: [
    [
      [-1, "古人：學而時習之，不亦說乎？"],
      [0, "原來要常常複習！"],
      [1, "我們一起記下來！"],
    ],
    [
      [-1, "古人：溫故而知新。"],
      [1, "那我先把上週的錯題看一遍。"],
      [0, "好，我也是！"],
    ],
    [
      [-1, "古人：有志者事竟成。"],
      [0, "聽到了嗎？我們一定行！"],
      [1, "嗯！"],
    ],
  ],
  geo: [
    [
      [0, "今天降雨機率 20%！"],
      [1, "那不用帶傘！"],
      [2, "但東北季風來了，多穿一件。"],
    ],
    [
      [0, "風速計轉好快！"],
      [1, "是東北季風 3 級。"],
      [0, "你看得好準！"],
    ],
    [
      [0, "那朵是積雨雲嗎？"],
      [1, "對，下午可能有雷陣雨。"],
      [2, "那我們早點回去讀書！"],
    ],
  ],
  math: [
    [
      [0, "我出一題：3x＋5＝20。"],
      [1, "x＝5！"],
      [0, "答對！換你出題。"],
    ],
    [
      [0, "這題：12＋30＝？"],
      [1, "42！太簡單了～"],
    ],
    [
      [0, "√49 是多少？"],
      [1, "7！"],
      [0, "漂亮，你越來越快了。"],
    ],
  ],
  bio: [
    [
      [0, "球丟過去囉！"],
      [1, "小狗快追！"],
      [0, "汪汪！好棒好棒～"],
    ],
    [
      [0, "摸摸頭～牠好乖。"],
      [1, "牠是哺乳類，恆溫動物喔。"],
    ],
    [
      [0, "換你丟！"],
      [1, "接好——"],
      [2, "哈哈，小狗跑好快！"],
    ],
  ],
  earth: [
    [
      [0, "我先看——哇，土星環！"],
      [1, "換我看！"],
      [2, "下一個換我！"],
    ],
    [
      [0, "看到月亮的坑洞了！"],
      [1, "換我換我！"],
      [0, "好，你看。"],
    ],
    [
      [0, "那顆最亮的是金星嗎？"],
      [1, "對！換你看看。"],
    ],
  ],
  phy: [
    [
      [0, "加一滴試劑……"],
      [1, "哇！變色了！"],
      [2, "哇——啵啵啵！"],
    ],
    [
      [0, "注意看，要冒泡了！"],
      [1, "啵！哇～"],
      [2, "好厲害！"],
    ],
    [
      [0, "酸鹼指示劑變粉紅色了。"],
      [1, "哇！是鹼性！"],
    ],
  ],
};
const RESP: Record<string, string[]> = {
  dad: [
    "哈囉我～說得真好！爸爸給你按讚，顆顆呵呵啾咪。",
    "這個好，爸爸學起來了，顆顆呵呵啾咪。",
  ],
  mom: [
    "畫起來，這個會考！",
    "全彌陀都喜歡我，也喜歡你們！",
    "我要走一萬步，陪你們一起！",
  ],
  kid: [
    "嘻嘻，我也會！",
    "我比你快！略略略～",
    "我要跟媽媽說你偷懶……開玩笑啦！",
  ],
  fr: [
    "又在表現了喔～不過說得對。",
    "好啦好啦，你最厲害。",
    "這句我要抄下來，下次拿來虧你。",
  ],
  goal: [
    "很好，那下一題換你。",
    "不錯，記得整理到筆記裡。",
    "先完成，再追求完美。",
  ],
  g: ["好喔！", "原來如此！", "一起加油！"],
};
const CHORUS: Record<string, string> = {
  tea: "乾杯～🍵",
  flower: "哇，開花了✨",
  civ: "👏👏👏",
  phy: "哇——！",
  earth: "下一個換我！",
  bio: "汪汪！",
  his: "古人好厲害！",
};
const DAD_PUNS: string[][] = [
  [
    "哈囉我～為什麼鉛筆最有自信？因為它很有『筆』握！",
    "好冷喔哈哈～",
    "冷笑話提神！讀完這節一起喝茶，顆顆呵呵啾咪。",
  ],
  [
    "哈囉我～考試為什麼要帶橡皮擦？因為錯了可以重來！",
    "這次居然有點感動……",
    "大家都很棒，爸爸都看到了，顆顆呵呵啾咪。",
  ],
  [
    "哈囉我～數學老師為什麼不怕冷？因為他有很多角度！",
    "哈哈哈，好爛喔！",
    "笑了就有精神了！加油，顆顆呵呵啾咪。",
  ],
];
const FR_TEASE: string[][] = [
  [
    "你昨天是不是又讀到睡著？",
    "才沒有！我只是閉眼複習。",
    "閉眼複習三小時喔～",
  ],
  ["筆記借我抄一下好不好？", "可以，但要請喝飲料。", "……成交！"],
  ["你剛剛那題是不是猜的？", "是推理！推理懂不懂？", "好啦，推理大師。"],
  ["我們來比賽誰先背完！", "輸的人請喝珍奶！", "你又要輸了啦～"],
];
const GOAL_PUSH: string[][] = [
  ["今天的進度完成了嗎？", "還差一點點……", "那先完成再休息，效率比較好。"],
  ["這題卡住了嗎？", "嗯……", "先列式，一步一步來，你可以的。"],
  [`目標是${GOAL_SCHOOL}，記得嗎？`, "記得！", "那就一起把這頁讀完。"],
];
const MOM_OPEN = [
  "畫起來，這個會考！",
  "全彌陀都喜歡我！你們也要喜歡讀書喔。",
  "我要走一萬步，走完再來檢查你們讀書！",
  "我煮的菜真好吃，讀完來吃飯！",
];
const INVITE: Record<string, string> = {
  tea: "來喝茶！",
  flower: "一起來澆花！",
  civ: "來聽演講！",
  chi: "來對對子！",
  eng: "來練英文會話！",
  his: "來聽古人說故事！",
  geo: "來看天氣！",
  math: "來解黑板題！",
  bio: "來陪小狗玩球！",
  earth: "來輪流看望遠鏡！",
  phy: "來看實驗！",
};
const VERB: Record<string, string> = {
  tea: "喝茶",
  flower: "澆花",
  chi: "對對子",
  eng: "練英文會話",
  his: "聽古人說故事",
  geo: "一起看天氣",
  math: "解黑板題",
  bio: "陪小狗玩球",
  earth: "輪流看望遠鏡",
  phy: "看實驗變色",
  civ: "聽演講",
};
const GREET: string[][] = [
  ["嗨！加油！", "嗨～你也加油！"],
  ["擊掌！✋", "耶！啪！"],
  ["要去哪座島？", "數學島！一起衝！"],
  ["Give me five!", "✋ 啪！"],
  ["今天也很認真喔！", "你也是！擊掌！"],
];
const rpick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const aniOf = (id: string): Ani | undefined =>
  ANIMALS.find((a: Ani) => `ani-${a.island}` === id);
const idolCatch = (id: string): string =>
  id === "idol-16"
    ? "考試順起來！大家一起加油！"
    : id === "idol-17"
      ? "唉呦不錯哦~ 大家都好認真！"
      : "（粉絲應援）一起加油！";
const respLine = (id: string): string => {
  const a = aniOf(id);
  if (a) return a.sound + pick(["我也覺得！", "好耶！"]);
  if (id.startsWith("idol-")) return idolCatch(id);
  const g = groupOf(id);
  return pick(RESP[g] || RESP.g);
};
const joinLine = (id: string): string => {
  const a = aniOf(id);
  if (a) return a.sound + "來了！";
  if (id === "crew-14") return "哈囉我～來了來了！";
  return pick(["好啊，我來了！", "來了來了～", "等我一下！"]);
};
// 旅行路線：一段一段走（0 直線、1 沿島上環道、2 停下來做活動）
interface Seg {
  k: number;
  dur: number;
  a: V3;
  b: V3;
  X: number;
  Z: number;
  a0: number;
  a1: number;
  h: number;
  act: string;
  isl: string;
  stk: string;
  bridge: boolean;
  moor: number;
  bh: number;
  arr: string;
  slot: number;
}
interface Trav {
  home: string;
  at: string;
  ang: number;
  segs: Seg[];
  st: number;
  on: boolean;
  q: [number, number, number, number];
  moving: boolean;
  acting: string;
  boatAt: [number, number, number] | null;
  visits: number;
  state: string;
}
const seg0 = (): Seg => ({
  k: 0,
  dur: 0.05,
  a: [0, 0, 0],
  b: [0, 0, 0],
  X: 0,
  Z: 0,
  a0: 0,
  a1: 0,
  h: NaN,
  act: "",
  isl: "",
  stk: "",
  bridge: false,
  moor: 0,
  bh: 0,
  arr: "",
  slot: -1,
});
const ringP = (id: string, a: number): V3 => {
  const [X, Z] = ctrOf(id);
  return [X + RING * Math.cos(a), T_TOP, Z + RING * Math.sin(a)];
};
function newTrav(home: string, seed: number): Trav {
  const h = home === "loop" ? "math" : home;
  const ang = seed * 2.39996;
  const p = ringP(h, ang);
  return {
    home: h,
    at: h,
    ang,
    segs: [],
    st: 0,
    on: false,
    q: [p[0], p[1], p[2], -ang],
    moving: true,
    acting: "",
    boatAt: null,
    visits: 0,
    state: "",
  };
}
function addArc(tr: Trav, to: number) {
  const d = Math.atan2(Math.sin(to - tr.ang), Math.cos(to - tr.ang));
  if (Math.abs(d) < 0.04) return;
  const [X, Z] = ctrOf(tr.at);
  const s = seg0();
  s.k = 1;
  s.X = X;
  s.Z = Z;
  s.a0 = tr.ang;
  s.a1 = tr.ang + d;
  s.dur = (Math.abs(d) * RING) / WALK;
  tr.segs.push(s);
  tr.ang += d;
}
function addLine(
  tr: Trav,
  a: V3,
  b: V3,
  spd: number,
  dur = 0,
  bridge = false,
  moor = 0,
  bh = 0,
): Seg {
  const s = seg0();
  s.a = a;
  s.b = b;
  s.dur =
    dur ||
    Math.max(0.05, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / spd);
  s.bridge = bridge;
  s.moor = moor;
  s.bh = bh;
  tr.segs.push(s);
  return s;
}
function addWait(
  tr: Trav,
  p: V3,
  h: number,
  dur: number,
  act: string,
  isl: string,
  stk: string,
  slot = -1,
) {
  const s = seg0();
  s.k = 2;
  s.a = p;
  s.b = p;
  s.h = h;
  s.dur = dur;
  s.act = act;
  s.isl = isl;
  s.stk = stk;
  s.slot = slot;
  tr.segs.push(s);
}
// 群體活動：每個活動有主位＋座位（茶桌 4 人、花圃 3 人、肥皂箱 1 講者＋4 聽眾…）
const GCAP: Record<string, number> = {
  tea: 4,
  flower: 3,
  civ: 5,
  chi: 2,
  eng: 2,
  math: 2,
  his: 4,
  geo: 3,
  bio: 3,
  earth: 3,
  phy: 4,
};
const capOf = (st: Sta): number => GCAP[st.k === "spec" ? st.isl : st.k] || 3;
interface Slot {
  p: V3;
  h: number;
}
const SLOTS: Record<string, Slot[]> = (() => {
  const o: Record<string, Slot[]> = {};
  STATIONS.forEach((st: Sta) => {
    const [X, Z] = ctrOf(st.isl);
    const P = st.P;
    const ain = Math.atan2(Z - P[2], X - P[0]);
    const at = (a: number, r: number): V3 => [
      P[0] + r * Math.cos(a),
      T_TOP,
      P[2] + r * Math.sin(a),
    ];
    const face = (p: V3): number => Math.atan2(P[0] - p[0], P[2] - p[2]);
    const L: Slot[] = [];
    if (st.k === "tea")
      [0, 1.2, -1.2, 2.4].forEach((d: number) => {
        const p = at(ain + d, 1.85);
        L.push({ p, h: face(p) });
      });
    else if (st.k === "flower")
      [0.55, -0.55, 1.5].forEach((d: number) => {
        const p = at(ain + d, 1.9);
        L.push({ p, h: face(p) });
      });
    else if (st.isl === "civ") {
      L.push({ p: st.S, h: Math.atan2(X - P[0], Z - P[2]) });
      [0.42, -0.42, 1.1, -1.1].forEach((d: number) => {
        const p = at(ain + d, 3.0);
        L.push({ p, h: face(p) });
      });
    } else {
      L.push({ p: st.S, h: st.h });
      [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8].forEach((d: number) => {
        const p = at(ain + d, 2.3);
        if (
          L.every((x: Slot) => Math.hypot(x.p[0] - p[0], x.p[2] - p[2]) > 1.75)
        )
          L.push({ p, h: face(p) });
      });
    }
    o[`${st.isl}:${st.k}`] = L.slice(
      0,
      GCAP[st.k === "spec" ? st.isl : st.k] || 3,
    );
  });
  return o;
})();
const usedSlots = (all: Trav[], key: string, me: Trav | null): number[] => {
  const o: number[] = [];
  all.forEach((x: Trav) => {
    if (x !== me)
      x.segs.forEach((s: Seg) => {
        if (s.stk === key && s.slot >= 0) o.push(s.slot);
      });
  });
  return o;
};
const freeSlot = (all: Trav[], st: Sta, me: Trav | null): number => {
  const key = `${st.isl}:${st.k}`;
  const u = usedSlots(all, key, me);
  const n = (SLOTS[key] || []).length;
  for (let i = 0; i < n; i++) if (!u.includes(i)) return i;
  return -1;
};
const islAt = (q: number[]): string => {
  let b = "",
    bd = 8.2;
  ISLANDS.forEach((i: Island) => {
    const d = Math.hypot(wx(i.x) - q[0], wz(i.y) - q[2]);
    if (d < bd) {
      bd = d;
      b = i.id;
    }
  });
  return b;
};
function goStation(
  tr: Trav,
  st: Sta,
  slot: number,
  dur: number,
  from: V3 | null,
) {
  const sl = (SLOTS[`${st.isl}:${st.k}`] || [])[slot] || { p: st.S, h: st.h };
  const [X, Z] = ctrOf(st.isl);
  if (from) addLine(tr, from, sl.p, WALK);
  else {
    addArc(tr, st.beta);
    addLine(tr, ringP(st.isl, st.beta), sl.p, WALK);
  }
  addWait(
    tr,
    sl.p,
    sl.h,
    dur,
    st.k === "spec" ? st.isl : st.k,
    st.isl,
    `${st.isl}:${st.k}`,
    slot,
  );
  const a2 = Math.atan2(sl.p[2] - Z, sl.p[0] - X);
  addLine(tr, sl.p, ringP(st.isl, a2), WALK);
  tr.ang = a2;
  tr.at = st.isl;
}
function depart(tr: Trav, to: string, boat: boolean) {
  const from = tr.at;
  const [AX, AZ] = ctrOf(from),
    [BX, BZ] = ctrOf(to);
  let last: Seg;
  if (!boat) {
    const th = Math.atan2(BZ - AZ, BX - AX),
      c = Math.cos(th),
      s = Math.sin(th),
      ox = -s * 0.32,
      oz = c * 0.32;
    addArc(tr, th);
    const p0 = ringP(from, th),
      p1: V3 = [AX + 6.6 * c + ox, 1.92, AZ + 6.6 * s + oz],
      p2: V3 = [BX - 6.6 * c + ox, 1.92, BZ - 6.6 * s + oz];
    addLine(tr, p0, p1, WALK);
    addLine(tr, p1, p2, WALK, 0, true);
    tr.at = to;
    tr.ang = th + Math.PI;
    last = addLine(tr, p2, ringP(to, tr.ang), WALK);
  } else {
    const da = ((DOCK_DEG[from] || 0) * Math.PI) / 180,
      db = ((DOCK_DEG[to] || 0) * Math.PI) / 180;
    addArc(tr, da);
    const p0 = ringP(from, da);
    const d1: V3 = [AX + 11.4 * Math.cos(da), 1.9, AZ + 11.4 * Math.sin(da)],
      m1: V3 = [AX + 13.4 * Math.cos(da), 0.58, AZ + 13.4 * Math.sin(da)];
    const m2: V3 = [BX + 13.4 * Math.cos(db), 0.58, BZ + 13.4 * Math.sin(db)],
      d2: V3 = [BX + 11.4 * Math.cos(db), 1.9, BZ + 11.4 * Math.sin(db)];
    const bh = Math.atan2(m2[0] - m1[0], m2[2] - m1[2]);
    addLine(tr, p0, d1, WALK);
    addLine(tr, d1, m1, 1, 0.7, false, 1, bh);
    addLine(tr, m1, m2, 4.2, 0, false, 3, bh);
    addLine(tr, m2, d2, 1, 0.7, false, 2, bh);
    tr.at = to;
    tr.ang = db;
    last = addLine(tr, d2, ringP(to, db), WALK);
  }
  last.arr = to;
}
function planTrav(tr: Trav, all: Trav[], first: boolean) {
  const isl = tr.at;
  if (!first || Math.random() < 0.65) {
    const r = Math.random();
    const order: ActK[] =
      r < 0.5
        ? ["spec", "tea", "flower"]
        : r < 0.75
          ? ["tea", "flower", "spec"]
          : ["flower", "spec", "tea"];
    const sts = order
      .map((k: ActK) => STATIONS.find((s: Sta) => s.isl === isl && s.k === k))
      .filter((x: Sta | undefined) => !!x) as Sta[];
    const join = sts.find(
      (s: Sta) =>
        usedSlots(all, `${isl}:${s.k}`, tr).length > 0 &&
        freeSlot(all, s, tr) >= 0,
    );
    const st =
      join && Math.random() < 0.85
        ? join
        : sts.find((s: Sta) => freeSlot(all, s, tr) >= 0);
    if (st)
      goStation(
        tr,
        st,
        freeSlot(all, st, tr),
        join === st ? 7 + Math.random() * 2 : 9 + Math.random() * 2.5,
        null,
      );
  }
  addArc(
    tr,
    tr.ang + (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 2.2),
  );
  if (!first && Math.random() < 0.3) return; // 在這座島多待一會兒
  const ns = nbrs(isl);
  if (!ns.length) return;
  let best = ns[0],
    bs = 1e9;
  ns.forEach((n: { to: string; boat: boolean }) => {
    let sc =
      all.filter((o: Trav) => o.at === n.to).length +
      Math.random() * 2.2 +
      (n.to === "math" ? 1.2 : 0);
    if (
      tr.visits >= 3 &&
      (HOPS[n.to][tr.home] || 0) < (HOPS[isl][tr.home] || 0)
    )
      sc -= 2.5;
    sc -=
      0.7 *
      all.filter(
        (o: Trav) =>
          o !== tr &&
          o.segs.some((s: Seg) => s.k === 2 && s.slot >= 0 && s.isl === n.to),
      ).length;
    if (sc < bs) {
      bs = sc;
      best = n;
    }
  });
  depart(tr, best.to, best.boat);
}
// 船、碼頭、活動道具（靜態部分放進場景）
function rowboat3(m: MeshB, T: TF) {
  box(m, T, 0, 0.28, 0, 1.8, 0.5, 3.4, rgb("#B9784E"));
  box(m, T, 0, 0.2, 1.85, 1.1, 0.36, 0.5, rgb("#B9784E"));
  box(m, T, 0, 0.55, 0, 1.5, 0.06, 3.0, rgb("#E8D3B0"));
  box(m, T, 0, 0.62, -0.9, 1.5, 0.1, 0.35, rgb("#8A5A3C"));
  prism(
    m,
    (v: V3): V3 => T([v[0], v[1], v[2] - 1.2]),
    0.05,
    0.05,
    0.5,
    2.3,
    5,
    rgb("#5B5A52"),
  );
  tri(
    m,
    T([0, 2.25, -1.2]),
    T([0, 1.75, -1.2]),
    T([0, 2.0, -0.45]),
    rgb(ORANGE),
    T([0.3, 2, -0.8]),
  );
}
function dock3(m: MeshB, id: string) {
  const [X, Z] = ctrOf(id);
  const a = (DOCK_DEG[id] * Math.PI) / 180;
  const T = tf(X, 0, Z, Math.PI / 2 - a);
  box(m, T, 0, 1.8, 9.9, 1.7, 0.16, 5.0, rgb("#C9A27A"));
  for (let i = 0; i < 6; i++)
    box(m, T, 0, 1.89, 7.75 + i * 0.85, 1.6, 0.02, 0.08, rgb("#9C7A58"));
  [8.6, 10.2, 12.2].forEach((r: number) => {
    box(m, T, -0.78, 0.9, r, 0.2, 1.9, 0.2, rgb("#8A6A50"));
    box(m, T, 0.78, 0.9, r, 0.2, 1.9, 0.2, rgb("#8A6A50"));
  });
  prism(
    m,
    (v: V3): V3 => T([v[0] + 0.6, v[1], v[2] + 12.1]),
    0.12,
    0.12,
    1.88,
    2.2,
    6,
    rgb("#5B5A52"),
  );
  rowboat3(m, (v: V3): V3 => T([v[0] + 2.9, v[1], v[2] + 13.0]));
}
function props3(m: MeshB, st: Sta) {
  const T = tf(st.P[0], T_TOP, st.P[2], st.ry);
  const wood = rgb("#C9A27A"),
    dark = rgb("#8A6A50"),
    stone = rgb("#B9B4A8"),
    stoneD = rgb("#9E998C");
  if (st.k === "tea") {
    prism(m, T, 0.08, 0.08, 0, 0.5, 6, dark);
    prism(m, T, 0.6, 0.6, 0.5, 0.58, 10, wood);
    [-0.95, 0.95].forEach((x: number) =>
      prism(
        m,
        (v: V3): V3 => T([v[0] + x, v[1], v[2]]),
        0.24,
        0.22,
        0,
        0.32,
        8,
        dark,
      ),
    );
    ico(m, T, 0, 0.74, 0, 0.18, 0.16, 0.18, rgb("#8C5A3C"), 0);
    box(m, T, 0.2, 0.76, 0, 0.16, 0.05, 0.05, rgb("#8C5A3C"));
    box(m, T, 0, 0.92, 0, 0.06, 0.05, 0.06, rgb("#8C5A3C"));
    [
      [-0.32, 0.25],
      [0.3, -0.28],
    ].forEach((p: number[]) =>
      prism(
        m,
        (v: V3): V3 => T([v[0] + p[0], v[1], v[2] + p[1]]),
        0.06,
        0.07,
        0.58,
        0.68,
        6,
        rgb("#FFFFFF"),
      ),
    );
    return;
  }
  if (st.k === "flower") {
    box(m, T, 0, 0.07, 0, 1.7, 0.14, 1.2, rgb("#7A5A3C"));
    box(m, T, 0, 0.1, 0.64, 1.8, 0.2, 0.1, stone);
    box(m, T, 0, 0.1, -0.64, 1.8, 0.2, 0.1, stone);
    box(m, T, 0.55, 0.38, 0.35, 0.22, 0.28, 0.16, rgb("#5E9FB5"));
    return;
  }
  const id = st.isl;
  if (id === "chi") {
    box(m, T, 0, 0.2, 0, 1.3, 0.08, 0.75, wood);
    [
      [-0.55, -0.3],
      [0.55, -0.3],
      [-0.55, 0.3],
      [0.55, 0.3],
    ].forEach((p: number[]) =>
      box(m, T, p[0], 0.08, p[1], 0.08, 0.16, 0.08, dark),
    );
    box(m, T, 0, 0.255, 0, 1.0, 0.03, 0.5, rgb("#FFFFFF"));
    box(m, T, -0.52, 0.27, 0, 0.07, 0.07, 0.56, dark);
    box(m, T, 0.52, 0.27, 0, 0.07, 0.07, 0.56, dark);
    box(m, T, -0.2, 0.275, 0, 0.3, 0.01, 0.04, rgb(INK));
    box(m, T, -0.2, 0.275, 0.12, 0.22, 0.01, 0.04, rgb(INK));
  } else if (id === "eng") {
    box(m, T, 0, 0.45, 0, 0.7, 0.9, 0.5, rgb(ACC.eng || ORANGE));
    box(m, T, 0, 0.92, 0.05, 0.8, 0.06, 0.6, rgb("#FFFFFF"));
    prism(
      m,
      (v: V3): V3 => T([v[0] - 0.75, v[1], v[2]]),
      0.04,
      0.04,
      0,
      1.9,
      5,
      rgb("#5B5A52"),
    );
    box(m, T, -0.75, 2.1, 0, 1.0, 0.6, 0.06, rgb("#FFFFFF"));
    box(m, T, -0.95, 2.1, 0.04, 0.12, 0.36, 0.02, rgb(ORANGE));
    box(m, T, -0.75, 2.1, 0.04, 0.12, 0.36, 0.02, rgb(ACC.phy));
    box(m, T, -0.55, 2.1, 0.04, 0.12, 0.36, 0.02, rgb(ACC.bio));
  } else if (id === "his") {
    box(m, T, 0, 0.25, 0, 0.9, 0.5, 0.9, stoneD);
    prism(m, T, 0.45, 0.26, 0.5, 1.6, 8, stone);
    ico(m, T, 0, 1.86, 0, 0.28, 0.3, 0.28, stone, 0);
    box(m, T, 0, 2.14, 0, 0.55, 0.1, 0.32, stoneD);
    box(m, T, 0, 1.66, 0.22, 0.12, 0.22, 0.06, stoneD);
    box(m, T, 0.3, 1.25, 0.2, 0.12, 0.5, 0.1, stoneD);
  } else if (id === "civ") {
    box(m, T, 0, 0.22, 0, 0.95, 0.44, 0.95, wood);
    box(m, T, 0, 0.24, 0.48, 0.7, 0.12, 0.02, rgb(ACC.civ || ORANGE));
  } else if (id === "geo") {
    box(m, T, -0.3, 0.95, 0, 0.6, 0.55, 0.5, rgb("#FFFFFF"));
    [
      [-0.55, -0.2],
      [-0.05, -0.2],
      [-0.55, 0.2],
      [-0.05, 0.2],
    ].forEach((p: number[]) =>
      box(m, T, p[0], 0.34, p[1], 0.06, 0.68, 0.06, rgb("#EDE6D6")),
    );
    prism(
      m,
      (v: V3): V3 => T([v[0] + 0.55, v[1], v[2]]),
      0.05,
      0.05,
      0,
      2.4,
      5,
      rgb("#5B5A52"),
    );
  } else if (id === "math") {
    box(m, T, -0.75, 0.75, 0, 0.08, 1.5, 0.08, dark);
    box(m, T, 0.75, 0.75, 0, 0.08, 1.5, 0.08, dark);
    box(m, T, 0, 1.3, -0.02, 1.75, 1.1, 0.06, dark);
    box(m, T, 0, 1.3, 0.02, 1.6, 0.96, 0.05, rgb("#2F5D4A"));
    box(m, T, 0, 0.8, 0.07, 1.4, 0.04, 0.1, dark);
    box(m, T, -0.35, 1.45, 0.05, 0.4, 0.03, 0.01, rgb("#FFFFFF"));
    box(m, T, 0.25, 1.2, 0.05, 0.5, 0.03, 0.01, rgb("#FFFFFF"));
  } else if (id === "bio") {
    gableHouse(
      m,
      (v: V3): V3 => T([v[0] - 0.75, v[1], v[2] - 0.25]),
      0.8,
      0.8,
      0.55,
      0.4,
      rgb("#E9C58A"),
      rgb("#C46A4E"),
      rgb("#4A3B33"),
    );
    prism(
      m,
      (v: V3): V3 => T([v[0] + 0.7, v[1], v[2] - 0.3]),
      0.2,
      0.24,
      0,
      0.12,
      8,
      rgb("#5E9FB5"),
    );
  } else if (id === "earth") {
    [
      [-0.25, 0],
      [0.12, 0.2],
      [0.12, -0.2],
    ].forEach((p: number[]) =>
      box(m, T, -0.6 + p[0], 0.45, p[1], 0.06, 0.9, 0.06, dark),
    );
    for (let i = 0; i < 4; i++)
      box(
        m,
        T,
        -0.6,
        0.95 + i * 0.16,
        0.1 + i * 0.16,
        0.2,
        0.2,
        0.24,
        rgb(i === 3 ? INK : "#F2EEE4"),
      );
    prism(
      m,
      (v: V3): V3 => T([v[0] + 0.55, v[1], v[2]]),
      0.35,
      0.3,
      0,
      0.15,
      8,
      dark,
    );
    prism(
      m,
      (v: V3): V3 => T([v[0] + 0.55, v[1], v[2]]),
      0.04,
      0.04,
      0.15,
      1.2,
      5,
      rgb("#5B5A52"),
    );
    ico(m, T, 0.55, 1.3, 0, 0.2, 0.2, 0.2, rgb("#F2C14E"), 0);
  } else {
    box(m, T, 0, 0.36, 0, 1.3, 0.72, 0.65, rgb("#FFFFFF"));
    box(m, T, 0, 0.74, 0, 1.4, 0.06, 0.75, rgb("#DDE6E8"));
    prism(
      m,
      (v: V3): V3 => T([v[0] - 0.2, v[1], v[2]]),
      0.28,
      0.12,
      0.77,
      1.12,
      8,
      rgb("#CFE6EE"),
    );
    prism(
      m,
      (v: V3): V3 => T([v[0] - 0.2, v[1], v[2]]),
      0.08,
      0.08,
      1.12,
      1.38,
      6,
      rgb("#CFE6EE"),
    );
    prism(
      m,
      (v: V3): V3 => T([v[0] + 0.4, v[1], v[2]]),
      0.07,
      0.07,
      0.77,
      1.1,
      6,
      rgb("#F6C9A8"),
    );
  }
}

// ---------- WebGL 引擎 ----------
interface Eng3 {
  setData: (d: Data3) => void;
  setTalk: (b: Bubble | null, reacting: string) => void;
  setMotion: (b: boolean) => void;
  reset: () => void;
  zoom: (f: number) => void;
  rotate: (a: number) => void;
  destroy: () => void;
}
interface Cb3 {
  onPick: (id: string) => void;
  onPoke: (id: string) => void;
  onFail: (why: string) => void;
}
const VS =
  "attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;uniform mat4 uVP;uniform mat4 uM;uniform vec3 uL;uniform vec3 uE;varying vec3 vC;varying float vF;void main(){vec4 w=uM*vec4(aP,1.0);vec3 n=normalize((uM*vec4(aN,0.0)).xyz);float d=max(dot(n,uL),0.0);vC=aC*(0.62+0.46*d+0.06*n.y);vF=clamp((length(w.xyz-uE)-150.0)/200.0,0.0,0.5);gl_Position=uVP*w;}";
const FS =
  "precision mediump float;uniform vec3 uFog;uniform float uA;varying vec3 vC;varying float vF;void main(){gl_FragColor=vec4(mix(vC,uFog,vF),uA);}";
function createWorld3D(
  canvas: HTMLCanvasElement,
  overlay: HTMLDivElement,
  cb: Cb3,
): Eng3 | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  } catch (_e) {
    gl = null;
  }
  if (!gl) {
    cb.onFail("此裝置不支援 WebGL");
    return null;
  }
  const G: WebGLRenderingContext = gl;
  const sh = (type: number, src: string): WebGLShader | null => {
    const s = G.createShader(type);
    if (!s) return null;
    G.shaderSource(s, src);
    G.compileShader(s);
    return G.getShaderParameter(s, G.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(G.VERTEX_SHADER, VS),
    fs = sh(G.FRAGMENT_SHADER, FS);
  const prog = G.createProgram();
  if (!vs || !fs || !prog) {
    cb.onFail("3D 著色器編譯失敗");
    return null;
  }
  G.attachShader(prog, vs);
  G.attachShader(prog, fs);
  G.linkProgram(prog);
  if (!G.getProgramParameter(prog, G.LINK_STATUS)) {
    cb.onFail("3D 程式連結失敗");
    return null;
  }
  G.useProgram(prog);
  const aP = G.getAttribLocation(prog, "aP"),
    aN = G.getAttribLocation(prog, "aN"),
    aC = G.getAttribLocation(prog, "aC");
  const uVP = G.getUniformLocation(prog, "uVP"),
    uM = G.getUniformLocation(prog, "uM"),
    uL = G.getUniformLocation(prog, "uL"),
    uE = G.getUniformLocation(prog, "uE"),
    uFog = G.getUniformLocation(prog, "uFog"),
    uA = G.getUniformLocation(prog, "uA");
  G.enableVertexAttribArray(aP);
  G.enableVertexAttribArray(aN);
  G.enableVertexAttribArray(aC);
  G.enable(G.DEPTH_TEST);
  const ln = Math.hypot(0.45, 0.85, 0.35);
  G.uniform3f(uL, 0.45 / ln, 0.85 / ln, 0.35 / ln);
  const fog = rgb("#A9D2D0");
  G.uniform3f(uFog, fog[0], fog[1], fog[2]);
  G.uniform1f(uA, 1);
  const up = (m: MeshB): GMesh => {
    const buf = G.createBuffer();
    G.bindBuffer(G.ARRAY_BUFFER, buf);
    G.bufferData(G.ARRAY_BUFFER, new Float32Array(m.d), G.STATIC_DRAW);
    return { buf, n: m.d.length / 9 };
  };
  const free = (g: GMesh | null) => {
    if (g && g.buf) G.deleteBuffer(g.buf);
  };
  const draw = (g: GMesh, M: M4) => {
    if (!g.n) return;
    G.bindBuffer(G.ARRAY_BUFFER, g.buf);
    G.vertexAttribPointer(aP, 3, G.FLOAT, false, 36, 0);
    G.vertexAttribPointer(aN, 3, G.FLOAT, false, 36, 12);
    G.vertexAttribPointer(aC, 3, G.FLOAT, false, 36, 24);
    G.uniformMatrix4fv(uM, false, M);
    G.drawArrays(G.TRIANGLES, 0, g.n);
  };
  // 共用小物件：陰影、帆船、雲
  const shadowM = mb();
  prism(shadowM, ID, 0.55, 0.55, 0, 0.01, 10, [0.18, 0.24, 0.22]);
  const shadowG = up(shadowM);
  const boatM = mb();
  box(boatM, ID, 0, 0.3, 0, 1.2, 0.5, 3, rgb("#FFFFFF"));
  box(boatM, ID, 0, 0.58, 0, 1.0, 0.08, 2.6, rgb("#E4DFD3"));
  prism(boatM, ID, 0.06, 0.06, 0.5, 4, 5, rgb("#5B5A52"));
  tri(
    boatM,
    [0, 3.9, 0.1],
    [0, 0.9, 0.1],
    [0, 0.9, 1.9],
    rgb(CREAM),
    [0.5, 2, 1],
  );
  tri(
    boatM,
    [0, 3.4, -0.1],
    [0, 0.9, -0.1],
    [0, 0.9, -1.4],
    rgb(ORANGE),
    [0.5, 2, -1],
  );
  const boatG = up(boatM);
  // v9 動態小物件：小船、風速計、行星、茶煙、泡泡、試劑、毛筆、小花、小狗小貓
  const mk1 = (fn: (m: MeshB) => void): GMesh => {
    const m = mb();
    fn(m);
    return up(m);
  };
  const rowG = mk1((m: MeshB) => rowboat3(m, ID));
  const rotorG = mk1((m: MeshB) => {
    prism(m, ID, 0.06, 0.06, -0.05, 0.08, 6, rgb("#5B5A52"));
    for (let i = 0; i < 3; i++) {
      const T = tf(0, 0, 0, (i * Math.PI * 2) / 3);
      box(m, T, 0, 0, 0.25, 0.04, 0.04, 0.5, rgb("#5B5A52"));
      ico(m, T, 0, 0, 0.52, 0.1, 0.1, 0.1, rgb(ORANGE), 0);
    }
  });
  const planetG = mk1((m: MeshB) =>
    ico(m, ID, 0, 0, 0, 0.12, 0.12, 0.12, rgb("#5E9FB5"), 0),
  );
  const planet2G = mk1((m: MeshB) => {
    ico(m, ID, 0, 0, 0, 0.09, 0.09, 0.09, rgb("#DB6A41"), 0);
    ring(m, ID, 0.12, 0.18, 0, 10, rgb("#F2C98A"));
  });
  const puffG = mk1((m: MeshB) =>
    ico(m, ID, 0, 0, 0, 0.1, 0.1, 0.1, rgb("#FFFFFF"), 0, undefined, 0.02),
  );
  const bubG = mk1((m: MeshB) =>
    ico(m, ID, 0, 0, 0, 0.06, 0.06, 0.06, rgb("#E8F6FA"), 0, undefined, 0.02),
  );
  const liqA = mk1((m: MeshB) =>
    prism(m, ID, 0.25, 0.17, 0.79, 0.93, 8, rgb("#7FC8E0")),
  );
  const liqB = mk1((m: MeshB) =>
    prism(m, ID, 0.25, 0.17, 0.79, 0.93, 8, rgb("#F08CB0")),
  );
  const brushG = mk1((m: MeshB) => {
    box(m, ID, 0, 0.2, 0, 0.05, 0.36, 0.05, rgb("#8A5A3C"));
    box(m, ID, 0, 0.0, 0, 0.07, 0.08, 0.07, rgb(INK));
  });
  const flowerG = [ORANGE, "#F4A9B8", "#B9A9E0"].map((c: string) =>
    mk1((m: MeshB) => {
      box(m, ID, 0, 0.18, 0, 0.04, 0.36, 0.04, rgb(LEAF_D));
      box(m, ID, 0.08, 0.15, 0, 0.12, 0.03, 0.06, rgb(LEAF_L));
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        ico(
          m,
          ID,
          Math.cos(a) * 0.09,
          0.4,
          Math.sin(a) * 0.09,
          0.07,
          0.04,
          0.07,
          rgb(c),
          0,
          undefined,
          0.03,
        );
      }
      ico(
        m,
        ID,
        0,
        0.41,
        0,
        0.05,
        0.04,
        0.05,
        rgb("#F2C14E"),
        0,
        undefined,
        0.02,
      );
    }),
  );
  const cupG = mk1((m: MeshB) => {
    prism(m, ID, 0.07, 0.08, -0.06, 0.08, 6, rgb("#FFFFFF"));
    prism(m, ID, 0.06, 0.06, 0.06, 0.085, 6, rgb("#B9784E"));
  });
  const canG = mk1((m: MeshB) => {
    box(m, ID, 0, 0, 0, 0.26, 0.24, 0.22, rgb("#5E9FB5"));
    box(m, ID, 0, 0.06, 0.22, 0.05, 0.05, 0.26, rgb("#5E9FB5"));
    box(m, ID, 0, 0.16, -0.04, 0.04, 0.1, 0.16, rgb("#3F7F95"));
  });
  const dropG = mk1((m: MeshB) =>
    ico(m, ID, 0, 0, 0, 0.06, 0.09, 0.06, rgb("#7FC8E0"), 0, undefined, 0.01),
  );
  const heartG = mk1((m: MeshB) => {
    ico(
      m,
      ID,
      -0.09,
      0.05,
      0,
      0.11,
      0.11,
      0.06,
      rgb("#FF7A9A"),
      0,
      undefined,
      0.01,
    );
    ico(
      m,
      ID,
      0.09,
      0.05,
      0,
      0.11,
      0.11,
      0.06,
      rgb("#FF7A9A"),
      0,
      undefined,
      0.01,
    );
    prism(m, ID, 0, 0.17, -0.2, 0.03, 4, rgb("#FF7A9A"));
  });
  const sparkG = mk1((m: MeshB) => {
    box(m, ID, 0, 0, 0, 0.06, 0.3, 0.06, rgb("#F2C14E"));
    box(m, ID, 0, 0, 0, 0.3, 0.06, 0.06, rgb("#F2C14E"));
    box(m, ID, 0, 0, 0, 0.06, 0.06, 0.3, rgb("#F2C14E"));
  });
  const ballG = mk1((m: MeshB) =>
    ico(m, ID, 0, 0, 0, 0.16, 0.16, 0.16, rgb("#E2574C"), 0, undefined, 0.01),
  );
  const xf = (M: M4, v: V3): V3 => [
    M[0] * v[0] + M[4] * v[1] + M[8] * v[2] + M[12],
    M[1] * v[0] + M[5] * v[1] + M[9] * v[2] + M[13],
    M[2] * v[0] + M[6] * v[1] + M[10] * v[2] + M[14],
  ];
  const petP = [animal3(1), animal3(2)].map((p: Parts3) => ({
    core: up(p.core),
    l: up(p.legL),
    r: up(p.legR),
  }));
  const drawProps = (t: number) => {
    const n = clk();
    STATIONS.forEach((st: Sta) => {
      const on = (propOn[`${st.isl}:${st.k}`] || 0) > n;
      const R = mRY(st.ry);
      const at = (x: number, y: number, z: number): M4 => {
        const p = lw(st, x, y, z);
        return mmul(mT(p[0], p[1], p[2]), R);
      };
      if (st.k === "tea") {
        if (on)
          for (let i = 0; i < 3; i++) {
            const k = (t * 0.7 + i / 3) % 1;
            draw(
              puffG,
              mmul(
                at(0.05 * Math.sin(t * 3 + i), 1.0 + k * 1.1, 0),
                mS(0.6 + k),
              ),
            );
          }
        return;
      }
      if (st.k === "flower") {
        (planted[st.isl] || []).forEach(
          (fl: { p: V3; b: number; c: number }) => {
            const k = Math.max(0, Math.min(1, (n - fl.b) / 0.8));
            if (k <= 0) return;
            const s =
              k >= 1 ? 1.6 : 1.6 * k * (1 + 0.5 * Math.sin(k * Math.PI));
            draw(flowerG[fl.c], mmul(mT(fl.p[0], fl.p[1], fl.p[2]), mS(s)));
          },
        );
        return;
      }
      const id = st.isl;
      if (id === "geo") {
        draw(rotorG, mmul(at(0.55, 2.45, 0), mRY(t * (on ? 7 : 1.6))));
        if (on)
          draw(cloudG, mmul(at(0, 4.4 + Math.sin(t * 1.5) * 0.2, 0), mS(0.22)));
      } else if (id === "earth") {
        const v = on ? 2.4 : 0.7;
        draw(
          planetG,
          at(0.55 + Math.cos(t * v) * 0.55, 1.3, Math.sin(t * v) * 0.55),
        );
        draw(
          planet2G,
          at(
            0.55 + Math.cos(t * v * 0.6 + 2) * 0.85,
            1.3,
            Math.sin(t * v * 0.6 + 2) * 0.85,
          ),
        );
      } else if (id === "phy") {
        draw(on && Math.floor(n * 1.2) % 2 ? liqB : liqA, at(-0.2, 0, 0));
        if (on)
          for (let i = 0; i < 4; i++) {
            const k = (t * 0.9 + i / 4) % 1;
            draw(
              bubG,
              at(-0.2 + Math.sin(i * 2 + t) * 0.05, 1.05 + k * 1.0, 0),
            );
          }
      } else if (id === "chi") {
        draw(
          brushG,
          at(
            on ? Math.sin(t * 3) * 0.3 : 0.35,
            0.3 + (on ? Math.abs(Math.sin(t * 6)) * 0.08 : 0),
            on ? 0.05 : 0.2,
          ),
        );
      } else if (id === "bio") {
        petP.forEach((p: { core: GMesh; l: GMesh; r: GMesh }, i: number) => {
          const hop = on ? Math.abs(Math.sin(t * 6 + i * 1.7)) * 0.35 : 0;
          const B = mmul(
            mmul(
              at(i ? 0.6 : -0.1, hop, i ? 0.45 : 0.55),
              mRY(on ? Math.sin(t * 2 + i) * 0.8 : i * 0.6),
            ),
            mS(0.75),
          );
          const sw = on ? Math.sin(t * 10 + i) * 0.5 : 0;
          draw(p.core, B);
          draw(p.l, mmul(B, mmul(mT(-0.13, 0.46, 0), mRX(sw))));
          draw(p.r, mmul(B, mmul(mT(0.13, 0.46, 0), mRX(-sw))));
        });
      }
    });
  };
  const cloudM = mb();
  ico(cloudM, ID, 0, 0, 0, 3, 1.4, 2, rgb("#FFFFFF"), 0, undefined, 0.06);
  ico(
    cloudM,
    ID,
    -2.4,
    -0.3,
    0.3,
    1.8,
    1.1,
    1.5,
    rgb("#FFFFFF"),
    0,
    undefined,
    0.06,
  );
  ico(
    cloudM,
    ID,
    2.2,
    0.3,
    -0.2,
    2,
    1.3,
    1.6,
    rgb("#FFFFFF"),
    0,
    undefined,
    0.06,
  );
  const cloudG = up(cloudM);
  let scene: GMesh | null = null;
  let walkers: Walker3[] = [];
  let dataKey = "";
  let motion = true,
    visible = true,
    dirty = true,
    raf = 0,
    last = 0,
    tAnim = 0,
    lastNow = 0;
  let talk: Bubble | null = null,
    reacting = "",
    reactAt = 0;
  // 相機
  const cam = { tx: 2.5, tz: 2, yaw: 0, pitch: 0.92, dist: 110 };
  let W = 300,
    H = 200,
    fit = 110;
  const fitDist = (asp: number): number => Math.max(170 / asp, 108);
  const resetCam = () => {
    cam.tx = 2.5;
    cam.tz = 2;
    cam.yaw = 0;
    cam.pitch = 0.92;
    cam.dist = fit;
    dirty = true;
  };
  // 飛行鏡頭：點島嶼平滑飛過去（減少動態時直接跳過去）
  interface CamS {
    tx: number;
    tz: number;
    yaw: number;
    pitch: number;
    dist: number;
  }
  let fly: { a: CamS; b: CamS; t0: number; dur: number } | null = null;
  let focusId = "",
    lastSel = "";
  const flyTo = (b: CamS, dur = 800) => {
    const a: CamS = {
      tx: cam.tx,
      tz: cam.tz,
      yaw: cam.yaw,
      pitch: cam.pitch,
      dist: cam.dist,
    };
    b.yaw =
      a.yaw + Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw));
    if (!motion) {
      fly = null;
      cam.tx = b.tx;
      cam.tz = b.tz;
      cam.yaw = b.yaw;
      cam.pitch = b.pitch;
      cam.dist = b.dist;
      touch();
      return;
    }
    fly = { a, b, t0: performance.now(), dur };
    touch();
  };
  const stepFly = (now: number) => {
    if (!fly) return;
    const k = Math.min(1, (now - fly.t0) / fly.dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const A = fly.a,
      B = fly.b;
    cam.tx = A.tx + (B.tx - A.tx) * e;
    cam.tz = A.tz + (B.tz - A.tz) * e;
    cam.yaw = A.yaw + (B.yaw - A.yaw) * e;
    cam.pitch = A.pitch + (B.pitch - A.pitch) * e;
    cam.dist = Math.exp(
      Math.log(A.dist) + (Math.log(B.dist) - Math.log(A.dist)) * e,
    );
    if (k >= 1) fly = null;
  };
  const focusDist = (): number =>
    Math.max(28, 12.5 / (Math.tan(0.35) * Math.min(W / H, 1.3)));
  let VP = m4();
  let eye: V3 = [0, 0, 0];
  const FOV = 0.7;
  const calcCam = () => {
    const cp = Math.cos(cam.pitch);
    eye = [
      cam.tx + cam.dist * cp * Math.sin(cam.yaw),
      cam.dist * Math.sin(cam.pitch),
      cam.tz + cam.dist * cp * Math.cos(cam.yaw),
    ];
    VP = mmul(persp(FOV, W / H, 0.5, 600), lookAt(eye, [cam.tx, 0, cam.tz]));
  };
  const project = (p: V3): [number, number, number] | null => {
    const x = VP[0] * p[0] + VP[4] * p[1] + VP[8] * p[2] + VP[12],
      y = VP[1] * p[0] + VP[5] * p[1] + VP[9] * p[2] + VP[13],
      w = VP[3] * p[0] + VP[7] * p[1] + VP[11] * p[2] + VP[15];
    if (w <= 0.1) return null;
    return [((x / w) * 0.5 + 0.5) * W, (1 - ((y / w) * 0.5 + 0.5)) * H, w];
  };
  const resize = () => {
    const r = overlay.getBoundingClientRect();
    W = Math.max(200, r.width);
    H = Math.max(200, r.height);
    const pw = overlay.parentElement;
    if (pw) pw.classList.toggle("g3-sm", W < 560);
    const dpr = Math.min(
      2,
      (typeof window !== "undefined" && window.devicePixelRatio) || 1,
    );
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const nf = fitDist(W / H);
    if (Math.abs(cam.dist - fit) < 0.5) cam.dist = nf;
    fit = nf;
    dirty = true;
  };
  // 疊加的 HTML 標籤（島名、角色名、協作、對話泡泡）
  const mkEl = (cls: string, text: string): HTMLDivElement => {
    const d = document.createElement("div");
    d.className = cls;
    if (text) d.textContent = text;
    overlay.appendChild(d);
    return d;
  };
  let labels: { el: HTMLDivElement; p: V3; dy: number }[] = [];
  let tags: { el: HTMLDivElement; w: Walker3 }[] = [];
  // 島嶼導覽：上一座／下一座／清單（像政策島一樣快速跳島）
  const ISL_ORDER = ISLANDS.map((i: Island) => i.id);
  const nav = mkEl("g3-nav", "");
  const navPrev = document.createElement("button"),
    navName = document.createElement("span"),
    navNext = document.createElement("button"),
    navList = document.createElement("button");
  navPrev.type = "button";
  navNext.type = "button";
  navList.type = "button";
  navPrev.textContent = "‹";
  navNext.textContent = "›";
  navList.textContent = "清單";
  navPrev.setAttribute("aria-label", "上一座島");
  navNext.setAttribute("aria-label", "下一座島");
  navList.setAttribute("aria-label", "島嶼清單");
  navList.className = "g3-nl";
  nav.append(navPrev, navName, navNext, navList);
  const listEl = mkEl("g3-list", "");
  listEl.style.display = "none";
  let pendTap = 0;
  const syncNav = () => {
    const i = ISL_ORDER.indexOf(focusId);
    const isl = i >= 0 ? ISLANDS[i] : null;
    navName.textContent = isl
      ? `${String(i + 1).padStart(2, "0")} ${isl.name}`
      : "全景";
    nav.dataset.focus = focusId;
    listEl
      .querySelectorAll("button")
      .forEach((b: Element) =>
        (b as HTMLElement).classList.toggle(
          "on",
          (b as HTMLElement).dataset.isl === focusId,
        ),
      );
  };
  const focusIsland = (id: string, notify: boolean) => {
    const isl = islandById(id);
    if (!isl) return;
    if (pendTap) {
      clearTimeout(pendTap);
      pendTap = 0;
    }
    focusId = id;
    syncNav();
    flyTo({
      tx: wx(isl.x),
      tz: wz(isl.y) + 1.5,
      yaw: cam.yaw,
      pitch: 0.84,
      dist: focusDist(),
    });
    if (notify) cb.onPick(id);
  };
  const hopIsl = (d: number) => {
    const n = ISL_ORDER.length;
    const i = ISL_ORDER.indexOf(focusId);
    const j = i < 0 ? (d > 0 ? 0 : n - 1) : (i + d + n) % n;
    focusIsland(ISL_ORDER[j], true);
  };
  ISLANDS.forEach((isl: Island, ii: number) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${String(ii + 1).padStart(2, "0")} ${isl.name}`;
    b.dataset.isl = isl.id;
    b.onclick = () => {
      listEl.style.display = "none";
      focusIsland(isl.id, true);
    };
    listEl.appendChild(b);
  });
  navPrev.onclick = () => hopIsl(-1);
  navNext.onclick = () => hopIsl(1);
  navList.onclick = () => {
    listEl.style.display = listEl.style.display === "none" ? "" : "none";
  };
  syncNav();
  // 對話泡泡：同時最多 3 個，錯開出現；點擊的優先
  interface Bub {
    el: HTMLDivElement;
    wid: string;
    at: V3 | null;
    until: number;
    grp: string;
    dy: number;
  }
  let bubs: Bub[] = [];
  let lastSay = 0;
  const propOn: Record<string, number> = {};
  const bloomAt: Record<string, number> = {};
  const invited: Record<string, number> = {};
  const planted: Record<string, { p: V3; b: number; c: number }[]> = {};
  const fxEls: Record<string, HTMLDivElement> = {};
  const tagOf: Record<string, HTMLDivElement> = {};
  let allT: Trav[] = [];
  let lastSim = 0;
  const clk = (): number => performance.now() / 1000;
  const anchorOf = (wid: string, at: V3 | null): V3 | null => {
    if (at) return at;
    const w = walkers.find((x: Walker3) => x.id === wid);
    if (!w) return null;
    const q = posOf(w, tAnim);
    return [q[0], q[1] + 2.3 * (w.g ? w.g.scale : 1), q[2]];
  };
  const say = (
    wid: string,
    text: string,
    pri: number,
    at: V3 | null,
    opt?: { grp?: string; life?: number },
  ) => {
    const n = clk();
    bubs = bubs.filter((b: Bub) => {
      const keep = b.until > n && !(wid && b.wid === wid);
      if (!keep) b.el.remove();
      return keep;
    });
    const an = anchorOf(wid, at);
    if (!an || !text) return;
    const grp = (opt && opt.grp) || "";
    let dy = 0;
    if (grp) {
      const s = project(an);
      if (!s || s[0] < 0 || s[0] > W || s[1] < 0 || s[1] > H) return;
      const mine = bubs.filter((b: Bub) => b.grp === grp);
      if (mine.length >= 2) {
        const o = mine[0];
        o.el.remove();
        bubs = bubs.filter((b: Bub) => b !== o);
      }
      const rest = bubs.filter((b: Bub) => b.grp === grp);
      dy = rest.length && rest[rest.length - 1].dy === 0 ? -46 : 0;
    } else if (pri < 2) {
      if (bubs.length >= (pri === 1 ? 3 : 2) || n - lastSay < 1.1) return;
      const s = project(an);
      if (!s || s[0] < 0 || s[0] > W || s[1] < 0 || s[1] > H) return;
      const near = bubs.some((b: Bub) => {
        const a2 = anchorOf(b.wid, b.at);
        const s2 = a2 ? project(a2) : null;
        return (
          !!s2 && Math.abs(s2[0] - s[0]) < 150 && Math.abs(s2[1] - s[1]) < 46
        );
      });
      if (near) return;
    }
    while (bubs.length >= 4) {
      const o = bubs.shift();
      if (o) o.el.remove();
    }
    const el = mkEl("g3-bub", text);
    if (grp) el.dataset.grp = grp;
    const life = (opt && opt.life) || (pri === 2 ? 4.6 : 4.0);
    bubs.push({ el, wid, at, until: n + life, grp, dy });
    lastSay = n;
    setTimeout(() => touch(), life * 1000 + 60);
    touch();
  };
  const plant = (isl: string, cnt: number) => {
    const st = STATIONS.find((s: Sta) => s.isl === isl && s.k === "flower");
    if (!st) return;
    const L = planted[isl] || (planted[isl] = []);
    for (let i = 0; i < cnt; i++) {
      L.push({
        p: lw(st, -0.7 + Math.random() * 1.2, 0.14, -0.4 + Math.random() * 0.8),
        b: clk() + i * 0.5,
        c: Math.floor(Math.random() * 3),
      });
      if (L.length > 7) L.shift();
    }
  };
  STATIONS.forEach((s: Sta) => {
    if (s.k === "flower") {
      plant(s.isl, 2);
      (planted[s.isl] || []).forEach((fl: { b: number }) => {
        fl.b = -100;
      });
    }
  });
  const setState = (w: Walker3, s: string) => {
    const tr = w.trav;
    if (!tr || tr.state === s) return;
    tr.state = s;
    const el = tagOf[w.id];
    if (el) {
      if (s) el.dataset.st = s;
      else delete el.dataset.st;
    }
  };
  const enterSeg = (w: Walker3, s: Seg) => {
    const tr = w.trav as Trav;
    if (s.act) {
      tr.acting = s.act;
      const others =
        s.slot >= 0
          ? walkers.filter(
              (o: Walker3) =>
                o !== w &&
                !!o.trav &&
                o.trav.on &&
                !!o.trav.segs[0] &&
                o.trav.segs[0].k === 2 &&
                o.trav.segs[0].stk === s.stk,
            )
          : [];
      if (others.length) {
        let rem = s.dur;
        others.forEach((o: Walker3) => {
          const ot = o.trav as Trav;
          rem = Math.max(rem, ot.segs[0].dur - ot.st);
        });
        const tgt = Math.min(14, Math.max(rem, 7));
        s.dur = tgt;
        others.forEach((o: Walker3) => {
          const ot = o.trav as Trav;
          if (ot.segs[0].dur < 1e5) ot.segs[0].dur = ot.st + tgt;
        });
        if (s.act === "flower") {
          plant(s.isl, 1);
          bloomAt[s.isl] = clk();
        }
      } else if (s.act === "flower") plant(s.isl, 2);
      propOn[s.stk] = Math.max(propOn[s.stk] || 0, clk() + s.dur);
      const iv = invited[w.id] || 0;
      delete invited[w.id];
      if (iv > clk()) say(w.id, joinLine(w.id), 2, null);
      else if (!others.length) say(w.id, actLine(w.id, s.act), 1, null);
    }
    setState(
      w,
      s.act
        ? `act:${s.isl}:${s.act}`
        : s.moor
          ? "boat"
          : s.bridge
            ? "bridge"
            : "",
    );
  };
  const exitSeg = (w: Walker3, s: Seg) => {
    const tr = w.trav as Trav;
    if (s.act) tr.acting = "";
    if (s.arr) tr.visits = s.arr === tr.home ? 0 : tr.visits + 1;
  };
  const stepTrav = (w: Walker3, dt: number) => {
    const tr = w.trav;
    if (!tr) return;
    tr.st += dt;
    for (let g = 0; g < 16; g++) {
      if (!tr.segs.length) planTrav(tr, allT, false);
      if (!tr.segs.length)
        addWait(tr, ringP(tr.at, tr.ang), -tr.ang, 2, "", tr.at, "");
      const s0 = tr.segs[0];
      if (!tr.on) {
        tr.on = true;
        enterSeg(w, s0);
      }
      if (tr.st < s0.dur) break;
      tr.st -= s0.dur;
      exitSeg(w, s0);
      tr.segs.shift();
      tr.on = false;
    }
    const s = tr.segs[0];
    if (!s) return;
    const f = Math.max(0, Math.min(1, tr.st / s.dur));
    tr.boatAt = null;
    tr.moving = true;
    if (s.k === 1) {
      const a = s.a0 + (s.a1 - s.a0) * f;
      tr.q = [
        s.X + RING * Math.cos(a),
        T_TOP,
        s.Z + RING * Math.sin(a),
        s.a1 > s.a0 ? -a : Math.PI - a,
      ];
    } else if (s.k === 2) {
      tr.q = [s.a[0], s.a[1], s.a[2], s.h];
      tr.moving = false;
    } else {
      const dx = s.b[0] - s.a[0],
        dz = s.b[2] - s.a[2];
      const h =
        Math.abs(dx) + Math.abs(dz) > 0.01 ? Math.atan2(dx, dz) : tr.q[3];
      tr.q = [
        s.a[0] + dx * f,
        s.a[1] + (s.b[1] - s.a[1]) * f,
        s.a[2] + dz * f,
        s.moor ? s.bh : h,
      ];
      if (s.moor === 3) tr.moving = false;
      if (s.moor) {
        const bx = s.moor === 1 ? s.b[0] : s.moor === 2 ? s.a[0] : tr.q[0],
          bz = s.moor === 1 ? s.b[2] : s.moor === 2 ? s.a[2] : tr.q[2];
        tr.boatAt = [bx, bz, s.bh];
      }
    }
  };
  const tapProp = (st: Sta) => {
    const act = st.k === "spec" ? st.isl : st.k;
    const key = `${st.isl}:${st.k}`;
    const n = clk();
    propOn[key] = Math.max(propOn[key] || 0, n + 5);
    if (st.k === "flower") plant(st.isl, 2);
    say("", INVITE[act] || "一起來！", 2, [st.P[0], st.P[1] + 2.6, st.P[2]]);
    const cand = walkers.filter((w: Walker3) => {
      const tr = w.trav;
      if (!tr || !w.g) return false;
      const s0 = tr.segs[0];
      if (!s0 || s0.bridge || s0.moor || (s0.k === 2 && !!s0.act) || tr.boatAt)
        return false;
      const c = islAt(tr.q);
      return (
        c === st.isl || nbrs(c).some((x: { to: string }) => x.to === st.isl)
      );
    });
    cand.sort((a: Walker3, b: Walker3) => {
      const qa = (a.trav as Trav).q,
        qb = (b.trav as Trav).q;
      return (
        Math.hypot(qa[0] - st.P[0], qa[2] - st.P[2]) -
        Math.hypot(qb[0] - st.P[0], qb[2] - st.P[2])
      );
    });
    let got = 0;
    for (const w of cand) {
      if (got >= 3) break;
      const tr = w.trav as Trav;
      const sl = freeSlot(allT, st, tr);
      if (sl < 0) break;
      const q = tr.q;
      const from: V3 = [q[0], q[1], q[2]];
      const cur = islAt(q);
      tr.segs = [];
      tr.st = 0;
      tr.on = false;
      if (cur === st.isl) goStation(tr, st, sl, 8 + Math.random() * 2, from);
      else {
        const nb = nbrs(cur).find((x: { to: string }) => x.to === st.isl);
        if (!nb) continue;
        const [X0, Z0] = ctrOf(cur);
        const a = Math.atan2(q[2] - Z0, q[0] - X0);
        tr.at = cur;
        tr.ang = a;
        addLine(tr, from, ringP(cur, a), WALK);
        depart(tr, st.isl, nb.boat);
        goStation(tr, st, sl, 8, null);
      }
      invited[w.id] = n + 40;
      got++;
    }
    if (!got) {
      let near: Walker3 | null = null,
        nd = 5.5;
      walkers.forEach((w: Walker3) => {
        if (!w.g) return;
        const q = posOf(w, tAnim);
        const d = Math.hypot(q[0] - st.P[0], q[2] - st.P[2]);
        if (d < nd) {
          nd = d;
          near = w;
        }
      });
      if (near)
        say((near as Walker3).id, actLine((near as Walker3).id, act), 1, null);
    }
    touch();
  };
  // ---- 社交：群組、成對對話、橋上擊掌、活動動態 ----
  interface GM {
    w: Walker3;
    slot: number;
    s: Seg;
  }
  const staOf = (k: string): Sta | undefined =>
    STATIONS.find((x: Sta) => `${x.isl}:${x.k}` === k);
  const groupsNow = (): Record<string, GM[]> => {
    const G: Record<string, GM[]> = {};
    walkers.forEach((w: Walker3) => {
      const tr = w.trav;
      if (!tr || !tr.on) return;
      const s0 = tr.segs[0];
      if (!s0 || s0.k !== 2 || !s0.stk || s0.slot < 0) return;
      (G[s0.stk] || (G[s0.stk] = [])).push({ w, slot: s0.slot, s: s0 });
    });
    Object.keys(G).forEach((k: string) =>
      G[k].sort((a: GM, b: GM) => a.slot - b.slot),
    );
    return G;
  };
  const hi5: Record<string, number> = {};
  const hiCool: Record<string, number> = {};
  let hiFx: { p: V3; until: number }[] = [];
  const poseMap = (GN: Record<string, GM[]>): Record<string, string> => {
    const o: Record<string, string> = {};
    const n = clk();
    Object.keys(GN).forEach((k: string) => {
      const M = GN[k];
      const st = staOf(k);
      if (!st) return;
      const a = st.k === "spec" ? st.isl : st.k;
      M.forEach((m: GM, i: number) => {
        let p = "act";
        if (a === "tea") p = "sit";
        else if (a === "flower") p = "water";
        else if (a === "civ") p = m.slot === 0 ? "act" : "clap";
        else if (a === "earth")
          p =
            M.length > 1
              ? i === Math.floor(n / 3.2) % M.length
                ? "look"
                : "idle"
              : "look";
        else if (a === "phy") p = m.slot === 0 ? "act" : "wow";
        else if (a === "his") p = "idle";
        else if (a === "geo") p = m.slot === 0 ? "act" : "look";
        o[m.w.id] = p;
      });
    });
    Object.keys(hi5).forEach((id: string) => {
      if (hi5[id] > n) o[id] = "hi5";
      else delete hi5[id];
    });
    return o;
  };
  const greetLine = (id: string, base: string): string =>
    id === "crew-14"
      ? "哈囉我～" + base
      : id === "crew-15"
        ? base + "嘻嘻！"
        : aniOf(id)
          ? (aniOf(id) as Ani).sound + base
          : base;
  const checkGreet = () => {
    const n = clk();
    const B = walkers.filter(
      (w: Walker3) =>
        !!w.g &&
        !!w.trav &&
        w.trav.on &&
        !!w.trav.segs[0] &&
        w.trav.segs[0].bridge,
    );
    for (let i = 0; i < B.length; i++)
      for (let j = i + 1; j < B.length; j++) {
        const a = B[i],
          b = B[j];
        if ((hiCool[a.id] || 0) > n || (hiCool[b.id] || 0) > n) continue;
        const qa = (a.trav as Trav).q,
          qb = (b.trav as Trav).q;
        if (Math.hypot(qa[0] - qb[0], qa[2] - qb[2]) > 1.4) continue;
        hiCool[a.id] = n + 14;
        hiCool[b.id] = n + 14;
        hi5[a.id] = n + 2.2;
        hi5[b.id] = n + 2.2;
        const g = rpick(GREET);
        const key = `hi5:${a.id}|${b.id}`;
        say(a.id, greetLine(a.id, g[0]), 1, null, { grp: key, life: 3 });
        say(b.id, greetLine(b.id, g[1]), 1, null, { grp: key, life: 3 });
        hiFx.push({
          p: [(qa[0] + qb[0]) / 2, qa[1] + 2.6, (qa[2] + qb[2]) / 2],
          until: n + 1.8,
        });
        if (hiFx.length > 4) hiFx.shift();
        setState(a, "hi5");
        setState(b, "hi5");
      }
  };
  const makeScript = (k: string, M: GM[]): DL => {
    const st = staOf(k) as Sta;
    const a = st.k === "spec" ? st.isl : st.k;
    const ids = M.map((m: GM) => m.w.id);
    const gs = ids.map(groupOf);
    const ix = (g: string): number => gs.indexOf(g);
    const ot = (i: number): number => (i === 0 ? 1 : 0);
    const d = ix("dad"),
      g = ix("goal"),
      mo = ix("mom"),
      kd = ix("kid"),
      f1 = ix("fr"),
      f2 = gs.indexOf("fr", f1 + 1),
      an = ids.findIndex((x: string) => x.startsWith("ani-")),
      il = ix("idol");
    const sp: DL[] = [];
    if (d >= 0 && g >= 0)
      sp.push([
        [d, `哈囉我～你就是${GOAL_SCHOOL}那位同學？`],
        [g, "叔叔好，我是來陪大家讀書的。"],
        [d, `很好，先考上${GOAL_SCHOOL}再說！顆顆呵呵啾咪。`],
      ]);
    if (d >= 0) {
      const p = rpick(DAD_PUNS);
      sp.push([
        [d, p[0]],
        [ot(d), p[1]],
        [d, p[2]],
      ]);
    }
    if (mo >= 0 && kd >= 0)
      sp.push([
        [mo, "啾啾，不要吵大家讀書！"],
        [kd, "我是來幫忙的啦～"],
        [mo, "那就好好幫忙，畫起來，這個會考！"],
      ]);
    if (kd >= 0)
      sp.push([
        [kd, "我比你先做完！略略略～"],
        [ot(kd), "啾啾你根本還沒開始吧！"],
        [kd, "嘻嘻，被發現了。"],
      ]);
    if (mo >= 0)
      sp.push([
        [mo, rpick(MOM_OPEN)],
        [ot(mo), rpick(["好～", "遵命！", "收到！"])],
      ]);
    if (f1 >= 0 && f2 >= 0) {
      const p = rpick(FR_TEASE);
      sp.push([
        [f1, p[0]],
        [f2, p[1]],
        [f1, p[2]],
      ]);
    }
    if (g >= 0) {
      const p = rpick(GOAL_PUSH);
      sp.push([
        [g, p[0]],
        [ot(g), p[1]],
        [g, p[2]],
      ]);
    }
    if (il >= 0)
      sp.push([
        [il, idolCatch(ids[il])],
        [ot(il), "哇～被偶像稱讚了！"],
      ]);
    if (an >= 0) {
      const A = aniOf(ids[an]);
      sp.push([
        [an, `${A ? A.sound : ""}我也要一起！`],
        [ot(an), "好啊，一起來！"],
      ]);
    }
    const r = Math.random();
    if (sp.length && r < 0.45) return rpick(sp);
    const fx = DLG[a];
    if (fx && r < 0.8) return rpick(fx);
    const L: DL = [
      [0, actLine(ids[0], a)],
      [1, respLine(ids[1])],
    ];
    if (M.length > 2) L.push([2, CHORUS[a] || "一起加油！"]);
    return L;
  };
  const dlg: Record<string, { L: DL; i: number; next: number }> = {};
  const dlgCool: Record<string, number> = {};
  const onScr = (p: V3): boolean => {
    const s2 = project(p);
    return !!s2 && s2[0] > 0 && s2[0] < W && s2[1] > 0 && s2[1] < H;
  };
  // 活動動態（可收合）；點一則就飛過去
  const tick = mkEl("g3-tick", "");
  const tickBtn = document.createElement("button");
  tickBtn.type = "button";
  tickBtn.className = "g3-tbtn";
  const tickList = document.createElement("div");
  tickList.className = "g3-tl";
  tick.append(tickBtn, tickList);
  let tickOpen: boolean | null = null;
  let tickSig = "";
  const nameOf = (w: Walker3): string =>
    w.id === "crew-13"
      ? "媽媽"
      : aniOf(w.id)
        ? (aniOf(w.id) as Ani).name
        : w.tag || ["同學", "小熊", "小貓", "小雞"][w.kind] || "島民";
  const joinN = (L: string[]): string => {
    const cnt: Record<string, number> = {};
    L.forEach((x: string) => {
      cnt[x] = (cnt[x] || 0) + 1;
    });
    const u = Object.keys(cnt).map((x: string) =>
      cnt[x] > 1
        ? `${["", "", "兩", "三", "四", "五"][cnt[x]] || cnt[x]}${x === "同學" ? "位" : "隻"}${x}`
        : x,
    );
    return u.length <= 1
      ? u.join("")
      : `${u.slice(0, -1).join("、")}和${u[u.length - 1]}`;
  };
  const describe = (k: string, M: GM[]): string => {
    const st = staOf(k) as Sta;
    const a = st.k === "spec" ? st.isl : st.k;
    const isl = islandById(st.isl);
    const iname = isl ? isl.name : "";
    const names = M.map((m: GM) => nameOf(m.w));
    if (a === "civ") {
      const sp = M[0].slot === 0 ? names[0] : "";
      const au = sp ? names.slice(1) : names;
      return sp
        ? au.length
          ? `${sp}在${iname}站上肥皂箱演講，${joinN(au)}在聽`
          : `${sp}在${iname}站上肥皂箱演講`
        : `${joinN(au)}在${iname}等演講開始`;
    }
    return `${joinN(names)}在${iname}${VERB[a] || "做活動"}`;
  };
  const flyToSta = (st: Sta) => {
    focusId = st.isl;
    syncNav();
    const [X, Z] = ctrOf(st.isl);
    const yw = Math.atan2(st.P[0] - X, st.P[2] - Z);
    const sy = Math.sin(yw),
      cy = Math.cos(yw);
    flyTo({
      tx: st.P[0] - 3.4 * sy,
      tz: st.P[2] - 3.4 * cy,
      yaw: yw,
      pitch: 0.8,
      dist: Math.max(17, focusDist() * 0.62),
    });
  };
  const renderTick = (G: Record<string, GM[]>) => {
    if (tickOpen === null) tickOpen = W >= 560;
    const sc = (k: string): number =>
      G[k].length + (focusId && k.startsWith(focusId + ":") ? 10 : 0);
    const ks = Object.keys(G)
      .sort((a: string, b: string) => sc(b) - sc(a))
      .slice(0, W < 560 ? 2 : 3);
    const items = ks.map((k: string) => ({
      k,
      n: G[k].length,
      t: describe(k, G[k]),
    }));
    const sig = `${tickOpen}|${items.map((x: { k: string; t: string }) => x.k + x.t).join("|")}`;
    if (sig === tickSig) return;
    tickSig = sig;
    tickBtn.textContent = `活動動態 ${tickOpen ? "▾" : "▸"}`;
    tickBtn.setAttribute("aria-expanded", tickOpen ? "true" : "false");
    tickList.textContent = "";
    tickList.style.display = tickOpen ? "" : "none";
    items.forEach((x: { k: string; n: number; t: string }) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "g3-ti";
      b.textContent = x.t;
      b.dataset.key = x.k;
      b.dataset.n = String(x.n);
      b.onclick = () => {
        const st = staOf(x.k);
        if (st) flyToSta(st);
      };
      tickList.appendChild(b);
    });
  };
  tickBtn.onclick = () => {
    tickOpen = !tickOpen;
    tickSig = "";
    renderTick(groupsNow());
  };
  const tickSocial = () => {
    if (!visible) return;
    const n = clk();
    const G = groupsNow();
    Object.keys(dlg).forEach((k: string) => {
      if (!G[k] || G[k].length < 2) delete dlg[k];
    });
    Object.keys(G).forEach((k: string) => {
      const M = G[k];
      if (M.length < 2) return;
      const st = staOf(k);
      if (!st) return;
      let d = dlg[k];
      if (!d) {
        if (
          n < (dlgCool[k] || 0) ||
          Object.keys(dlg).length >= 2 ||
          !onScr(st.P)
        )
          return;
        d = dlg[k] = { L: makeScript(k, M), i: 0, next: n };
      }
      if (n < d.next) return;
      const step = d.L[d.i];
      if (!step) {
        delete dlg[k];
        dlgCool[k] = n + 4;
        return;
      }
      d.i++;
      d.next = n + 1.9;
      if (step[0] < 0)
        say("", step[1], 1, [st.P[0], st.P[1] + 2.9, st.P[2]], {
          grp: k,
          life: 3.6,
        });
      else {
        const m = M[step[0] % M.length];
        say(m.w.id, step[1], 1, null, { grp: k, life: 3.6 });
      }
      touch();
    });
    renderTick(G);
  };
  const socT = window.setInterval(tickSocial, 800);
  // 減少動態：直接擺好靜態群組（坐著喝茶、拿著澆水壺、聽演講），只換對話文字
  const tableau = () => {
    const n = clk();
    ISLANDS.forEach((isl: Island, ii: number) => {
      const here = walkers.filter(
        (w: Walker3) => !!w.trav && islAt((w.trav as Trav).q) === isl.id,
      );
      if (here.length < 2) return;
      const k: ActK = (["tea", "flower", "spec"] as ActK[])[ii % 3];
      const st = STATIONS.find((x: Sta) => x.isl === isl.id && x.k === k);
      if (!st) return;
      const key = `${st.isl}:${st.k}`;
      const sl = SLOTS[key] || [];
      const [X, Z] = ctrOf(st.isl);
      const act = st.k === "spec" ? st.isl : st.k;
      here.slice(0, Math.min(sl.length, 3)).forEach((w: Walker3, i: number) => {
        const tr = w.trav as Trav;
        const p = sl[i];
        tr.segs = [];
        tr.st = 0;
        addWait(tr, p.p, p.h, 1e6, act, st.isl, key, i);
        const a2 = Math.atan2(p.p[2] - Z, p.p[0] - X);
        addLine(tr, p.p, ringP(st.isl, a2), WALK);
        tr.ang = a2;
        tr.at = st.isl;
        tr.q = [p.p[0], p.p[1], p.p[2], p.h];
        tr.on = true;
        tr.moving = false;
        tr.acting = act;
        setState(w, `act:${st.isl}:${act}`);
      });
      propOn[key] = n + 1e6;
    });
    touch();
  };
  const rebuildLabels = (D: Data3) => {
    labels.forEach((l: { el: HTMLDivElement }) => l.el.remove());
    tags.forEach((t: { el: HTMLDivElement }) => t.el.remove());
    labels = [];
    tags = [];
    ISLANDS.forEach((isl: Island, ii: number) => {
      const p = D.progress[isl.id] || 0;
      const sel = D.selected === isl.id;
      const el = mkEl("g3-isl", "");
      const nb = document.createElement("b");
      nb.style.color = ORANGE;
      nb.style.fontFamily = "ui-monospace,Menlo,monospace";
      nb.textContent = String(ii + 1).padStart(2, "0");
      const nm = document.createElement("span");
      nm.textContent = ` ${isl.name}${p >= 1 ? "・慶典" : ""} `;
      const pc = document.createElement("i");
      pc.textContent = `建築 ${Math.round(p * 100)}%`;
      el.append(nb, nm, pc);
      if (sel) el.style.borderColor = ORANGE;
      el.onclick = () => focusIsland(isl.id, true);
      el.dataset.isl = isl.id;
      labels.push({ el, p: [wx(isl.x), 0.4, wz(isl.y) + 10.2], dy: 0 });
    });
    const pairs = new Map<string, number>();
    LINKS.forEach((l: Link2) => {
      const ua = unitById(l.a),
        ub = unitById(l.b);
      if (!ua || !ub || ua.island === ub.island) return;
      const key = [ua.island, ub.island].sort().join("|");
      pairs.set(key, (pairs.get(key) || 0) + 1);
    });
    pairs.forEach((n: number, key: string) => {
      const [ia, ib] = key.split("|");
      const A = islandById(ia),
        B = islandById(ib);
      if (!A || !B) return;
      const on = D.selected === ia || D.selected === ib;
      const el = mkEl("g3-lnk", `協作 ${n}`);
      if (on) el.style.color = ORANGE;
      labels.push({
        el,
        p: [(wx(A.x) + wx(B.x)) / 2, 2.2, (wz(A.y) + wz(B.y)) / 2],
        dy: 0,
      });
    });
    walkers.forEach((w: Walker3) => {
      if (!w.tag) return;
      const el = mkEl(
        w.id.startsWith("idol-")
          ? "g3-tag g3-idol"
          : w.id.startsWith("ani-")
            ? "g3-tag g3-ani"
            : "g3-tag",
        w.tag,
      );
      if (w.id === "crew-18") {
        const bd = document.createElement("b");
        bd.className = "g3-badge";
        bd.textContent = GOAL_SCHOOL;
        el.appendChild(bd);
      }
      el.onclick = () => {
        const q = posOf(w, tAnim);
        flyTo(
          { tx: q[0], tz: q[2], yaw: q[3] + 0.45, pitch: 0.5, dist: 17 },
          600,
        );
        cb.onPoke(w.id);
      };
      tagOf[w.id] = el;
      if (w.trav && w.trav.state) el.dataset.st = w.trav.state;
      tags.push({ el, w });
    });
  };
  const posOf = (w: Walker3, t: number): [number, number, number, number] =>
    w.trav ? w.trav.q : w.path(t);
  const placeOverlay = (t: number) => {
    labels.forEach((l: { el: HTMLDivElement; p: V3 }) => {
      const s = project(l.p);
      if (
        !s ||
        (focusId && l.el.dataset.isl === focusId) ||
        s[0] < -60 ||
        s[0] > W + 60 ||
        s[1] < -20 ||
        s[1] > H + 20
      ) {
        l.el.style.display = "none";
        return;
      }
      l.el.style.display = "";
      l.el.style.transform = `translate(${s[0].toFixed(1)}px,${s[1].toFixed(1)}px) translate(-50%,-50%)`;
    });
    tags.forEach((g: { el: HTMLDivElement; w: Walker3 }) => {
      const q = posOf(g.w, t);
      const s = project([q[0], q[1], q[2]]);
      if (!s || s[0] < -40 || s[0] > W + 40 || s[1] < -20 || s[1] > H + 30) {
        g.el.style.display = "none";
        return;
      }
      g.el.style.display = "";
      g.el.style.transform = `translate(${s[0].toFixed(1)}px,${(s[1] + 4).toFixed(1)}px) translate(-50%,0)`;
    });
    const n = clk();
    bubs = bubs.filter((b: Bub) => {
      if (b.until > n) return true;
      b.el.remove();
      return false;
    });
    bubs.forEach((b: Bub) => {
      const an = anchorOf(b.wid, b.at);
      const s = an ? project(an) : null;
      if (!s || s[0] < -100 || s[0] > W + 100 || s[1] < -40 || s[1] > H + 40) {
        b.el.style.display = "none";
        return;
      }
      b.el.style.display = "";
      const hw = Math.min(W / 2 - 4, b.el.offsetWidth / 2 + 4);
      b.el.style.transform = `translate(${Math.min(W - hw, Math.max(hw, s[0])).toFixed(1)}px,${(s[1] + b.dy).toFixed(1)}px) translate(-50%,-100%)`;
    });
    // 活動小字卡：拉近才顯示，最多 4 個
    const act: { key: string; st: Sta; s: [number, number, number] }[] = [];
    if (cam.dist < 75)
      STATIONS.forEach((st: Sta) => {
        const key = `${st.isl}:${st.k}`;
        if ((propOn[key] || 0) <= n) return;
        const s = project([
          st.P[0],
          st.P[1] + (st.k === "spec" && st.isl === "math" ? 1.9 : 2.6),
          st.P[2],
        ]);
        if (s && s[0] > 0 && s[0] < W && s[1] > 0 && s[1] < H)
          act.push({ key, st, s });
      });
    act.sort(
      (
        a: { s: [number, number, number] },
        b: { s: [number, number, number] },
      ) => a.s[2] - b.s[2],
    );
    const shown = act.slice(0, 4);
    Object.keys(fxEls).forEach((k: string) => {
      if (!shown.some((x: { key: string }) => x.key === k))
        fxEls[k].style.display = "none";
    });
    shown.forEach(
      (x: { key: string; st: Sta; s: [number, number, number] }) => {
        const ak = x.st.k === "spec" ? x.st.isl : x.st.k;
        const list = FX_TEXT[ak] || ["…"];
        let el = fxEls[x.key];
        if (!el) {
          el = mkEl(ak === "math" ? "g3-fx g3-chalk" : "g3-fx", "");
          fxEls[x.key] = el;
        }
        const txt = list[Math.floor(n * 0.7 + x.st.al * 3) % list.length];
        if (el.textContent !== txt) el.textContent = txt;
        el.style.display = "";
        el.style.transform = `translate(${x.s[0].toFixed(1)}px,${x.s[1].toFixed(1)}px) translate(-50%,-100%)`;
      },
    );
  };
  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
    lastNow = now;
    if (motion) tAnim += dt;
    const anim = motion;
    if (!dirty && !anim && !fly && !(reacting && now - reactAt < 700)) return;
    if (anim && now - last < 30 && !dirty) {
      raf = requestAnimationFrame(frame);
      return;
    }
    last = now;
    dirty = false;
    stepFly(now);
    calcCam();
    G.viewport(0, 0, canvas.width, canvas.height);
    G.clearColor(fog[0], fog[1], fog[2], 1);
    G.clear(G.COLOR_BUFFER_BIT | G.DEPTH_BUFFER_BIT);
    G.uniformMatrix4fv(uVP, false, VP);
    G.uniform3f(uE, eye[0], eye[1], eye[2]);
    if (scene) draw(scene, m4());
    const t = tAnim;
    const dS = t - lastSim;
    lastSim = t;
    if (dS > 0)
      walkers.forEach((w: Walker3) => stepTrav(w, Math.min(dS, 0.25)));
    if (anim && dS > 0) checkGreet();
    // 船與雲
    const bx = ((t * 1.6) % 160) - 80;
    draw(
      boatG,
      mmul(mT(bx, 0, 46 + Math.sin(t * 0.5) * 0.3), mRY(Math.PI / 2)),
    );
    const bx2 = 80 - ((t * 1.2 + 70) % 160);
    draw(boatG, mmul(mT(bx2, 0, -42), mRY(-Math.PI / 2)));
    [
      [0, -30, 0],
      [40, 10, 1],
      [80, -10, 2],
    ].forEach(([o, z, k]: number[]) =>
      draw(
        cloudG,
        mmul(mT(((t * 0.8 + o) % 180) - 90, 26 + k * 3, z), mS(0.6 + k * 0.12)),
      ),
    );
    drawProps(t);
    // 角色
    const shadowList: M4[] = [];
    const GN = groupsNow();
    const PZ = poseMap(GN);
    walkers.forEach((w: Walker3) => {
      if (!w.g) return;
      const q = posOf(w, t);
      const s = w.g.scale;
      if (w.trav && w.trav.boatAt) {
        const BA = w.trav.boatAt;
        draw(
          rowG,
          mmul(
            mT(BA[0], anim ? Math.sin(t * 2 + w.seed) * 0.05 : 0, BA[1]),
            mRY(BA[2]),
          ),
        );
      }
      let hop = 0;
      if (w.id === reacting) {
        const k = (now - reactAt) / 600;
        if (k < 1) hop = Math.sin(k * Math.PI) * 1.4;
      }
      const ph = t * 7 + w.seed;
      const bob = anim ? Math.abs(Math.sin(ph)) * 0.08 : 0;
      const spin = w.fest && anim ? Math.sin(t * 3 + w.seed) * 0.9 : 0;
      const pz = PZ[w.id] || "";
      const sit = pz === "sit";
      const base = mmul(
        mmul(
          mT(q[0], q[1] + (sit ? -0.26 * s : bob) + hop, q[2]),
          mRY(q[3] + (pz ? 0 : spin)),
        ),
        mS(s),
      );
      const mv = !w.trav || w.trav.moving;
      const acting = !!(w.trav && w.trav.acting);
      const sw = anim && mv ? Math.sin(ph) * 0.55 : 0;
      const swA = anim && acting ? Math.sin(t * 5 + w.seed) * 0.9 : sw;
      const legY = 0.46;
      draw(w.g.parts.core, base);
      let aL = -swA * 0.9,
        aR = swA * 0.9;
      if (sit) {
        const upc = anim ? Math.sin(t * 1.3 + w.seed) > 0.5 : w.seed % 2 === 0;
        aL = -0.5;
        aR = upc ? -1.9 : -0.9;
      } else if (pz === "water") {
        aL = -0.3;
        aR = -1.1;
      } else if (pz === "clap") {
        const c = anim ? Math.sin(t * 14 + w.seed) * 0.25 : 0;
        aL = -1.5 + c;
        aR = -1.5 - c;
      } else if (pz === "look") {
        aL = -2.5;
        aR = -2.5;
      } else if (pz === "wow") {
        const upw = anim ? Math.sin(t * 2.2 + w.seed) > -0.2 : true;
        aL = upw ? -2.7 : -0.3;
        aR = aL;
      } else if (pz === "hi5") {
        aR = -2.9;
        aL = -0.2;
      } else if (pz === "idle") {
        aL = 0;
        aR = 0;
      }
      draw(
        w.g.parts.legL,
        mmul(base, mmul(mT(-0.13, legY, 0), mRX(sit ? -1.45 : sw))),
      );
      draw(
        w.g.parts.legR,
        mmul(base, mmul(mT(0.13, legY, 0), mRX(sit ? -1.45 : -sw))),
      );
      const armRM = mmul(base, mmul(mT(0.41, 1.0, 0), mRX(aR)));
      if (w.g.arms) {
        draw(w.g.parts.armL, mmul(base, mmul(mT(-0.41, 1.0, 0), mRX(aL))));
        if (!w.g.raised) draw(w.g.parts.armR, armRM);
      }
      if (sit && aR < -1.5)
        draw(
          cupG,
          w.g.arms
            ? mmul(armRM, mT(0, -0.5, 0.05))
            : mmul(base, mT(0.42, 1.05, 0.45)),
        );
      if (pz === "water") {
        const tilt = anim
          ? 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + w.seed))
          : 0.6;
        const CM = mmul(base, mmul(mT(0.44, 0.78, 0.55), mRX(tilt)));
        draw(canG, CM);
        const sp = xf(CM, [0, 0.07, 0.36]);
        const nd = anim ? 3 : 1;
        for (let i = 0; i < nd; i++) {
          const kk = anim ? (t * 1.7 + i / 3 + w.seed * 0.1) % 1 : 0.4;
          draw(dropG, mT(sp[0], sp[1] - kk * 1.1, sp[2]));
        }
      }
      shadowList.push(mmul(mT(q[0], q[1] + 0.03, q[2]), mS(s)));
    });
    // 群體特效：聽眾愛心／星星、小狗追球、開花閃光、擊掌星星
    const nn = clk();
    Object.keys(GN).forEach((k: string) => {
      const M = GN[k];
      const st = staOf(k);
      if (!st || M.length < 2) return;
      const a = st.k === "spec" ? st.isl : st.k;
      if (a === "civ")
        M.forEach((m: GM, i: number) => {
          if (m.slot === 0) return;
          const q = posOf(m.w, t);
          const sc = m.w.g ? m.w.g.scale : 1;
          const kk = anim ? (t * 0.55 + i * 0.37) % 1 : 0.4;
          draw(
            i % 2 ? sparkG : heartG,
            mmul(mT(q[0], q[1] + 2.3 * sc + kk * 1.6, q[2]), mS(1.7)),
          );
        });
      if (a === "bio") {
        const A = posOf(M[0].w, t),
          B = posOf(M[1].w, t);
        const u = anim ? (t * 0.45) % 2 : 0.5;
        const f = u < 1 ? u : 2 - u;
        draw(
          ballG,
          mT(
            A[0] + (B[0] - A[0]) * f,
            T_TOP + 0.18 + Math.sin(f * Math.PI) * 1.3,
            A[2] + (B[2] - A[2]) * f,
          ),
        );
        const g = Math.max(0, Math.min(1, u < 1 ? f - 0.2 : f + 0.2));
        const sgn = u < 1 ? 1 : -1;
        const Dm = mmul(
          mmul(
            mT(
              A[0] + (B[0] - A[0]) * g,
              T_TOP + (anim ? Math.abs(Math.sin(t * 9)) * 0.15 : 0),
              A[2] + (B[2] - A[2]) * g,
            ),
            mRY(Math.atan2((B[0] - A[0]) * sgn, (B[2] - A[2]) * sgn)),
          ),
          mS(0.8),
        );
        const pp = petP[0];
        const sw2 = anim ? Math.sin(t * 12) * 0.6 : 0;
        draw(pp.core, Dm);
        draw(pp.l, mmul(Dm, mmul(mT(-0.13, 0.46, 0), mRX(sw2))));
        draw(pp.r, mmul(Dm, mmul(mT(0.13, 0.46, 0), mRX(-sw2))));
      }
      if (
        (a === "flower" && nn - (bloomAt[st.isl] || -99) < 3.5) ||
        a === "phy"
      )
        for (let i = 0; i < 5; i++) {
          const ang = i * 1.2566 + (anim ? t * 1.5 : 0);
          const kk = anim ? (t * 0.8 + i * 0.2) % 1 : 0.5;
          draw(
            sparkG,
            mT(
              st.P[0] + Math.cos(ang) * 0.75,
              T_TOP + 0.7 + kk * 1.3,
              st.P[2] + Math.sin(ang) * 0.75,
            ),
          );
        }
    });
    hiFx = hiFx.filter((h: { until: number }) => h.until > nn);
    hiFx.forEach((h: { p: V3; until: number }) => {
      for (let i = 0; i < 4; i++) {
        const ang = i * 1.57 + (anim ? t * 4 : 0);
        draw(
          sparkG,
          mmul(
            mT(
              h.p[0] + Math.cos(ang) * 0.5,
              h.p[1] + Math.sin(ang) * 0.5,
              h.p[2],
            ),
            mS(1.4),
          ),
        );
      }
    });
    G.enable(G.BLEND);
    G.blendFunc(G.SRC_ALPHA, G.ONE_MINUS_SRC_ALPHA);
    G.depthMask(false);
    G.uniform1f(uA, 0.28);
    shadowList.forEach((M: M4) => draw(shadowG, M));
    G.uniform1f(uA, 1);
    G.depthMask(true);
    G.disable(G.BLEND);
    placeOverlay(t);
    if (anim || fly || (reacting && now - reactAt < 700))
      raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  };
  const touch = () => {
    dirty = true;
    kick();
  };
  // 操作：單指旋轉、雙指縮放＋平移、滾輪（Ctrl 或已拉近）縮放、右鍵／Shift 拖曳平移、點擊選取
  const ptrs = new Map<number, { x: number; y: number }>();
  let downAt = 0,
    moved = 0,
    lastPinch = 0,
    lastMid: [number, number] = [0, 0],
    panMode = false,
    downX = 0,
    downY = 0,
    maxD = 0,
    lastTapAt = 0,
    lastTapX = 0,
    lastTapY = 0;
  const slop = (e: PointerEvent): number =>
    e.pointerType === "mouse" ? 5 : 10;
  const clampCam = () => {
    cam.pitch = Math.max(0.42, Math.min(1.45, cam.pitch));
    cam.dist = Math.max(14, Math.min(fit * 1.6, cam.dist));
    cam.tx = Math.max(-60, Math.min(64, cam.tx));
    cam.tz = Math.max(-48, Math.min(50, cam.tz));
  };
  const pan = (dx: number, dy: number) => {
    const k = (cam.dist / H) * 0.75;
    const k2 = k / Math.max(0.4, Math.sin(cam.pitch));
    const c = Math.cos(cam.yaw),
      s = Math.sin(cam.yaw);
    cam.tx += -dx * c * k - dy * s * k2;
    cam.tz += dx * s * k - dy * c * k2;
  };
  const onDown = (e: PointerEvent) => {
    if (e.cancelable) e.preventDefault();
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_e) {
      /* 略過 */
    }
    if (ptrs.size === 1) {
      downAt = performance.now();
      moved = 0;
      maxD = 0;
      downX = e.clientX;
      downY = e.clientY;
      panMode = e.button === 2 || e.shiftKey;
    }
    fly = null;
    if (ptrs.size === 2) {
      const [a, b] = Array.from(ptrs.values());
      lastPinch = Math.hypot(a.x - b.x, a.y - b.y);
      lastMid = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      moved = 99;
    }
  };
  const onMove = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size >= 2) {
      const [a, b] = Array.from(ptrs.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid: [number, number] = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      if (lastPinch > 0 && d > 0) {
        const R = canvas.getBoundingClientRect();
        zoomAt(mid[0] - R.left, mid[1] - R.top, lastPinch / d);
      }
      pan(mid[0] - lastMid[0], mid[1] - lastMid[1]);
      lastPinch = d;
      lastMid = mid;
      clampCam();
      touch();
      return;
    }
    moved += Math.abs(dx) + Math.abs(dy);
    maxD = Math.max(maxD, Math.hypot(e.clientX - downX, e.clientY - downY));
    if (maxD < slop(e)) return;
    if (panMode) pan(dx, dy);
    else {
      cam.yaw -= dx * 0.008;
      cam.pitch += dy * 0.006;
    }
    clampCam();
    touch();
  };
  // 從螢幕點打一條射線到島面高度，拿來做「往指標縮放」
  const rayG = (x: number, y: number): [number, number] | null => {
    const ndx = (x / W) * 2 - 1,
      ndy = 1 - (y / H) * 2;
    const th = Math.tan(FOV / 2);
    const fw: V3 = [cam.tx - eye[0], -eye[1], cam.tz - eye[2]];
    const fl = Math.hypot(fw[0], fw[1], fw[2]);
    fw[0] /= fl;
    fw[1] /= fl;
    fw[2] /= fl;
    let rx = fw[2],
      rz = -fw[0];
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    const rt: V3 = [-rx, 0, -rz];
    const uv: V3 = [
      rt[1] * fw[2] - rt[2] * fw[1],
      rt[2] * fw[0] - rt[0] * fw[2],
      rt[0] * fw[1] - rt[1] * fw[0],
    ];
    const dir: V3 = [
      fw[0] + rt[0] * ndx * th * (W / H) + uv[0] * ndy * th,
      fw[1] + rt[1] * ndx * th * (W / H) + uv[1] * ndy * th,
      fw[2] + rt[2] * ndx * th * (W / H) + uv[2] * ndy * th,
    ];
    if (dir[1] >= -0.02) return null;
    const k = (T_TOP - eye[1]) / dir[1];
    return [eye[0] + dir[0] * k, eye[2] + dir[2] * k];
  };
  const zoomAt = (x: number, y: number, f: number, anim = false) => {
    fly = null;
    const s0: CamS = {
      tx: cam.tx,
      tz: cam.tz,
      yaw: cam.yaw,
      pitch: cam.pitch,
      dist: cam.dist,
    };
    calcCam();
    const g0 = rayG(x, y);
    cam.dist *= f;
    clampCam();
    calcCam();
    const g1 = rayG(x, y);
    if (g0 && g1) {
      cam.tx += g0[0] - g1[0];
      cam.tz += g0[1] - g1[1];
    }
    clampCam();
    if (anim) {
      const b: CamS = {
        tx: cam.tx,
        tz: cam.tz,
        yaw: cam.yaw,
        pitch: cam.pitch,
        dist: cam.dist,
      };
      cam.tx = s0.tx;
      cam.tz = s0.tz;
      cam.dist = s0.dist;
      flyTo(b, 350);
    } else touch();
  };
  const pick = (cx: number, cy: number) => {
    calcCam();
    const r = canvas.getBoundingClientRect();
    const x = cx - r.left,
      y = cy - r.top;
    let best: Walker3 | null = null,
      bd = 1e9;
    const f = H / 2 / Math.tan(FOV / 2);
    walkers.forEach((w: Walker3) => {
      if (!w.g) return;
      const q = posOf(w, tAnim);
      const s = project([q[0], q[1] + 1.1 * w.g.scale, q[2]]);
      if (!s) return;
      const rad = Math.max(20, (1.3 * w.g.scale * f) / s[2]);
      const d = Math.hypot(s[0] - x, s[1] - y);
      if (d < rad && d / rad < bd) {
        bd = d / rad;
        best = w;
      }
    });
    if (best) {
      cb.onPoke((best as Walker3).id);
      return;
    }
    // 點活動道具：觸發小互動
    let bst: Sta | null = null,
      bsd = 1e9;
    STATIONS.forEach((st: Sta) => {
      const s = project([st.P[0], st.P[1] + 0.8, st.P[2]]);
      if (!s) return;
      const rad = Math.max(16, (1.1 * f) / s[2]);
      const d = Math.hypot(s[0] - x, s[1] - y);
      if (d < rad && d / rad < bsd) {
        bsd = d / rad;
        bst = st;
      }
    });
    if (bst) {
      tapProp(bst as Sta);
      return;
    }
    // 射線與島面相交
    const ndx = (x / W) * 2 - 1,
      ndy = 1 - (y / H) * 2;
    const th = Math.tan(FOV / 2);
    const fw: V3 = [cam.tx - eye[0], -eye[1], cam.tz - eye[2]];
    const fl = Math.hypot(fw[0], fw[1], fw[2]);
    fw[0] /= fl;
    fw[1] /= fl;
    fw[2] /= fl;
    let rx = fw[2],
      rz = -fw[0];
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    const rt: V3 = [-rx, 0, -rz];
    const uv: V3 = [
      rt[1] * fw[2] - rt[2] * fw[1],
      rt[2] * fw[0] - rt[0] * fw[2],
      rt[0] * fw[1] - rt[1] * fw[0],
    ];
    const dir: V3 = [
      fw[0] + rt[0] * ndx * th * (W / H) + uv[0] * ndy * th,
      fw[1] + rt[1] * ndx * th * (W / H) + uv[1] * ndy * th,
      fw[2] + rt[2] * ndx * th * (W / H) + uv[2] * ndy * th,
    ];
    if (dir[1] >= 0) return;
    const k = (T_TOP - eye[1]) / dir[1];
    const hx = eye[0] + dir[0] * k,
      hz = eye[2] + dir[2] * k;
    let bi: Island | null = null,
      bdd = 1e9;
    ISLANDS.forEach((isl: Island) => {
      const d = Math.hypot(wx(isl.x) - hx, wz(isl.y) - hz);
      if (d < 9.6 && d < bdd) {
        bdd = d;
        bi = isl;
      }
    });
    if (bi) {
      const id = (bi as Island).id;
      pendTap = window.setTimeout(() => {
        pendTap = 0;
        focusIsland(id, true);
      }, 240);
    }
  };
  const onUp = (e: PointerEvent) => {
    const had = ptrs.has(e.pointerId);
    ptrs.delete(e.pointerId);
    if (
      had &&
      ptrs.size === 0 &&
      moved < 99 &&
      maxD < slop(e) &&
      performance.now() - downAt < 700 &&
      e.type === "pointerup"
    ) {
      const R = canvas.getBoundingClientRect();
      const x = e.clientX - R.left,
        y = e.clientY - R.top;
      const tn = performance.now();
      if (tn - lastTapAt < 330 && Math.hypot(x - lastTapX, y - lastTapY) < 30) {
        lastTapAt = 0;
        if (pendTap) {
          clearTimeout(pendTap);
          pendTap = 0;
        }
        zoomAt(x, y, 0.5, true);
      } else {
        lastTapAt = tn;
        lastTapX = x;
        lastTapY = y;
        pick(e.clientX, e.clientY);
      }
    }
    if (ptrs.size === 1) {
      const [a] = Array.from(ptrs.values());
      void a;
      moved = 99;
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && cam.dist >= fit * 0.98) return;
    e.preventDefault();
    const R = canvas.getBoundingClientRect();
    zoomAt(
      e.clientX - R.left,
      e.clientY - R.top,
      e.deltaY > 0 ? 1.12 : 1 / 1.12,
    );
  };
  const onCtx = (e: Event) => e.preventDefault();
  const onLost = (e: Event) => {
    e.preventDefault();
    cb.onFail("3D 畫面暫時中斷（WebGL context lost）");
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onCtx);
  canvas.addEventListener("webglcontextlost", onLost);
  let io: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver((en: IntersectionObserverEntry[]) => {
      visible =
        en.some((x: IntersectionObserverEntry) => x.isIntersecting) &&
        !document.hidden;
      lastNow = 0;
      if (visible) touch();
    });
    io.observe(overlay);
  }
  const onVis = () => {
    visible = !document.hidden;
    lastNow = 0;
    if (visible) touch();
  };
  document.addEventListener("visibilitychange", onVis);
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => {
      resize();
      touch();
    });
    ro.observe(overlay);
  }
  resize();
  cam.dist = fit;
  return {
    setData: (D: Data3) => {
      const k = JSON.stringify(D);
      if (k === dataKey) return;
      dataKey = k;
      if (D.selected !== lastSel) {
        lastSel = D.selected;
        if (
          scene &&
          D.selected &&
          D.selected !== focusId &&
          islandById(D.selected)
        )
          focusIsland(D.selected, false);
      }
      free(scene);
      scene = up(buildScene(D));
      walkers.forEach((w: Walker3) => {
        if (w.g) Object.values(w.g.parts).forEach((g: GMesh) => free(g));
      });
      const oldT = new Map<string, Trav>();
      walkers.forEach((w: Walker3) => {
        if (w.trav) oldT.set(w.id, w.trav);
      });
      walkers = walkerList(D);
      const fresh: Trav[] = [];
      walkers.forEach((w: Walker3) => {
        if (!w.trav) return;
        const o = oldT.get(w.id);
        if (o) w.trav = o;
        else fresh.push(w.trav);
      });
      allT = walkers
        .filter((w: Walker3) => !!w.trav)
        .map((w: Walker3) => w.trav as Trav);
      fresh.forEach((tr: Trav) => planTrav(tr, allT, true));
      Object.keys(tagOf).forEach((k: string) => {
        delete tagOf[k];
      });
      walkers.forEach((w: Walker3) => {
        const cp = charParts(w.kind, w.seed);
        w.g = {
          parts: {
            core: up(cp.parts.core),
            legL: up(cp.parts.legL),
            legR: up(cp.parts.legR),
            armL: up(cp.parts.armL),
            armR: up(cp.parts.armR),
          },
          arms: cp.parts.arms,
          raised: !!cp.parts.raised,
          scale: cp.scale,
        };
      });
      rebuildLabels(D);
      if (!motion) tableau();
      touch();
    },
    setTalk: (b: Bubble | null, r: string) => {
      const tapped = !!r && r !== reacting;
      if (tapped) reactAt = performance.now();
      reacting = r;
      if (b && (!talk || b.key !== talk.key))
        say(b.id, b.text, b.id === r ? 2 : 0, null);
      else if (tapped)
        say(
          r,
          r.startsWith("idol-") ? "（粉絲應援）加油！" : "嘿！一起加油！",
          2,
          null,
        );
      talk = b;
      touch();
    },
    setMotion: (b: boolean) => {
      motion = b;
      lastNow = 0;
      if (!b && tAnim < 0.5) tableau();
      if (b) {
        const n = clk();
        walkers.forEach((w: Walker3) => {
          const tr = w.trav;
          if (tr && tr.segs[0] && tr.segs[0].dur > 1e5)
            tr.segs[0].dur = tr.st + 3 + Math.random() * 4;
        });
        Object.keys(propOn).forEach((k: string) => {
          if (propOn[k] > n + 1e5) propOn[k] = n + 5;
        });
      }
      touch();
    },
    reset: () => {
      focusId = "";
      syncNav();
      listEl.style.display = "none";
      if (pendTap) {
        clearTimeout(pendTap);
        pendTap = 0;
      }
      flyTo({ tx: 2.5, tz: 2, yaw: 0, pitch: 0.92, dist: fit });
    },
    zoom: (f: number) => {
      cam.dist /= f;
      clampCam();
      touch();
    },
    rotate: (a: number) => {
      cam.yaw += a;
      touch();
    },
    destroy: () => {
      if (raf) cancelAnimationFrame(raf);
      if (pendTap) clearTimeout(pendTap);
      clearInterval(socT);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onCtx);
      canvas.removeEventListener("webglcontextlost", onLost);
      document.removeEventListener("visibilitychange", onVis);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      overlay
        .querySelectorAll(
          ".g3-isl,.g3-lnk,.g3-tag,.g3-bub,.g3-fx,.g3-nav,.g3-list,.g3-tick",
        )
        .forEach((n: Element) => n.remove());
    },
  };
}

const CSS3 = `
.g3-wrap{position:relative;width:100%;height:clamp(420px,60vw,640px);border-radius:22px;overflow:hidden;background:#A9D2D0;color-scheme:light;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.g3-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
.g3-ov{position:absolute;inset:0;pointer-events:none;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif}
.g3-isl,.g3-lnk,.g3-tag,.g3-bub,.g3-fx{position:absolute;left:0;top:0;white-space:nowrap;will-change:transform}
.g3-isl{pointer-events:auto;cursor:pointer;background:#FFFFFF;color:#33342D;border:2px solid #FFFFFF;border-radius:999px;padding:3px 10px;font-size:13px;font-weight:700;box-shadow:0 2px 0 rgba(45,58,54,.16)}
.g3-isl i{font-style:normal;font-weight:400;color:#8A8478;font-size:11px}
.g3-lnk{background:#FFFFFF;color:#33342D;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:700;box-shadow:0 1px 0 rgba(45,58,54,.14)}
.g3-tag{pointer-events:auto;cursor:pointer;background:#FFFFFF;color:#33342D;border:1.5px solid #DB6A41;border-radius:999px;padding:0 7px;font-size:11px;font-weight:700}
.g3-idol{background:#DB6A41;color:#FFFFFF}
.g3-ani{border-color:#7FB59A;color:#3E6B55}
.g3-tick{position:absolute;left:10px;top:64px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:min(330px,58%);z-index:2}
.g3-tl{display:flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:100%}
.g3-tick button{background:#FFFFFF;color:#33342D;border:1px solid #EADFD3;border-radius:10px;padding:3px 9px;font-size:12px;font-weight:700;cursor:pointer;text-align:left;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 3px rgba(45,58,54,.18)}
.g3-tick .g3-ti{font-weight:600;border-color:#F2C98A}
.g3-sm .g3-tick{top:42px;left:6px;max-width:64%}
.g3-sm .g3-tick button{font-size:10px;padding:2px 6px}
.g3-badge{margin-left:4px;background:#22396B;color:#FFFFFF;border-radius:6px;padding:0 4px;font-size:10px}
.g3-bub{background:#FFFFFF;color:#33342D;border-radius:14px;padding:5px 11px;font-size:13px;font-weight:700;max-width:240px;white-space:normal;box-shadow:0 2px 6px rgba(45,58,54,.22);margin-top:-8px}
.g3-fx{background:#FFF8E1;color:#5A4E3A;border:1.5px solid #F2C14E;border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700;pointer-events:none}
.g3-chalk{background:#2F5D4A;color:#FFFFFF;border-color:#8A6A50;font-family:ui-monospace,Menlo,monospace;font-size:12px}
.g3-btns{position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:6px}
.g3-btns button{background:#FFFFFF;color:#33342D;border:1px solid #EADFD3;border-radius:10px;padding:6px 10px;font-size:13px;font-weight:700;cursor:pointer;min-width:44px;min-height:34px;box-shadow:0 1px 3px rgba(45,58,54,.18)}
.g3-nav{position:absolute;left:50%;bottom:38px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:#FFFFFF;color:#33342D;border-radius:999px;padding:3px 5px;box-shadow:0 2px 6px rgba(45,58,54,.22);pointer-events:auto;font-size:13px;font-weight:700;white-space:nowrap;z-index:2}
.g3-nav span{min-width:76px;text-align:center}
.g3-nav button{font-family:inherit;background:#F2EEE4;color:#33342D;border:0;border-radius:999px;min-width:34px;min-height:30px;font-size:18px;font-weight:900;cursor:pointer;line-height:1}
.g3-nav .g3-nl{font-size:12px;padding:0 10px;background:#DB6A41;color:#FFFFFF}
.g3-list{position:absolute;left:50%;bottom:78px;transform:translateX(-50%);display:grid;grid-template-columns:repeat(3,auto);gap:6px;background:#FFFFFF;border-radius:14px;padding:8px;box-shadow:0 4px 12px rgba(45,58,54,.25);pointer-events:auto;z-index:3}
.g3-list button{font-family:inherit;background:#F2EEE4;color:#33342D;border:1.5px solid transparent;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.g3-list button.on{border-color:#DB6A41;color:#DB6A41}
.g3-hint{position:absolute;left:8px;bottom:8px;background:rgba(255,255,255,.9);color:#33342D;border-radius:8px;padding:3px 8px;font-size:11px;pointer-events:none}
.g3-logo{position:absolute;left:10px;top:10px;background:#F2EEE4;color:#33342D;border-radius:14px;padding:6px 12px;pointer-events:none;box-shadow:0 2px 0 rgba(45,58,54,.12)}
.g3-sm .g3-lnk{display:none}
.g3-sm .g3-isl{font-size:10px;padding:1px 6px;border-width:1px}
.g3-sm .g3-isl i{display:none}
.g3-sm .g3-tag{font-size:9px;padding:0 4px;border-width:1px}
.g3-sm .g3-fx{font-size:9px;padding:0 4px}
.g3-sm .g3-bub{font-size:11px;max-width:170px;padding:4px 8px}
.g3-sm .g3-btns{gap:4px;top:6px;right:6px}
.g3-sm .g3-btns button{min-width:34px;min-height:30px;padding:3px 6px;font-size:12px}
.g3-sm .g3-hint{font-size:9px;right:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g3-sm .g3-nav{bottom:34px;font-size:11px;padding:2px 4px;gap:4px}
.g3-sm .g3-nav span{min-width:60px}
.g3-sm .g3-list{bottom:72px;padding:6px;gap:4px}
.g3-sm .g3-list button{font-size:10px;padding:3px 6px}
.g3-sm .g3-logo{transform:scale(.72);transform-origin:top left;left:6px;top:6px}
`;

export { createWorld3D, CSS3 };
export type { Eng3, Cb3 };
