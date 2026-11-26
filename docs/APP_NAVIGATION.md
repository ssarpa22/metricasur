# App navigation and dashboard

MétricaSur uses a compact workspace shell with a responsive sidebar and a dashboard-first landing page.

## Navigation
- **Inicio** is the default route and contains a truthful overview, current industry context, enabled-module count, setup shortcut, and an empty activity state until operational records exist.
- **Operaciones**, **Personas**, and **Organización** group enabled modules by user task.
- **Informes** is a reserved top-level section; detailed analytics will appear when operational data is available.
- **Asistente IA** is explicitly marked as in preparation and does not imply that the assistant can currently read or change business data.
- **Configuración** groups workspace switching/creation/deletion, module activation, and profile settings.

## UX principles
- Desktop sidebar can collapse; mobile navigation uses an overlay drawer.
- Workspace switching remains server-action based and membership-checked.
- Only enabled modules appear in the sidebar.
- Module pages clearly state when their operational interface is not implemented yet.
- Empty states never fabricate financial metrics, transactions, tasks, or notifications.
- Module activation and workspace deletion retain their existing server-side authorization and database protections.

## Productivity and guidance

- The application header exposes a searchable command palette; `Ctrl+K` (or `Cmd+K` on macOS) opens it and `Escape` closes it.
- The command palette searches the main sections and the currently enabled modules without changing workspace permissions.
- The dashboard offers a dismissible first-steps guide for empty workspaces. Its dismissal is stored locally in the browser.
- The compact-density preference applies to the workspace content area as well as the dashboard.
- Preference updates are broadcast between mounted app surfaces and synchronized across browser tabs through the storage event.

## Scope
This navigation refactor does not introduce operational tables or pretend that module functionality already exists. It creates the information architecture and dashboard surface that later modules can populate.


## Sidebar and appearance defaults

- New users start with the sidebar expanded; collapsing it switches navigation entries to centered icons with accessible labels and hover tooltips.
- Expanded navigation displays each icon alongside its text label.
- The default theme is dark. Explicitly saved theme preferences (light, dark, or system) continue to take precedence.
- Existing sidebar and appearance preferences are preserved when the defaults change.
