const ZODIAC_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const PLANET_GLYPH: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  north_node: "☊",
  south_node: "☋",
  chiron: "⚷",
  vesta: "⚶",
};

const VS15 = "\uFE0E";
const ASTRO_FONT = 'var(--font-astro), "Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol"';
const TEXT_FONT = "var(--font-grotesk), ui-sans-serif, system-ui, sans-serif";
const ACCENT = "#F6E7A1";

export type NatalWheelPlanet = {
  key: string;
  name?: string;
  glyph?: string;
  longitude: number;
  degree?: number;
  minute?: number;
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
  aspect?: string;
  orb?: number;
};

export type NatalWheelData = {
  ascendant_longitude: number;
  mc_longitude?: number | null;
  dsc_longitude?: number | null;
  ic_longitude?: number | null;
  planets: NatalWheelPlanet[];
  houses?: NatalWheelHouse[];
  aspects?: NatalWheelAspect[];
  signs?: Array<{ sign: string; sign_ru: string; start: number }>;
};

const CX = 250;
const CY = 250;
const R_OUT = 200;
const R_ZODIAC_IN = 176;
const R_TICK_INNER = 160;
const R_PLANET = 138;
const R_DEGREE = 114;
const R_HOUSE_OUTER = 84;
const R_HOUSE_INNER = 72;
const R_HOUSE_NUM = (R_HOUSE_INNER + R_HOUSE_OUTER) / 2;
const R_ASPECT = 66;
const R_ANGLE_MARK_IN = R_TICK_INNER;
const R_ANGLE_MARK_OUT = R_ZODIAC_IN;
const R_ANGLE_LABEL = R_TICK_INNER - 8;
const MIN_LABEL_PX = 22;

