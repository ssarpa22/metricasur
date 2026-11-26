const PREFERENCES_KEY = "metricasur_preferences";
export const PREFERENCES_EVENT = "metricasur:preferences-updated";

export type Theme = "light" | "dark" | "system";
export type LayoutDensity = "compact" | "comfortable";

export type DashboardWidget = {
  id: string;
  label: string;
  visible: boolean;
  order: number;
};

export type UserPreferences = {
  theme: Theme;
  layoutDensity: LayoutDensity;
  sidebarCollapsed: boolean;
  dashboardWidgets: DashboardWidget[];
  showWelcomeCard: boolean;
};

const defaultWidgets: DashboardWidget[] = [
  { id: "stats", label: "Resumen de métricas", visible: true, order: 1 },
  { id: "workspace", label: "Tu espacio de trabajo", visible: true, order: 2 },
  { id: "recent", label: "Actividad reciente", visible: true, order: 3 },
  { id: "byModule", label: "Actividad por módulo", visible: true, order: 4 },
];

const defaultPreferences: UserPreferences = {
  theme: "system",
  layoutDensity: "comfortable",
  sidebarCollapsed: false,
  dashboardWidgets: defaultWidgets,
  showWelcomeCard: true,
};

function getDefaults(): UserPreferences {
  return JSON.parse(JSON.stringify(defaultPreferences));
}

function getStorage(): Storage | undefined {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
    return (globalThis as { localStorage?: Storage }).localStorage!;
  }
  return undefined;
}

export function loadPreferences(): UserPreferences {
  const storage = getStorage();
  if (!storage) return getDefaults();
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...getDefaults(),
      theme: parsed.theme ?? defaultPreferences.theme,
      layoutDensity: parsed.layoutDensity ?? defaultPreferences.layoutDensity,
      sidebarCollapsed: parsed.sidebarCollapsed ?? defaultPreferences.sidebarCollapsed,
      showWelcomeCard: parsed.showWelcomeCard ?? defaultPreferences.showWelcomeCard,
      dashboardWidgets: Array.isArray(parsed.dashboardWidgets) && parsed.dashboardWidgets.length
        ? mergeWidgets(parsed.dashboardWidgets)
        : defaultPreferences.dashboardWidgets,
    };
  } catch {
    return getDefaults();
  }
}

function mergeWidgets(saved: DashboardWidget[]): DashboardWidget[] {
  const byId = new Map(saved.map((w) => [w.id, w]));
  return defaultPreferences.dashboardWidgets.map((def) => {
    const savedWidget = byId.get(def.id);
    if (!savedWidget) return def;
    return {
      id: def.id,
      label: def.label,
      visible: savedWidget.visible !== undefined ? savedWidget.visible : def.visible,
      order: savedWidget.order !== undefined ? savedWidget.order : def.order,
    };
  });
}

export function savePreferences(prefs: UserPreferences): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: prefs }));
  } catch {}
}

export function updatePreferences(partial: Partial<UserPreferences>): UserPreferences {
  const current = loadPreferences();
  const next = { ...current, ...partial };
  if (partial.dashboardWidgets) {
    next.dashboardWidgets = mergeWidgets(partial.dashboardWidgets);
  }
  savePreferences(next);
  return next;
}

export function getVisibleWidgets(prefs: UserPreferences): DashboardWidget[] {
  return [...prefs.dashboardWidgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);
}

export function toggleWidgetVisibility(prefs: UserPreferences, widgetId: string): UserPreferences {
  return updatePreferences({
    dashboardWidgets: prefs.dashboardWidgets.map((w) =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ),
  });
}

export function setWidgetOrder(prefs: UserPreferences, widgetId: string, newOrder: number): UserPreferences {
  return updatePreferences({
    dashboardWidgets: prefs.dashboardWidgets.map((w) =>
      w.id === widgetId ? { ...w, order: newOrder } : w
    ),
  });
}

export function getLayoutClass(density: LayoutDensity): string {
  return density === "compact" ? "p-3 py-5 gap-4" : "p-4 py-7 gap-5 sm:py-9";
}
