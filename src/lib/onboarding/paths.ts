/** Frontend-only funnel after the quiz (not API OnboardingStep rows). */
export const INSIGHT_SLUG = "insight";
export const COSMOPORTRAIT_SLUG = "cosmoportrait";
export const REPORT_SLUG = "report";

export const INSIGHT_FUNNEL_SLUGS = [
  INSIGHT_SLUG,
  COSMOPORTRAIT_SLUG,
  REPORT_SLUG,
] as const;

/** Старые URL квиза → актуальные slugs. */
export const LEGACY_ONBOARDING_SLUGS: Record<string, string> = {
  intent: "goal",
  chart_knowledge: "astrolevel",
  astrology_trigger: "questions",
};

/** Первый шаг квиза (совпадает с seed / API order). CTA с лендинга ведут сюда сразу. */
export const FIRST_STEP_SLUG = "name";

export function stepHref(slug: string): string {
  return `/onboarding/${slug}/`;
}

export function canonicalOnboardingSlug(slug: string): string {
  return LEGACY_ONBOARDING_SLUGS[slug] ?? slug;
}

export function insightScreenForSlug(slug: string): number {
  const index = (INSIGHT_FUNNEL_SLUGS as readonly string[]).indexOf(slug);
  return index >= 0 ? index : 0;
}

export function insightHrefForScreen(index: number): string {
  if (index <= 0) return stepHref(INSIGHT_SLUG);
  if (index === 1) return stepHref(COSMOPORTRAIT_SLUG);
  return stepHref(REPORT_SLUG);
}

/** Свежий проход с первого шага — без промежуточного /onboarding?new=1. */
export function freshOnboardingHref(): string {
  return `${stepHref(FIRST_STEP_SLUG)}?new=1`;
}

/** Продолжить текущую сессию (карта с лендинга уже в cookie / localStorage). */
export function continueOnboardingHref(): string {
  return stepHref(FIRST_STEP_SLUG);
}

/** Normalize API url_path → app path (keeps trailing slash). */
export function hrefFromUrlPath(urlPath: string): string {
  const trimmed = urlPath.trim();
  if (!trimmed) return "/onboarding/";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export function isReservedSlug(slug: string): boolean {
  return (INSIGHT_FUNNEL_SLUGS as readonly string[]).includes(slug);
}
