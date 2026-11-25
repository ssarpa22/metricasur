---
name: metricasur-testing
description: Crear, ejecutar y mantener pruebas unitarias, de integración y E2E para MétricaSur utilizando Vitest y Playwright.
---

# MétricaSur Testing

## Objetivo
Garantizar que las funcionalidades de MétricaSur funcionen correctamente y que los cambios no introduzcan regresiones.

## Herramientas
- Vitest para pruebas unitarias.
- Playwright para pruebas end-to-end.
- TypeScript para comprobación estática.
- ESLint para análisis de calidad.

## Antes de crear pruebas
1. Inspeccionar la configuración existente.
2. Revisar los tests relacionados.
3. Identificar los comportamientos que deben garantizarse.
4. Reutilizar fixtures y utilidades existentes.
5. Evitar duplicar pruebas que ya cubren el mismo escenario.

## Pruebas unitarias
Priorizar pruebas de:
- Validaciones.
- Normalización de datos.
- Cálculos.
- Transformaciones.
- Funciones auxiliares.
- Reglas de negocio independientes.

Cubrir:
- Casos correctos.
- Valores límite.
- Datos vacíos.
- Datos inválidos.
- Tipos incorrectos.
- Fechas imposibles.
- Valores numéricos negativos o fuera de rango.

## Pruebas E2E
Utilizar Playwright para comprobar flujos reales.

Priorizar:
- Registro e inicio de sesión.
- Cierre de sesión.
- Creación de empresas.
- Cambio de empresa activa.
- Aislamiento entre empresas.
- Activación y desactivación de módulos.
- Creación y edición de registros.
- Eliminación de registros.
- Validaciones de formularios.
- Filtros y búsquedas.
- Persistencia de información.
- Exportaciones CSV.
- Permisos de usuarios.

## Multiempresa
Toda funcionalidad que maneje información empresarial debe probar:
- Acceso desde la empresa propietaria.
- Imposibilidad de acceder desde otra empresa.
- Imposibilidad de modificar registros ajenos.
- Comportamiento al cambiar de empresa activa.

## Seguridad de las pruebas
- No utilizar credenciales reales.
- No imprimir secretos.
- No modificar empresas ni registros preexistentes.
- Utilizar datos de prueba claramente identificables.
- No ejecutar resets destructivos.
- No eliminar datos que no haya creado el propio test.
- Limpiar únicamente recursos creados por la prueba cuando sea seguro hacerlo.

## Calidad
- Las pruebas deben verificar comportamientos reales.
- Evitar tests que simplemente reproduzcan la implementación.
- No modificar expectativas para hacer pasar una prueba incorrecta.
- No ignorar errores con skip, only o mecanismos equivalentes sin justificación.
- No ocultar fallos de seguridad.

## Ejecución
Después de modificar código:
1. Ejecutar los tests unitarios afectados.
2. Ejecutar TypeScript.
3. Ejecutar lint cuando corresponda.
4. Ejecutar los tests E2E relevantes.
5. Ejecutar la suite completa cuando el alcance lo justifique.

Si una prueba falla, investigar la causa y corregirla cuando corresponda.

## Entrega
Informar:
- Tests agregados o modificados.
- Escenarios cubiertos.
- Resultado real de ejecución.
- Fallos pendientes.