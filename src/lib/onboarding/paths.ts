/** Frontend-only completion route (not an API OnboardingStep). */
export const INSIGHT_SLUG = "insight";

/** Первый шаг квиза (совпадает с seed / API order). CTA с лендинга ведут сюда сразу. */
export const FIRST_STEP_SLUG = "name";

export function stepHref(slug: string): string {
  return `/onboarding/${slug}/`;
}

/** Свежий проход с первого шага — без промежуточного /onboarding?new=1. */
export function freshOnboardingHref(): string {
  return `${stepHref(FIRST_STEP_SLUG)}?new=1`;
}

/** Normalize API url_path → app path (keeps trailing slash). */
export function hrefFromUrlPath(urlPath: string): string {
  const trimmed = urlPath.trim();
  if (!trimmed) return "/onboarding/";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export function isReservedSlug(slug: string): boolean {
  return slug === INSIGHT_SLUG;
}
