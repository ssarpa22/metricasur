import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadPreferences,
  savePreferences,
  updatePreferences,
  getVisibleWidgets,
  toggleWidgetVisibility,
  setWidgetOrder,
  getLayoutClass,
  type UserPreferences,
} from "./user-preferences";

const PREFERENCES_KEY = "metricasur_preferences";

function createMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

let mockStorage: ReturnType<typeof createMockStorage>;

beforeEach(() => {
  mockStorage = createMockStorage();
  Object.defineProperty(globalThis, "localStorage", { value: mockStorage as unknown as Storage, writable: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "localStorage", { value: undefined, writable: true, configurable: true });
});

describe("loadPreferences", () => {
  it("returns defaults when no stored preferences exist", () => {
    const prefs = loadPreferences();
    expect(prefs.theme).toBe("dark");
    expect(prefs.layoutDensity).toBe("comfortable");
    expect(prefs.sidebarCollapsed).toBe(false);
    expect(prefs.showWelcomeCard).toBe(true);
    expect(prefs.dashboardWidgets.length).toBe(4);
    expect(prefs.dashboardWidgets.every((w) => w.visible)).toBe(true);
  });

  it("loads stored preferences correctly", () => {
    mockStorage.setItem(PREFERENCES_KEY, JSON.stringify({
      theme: "dark",
      layoutDensity: "compact",
      sidebarCollapsed: true,
      showWelcomeCard: false,
      dashboardWidgets: [
        { id: "stats", label: "Resumen de métricas", visible: false, order: 1 },
        { id: "workspace", label: "Tu espacio de trabajo", visible: true, order: 2 },
        { id: "recent", label: "Actividad reciente", visible: true, order: 3 },
        { id: "byModule", label: "Actividad por módulo", visible: true, order: 4 },
      ],
    }));
    const prefs = loadPreferences();
    expect(prefs.theme).toBe("dark");
    expect(prefs.layoutDensity).toBe("compact");
    expect(prefs.sidebarCollapsed).toBe(true);
    expect(prefs.showWelcomeCard).toBe(false);
    const stats = prefs.dashboardWidgets.find((w) => w.id === "stats");
    expect(stats?.visible).toBe(false);
  });

  it("merges partial stored widget configs with defaults", () => {
    mockStorage.setItem(PREFERENCES_KEY, JSON.stringify({
      dashboardWidgets: [
        { id: "stats", label: "Custom stats", visible: false, order: 10 },
      ],
    }));
    const prefs = loadPreferences();
    expect(prefs.dashboardWidgets.length).toBe(4);
    const stats = prefs.dashboardWidgets.find((w) => w.id === "stats");
    expect(stats?.label).toBe("Resumen de métricas");
    expect(stats?.visible).toBe(false);
    expect(stats?.order).toBe(10);
    const workspace = prefs.dashboardWidgets.find((w) => w.id === "workspace");
    expect(workspace?.visible).toBe(true);
  });

  it("returns defaults on corrupt stored data", () => {
    mockStorage.setItem(PREFERENCES_KEY, "not-valid-json");
    const prefs = loadPreferences();
    expect(prefs.theme).toBe("dark");
    expect(prefs.dashboardWidgets.length).toBe(4);
  });

  it("falls back to safe defaults for invalid stored preference values", () => {
    mockStorage.setItem(PREFERENCES_KEY, JSON.stringify({
      theme: "neon",
      layoutDensity: "ultra-compact",
      sidebarCollapsed: "yes",
      showWelcomeCard: 1,
    }));

    const prefs = loadPreferences();
    expect(prefs.theme).toBe("dark");
    expect(prefs.layoutDensity).toBe("comfortable");
    expect(prefs.sidebarCollapsed).toBe(false);
    expect(prefs.showWelcomeCard).toBe(true);
  });
});

describe("savePreferences and updatePreferences", () => {
  it("persists preferences to localStorage", () => {
    savePreferences({ theme: "light", layoutDensity: "compact", sidebarCollapsed: false, dashboardWidgets: [], showWelcomeCard: true } as UserPreferences);
    const raw = mockStorage.getItem(PREFERENCES_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.theme).toBe("light");
    expect(parsed.layoutDensity).toBe("compact");
    expect(parsed.sidebarCollapsed).toBe(false);
  });

  it("updatePreferences merges partial updates", () => {
    savePreferences({ theme: "system", layoutDensity: "comfortable" } as UserPreferences);
    const next = updatePreferences({ theme: "dark" });
    expect(next.theme).toBe("dark");
    expect(next.layoutDensity).toBe("comfortable");
    const raw = mockStorage.getItem(PREFERENCES_KEY);
    expect(JSON.parse(raw!).theme).toBe("dark");
  });

  it("updatePreferences merges widget arrays correctly", () => {
    savePreferences({ theme: "system" } as UserPreferences);
    const next = updatePreferences({
      dashboardWidgets: [
        { id: "stats", label: "Resumen de métricas", visible: false, order: 1 },
      ],
    });
    expect(next.dashboardWidgets.length).toBe(4);
    const stats = next.dashboardWidgets.find((w) => w.id === "stats");
    expect(stats?.visible).toBe(false);
  });
});

describe("getVisibleWidgets", () => {
  it("returns only visible widgets sorted by order", () => {
    const prefs: UserPreferences = {
      theme: "system",
      layoutDensity: "comfortable",
      sidebarCollapsed: false,
      showWelcomeCard: true,
      dashboardWidgets: [
        { id: "a", label: "A", visible: true, order: 3 },
        { id: "b", label: "B", visible: false, order: 1 },
        { id: "c", label: "C", visible: true, order: 2 },
      ],
    };
    const visible = getVisibleWidgets(prefs);
    expect(visible.map((w) => w.id)).toEqual(["c", "a"]);
  });
});

describe("toggleWidgetVisibility", () => {
  it("toggles a widget's visibility", () => {
    const prefs: UserPreferences = {
      theme: "system",
      layoutDensity: "comfortable",
      sidebarCollapsed: false,
      showWelcomeCard: true,
      dashboardWidgets: [
        { id: "stats", label: "Resumen de métricas", visible: true, order: 1 },
        { id: "workspace", label: "Tu espacio de trabajo", visible: true, order: 2 },
      ],
    };
    const next = toggleWidgetVisibility(prefs, "stats");
    const stats = next.dashboardWidgets.find((w) => w.id === "stats");
    expect(stats?.visible).toBe(false);
    const workspace = next.dashboardWidgets.find((w) => w.id === "workspace");
    expect(workspace?.visible).toBe(true);
  });
});

describe("setWidgetOrder", () => {
  it("updates a widget's order", () => {
    const prefs: UserPreferences = {
      theme: "system",
      layoutDensity: "comfortable",
      sidebarCollapsed: false,
      showWelcomeCard: true,
      dashboardWidgets: [
        { id: "stats", label: "Resumen de métricas", visible: true, order: 1 },
        { id: "workspace", label: "Tu espacio de trabajo", visible: true, order: 2 },
      ],
    };
    const next = setWidgetOrder(prefs, "stats", 5);
    const stats = next.dashboardWidgets.find((w) => w.id === "stats");
    expect(stats?.order).toBe(5);
  });
});

describe("getLayoutClass", () => {
  it("returns compact class for compact density", () => {
    expect(getLayoutClass("compact")).toContain("p-3");
    expect(getLayoutClass("compact")).toContain("gap-4");
  });

  it("returns comfortable class for comfortable density", () => {
    expect(getLayoutClass("comfortable")).toContain("p-4");
    expect(getLayoutClass("comfortable")).toContain("py-7");
    expect(getLayoutClass("comfortable")).toContain("sm:py-9");
  });
});