const CLASSICAL = new Set([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);
const OUTER = new Set(["uranus", "neptune", "pluto"]);
const WHEEL_ASPECTS = new Set(["square", "opposition", "trine", "sextile"]);

function normalize(value: number) {
  return ((value % 360) + 360) % 360;
}

function angularGap(a: number, b: number) {
  const diff = Math.abs(normalize(a) - normalize(b));
  return Math.min(diff, 360 - diff);
}

function xy(asc: number, lon: number, r: number) {
  const theta = ((asc - lon) * Math.PI) / 180;
  return {
    x: CX - r * Math.cos(theta),
    y: CY - r * Math.sin(theta),
  };
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function houseMid(start: number, end: number) {
  const span = normalize(end - start);
  return normalize(start + span / 2);
}

function dms(planet: NatalWheelPlanet) {
  const degree = Number.isFinite(planet.degree)
    ? Number(planet.degree)
    : Math.floor(normalize(planet.longitude) % 30);
  const minute = Number.isFinite(planet.minute) ? Number(planet.minute) : 0;
  const rx = planet.retrograde ? "R" : "";
  return `${degree}°${String(minute).padStart(2, "0")}′${rx}`;
}

function glyphOf(planet: NatalWheelPlanet) {
  const raw = PLANET_GLYPH[planet.key] || planet.glyph || planet.name?.[0] || "";
  return raw ? `${raw}${VS15}` : "";
}

function signGlyph(index: number) {
  return `${ZODIAC_GLYPH[index]}${VS15}`;
}

function minSepDeg() {
  return (MIN_LABEL_PX / R_DEGREE) * (180 / Math.PI);
}

function placeBodies(planets: NatalWheelPlanet[]) {
  const sorted = [...planets].sort((a, b) => normalize(a.longitude) - normalize(b.longitude));
  const display = sorted.map((planet) => normalize(planet.longitude));
  const minDeg = minSepDeg();
  const n = display.length;

  if (n > 1) {
    for (let pass = 0; pass < 40; pass += 1) {
      let moved = false;
      for (let i = 0; i < n; i += 1) {
        const j = (i + 1) % n;
        const gap = angularGap(display[i], display[j]);
        if (gap >= minDeg) continue;
        const extra = (minDeg - gap) / 2;
        display[i] = normalize(display[i] - extra);
        display[j] = normalize(display[j] + extra);
        moved = true;
      }
      if (!moved) break;
    }
  }

  return sorted.map((planet, index) => ({
    planet,
    displayLon: display[index],
  }));
}

function visibleAspects(aspects: NatalWheelAspect[]) {
  return aspects.filter((row) => {
    if (!CLASSICAL.has(row.a) || !CLASSICAL.has(row.b)) return false;
    if (OUTER.has(row.a) && OUTER.has(row.b)) return false;
    const kind = row.aspect || "";
    if (!WHEEL_ASPECTS.has(kind)) return false;
    if (kind === "sextile" && typeof row.orb === "number" && row.orb > 3.5) return false;
    return true;
  });
}

function tickInnerR(lon: number) {
  if (lon % 10 === 0) return R_ZODIAC_IN - 11;
  if (lon % 5 === 0) return R_ZODIAC_IN - 7;
  return R_ZODIAC_IN - 4;
}

export function SharedNatalWheel({ wheel }: { wheel: NatalWheelData }) {
  const asc = wheel.ascendant_longitude || 0;
  const dsc = typeof wheel.dsc_longitude === "number" ? wheel.dsc_longitude : normalize(asc + 180);
  const mc = typeof wheel.mc_longitude === "number" ? wheel.mc_longitude : null;
  const ic = typeof wheel.ic_longitude === "number" ? wheel.ic_longitude : mc != null ? normalize(mc + 180) : null;
  const planets = wheel.planets || [];
  const houses = [...(wheel.houses || [])].sort((a, b) => a.house - b.house);
  const placed = placeBodies(planets);
  const byKey: Record<string, { longitude: number }> = Object.fromEntries(
    planets.map((planet) => [planet.key, planet]),
  );

  const angleLabels = [
    { key: "ASC", lon: asc },
    { key: "DSC", lon: dsc },
    ...(mc != null ? [{ key: "MC", lon: mc }] : []),
    ...(ic != null ? [{ key: "IC", lon: ic }] : []),
  ];

  return (
    <svg
      viewBox="0 0 500 500"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full overflow-visible text-[#F6E7A1]"
      role="img"
      aria-label="Натальная карта"
    >
      <circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.9" />
      <circle cx={CX} cy={CY} r={R_ZODIAC_IN} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.7" />
      <circle cx={CX} cy={CY} r={R_TICK_INNER} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="0.7" />
      <circle cx={CX} cy={CY} r={R_HOUSE_OUTER} fill="none" stroke="currentColor" strokeOpacity="0.26" />
      <circle cx={CX} cy={CY} r={R_HOUSE_INNER} fill="none" stroke="currentColor" strokeOpacity="0.2" />

      {Array.from({ length: 360 }, (_, i) => {
        if (i % 30 === 0) return null;
        const lon = i;
        const ten = lon % 10 === 0;
        const five = lon % 5 === 0;
        const inner = xy(asc, lon, tickInnerR(lon));
        const outer = xy(asc, lon, R_ZODIAC_IN);
        return (
          <line
            key={`tick-${lon}`}
            x1={round(inner.x)}
            y1={round(inner.y)}
            x2={round(outer.x)}
            y2={round(outer.y)}
            stroke="#ffffff"
            strokeOpacity={ten ? 0.42 : five ? 0.28 : 0.14}
            strokeWidth={ten ? 0.55 : five ? 0.4 : 0.28}
          />
        );
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const lon = i * 30;
        const inner = xy(asc, lon, R_ZODIAC_IN);
        const outer = xy(asc, lon, R_OUT);
        return (
          <line
            key={`zodiac-${lon}`}
            x1={round(inner.x)}
            y1={round(inner.y)}
            x2={round(outer.x)}
            y2={round(outer.y)}
            stroke={ACCENT}
            strokeOpacity="0.58"
            strokeWidth="1.05"
          />
        );
      })}

      {(wheel.signs ?? Array.from({ length: 12 }, (_, i) => ({ start: i * 30, sign: "", sign_ru: "" }))).map(
        (sign, index) => {
          const icon = xy(asc, sign.start + 15, (R_OUT + R_ZODIAC_IN) / 2);
          return (
            <text
              key={`sign-${index}`}
              x={round(icon.x)}
              y={round(icon.y)}
              fill={ACCENT}
              fillOpacity="0.88"
              fontSize="14"
              fontFamily={ASTRO_FONT}
              fontWeight={400}
              textAnchor="middle"
              dominantBaseline="central"
              className="natal-astro-glyph"
              style={{ fontVariantEmoji: "text" }}
            >
              {signGlyph(index)}
            </text>
          );
        },
      )}

      {houses.map((house, index) => {
        const next = houses[(index + 1) % houses.length];
        const inner = xy(asc, house.cusp, R_HOUSE_INNER);
        const outer = xy(asc, house.cusp, R_ZODIAC_IN);
        const number = next ? xy(asc, houseMid(house.cusp, next.cusp), R_HOUSE_NUM) : null;
        return (
          <g key={`house-${house.house}`}>
            <line
              x1={round(inner.x)}
              y1={round(inner.y)}
              x2={round(outer.x)}
              y2={round(outer.y)}
              stroke="#ffffff"
              strokeOpacity="0.28"
              strokeWidth="0.7"
            />
            {number ? (
              <text
                x={round(number.x)}
                y={round(number.y)}
                fill="#F6E7A1"
                fillOpacity="0.62"
                fontSize="8"
                fontFamily={TEXT_FONT}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {house.house}
              </text>
            ) : null}
          </g>
        );
      })}

      {visibleAspects(wheel.aspects ?? []).map((aspect, index) => {
        const a = byKey[aspect.a];
        const b = byKey[aspect.b];
        if (!a || !b) return null;
        const from = xy(asc, a.longitude, R_ASPECT);
        const to = xy(asc, b.longitude, R_ASPECT);
        const hard = aspect.kind === "hard" || aspect.aspect === "square" || aspect.aspect === "opposition";
        return (
          <line
            key={`asp-${index}`}
            x1={round(from.x)}
            y1={round(from.y)}
            x2={round(to.x)}
            y2={round(to.y)}
            stroke={hard ? "#c45c5c" : "#7eafd6"}
            strokeOpacity={hard ? 0.78 : 0.55}
            strokeWidth={hard ? 1.05 : 0.8}
            strokeDasharray={hard ? undefined : "3.5 3"}
          />
        );
      })}

      {placed.map(({ planet, displayLon }) => {
        const glyph = xy(asc, displayLon, R_PLANET);
        const label = xy(asc, displayLon, R_DEGREE);
        return (
          <g key={planet.key}>
            <text
              x={round(glyph.x)}
              y={round(glyph.y)}
              fill="#ffffff"
              fontSize="18"
              fontFamily={ASTRO_FONT}
              fontWeight={400}
              textAnchor="middle"
              dominantBaseline="central"
              className="natal-astro-glyph"
              style={{ fontVariantEmoji: "text" }}
            >
              {glyphOf(planet)}
            </text>
            <text
              x={round(label.x)}
              y={round(label.y)}
              fill="#F6E7A1"
              fillOpacity="0.88"
              fontSize="8"
              fontFamily={TEXT_FONT}
              letterSpacing="-0.02em"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {dms(planet)}
            </text>
          </g>
        );
      })}

      {planets.map((planet) => {
        const anchor = xy(asc, planet.longitude, R_ZODIAC_IN);
        return (
          <circle
            key={`anchor-${planet.key}`}
            cx={round(anchor.x)}
            cy={round(anchor.y)}
            r="1.15"
            fill="#ffffff"
            fillOpacity="0.72"
          />
        );
      })}

      {angleLabels.map((item) => {
        const markInner = xy(asc, item.lon, R_ANGLE_MARK_IN);
        const markOuter = xy(asc, item.lon, R_ANGLE_MARK_OUT);
        const label = xy(asc, item.lon, R_ANGLE_LABEL);
        return (
          <g key={item.key}>
            <line
              x1={round(markInner.x)}
              y1={round(markInner.y)}
              x2={round(markOuter.x)}
              y2={round(markOuter.y)}
              stroke={ACCENT}
              strokeOpacity="0.95"
              strokeWidth="1.2"
            />
            <text
              x={round(label.x)}
              y={round(label.y)}
              fill={ACCENT}
              fontSize="8"
              fontFamily={TEXT_FONT}
              textAnchor="middle"
              dominantBaseline="middle"
              className="uppercase tracking-[0.12em]"
            >
              {item.key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
