---
name: metricasur-development
description: Implementar funcionalidades, modificar componentes y Server Actions, corregir errores y evolucionar MétricaSur respetando su arquitectura SaaS multiempresa.
---

# MétricaSur Development

## Objetivo
Implementar funcionalidades completas en MétricaSur con autonomía, cambios acotados y calidad de producción.

## Antes de implementar
1. Inspeccionar los archivos involucrados y sus dependencias.
2. Identificar componentes, acciones, tipos y utilidades reutilizables.
3. Comprender cómo funciona actualmente la funcionalidad.
4. Detectar posibles efectos secundarios.
5. Definir el cambio mínimo necesario.

No realizar auditorías generales cuando el pedido sea específico.

## Implementación
- Seguir los patrones existentes de Next.js App Router.
- Utilizar Server Components por defecto.
- Utilizar Client Components únicamente cuando sean necesarios.
- Mantener las Server Actions separadas de los componentes visuales.
- Mantener TypeScript estricto.
- Reutilizar componentes y utilidades existentes.
- Evitar duplicar lógica.
- Mantener una interfaz consistente con el diseño actual.
- Implementar estados de carga, error, vacío y éxito cuando correspondan.
- Validar los datos también en el servidor.
- Evitar confiar en datos provenientes del navegador.

## Multiempresa
Toda funcionalidad debe respetar el contexto de empresa activa.
- Verificar la pertenencia del usuario a la empresa.
- Verificar permisos antes de modificar información.
- Restringir lecturas y escrituras a la empresa correspondiente.
- No mezclar información entre empresas.
- No asumir que ocultar una opción en la interfaz constituye autorización.

## Modificaciones
- Realizar cambios puntuales.
- No reescribir archivos completos innecesariamente.
- No eliminar código funcional sin justificación.
- Crear respaldos antes de modificaciones importantes.
- Preservar cambios anteriores del usuario.
- No modificar archivos ajenos al objetivo.

## Validación
Después de implementar:
1. Ejecutar TypeScript.
2. Ejecutar lint cuando corresponda.
3. Ejecutar las pruebas unitarias relacionadas.
4. Ejecutar pruebas E2E relevantes.
5. Corregir errores introducidos por el cambio.

No afirmar que una validación pasó si no fue ejecutada.

## Entrega
Informar brevemente:
- Qué se implementó.
- Qué archivos cambiaron.
- Qué pruebas se ejecutaron.
- Qué problemas quedaron pendientes.

Trabajar de manera autónoma. No pedir al usuario que inspeccione o copie archivos que pueden inspeccionarse directamente desde el repositorio.