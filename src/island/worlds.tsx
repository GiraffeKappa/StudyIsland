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
import { createWorld3D, CSS3 } from "./engine";
import type { Eng3, Cb3 } from "./engine";
function IslandWorld3D(props: WorldProps & { onFail: (why: string) => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canRef = useRef<HTMLCanvasElement | null>(null);
  const ovRef = useRef<HTMLDivElement | null>(null);
  const eng = useRef<Eng3 | null>(null);
  const cbRef = useRef<Cb3>({
    onPick: props.onPick,
    onPoke: props.onPoke,
    onFail: props.onFail,
  });
  cbRef.current = {
    onPick: props.onPick,
    onPoke: props.onPoke,
    onFail: props.onFail,
  };
  useEffect(() => {
    const c = canRef.current,
      o = ovRef.current;
    if (!c || !o) return;
    const e = createWorld3D(c, o, {
      onPick: (id: string) => cbRef.current.onPick(id),
      onPoke: (id: string) => cbRef.current.onPoke(id),
      onFail: (w: string) => cbRef.current.onFail(w),
    });
    eng.current = e;
    return () => {
      if (e) e.destroy();
      eng.current = null;
    };
  }, []);
  const hitsKey = Array.from(props.hits).sort().join(",");
  const idolKey = props.idolsOn.join(",");
  useEffect(() => {
    if (eng.current)
      eng.current.setData({
        progress: props.progress,
        selected: props.selected,
        hits: hitsKey ? hitsKey.split(",") : [],
        idolsOn: idolKey ? idolKey.split(",") : [],
      });
  }, [props.progress, props.selected, hitsKey, idolKey]);
  useEffect(() => {
    if (eng.current) eng.current.setTalk(props.bubbleNow, props.reacting);
  }, [props.bubbleNow, props.reacting]);
  useEffect(() => {
    if (eng.current) eng.current.setMotion(props.motion);
  }, [props.motion]);
  return (
    <div
      ref={wrapRef}
      className="g3-wrap"
      data-grok-keep-colors="true"
      role="application"
      aria-label="會考讀書島 3D 地圖：拖曳旋轉、雙指或滾輪縮放、點角色或島嶼互動"
    >
      <style>{CSS3}</style>
      <canvas ref={canRef} />
      <div ref={ovRef} className="g3-ov">
        <div className="g3-logo">
          <b style={{ color: ORANGE, fontSize: 18, fontWeight: 900 }}>
            會考 GO!
          </b>{" "}
          <b style={{ fontSize: 15 }}>讀書島</b>
          <div
            style={{
              fontSize: 11,
              color: ORANGE,
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            考試日期待確認・3D
          </div>
        </div>
      </div>
      <div className="g3-btns">
        <button
          type="button"
          aria-label="放大"
          onClick={() => eng.current && eng.current.zoom(1.35)}
        >
          ＋
        </button>
        <button
          type="button"
          aria-label="縮小"
          onClick={() => eng.current && eng.current.zoom(1 / 1.35)}
        >
          －
        </button>
        <button
          type="button"
          aria-label="向左轉"
          onClick={() => eng.current && eng.current.rotate(-Math.PI / 6)}
        >
          ⟲
        </button>
        <button
          type="button"
          aria-label="向右轉"
          onClick={() => eng.current && eng.current.rotate(Math.PI / 6)}
        >
          ⟳
        </button>
        <button
          type="button"
          aria-label="全景"
          onClick={() => eng.current && eng.current.reset()}
        >
          全景
        </button>
      </div>
      <div className="g3-hint">
        點島嶼飛過去・拖曳旋轉・雙指或 Ctrl＋滾輪往指標縮放・雙擊拉近・右鍵或
        Shift 拖曳平移
      </div>
    </div>
  );
}

function IslandTown(props: {
  island: Island;
  units: Unit[];
  level: (id: string) => number;
  selected: string;
  onPick: (id: string) => void;
  motion: boolean;
  progress: number;
}) {
  const cols = 4;
  const cw = 180;
  const ch = 185;
  const rows = Math.ceil(props.units.length / cols);
  const H = rows * ch + 50;
  const m = props.motion;
  const walkers = 2 + Math.floor(props.progress * 4);
  return (
    <svg
      data-grok-keep-colors="true"
      width="100%"
      viewBox={`0 0 720 ${H}`}
      role="img"
      aria-label={`${props.island.name}的設施`}
      className={m ? undefined : "gi-still"}
      style={{
        fontFamily:
          "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
      }}
    >
      <rect x={0} y={0} width={720} height={H} rx={24} fill={SEA} />
      <path
        className={m ? "gi-wave" : undefined}
        d={`M-40,${H - 10} q30,-8 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0`}
        stroke="#8CC6C8"
        strokeWidth={2}
        fill="none"
      />
      <rect x={20} y={36} width={680} height={H - 62} rx={36} fill={SIDE_F} />
      <rect x={20} y={20} width={680} height={H - 62} rx={36} fill={FOAM} />
      <rect
        x={27}
        y={27}
        width={666}
        height={H - 76}
        rx={30}
        fill="none"
        stroke={ORANGE}
        strokeWidth={6}
        strokeDasharray="10 6"
      />
      <rect x={36} y={36} width={648} height={H - 94} rx={26} fill={SAGE} />
      {Array.from({ length: rows }).map((_: unknown, rI: number) => (
        <rect
          key={rI}
          x={46}
          y={rI * ch + 166}
          width={628}
          height={12}
          rx={6}
          fill={PAVE}
        />
      ))}
      {props.units.map((u: Unit, i: number) => {
        const cx = (i % cols) * cw + cw / 2;
        const by = Math.floor(i / cols) * ch + 152;
        const sel = props.selected === u.id;
        const label = u.name.length > 8 ? `${u.name.slice(0, 8)}…` : u.name;
        const lw = Math.max(64, label.length * 13 + 20);
        return (
          <g key={u.id} className="gi-bld" onClick={() => props.onPick(u.id)}>
            <title>{`${u.name}（${u.book === 0 ? "跨冊" : `冊${u.book}`}）`}</title>
            {sel ? (
              <ellipse
                cx={cx}
                cy={by + 2}
                rx={52}
                ry={15}
                fill={ORANGE}
                opacity={0.3}
              />
            ) : null}
            {facility(props.island.id, props.level(u.id), cx, by, 1.35, m)}
            {i % 3 === 1
              ? tree(cx + 56, by + 4, 1, `tr-${u.id}`, m, i % 2)
              : null}
            {i % 4 === 2 ? flowers(cx - 50, by + 6, `fl-${u.id}`) : null}
            <rect
              x={cx - lw / 2}
              y={by + 26}
              width={lw}
              height={22}
              rx={11}
              fill="#2D3A36"
              opacity={0.12}
            />
            <rect
              x={cx - lw / 2}
              y={by + 24}
              width={lw}
              height={22}
              rx={11}
              fill="#FFFFFF"
              stroke={sel ? ORANGE : "none"}
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={by + 39.5}
              textAnchor="middle"
              fill={INK}
              fontSize={13}
              fontWeight={sel ? 700 : 500}
            >
              {label}
            </text>
          </g>
        );
      })}
      {Array.from({ length: walkers }).map((_: unknown, k: number) => {
        const row = k % rows;
        const y = row * ch + 174;
        const path = `M60,${y} L660,${y} L60,${y}`;
        return (
          <g key={`tw-${k}`}>
            {m ? (
              <animateMotion
                dur={`${24 + k * 4}s`}
                begin={`-${k * 5}s`}
                repeatCount="indefinite"
                path={path}
              />
            ) : null}
            <g transform={m ? undefined : `translate(${100 + k * 110},${y})`}>
              <g transform="scale(1.3)">
                {chibi(
                  k % 4 === 1 ? 1 : k % 4 === 3 ? 2 : 0,
                  k + 1,
                  m,
                  props.progress >= 1,
                )}
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function bookLabel(b: number): string {
  if (b === 0) return "跨冊主題";
  if (b <= 4) return `冊${b}（總複習）`;
  if (b === 5) return "冊5（本學期）";
  return "冊6（下學期新進度）";
}

export { IslandWorld3D, IslandTown, bookLabel };
