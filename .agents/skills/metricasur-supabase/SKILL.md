---
name: metricasur-supabase
description: Trabajar con Supabase, PostgreSQL, autenticación, membresías, permisos, migraciones y seguridad RLS en MétricaSur.
---

# MétricaSur Supabase

## Objetivo
Mantener la integridad, seguridad y aislamiento de datos de MétricaSur.

## Arquitectura
Antes de trabajar con Supabase, inspeccionar:
- Clientes Supabase existentes.
- Esquemas y tablas utilizadas.
- Migraciones existentes.
- Políticas RLS.
- Funciones SQL y RPC.
- Relaciones y restricciones.
- Server Actions que utilizan esas tablas.

No inventar estructuras ni asumir que una columna existe.

## Aislamiento multiempresa
El aislamiento entre empresas es obligatorio.

Para cada operación:
1. Identificar al usuario autenticado.
2. Obtener o validar la empresa correspondiente.
3. Comprobar que el usuario pertenece a esa empresa.
4. Verificar el rol y los permisos necesarios.
5. Restringir las consultas por business_id.
6. Mantener las políticas RLS como segunda barrera de seguridad.

Nunca confiar exclusivamente en el business_id recibido desde el cliente.

## RLS
- Analizar las políticas existentes antes de modificarlas.
- Mantener el principio de mínimo privilegio.
- Evitar políticas demasiado permisivas.
- No utilizar USING (true) o WITH CHECK (true) sin una justificación de seguridad excepcional.
- Verificar SELECT, INSERT, UPDATE y DELETE.
- Evitar que un usuario pueda consultar o modificar datos de otra empresa.
- Revisar también las funciones SECURITY DEFINER.

## Migraciones
- Preferir migraciones incrementales.
- Agregar restricciones e índices cuando sean necesarios.
- Preservar los registros existentes.
- Considerar compatibilidad con versiones anteriores.
- Evitar cambios destructivos.
- No ejecutar DROP, TRUNCATE, RESET ni borrados masivos sin autorización explícita.

## Autenticación y permisos
- No exponer service_role ni secretos.
- Utilizar el cliente adecuado para servidor y navegador.
- Verificar membresías en el servidor.
- No confiar en roles enviados por el cliente.
- No permitir que un usuario eleve sus propios privilegios.

## Pruebas
Cuando se modifique seguridad o base de datos:
- Probar acceso autorizado.
- Probar acceso no autorizado.
- Probar aislamiento entre empresas.
- Probar restricciones RLS.
- Probar inserciones, actualizaciones y eliminaciones.
- Verificar que los datos anteriores sigan intactos.

## Reglas operativas
Nunca ejecutar migraciones sobre entornos reales ni modificar datos persistentes sin autorización explícita.
No realizar resets, seeds destructivos ni limpieza de empresas o registros.
No afirmar que RLS funciona correctamente sin pruebas que lo demuestren.

## Entrega
Documentar:
- Tablas afectadas.
- Migraciones creadas.
- Políticas modificadas.
- Riesgos identificados.
- Pruebas realizadas.