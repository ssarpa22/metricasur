export const planIds = ["free", "pro", "business"] as const;
export type PlanId = (typeof planIds)[number];

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  priceUsdMonthly: number;
  description: string;
  maxMonthlyRecords: number | null;
  maxTeamMembers: number;
  maxBusinesses: number;
  analytics: "basic" | "advanced";
  reports: "basic" | "advanced";
  canExport: boolean;
  canCustomizeReports: boolean;
  features: readonly string[];
};

export const subscriptionPlans: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsdMonthly: 0,
    description: "Una base útil para ordenar el trabajo diario.",
    maxMonthlyRecords: 100,
    maxTeamMembers: 1,
    maxBusinesses: 1,
    analytics: "basic",
    reports: "basic",
    canExport: false,
    canCustomizeReports: false,
    features: ["1 negocio", "Clientes y módulos esenciales", "100 registros operativos por mes", "Dashboard y métricas básicas"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsdMonthly: 12,
    description: "Más capacidad y mejores herramientas para crecer.",
    maxMonthlyRecords: 1000,
    maxTeamMembers: 5,
    maxBusinesses: 1,
    analytics: "advanced",
    reports: "advanced",
    canExport: true,
    canCustomizeReports: false,
    features: ["1 negocio", "1.000 registros operativos por mes", "Analíticas y reportes avanzados", "Exportación de datos", "Hasta 5 integrantes"],
  },
  business: {
    id: "business",
    name: "Business",
    priceUsdMonthly: 29,
    description: "Control y capacidad para equipos y varios negocios.",
    maxMonthlyRecords: 5000,
    maxTeamMembers: 25,
    maxBusinesses: 5,
    analytics: "advanced",
    reports: "advanced",
    canExport: true,
    canCustomizeReports: true,
    features: ["Hasta 5 negocios", "5.000 registros operativos por mes", "Analíticas avanzadas", "Reportes personalizables", "Hasta 25 integrantes"],
  },
};

export function getSubscriptionPlan(value: unknown): SubscriptionPlan {
  return typeof value === "string" && planIds.includes(value as PlanId)
    ? subscriptionPlans[value as PlanId]
    : subscriptionPlans.free;
}

export function getPlanId(value: unknown): PlanId {
  return getSubscriptionPlan(value).id;
}

export function isPlanAtLeast(plan: PlanId, required: PlanId): boolean {
  return planIds.indexOf(plan) >= planIds.indexOf(required);
}
