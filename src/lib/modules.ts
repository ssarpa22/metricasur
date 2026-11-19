import { z } from "zod";
import type { Industry } from "@/lib/industries";

export const moduleSlugSchema = z.enum([
  "sales", "inventory", "purchasing", "suppliers", "customers",
  "appointments", "projects", "time_tracking", "proposals", "services",
  "waste_tracking", "menu_costing", "production", "work_orders", "tasks",
]);

export type ModuleSlug = z.infer<typeof moduleSlugSchema>;
export type ModuleDefinition = {
  slug: ModuleSlug;
  name: string;
  description: string;
  category: "operations" | "sales" | "management" | "people";
  industries: Industry[];
};

const allIndustries: Industry[] = [
  "retail", "food_service", "butcher", "greengrocer", "beauty",
  "healthcare", "professional_services", "freelancer", "construction",
  "manufacturing", "other",
];

export const moduleCatalog: ModuleDefinition[] = [
  { slug: "sales", name: "Ventas", description: "Organizá operaciones de venta y su seguimiento.", category: "sales", industries: ["retail", "food_service", "butcher", "greengrocer"] },
  { slug: "inventory", name: "Inventario y stock", description: "Controlá existencias, movimientos y reposición.", category: "operations", industries: ["retail", "food_service", "butcher", "greengrocer", "beauty", "manufacturing"] },
  { slug: "purchasing", name: "Compras", description: "Planificá compras y registrá abastecimiento.", category: "operations", industries: ["retail", "food_service", "butcher", "greengrocer", "construction", "manufacturing"] },
  { slug: "suppliers", name: "Proveedores", description: "Centralizá contactos y relaciones con proveedores.", category: "people", industries: ["retail", "food_service", "butcher", "greengrocer", "construction", "manufacturing"] },
  { slug: "customers", name: "Clientes", description: "Mantené organizada la información y el seguimiento de clientes.", category: "people", industries: ["retail", "beauty", "healthcare", "professional_services", "freelancer", "other"] },
  { slug: "appointments", name: "Agenda y turnos", description: "Administrá citas, horarios y disponibilidad.", category: "operations", industries: ["beauty", "healthcare"] },
  { slug: "projects", name: "Proyectos", description: "Organizá trabajos, etapas y entregables.", category: "management", industries: ["professional_services", "freelancer", "construction"] },
  { slug: "time_tracking", name: "Horas y rentabilidad", description: "Registrá tiempo dedicado y analizá rentabilidad.", category: "management", industries: ["freelancer", "professional_services"] },
  { slug: "proposals", name: "Presupuestos y propuestas", description: "Prepará propuestas y seguí oportunidades comerciales.", category: "sales", industries: ["professional_services", "freelancer", "construction"] },
  { slug: "services", name: "Servicios", description: "Definí servicios, prestaciones y sus valores.", category: "sales", industries: ["beauty", "healthcare", "professional_services"] },
  { slug: "waste_tracking", name: "Mermas y desperdicio", description: "Registrá pérdidas y detectá oportunidades de mejora.", category: "operations", industries: ["food_service", "butcher", "greengrocer"] },
  { slug: "menu_costing", name: "Costos de menú", description: "Calculá costos de preparaciones e insumos.", category: "management", industries: ["food_service"] },
  { slug: "production", name: "Producción", description: "Organizá órdenes, procesos y productos terminados.", category: "operations", industries: ["manufacturing"] },
  { slug: "work_orders", name: "Órdenes de trabajo", description: "Coordiná trabajos, materiales y avances.", category: "operations", industries: ["construction", "manufacturing"] },
  { slug: "tasks", name: "Tareas", description: "Ordená pendientes y responsabilidades del negocio.", category: "management", industries: allIndustries },
];

export function getRecommendedModules(industry: Industry): ModuleDefinition[] {
  return moduleCatalog.filter((module) => module.industries.includes(industry));
}

export function getModuleDefinition(slug: string): ModuleDefinition | undefined {
  return moduleCatalog.find((module) => module.slug === slug);
}
