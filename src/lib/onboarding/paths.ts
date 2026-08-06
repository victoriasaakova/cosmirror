/** Frontend-only completion route (not an API OnboardingStep). */
export const INSIGHT_SLUG = "insight";

export function stepHref(slug: string): string {
  return `/onboarding/${slug}/`;
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
