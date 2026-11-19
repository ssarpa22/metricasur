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

La landing pública funciona sin credenciales. Para habilitar registro, inicio de sesión y espacios de trabajo, completá estas variables en `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICABLE
```

Podés obtener la URL y la clave publicable desde el panel de tu proyecto Supabase. En Authentication → URL Configuration, configurá `http://localhost:3000` como Site URL y agregá `http://localhost:3000/auth/callback` a Redirect URLs. Reiniciá `npm run dev` después de modificar las variables.

La aplicación incluye registro por email, inicio/cierre de sesión, edición del nombre de perfil, creación de espacios de trabajo y selección del espacio activo. Si la confirmación por email está habilitada en Supabase, el usuario debe confirmar su dirección antes de ingresar.

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
- [Base de datos y multi-tenancy](docs/DATABASE.md)
