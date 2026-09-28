# Vapitos

PWA mobile-first para gestionar inventario, ventas, compras, garantías y finanzas de Vapitos.

## Stack

- React + Vite
- Tailwind CSS v4
- Supabase / PostgreSQL / Auth
- React Router
- vite-plugin-pwa
- GitHub Pages mediante GitHub Actions

## Desarrollo local

1. Instala Node.js 22 o superior.
2. Copia `.env.example` como `.env.local`.
3. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Ejecuta:

```bash
npm install
npm run dev
```

## Base de datos

El archivo `supabase/final_migration.sql` contiene las funciones y cambios necesarios para la versión final. No borra las tablas existentes.

Ejecuta ese archivo en el SQL Editor del proyecto Supabase que ya contiene los datos de Vapitos.

## GitHub Pages

El proyecto usa `HashRouter`, por lo que funciona directamente en GitHub Pages sin configurar rewrites del servidor.

En GitHub, agrega estos Repository Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Luego habilita Pages usando **GitHub Actions**. Cada push a `main` construirá y publicará la aplicación.

La URL esperada para este repositorio es:

`https://davidvergaraa.github.io/vapitos/`
