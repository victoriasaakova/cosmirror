"use client";

const ZODIAC_PATHS = [
  "M4 12C4 6 8 4 12 10C16 4 20 6 20 12M12 10V21",
  "M5 4C6 8 9 9 12 9C15 9 18 8 19 4M12 9A7 7 0 1 1 11.99 9",
  "M7 4C10 5 14 5 17 4M7 20C10 19 14 19 17 20M9 5V19M15 5V19",
  "M5 9C8 5 15 5 18 8C20 10 18 13 15 12C13 11 14 8 17 8M19 15C16 19 9 19 6 16C4 14 6 11 9 12C11 13 10 16 7 16",
  "M6 17C2 12 6 8 10 11C13 14 11 19 8 19C5 19 4 16 6 14M10 11C11 5 18 4 19 9C20 13 16 15 15 20",
  "M4 5V16M4 8C6 4 9 5 9 9V16M9 8C11 4 14 5 14 9V16C14 20 19 20 20 16M14 12C17 12 19 14 19 17",
  "M5 14H19M4 18H20M8 14C8 8 16 8 16 14",
  "M4 5V16M4 8C6 4 9 5 9 9V16M9 8C11 4 14 5 14 9V16H20M17 13L20 16L17 19",
  "M5 19L19 5M12 5H19V12M6 8L16 18",
  "M4 5V16M4 9C7 5 11 6 11 10V17C11 21 17 21 19 17C21 13 16 12 14 15",
  "M3 9C6 6 9 12 12 9C15 6 18 12 21 9M3 15C6 12 9 18 12 15C15 12 18 18 21 15",
  "M7 4C13 8 13 16 7 20M17 4C11 8 11 16 17 20M4 12H20",
];

export type NatalWheelPlanet = {
  key: string;
  name?: string;
  glyph?: string;
  longitude: number;
  retrograde?: boolean;
};

export type NatalWheelHouse = {
  house: number;
  cusp: number;
};

export type NatalWheelAspect = {
  a: string;
  b: string;
  kind?: string;
};

export type NatalWheelData = {
  ascendant_longitude: number;
  mc_longitude?: number | null;
  planets: NatalWheelPlanet[];
  houses?: NatalWheelHouse[];
  aspects?: NatalWheelAspect[];
  signs?: Array<{ sign: string; sign_ru: string; start: number }>;
};

const CX = 100;
const CY = 100;

function xy(asc: number, lon: number, r: number) {
  const theta = ((asc - lon) * Math.PI) / 180;
  return {
    x: CX - r * Math.cos(theta),
    y: CY + r * Math.sin(theta),
  };
}

function round(value: number) {
  return Number(value.toFixed(2));
}

export function NatalWheel({ wheel }: { wheel: NatalWheelData }) {
  const asc = wheel.ascendant_longitude || 0;
  const planets = wheel.planets || [];
  const byKey = Object.fromEntries(planets.map((planet) => [planet.key, planet]));
  const used: Array<{ x: number; y: number }> = [];

  const planetPoints = planets.map((planet) => {
    let r = 58;
    let point = xy(asc, planet.longitude, r);
    for (let i = 0; i < 4; i += 1) {
      const clash = used.some((item) => (item.x - point.x) ** 2 + (item.y - point.y) ** 2 < 64);
      if (!clash) break;
      r += 6;
      point = xy(asc, planet.longitude, r);
    }
    used.push(point);
    return { ...planet, ...point, r };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full text-[#F6E7A1]"
      role="img"
      aria-label="Натальная карта"
    >
      <circle cx={CX} cy={CY} r="91" fill="#071240" stroke="currentColor" strokeOpacity="0.55" />
      <circle cx={CX} cy={CY} r="74" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx={CX} cy={CY} r="48" fill="none" stroke="currentColor" strokeOpacity="0.16" />

      {(wheel.signs ?? Array.from({ length: 12 }, (_, i) => ({ start: i * 30, sign: "", sign_ru: "" }))).map(
        (sign, index) => {
          const start = xy(asc, sign.start, 74);
          const end = xy(asc, sign.start, 91);
          const icon = xy(asc, sign.start + 15, 82.5);
          return (
            <g key={`sign-${index}`}>
              <line
                x1={round(start.x)}
                y1={round(start.y)}
                x2={round(end.x)}
                y2={round(end.y)}
                stroke="currentColor"
                strokeOpacity="0.32"
              />
              <path
                d={ZODIAC_PATHS[index]}
                transform={`translate(${round(icon.x - 6)} ${round(icon.y - 6)}) scale(0.5)`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        },
      )}

      {(wheel.houses ?? []).map((house) => {
        const inner = xy(asc, house.cusp, 6);
        const outer = xy(asc, house.cusp, 48);
        const angle = [1, 4, 7, 10].includes(house.house);
        return (
          <line
            key={`house-${house.house}`}
            x1={round(inner.x)}
            y1={round(inner.y)}
            x2={round(outer.x)}
            y2={round(outer.y)}
            stroke="currentColor"
            strokeOpacity={angle ? 0.55 : 0.22}
            strokeWidth={angle ? 1.1 : 0.6}
          />
        );
      })}

      {(wheel.aspects ?? []).map((aspect, index) => {
        const a = byKey[aspect.a];
        const b = byKey[aspect.b];
        if (!a || !b) return null;
        const from = xy(asc, a.longitude, 44);
        const to = xy(asc, b.longitude, 44);
        const hard = aspect.kind === "hard";
        return (
          <line
            key={`asp-${index}`}
            x1={round(from.x)}
            y1={round(from.y)}
            x2={round(to.x)}
            y2={round(to.y)}
            stroke={hard ? "#F6E7A1" : "#ffffff"}
            strokeOpacity={hard ? 0.48 : 0.18}
            strokeDasharray={hard ? undefined : "3 3"}
          />
        );
      })}

      {planetPoints.map((planet) => (
        <g key={planet.key}>
          <circle cx={planet.x} cy={planet.y} r="7.4" fill="#0a1856" stroke="#F6E7A1" strokeOpacity="0.55" />
          <text
            x={planet.x}
            y={planet.y + 0.6}
            fill="#f4efe8"
            fontSize="8.5"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {planet.glyph || planet.name?.[0] || ""}
          </text>
        </g>
      ))}

      <circle cx={CX} cy={CY} r="2.4" fill="#F6E7A1" />
      {(() => {
        const ascPoint = xy(asc, asc, 96);
        return (
          <text
            x={ascPoint.x}
            y={ascPoint.y}
            fill="#F6E7A1"
            fontSize="6.5"
            textAnchor="middle"
            dominantBaseline="middle"
            className="uppercase tracking-[0.14em]"
          >
            ASC
          </text>
        );
      })()}
    </svg>
  );
}
