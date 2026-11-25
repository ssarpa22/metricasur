# Suscripciones

MétricaSur tiene tres planes configurados en `src/lib/subscriptions.ts`: `free`, `pro` y `business`.
Los precios, límites y entitlements se mantienen en un único catálogo para evitar checks dispersos.

## Persistencia

La migración `202611250001_subscriptions.sql` crea una fila por negocio en
`business_subscriptions`. Los negocios existentes reciben Free grandfathered; los nuevos negocios
reciben Free activo sin estado de pago simulado. La tabla permite lectura a miembros, pero no
escritura a clientes autenticados.

## Límites actuales

| Plan | Registros/mes | Integrantes | Negocios | Analíticas | Exportación |
| --- | ---: | ---: | ---: | --- | --- |
| Free | 100 | 1 | 1 | Básicas | No |
| Pro | 1.000 | 5 | 1 | Avanzadas | Sí |
| Business | 5.000 | 25 | 5 | Avanzadas | Sí |

La creación de negocios y registros verifica estos límites en Server Actions y el límite mensual
también se protege con un trigger transaccional en PostgreSQL para evitar sobrepasos por solicitudes
concurrentes. El uso mensual cuenta todos los registros creados dentro del mes calendario UTC,
incluidos los cancelados; la eliminación física elimina el registro de ese conteo histórico.
Las exportaciones
protegidas están disponibles en `/api/exports/records`; todavía no hay integración de pagos.

La variable `METRICASUR_FREE_REGISTRATION_ENABLED=true` mantiene habilitado el registro gratuito.
Puede desactivarse en el futuro sin migrar ni cobrar automáticamente a cuentas existentes.
