# MétricaSur

Plataforma de gestión adaptable para emprendedores y pequeñas empresas.

## Requisitos
- Node.js 20.9 o superior (recomendado: Node.js 22 LTS).
- npm 10 o superior.
- Git.

## Desarrollo local
1. Cloná el repositorio.
2. Instalá dependencias: `npm install`.
3. Copiá las variables de ejemplo: `Copy-Item .env.example .env.local` (PowerShell).
4. Iniciá el servidor: `npm run dev`.
5. Abrí [http://localhost:3000](http://localhost:3000).

La aplicación puede ejecutarse sin credenciales de Supabase. Las integraciones se habilitarán en etapas posteriores.

## Comandos
| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación TypeScript |
| `npm test` | Tests unitarios |
| `npm run format:check` | Verificación Prettier |
| `npm run check` | Lint, tipos, tests y formato |

No agregues secretos reales al repositorio. Las claves privadas deben permanecer exclusivamente en el servidor.

## Documentación
- [Visión del producto](docs/PRODUCT_VISION.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Sistema de módulos](docs/MODULE_SYSTEM.md)
- [Autonomía de IA](docs/AI_AUTONOMY.md)
- [Roadmap](docs/ROADMAP.md)
