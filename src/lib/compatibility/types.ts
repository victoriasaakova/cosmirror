export type PersonId = "A" | "B";

export type RelationshipKind = "friendship" | "romantic" | "family";

export type RelationshipStage = "meeting" | "together" | "past";

export type BirthTimeStatus = "known" | "unknown";

export type DataQuality = "full" | "partial";

export type PointKey = "sun" | "moon" | "mercury" | "venus" | "mars" | "ascendant";

export type AspectPoint =
  | PointKey
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "north_node"
  | "south_node"
  | "chiron"
  | "asc"
  | "mc"
  | "midheaven";

export type AspectKey = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export type PersonDraft = {
  id: PersonId;
  displayName: string;
  birthDate: string;
  birthTime: string;
  unknownTime: boolean;
  placeName: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
};

export type PersonProfile = {
  id: PersonId;
  displayName: string;
  birthDate: string | null;
  birthTime: string | null;
  birthTimeStatus: BirthTimeStatus;
  placeName: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
};

export type CompatibilityRequest = {
  relationshipType: RelationshipKind;
  relationshipStatus?: string;
  persons: [PersonProfile, PersonProfile];
};

export type Placement = {
  point: PointKey;
  sign: string;
  degree: number | null;
  minute?: number | null;
  retrograde?: boolean;
};

export type PersonSnapshot = {
  id: PersonId;
  displayName: string;
  birthTimeStatus: BirthTimeStatus;
  placements: Placement[];
};

export type OverviewObservation = {
  id: "resource" | "tension" | "potential";
  label: string;
  text: string;
};

export type BondSummaryCard = {
  id: "dynamic" | "attraction" | "support" | "tension" | "care";
  role: string;
  headline: string;
  text: string;
  image: string;
};

export type BondCard = {
  id: string;
  category: string;
  headline: string;
  insight: string;
  basis: string;
};

export type SignComparison = {
  id: string;
  title: string;
  point: PointKey;
  aSign: string;
  bSign: string;
  a: string;
  b: string;
  text: string;
};

export type DimensionInsight = {
  id: string;
  title: string;
  headline: string;
  insight: string;
  commonGround: string;
  tension: string;
  astroBasis: string[];
};

export type PersonCycle = {
  personId: PersonId;
  title: string;
  period: string;
  personalInsight: string;
  relationshipNote: string;
};

export type CoupleCycle = {
  title: string;
  text: string;
};

export type UpcomingCycle = {
  personId: PersonId;
  title: string;
  period: string;
  note: string;
};

export type NatalRow = {
  point: PointKey;
  a: Placement | null;
  b: Placement | null;
};

export type SynastryAspect = {
  id: string;
  pointA: AspectPoint;
  aspect: AspectKey;
  pointB: AspectPoint;
  orbLabel: string;
  interpretation: string;
  primary: boolean;
  requiresTime: PersonId | "both" | null;
};

export type TarotArcana = {
  number: number;
  name: string;
  image: string;
};

export type PairArcanaPerson = {
  id: PersonId;
  number: number;
  name: string;
};

export type PairTarotLove = {
  name: string;
  upright: string;
  reversed: string;
};

export type PairTarotCard = {
  formulaNote: string;
  card: TarotArcana;
  persons: PairArcanaPerson[];
  love?: PairTarotLove;
};

export type PersonalInsight = {
  status: "ready" | "unavailable";
  temporalFrame: "base" | "current";
  title: string;
  body: string;
  basis: string;
};

export type ScoreStatus = "ready" | "limited" | "pending" | "unavailable" | "error";

export type ScoreIndex = {
  value: number | null;
  status: ScoreStatus;
  summary: string;
};

export type CompatibilityScores = {
  harmony: ScoreIndex;
  karmic: ScoreIndex;
  currentTension: ScoreIndex;
  transformation: ScoreIndex;
};

export type DeepParagraph = {
  label: string;
  text: string;
};

export type DeepSection = {
  id: string;
  title: string;
  teaser: string;
  paragraphs: DeepParagraph[];
  aspectLines: string[];
  glyphs: { id: string; pointA: string; aspect: string; pointB: string }[];
};

export type ReadingConclusion = {
  headline: string;
  text: string;
};

export type ReadingCycleSlot = {
  personId: PersonId;
  title: string;
  period: string;
  text: string;
};

export type CompatibilityResult = {
  schemaVersion: "compatibility-preview-v0" | "compatibility-v1" | "compatibility-v2";
  source: "mock" | "api";
  dataQuality: DataQuality;
  warnings: string[];
  persons: [PersonSnapshot, PersonSnapshot];
  insight?: PersonalInsight;
  pairCard?: PairTarotCard;
  scores?: CompatibilityScores;
  deepSections?: DeepSection[];
  readingConclusion?: ReadingConclusion;
  cycleSlots?: ReadingCycleSlot[];
  overview: {
    title: string;
    summary: string;
    observations: OverviewObservation[];
  };
  bondSummary: BondSummaryCard[];
  bonds: BondCard[];
  signComparisons: SignComparison[];
  dimensions: DimensionInsight[];
  cycles: {
    background: string;
    active: PersonCycle[];
    couple: CoupleCycle;
    upcoming: UpcomingCycle[];
  };
  natalRows: NatalRow[];
  aspects: SynastryAspect[];
  houseOverlays: string[];
  reflection: {
    question: string;
    conclusion: string;
  };
};

export interface CompatibilityProvider {
  load(request: CompatibilityRequest): Promise<CompatibilityResult>;
}
