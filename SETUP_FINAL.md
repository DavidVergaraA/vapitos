# Vapitos 1.0 — puesta en marcha

## 1. Supabase

El proyecto ya usa la base de datos que construimos. Después de reanudarla, ejecuta **una sola vez**:

`supabase/final_migration.sql`

Hazlo en Supabase → SQL Editor → New query → pega el contenido → Run.

Este archivo:

- crea el libro de movimientos de capital de reinversión;
- actualiza las operaciones atómicas de compras, ventas y garantías;
- agrega el cálculo de resumen semanal;
- agrega el cierre semanal manual;
- crea las distribuciones de reinversión y socios;
- permite marcar pagos de socios como pagados;
- deja RLS y permisos para usuarios autenticados.

**No ejecutes un script que borre las tablas.** Esta migración está diseñada para conservar los datos actuales.

## 2. Probar localmente

Crea `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=TU_URL_DE_SUPABASE
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLISHABLE
```

La clave debe ser la **publishable key**, no una secret/service-role key.

Luego:

```bash
npm install
npm run dev
```

Con GitHub Pages, la app queda bajo `/vapitos/`; localmente Vite te mostrará la URL correspondiente.

## 3. GitHub Pages

El repositorio esperado es `DavidVergaraA/vapitos`, por eso Vite usa:

```js
base: '/vapitos/'
```

La aplicación usa `HashRouter`, así que las rutas funcionan en GitHub Pages sin configurar rewrites del servidor.

### Secrets

En GitHub → Settings → Secrets and variables → Actions agrega:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Pages

En GitHub → Settings → Pages → Build and deployment → Source: **GitHub Actions**.

Después haz push a `main`. El workflow `.github/workflows/deploy.yml` hará el build y publicará `dist`.

## 4. URL

Si el repositorio sigue llamándose `vapitos`, la URL será aproximadamente:

`https://davidvergaraa.github.io/vapitos/`

## 5. Checklist de prueba

1. Login con David.
2. Login con Julian.
3. Proveedores: crear/editar/eliminar.
4. Productos: crear/editar/eliminar.
5. Compras: registrar una compra y comprobar que aparecen unidades nuevas en Inventario.
6. Ventas: registrar una venta y comprobar que la unidad pasa a vendida.
7. Garantías: probar reemplazo y/o devolución.
8. Finanzas: revisar la semana, configurar porcentajes y probar un cierre de prueba cuando exista una semana completa.
9. Después de cerrar una semana, verificar que aparecen las tres distribuciones.
10. Marcar los pagos de los socios como pagados.
11. Registrar una compra posterior y comprobar que el capital de reinversión disminuye.
12. Instalar/probar la PWA desde el navegador móvil o el menú de instalación.

## 6. Importante

GitHub Pages solo aloja el frontend. Los datos y la autenticación siguen viviendo en Supabase.
