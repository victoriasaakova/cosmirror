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
  relationshipType: "romantic";
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

export type CompatibilityResult = {
  schemaVersion: "compatibility-preview-v0" | "compatibility-v1";
  source: "mock" | "api";
  dataQuality: DataQuality;
  warnings: string[];
  persons: [PersonSnapshot, PersonSnapshot];
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
