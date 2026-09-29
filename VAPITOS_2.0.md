# Vapitos 2.0

Vapitos 2.0 añade edición de ventas, abonos/cuentas por cobrar, garantías con destino del Vapo defectuoso, reventa de unidades defectuosas y ventas mediante vendedores externos con comisiones.

## Migración Supabase

1. Haz un backup si quieres conservar una copia adicional.
2. En el proyecto Supabase existente abre **SQL Editor**.
3. Ejecuta primero `supabase/final_migration.sql` solo si tu proyecto todavía no tenía la migración 1.0 aplicada.
4. Si Vapitos 1.0 ya estaba funcionando y ya ejecutaste esa migración, ejecuta únicamente `supabase/v2_migration.sql`.
5. No borres tablas ni ejecutes el SQL maestro inicial.

La migración 2.0 es incremental y conserva los datos existentes. Las ventas históricas reciben un abono equivalente a su precio para que queden como cobradas al migrar.

## Cambios 2.0

- Editar ventas: unidad, precio, método y notas.
- No permite bajar el precio por debajo de lo ya abonado.
- Abonos parciales y cuentas por cobrar.
- Dashboard separa ventas generadas, dinero cobrado y pendiente.
- Vendedores externos.
- Comisión fija o porcentual.
- Estado de comisión pendiente/pagada.
- Destino de utilidad de venta externa: reinversión o utilidad.
- Garantías: Vapo defectuoso desechado, conservado o revendido.
- Reventa de un Vapo defectuoso vinculada a la garantía original.
- Finanzas muestra por cobrar y comisiones.

## Probar localmente

```bash
npm install
npm run dev
```

Para producción:

```bash
npm run build
```

## Deploy

No subas `.env.local`. En GitHub Actions usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` como secrets/variables.


## Auditoría de datos previa a V2

La BD existente se audita antes de ejecutar la migración. Las ventas históricas de Vapitos 1.0 se convierten en abonos completos porque 1.0 no tenía módulo de abonos. Si alguna de esas ventas realmente tenía saldo pendiente, se debe corregir después de la migración desde Ventas.

La migración V2 no elimina tablas ni registros. En particular conserva ventas, inventario y garantías existentes. Una garantía histórica cuyo destino todavía no esté registrado puede completarse desde la pantalla Garantías.

Las ventas externas destinadas a reinversión no entran en el reparto normal de utilidad; el monto cobrado neto de comisión se suma a la reinversión. Las ventas externas cuyo destino sea Utilidad sí participan en el reparto semanal.

Los abonos se contabilizan por su propia fecha de cobro, no por la fecha original de la venta.
