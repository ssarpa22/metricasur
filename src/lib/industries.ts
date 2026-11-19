import { z } from "zod";

export const industrySchema = z.enum([
  "retail",
  "food_service",
  "butcher",
  "greengrocer",
  "beauty",
  "healthcare",
  "professional_services",
  "freelancer",
  "construction",
  "manufacturing",
  "other",
]);

export type Industry = z.infer<typeof industrySchema>;

export const industries: Record<Industry, {
  label: string;
  description: string;
  focus: string;
  priorities: string[];
}> = {
  retail: {
    label: "Comercio minorista",
    description: "Ventas, productos y reposición para tu local.",
    focus: "Tus ventas, productos y reposición",
    priorities: ["Registrar ventas y medios de pago", "Mantener precios y stock actualizados", "Detectar productos que necesitan reposición"],
  },
  food_service: {
    label: "Gastronomía",
    description: "Menú, insumos, costos y operación diaria.",
    focus: "Tu menú, tus insumos y tus costos",
    priorities: ["Calcular el costo de cada preparación", "Controlar insumos y desperdicio", "Planificar compras según la demanda"],
  },
  butcher: {
    label: "Carnicería",
    description: "Cortes, cámaras, compras, ventas y merma.",
    focus: "Tus cortes, el stock y las compras",
    priorities: ["Controlar existencias por corte y categoría", "Planificar compras a proveedores", "Registrar merma y movimientos de mercadería"],
  },
  greengrocer: {
    label: "Verdulería",
    description: "Frutas, verduras, rotación y compras frescas.",
    focus: "La mercadería fresca y la reposición",
    priorities: ["Revisar stock y estado de productos", "Estimar compras para el día siguiente", "Controlar rotación, precios y desperdicio"],
  },
  beauty: {
    label: "Peluquería y estética",
    description: "Agenda, profesionales, servicios y productos.",
    focus: "Tu agenda y la atención de clientes",
    priorities: ["Organizar turnos y disponibilidad", "Administrar servicios y precios", "Controlar productos e insumos utilizados"],
  },
  healthcare: {
    label: "Salud y consultorios",
    description: "Agenda, profesionales y administración de atención.",
    focus: "La organización de tu consultorio",
    priorities: ["Organizar turnos y disponibilidad", "Gestionar profesionales y servicios", "Administrar documentación con controles de acceso"],
  },
  professional_services: {
    label: "Servicios profesionales",
    description: "Clientes, trabajos, presupuestos y cobros.",
    focus: "Tus clientes y servicios",
    priorities: ["Organizar clientes y trabajos activos", "Preparar presupuestos y seguimiento", "Controlar entregas, facturación y cobros"],
  },
  freelancer: {
    label: "Freelancer",
    description: "Proyectos, horas, propuestas, entregas y pagos.",
    focus: "Tus proyectos y tu tiempo",
    priorities: ["Organizar proyectos y entregables", "Registrar horas y rentabilidad", "Dar seguimiento a propuestas y pagos"],
  },
  construction: {
    label: "Construcción y oficios",
    description: "Obras, presupuestos, materiales y cuadrillas.",
    focus: "Tus obras y materiales",
    priorities: ["Seguir el avance y los costos por obra", "Planificar materiales y compras", "Coordinar tareas, equipos y fechas"],
  },
  manufacturing: {
    label: "Industria y producción",
    description: "Producción, insumos, órdenes y costos.",
    focus: "Tu producción y tus recursos",
    priorities: ["Planificar órdenes de producción", "Controlar materias primas y productos terminados", "Medir costos, tiempos y desperdicio"],
  },
  other: {
    label: "Otro rubro",
    description: "Configurá tu espacio según la actividad de tu negocio.",
    focus: "Conocer cómo funciona tu negocio",
    priorities: ["Definir tus productos o servicios", "Organizar clientes, tareas y operaciones", "Identificar qué necesitás medir y mejorar"],
  },
};
