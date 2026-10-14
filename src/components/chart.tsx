import { formatMoney, TRILLION } from "@/lib/format";
import type { SeriesPoint } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 248;
const PAD = { l: 58, r: 12, t: 16, b: 28 };

function year(t: number): string {
  return String(new Date(t).getUTCFullYear());
}

export function CapChart({
  points,
  scale,
  accent = "#d7b56d",
}: {
  points: SeriesPoint[];
  scale: "linear" | "log";
  accent?: string;
}) {
  if (points.length < 2) return null;
  const innerW = WIDTH - PAD.l - PAD.r;
  const innerH = HEIGHT - PAD.t - PAD.b;
  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const spanT = Math.max(1, maxT - minT);

  const projectY = (value: number) => (scale === "log" ? Math.log10(Math.max(value, 1)) : value);
  const ys = points.map((point) => projectY(point.v));
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  const trillionY = projectY(TRILLION);
  const showTrillion = minY <= trillionY && trillionY <= maxY * 1.02;
  if (showTrillion) {
    minY = Math.min(minY, trillionY);
    maxY = Math.max(maxY, trillionY);
  }
  if (maxY === minY) maxY = minY + 1;
  const padY = (maxY - minY) * 0.08;
  minY -= padY;
  maxY += padY;
  if (scale === "linear") minY = Math.max(0, minY);

  const x = (t: number) => PAD.l + ((t - minT) / spanT) * innerW;
  const y = (value: number) =>
    PAD.t + (1 - (projectY(value) - minY) / (maxY - minY)) * innerH;

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(maxT).toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${x(minT).toFixed(1)},${(PAD.t + innerH).toFixed(1)} Z`;
  const last = points[points.length - 1];
  const ticks = scale === "log" ? logTicks(minY, maxY) : linearTicks(minY, maxY);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Market cap over time"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.l}
            x2={WIDTH - PAD.r}
            y1={y(tick)}
            y2={y(tick)}
            stroke="rgba(243,239,228,0.08)"
          />
          <text x={PAD.l - 8} y={y(tick) + 4} textAnchor="end">
            {formatMoney(tick)}
          </text>
        </g>
      ))}
      {showTrillion ? (
        <g>
          <line
            x1={PAD.l}
            x2={WIDTH - PAD.r}
            y1={y(TRILLION)}
            y2={y(TRILLION)}
            stroke="#d7b56d"
            strokeDasharray="4 4"
            strokeOpacity="0.85"
          />
        </g>
      ) : null}
      <path d={area} fill={accent} opacity="0.14" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2" />
      <circle cx={x(last.t)} cy={y(last.v)} r="3.5" fill="#f3efe4" />
      <text x={PAD.l} y={HEIGHT - 8}>
        {year(minT)}
      </text>
      <text x={WIDTH - PAD.r} y={HEIGHT - 8} textAnchor="end">
        {year(maxT)}
      </text>
    </svg>
  );
}

function logTicks(minLog: number, maxLog: number): number[] {
  const ticks: number[] = [];
  for (let exp = Math.ceil(minLog); exp <= Math.floor(maxLog); exp++) {
    const value = 10 ** exp;
    if (value >= 1e6) ticks.push(value);
  }
  if (!ticks.length) ticks.push(10 ** Math.round((minLog + maxLog) / 2));
  return ticks;
}

function linearTicks(min: number, max: number): number[] {
  const span = max - min;
  const raw = span / 3;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const step = Math.max(pow, 1);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value < max; value += step) ticks.push(value);
  return ticks.slice(0, 4);
}
