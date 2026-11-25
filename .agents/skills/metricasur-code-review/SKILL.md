---
name: metricasur-code-review
description: Revisar código de MétricaSur para detectar errores, vulnerabilidades, problemas de arquitectura, regresiones y riesgos de datos antes de integrar cambios.
---

# MétricaSur Code Review

## Objetivo
Realizar revisiones técnicas rigurosas y encontrar problemas reales antes de que lleguen a producción.

## Alcance
Revisar:
- TypeScript.
- React y Next.js.
- Server Actions.
- Componentes y formularios.
- Supabase.
- PostgreSQL.
- Políticas RLS.
- Validaciones.
- Autenticación.
- Permisos.
- Pruebas.
- Rendimiento.

## Seguridad
Buscar especialmente:
- Acceso a registros de otras empresas.
- Consultas sin business_id.
- Falta de validación de membresías.
- Autorizaciones exclusivamente en el cliente.
- Server Actions vulnerables.
- Manipulación de identificadores.
- Exposición de secretos.
- Validaciones incompletas.
- Errores de autorización.
- Políticas RLS permisivas.
- Escalamiento de privilegios.

## Integridad de datos
Detectar:
- Actualizaciones que afectan registros incorrectos.
- Eliminaciones sin restricciones suficientes.
- Operaciones que puedan perder información.
- Falta de transacciones cuando sean necesarias.
- Inconsistencias entre datos relacionados.
- Migraciones incompatibles.
- Valores que puedan romper restricciones de base de datos.

## Calidad de código
Detectar:
- Duplicación.
- Funciones innecesariamente complejas.
- Tipos inseguros.
- Uso excesivo de any.
- Manejo incorrecto de errores.
- Problemas de asincronía.
- Componentes innecesariamente grandes.
- Consultas redundantes.
- Problemas de rendimiento.
- Código muerto.

## Regresiones
Comparar los cambios con el comportamiento anterior.
Verificar que:
- Las funcionalidades existentes continúen funcionando.
- No se rompan otros módulos.
- Se mantenga el aislamiento multiempresa.
- Los formularios sigan enviando los datos esperados.
- Las acciones del servidor mantengan sus contratos.
- Las rutas y permisos continúen funcionando.

## Método de revisión
1. Inspeccionar el diff.
2. Revisar el contexto de cada archivo modificado.
3. Seguir los flujos afectados.
4. Comprobar los controles de seguridad.
5. Revisar las pruebas disponibles.
6. Ejecutar validaciones pertinentes cuando corresponda.
7. Clasificar los hallazgos por gravedad.

## Clasificación
- CRÍTICO: exposición de datos, acceso entre empresas o pérdida de información.
- ALTO: vulnerabilidad importante o funcionalidad principal rota.
- MEDIO: error funcional limitado, validación incompleta o regresión.
- BAJO: mantenibilidad, consistencia o mejora menor.

## Reglas
- No modificar código durante una revisión solicitada como auditoría.
- No inventar vulnerabilidades.
- Diferenciar problemas comprobados de riesgos potenciales.
- Incluir archivo y ubicación del problema.
- Explicar el impacto y una solución concreta.
- No ocultar hallazgos para simplificar el informe.

## Entrega
Presentar primero los problemas encontrados, ordenados por gravedad.
Después indicar:
- Evidencia.
- Impacto.
- Solución recomendada.
- Pruebas que faltan.
- Aspectos que fueron revisados y no presentaron problemas.