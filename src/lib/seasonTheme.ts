export type SeasonTheme = 'spring' | 'summer' | 'autumn' | 'winter';

const seasonThemes: readonly SeasonTheme[] = ['spring', 'summer', 'autumn', 'winter'];
const localOverrideHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function getSeasonForMonth(month: number): SeasonTheme {
  if (month >= 3 && month <= 5) {
    return 'spring';
  }

  if (month >= 6 && month <= 8) {
    return 'summer';
  }

  if (month >= 9 && month <= 11) {
    return 'autumn';
  }

  return 'winter';
}

function normalizeSeasonTheme(value: string | null | undefined): SeasonTheme | undefined {
  const normalized = value?.trim().toLowerCase();

  return seasonThemes.find((season) => season === normalized);
}

export function resolveSeasonTheme(
  now: Date,
  override?: string | null,
  options: { allowOverride?: boolean } = {},
): SeasonTheme {
  const overrideTheme = options.allowOverride ? normalizeSeasonTheme(override) : undefined;

  return overrideTheme ?? getSeasonForMonth(now.getMonth() + 1);
}

export function isSeasonThemeOverrideAllowed(hostname: string | undefined): boolean {
  return Boolean(hostname && localOverrideHosts.has(hostname));
}

export function readSeasonThemeOverride(search: string, envOverride?: string | null): string | undefined {
  const params = new URLSearchParams(search);

  return params.get('seasonTheme') ?? params.get('season-theme') ?? envOverride ?? undefined;
}

export function applySeasonThemeToRoot(root: HTMLElement, theme: SeasonTheme) {
  root.dataset.seasonTheme = theme;
}
