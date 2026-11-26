# Suscripciones

MétricaSur tiene tres planes configurados en `src/lib/subscriptions.ts`: `free`, `pro` y `business`.
Los precios, límites y entitlements se mantienen en un único catálogo para evitar checks dispersos.

## Persistencia y titularidad

La suscripción pertenece a la **cuenta del usuario** y se guarda en `account_subscriptions`, con una única fila por `user_id`. Los negocios creados por esa cuenta comparten el mismo plan y consumen los límites de forma agregada.

La migración `202611260001_account_subscriptions.sql` consolida los planes históricos de `business_subscriptions` por titular: si una cuenta tenía planes diferentes en sus negocios, conserva el nivel más alto. Las cuentas existentes sin negocios reciben Free. La tabla anterior se conserva como historial, pero deja de ser la fuente de autorización o límites.

Los clientes autenticados solo pueden leer su propia suscripción. Los cambios de plan quedan reservados a operaciones confiables del servidor.

## Límites actuales

| Plan | Registros/mes (cuenta) | Integrantes | Negocios |
| --- | ---: | ---: | ---: |
| Free | 100 | 1 | 1 |
| Pro | 1.000 | 5 | 1 |
| Business | 5.000 | 25 | 5 |

La creación de negocios verifica el límite dentro de la función RPC de PostgreSQL, con bloqueo por cuenta para evitar solicitudes concurrentes que lo excedan. El límite mensual de registros también se aplica en PostgreSQL y suma los registros de todos los negocios creados por la cuenta. La aplicación muestra el uso agregado y valida antes de insertar para dar un mensaje claro; el trigger de base de datos es la protección definitiva.

El uso mensual cuenta todos los registros creados dentro del mes calendario UTC, incluidos los cancelados; la eliminación física elimina el registro de ese conteo histórico. Las exportaciones protegidas están disponibles en `/api/exports/records`; todavía no hay integración de pagos.

La variable `METRICASUR_FREE_REGISTRATION_ENABLED=true` mantiene habilitado el registro gratuito. Puede desactivarse en el futuro sin migrar ni cobrar automáticamente a cuentas existentes.
