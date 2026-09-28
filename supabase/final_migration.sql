-- ============================================================
-- VAPITOS 1.0 - MIGRACIÓN FINAL
-- ============================================================
-- Ejecutar en el SQL Editor del proyecto Supabase EXISTENTE.
-- NO elimina tablas ni datos.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CAPITAL DE REINVERSIÓN
-- ------------------------------------------------------------
create table if not exists public.movimientos_capital (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('reinversion', 'compra', 'ajuste')),
  monto numeric(12,2) not null,
  compra_id bigint references public.compras(id),
  cierre_id bigint references public.cierres_semanales(id),
  fecha timestamptz not null default now(),
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_capital_fecha
  on public.movimientos_capital(fecha);

alter table public.movimientos_capital enable row level security;

drop policy if exists movimientos_capital_select_authenticated on public.movimientos_capital;
create policy movimientos_capital_select_authenticated
  on public.movimientos_capital
  for select
  to authenticated
  using (true);

grant select on public.movimientos_capital to authenticated;

-- ------------------------------------------------------------
-- 2. GRANTS BASE
-- ------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.proveedores,
  public.productos,
  public.socios,
  public.configuracion_negocio,
  public.compras,
  public.detalle_compras,
  public.inventario,
  public.ventas,
  public.garantias,
  public.cierres_semanales,
  public.distribuciones,
  public.movimientos_capital
  to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- ------------------------------------------------------------
-- 3. POLÍTICAS CRUD PARA USUARIOS AUTENTICADOS
-- ------------------------------------------------------------
-- Las funciones críticas también son atómicas y SECURITY DEFINER.

DO $$
DECLARE
  tabla text;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'proveedores',
    'productos',
    'socios',
    'configuracion_negocio',
    'compras',
    'detalle_compras',
    'inventario',
    'ventas',
    'garantias',
    'cierres_semanales',
    'distribuciones'
  ] LOOP
    EXECUTE format('drop policy if exists vapitos_authenticated_all on public.%I', tabla);
    EXECUTE format(
      'create policy vapitos_authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      tabla
    );
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4. REGISTRAR COMPRA + INVENTARIO + DESCUENTO DE REINVERSIÓN
-- ------------------------------------------------------------
create or replace function public.registrar_compra(
  p_proveedor_id bigint,
  p_notas text default null,
  p_detalles jsonb default '[]'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra_id bigint;
  v_detalle_id bigint;
  v_total numeric(12,2) := 0;
  v_detalle jsonb;
  v_producto_id bigint;
  v_sabor text;
  v_cantidad integer;
  v_costo numeric(12,2);
begin
  if not exists (select 1 from public.proveedores where id = p_proveedor_id) then
    raise exception 'El proveedor seleccionado no existe.';
  end if;

  if jsonb_array_length(coalesce(p_detalles, '[]'::jsonb)) = 0 then
    raise exception 'La compra debe tener al menos un detalle.';
  end if;

  insert into public.compras (proveedor_id, notas)
  values (p_proveedor_id, nullif(trim(p_notas), ''))
  returning id into v_compra_id;

  for v_detalle in select * from jsonb_array_elements(p_detalles)
  loop
    v_producto_id := (v_detalle->>'producto_id')::bigint;
    v_sabor := nullif(trim(v_detalle->>'sabor'), '');
    v_cantidad := (v_detalle->>'cantidad')::integer;
    v_costo := (v_detalle->>'costo_unitario')::numeric;

    if v_sabor is null then
      raise exception 'El sabor de una línea de compra es obligatorio.';
    end if;
    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'La cantidad de una línea de compra debe ser mayor que cero.';
    end if;
    if v_costo is null or v_costo < 0 then
      raise exception 'El costo unitario no es válido.';
    end if;
    if not exists (select 1 from public.productos where id = v_producto_id) then
      raise exception 'Uno de los productos seleccionados no existe.';
    end if;

    insert into public.detalle_compras (
      compra_id, producto_id, sabor, cantidad, costo_unitario
    )
    values (
      v_compra_id, v_producto_id, v_sabor, v_cantidad, v_costo
    )
    returning id into v_detalle_id;

    insert into public.inventario (
      detalle_compra_id, producto_id, sabor
    )
    select v_detalle_id, v_producto_id, v_sabor
    from generate_series(1, v_cantidad);

    v_total := v_total + (v_cantidad * v_costo);
  end loop;

  update public.compras
  set total = v_total
  where id = v_compra_id;

  -- Una compra reduce el capital reservado de reinversión.
  insert into public.movimientos_capital (
    tipo, monto, compra_id, notas
  )
  values (
    'compra', -v_total, v_compra_id, 'Compra registrada desde Vapitos'
  );

  return v_compra_id;
end;
$$;

grant execute on function public.registrar_compra(bigint, text, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 5. REGISTRAR VENTA ATÓMICA
-- ------------------------------------------------------------
create or replace function public.registrar_venta(
  p_inventario_id bigint,
  p_precio_final numeric(12,2),
  p_metodo_pago text,
  p_notas text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta_id bigint;
  v_costo numeric(12,2);
  v_estado text;
begin
  if p_precio_final is null or p_precio_final < 0 then
    raise exception 'El precio final no es válido.';
  end if;

  if p_metodo_pago not in ('nequi', 'bancolombia', 'efectivo') then
    raise exception 'El método de pago no es válido.';
  end if;

  select inventario.estado, productos.costo_mayorista
  into v_estado, v_costo
  from public.inventario
  join public.productos on productos.id = inventario.producto_id
  where inventario.id = p_inventario_id
  for update;

  if not found then
    raise exception 'La unidad seleccionada no existe.';
  end if;

  if v_estado <> 'disponible' then
    raise exception 'La unidad seleccionada ya no está disponible.';
  end if;

  insert into public.ventas (
    inventario_id,
    precio_final,
    costo_unitario,
    metodo_pago,
    resultado,
    notas
  )
  values (
    p_inventario_id,
    p_precio_final,
    v_costo,
    p_metodo_pago,
    'exitosa',
    nullif(trim(p_notas), '')
  )
  returning id into v_venta_id;

  update public.inventario
  set estado = 'vendido', fecha_salida = now()
  where id = p_inventario_id;

  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(bigint, numeric, text, text) to authenticated;

-- ------------------------------------------------------------
-- 6. REGISTRAR GARANTÍA ATÓMICA
-- ------------------------------------------------------------
create or replace function public.registrar_garantia(
  p_venta_id bigint,
  p_tipo text,
  p_motivo text,
  p_inventario_reemplazo_id bigint default null,
  p_monto_reembolso numeric(12,2) default 0,
  p_notas text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_garantia_id bigint;
  v_inventario_original_id bigint;
  v_producto_original_id bigint;
  v_estado_original text;
  v_producto_reemplazo_id bigint;
  v_estado_reemplazo text;
begin
  if p_tipo not in ('reemplazo', 'devolucion') then
    raise exception 'El tipo de garantía no es válido.';
  end if;

  if p_motivo not in ('no_enciende', 'no_carga', 'sabor_defectuoso', 'fuga', 'golpeado', 'otro') then
    raise exception 'El motivo de garantía no es válido.';
  end if;

  if p_monto_reembolso is null or p_monto_reembolso < 0 then
    raise exception 'El monto del reembolso no es válido.';
  end if;

  select ventas.inventario_id, inventario.producto_id, inventario.estado
  into v_inventario_original_id, v_producto_original_id, v_estado_original
  from public.ventas
  join public.inventario on inventario.id = ventas.inventario_id
  where ventas.id = p_venta_id
  for update;

  if not found then
    raise exception 'La venta seleccionada no existe.';
  end if;

  if exists (select 1 from public.garantias where venta_id = p_venta_id) then
    raise exception 'Esta venta ya tiene una garantía registrada.';
  end if;

  if v_estado_original <> 'vendido' then
    raise exception 'La unidad asociada a esta venta no está en estado vendido.';
  end if;

  if p_tipo = 'reemplazo' then
    if p_inventario_reemplazo_id is null then
      raise exception 'Debes seleccionar una unidad para el reemplazo.';
    end if;

    select estado, producto_id
    into v_estado_reemplazo, v_producto_reemplazo_id
    from public.inventario
    where id = p_inventario_reemplazo_id
    for update;

    if not found then
      raise exception 'La unidad de reemplazo no existe.';
    end if;

    if v_estado_reemplazo <> 'disponible' then
      raise exception 'La unidad seleccionada para reemplazo ya no está disponible.';
    end if;

    if v_producto_reemplazo_id <> v_producto_original_id then
      raise exception 'La unidad de reemplazo debe pertenecer al mismo producto.';
    end if;

    if p_monto_reembolso <> 0 then
      raise exception 'Un reemplazo no puede tener monto de reembolso.';
    end if;

    update public.inventario
    set estado = 'defectuoso', fecha_salida = now()
    where id = v_inventario_original_id;

    update public.inventario
    set estado = 'salida_garantia', fecha_salida = now()
    where id = p_inventario_reemplazo_id;

    update public.ventas
    set resultado = 'garantia_reemplazo'
    where id = p_venta_id;

  else
    if p_inventario_reemplazo_id is not null then
      raise exception 'Una devolución no puede tener una unidad de reemplazo.';
    end if;

    update public.inventario
    set estado = 'defectuoso', fecha_salida = now()
    where id = v_inventario_original_id;

    update public.ventas
    set resultado = 'garantia_devolucion'
    where id = p_venta_id;
  end if;

  insert into public.garantias (
    venta_id,
    tipo,
    motivo,
    inventario_reemplazo_id,
    monto_reembolso,
    notas
  )
  values (
    p_venta_id,
    p_tipo,
    p_motivo,
    case when p_tipo = 'reemplazo' then p_inventario_reemplazo_id else null end,
    case when p_tipo = 'reemplazo' then 0 else p_monto_reembolso end,
    nullif(trim(p_notas), '')
  )
  returning id into v_garantia_id;

  return v_garantia_id;
end;
$$;

grant execute on function public.registrar_garantia(bigint, text, text, bigint, numeric, text) to authenticated;

-- ------------------------------------------------------------
-- 7. RESUMEN DE UNA SEMANA
-- ------------------------------------------------------------
create or replace function public.obtener_resumen_semana(
  p_fecha_inicio date,
  p_fecha_fin date
)
returns table (
  fecha_inicio date,
  fecha_fin date,
  total_ventas numeric,
  costo_mercancia_vendida numeric,
  perdidas_garantias numeric,
  utilidad_real numeric
)
language sql
security definer
set search_path = public
as $$
  with ventas_semana as (
    select
      coalesce(sum(v.precio_final), 0) as ventas,
      coalesce(sum(v.costo_unitario), 0) as costos
    from public.ventas v
    where v.fecha_venta >= (p_fecha_inicio::timestamp at time zone 'America/Bogota')
      and v.fecha_venta < ((p_fecha_fin + 1)::timestamp at time zone 'America/Bogota')
  ),
  garantias_semana as (
    select coalesce(sum(
      case
        when g.tipo = 'devolucion' then g.monto_reembolso
        when g.tipo = 'reemplazo' then coalesce(p.costo_mayorista, 0)
        else 0
      end
    ), 0) as perdidas
    from public.garantias g
    left join public.inventario ir on ir.id = g.inventario_reemplazo_id
    left join public.productos p on p.id = ir.producto_id
    where g.fecha_garantia >= (p_fecha_inicio::timestamp at time zone 'America/Bogota')
      and g.fecha_garantia < ((p_fecha_fin + 1)::timestamp at time zone 'America/Bogota')
  )
  select
    p_fecha_inicio,
    p_fecha_fin,
    ventas_semana.ventas,
    ventas_semana.costos,
    garantias_semana.perdidas,
    ventas_semana.ventas - ventas_semana.costos - garantias_semana.perdidas
  from ventas_semana, garantias_semana;
$$;

grant execute on function public.obtener_resumen_semana(date, date) to authenticated;

-- ------------------------------------------------------------
-- 8. CERRAR SEMANA + DISTRIBUCIONES + REINVERSIÓN
-- ------------------------------------------------------------
create or replace function public.cerrar_semana(
  p_fecha_inicio date,
  p_fecha_fin date,
  p_notas text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cierre_id bigint;
  v_total_ventas numeric(12,2);
  v_costo numeric(12,2);
  v_perdidas numeric(12,2);
  v_utilidad numeric(12,2);
  v_reinv_pct numeric(5,2);
  v_socio1_pct numeric(5,2);
  v_socio2_pct numeric(5,2);
  v_reinv numeric(12,2);
  v_socio1 numeric(12,2);
  v_socio2 numeric(12,2);
  v_socio1_id bigint;
  v_socio2_id bigint;
begin
  if p_fecha_fin < p_fecha_inicio then
    raise exception 'El rango de fechas no es válido.';
  end if;

  if extract(isodow from p_fecha_inicio) <> 1 or extract(isodow from p_fecha_fin) <> 7 then
    raise exception 'El cierre debe cubrir una semana completa de lunes a domingo.';
  end if;

  if p_fecha_fin > (now() at time zone 'America/Bogota')::date then
    raise exception 'No puedes cerrar una semana que todavía no ha terminado.';
  end if;

  if exists (
    select 1 from public.cierres_semanales
    where fecha_inicio = p_fecha_inicio and fecha_fin = p_fecha_fin
  ) then
    raise exception 'Esta semana ya está cerrada.';
  end if;

  select
    total_ventas,
    costo_mercancia_vendida,
    perdidas_garantias,
    utilidad_real
  into v_total_ventas, v_costo, v_perdidas, v_utilidad
  from public.obtener_resumen_semana(p_fecha_inicio, p_fecha_fin);

  select
    porcentaje_reinversion,
    porcentaje_socio_1,
    porcentaje_socio_2
  into v_reinv_pct, v_socio1_pct, v_socio2_pct
  from public.configuracion_negocio
  where id = true;

  if not found then
    raise exception 'No existe la configuración del negocio.';
  end if;

  if v_reinv_pct + v_socio1_pct + v_socio2_pct <> 100 then
    raise exception 'Los porcentajes de distribución deben sumar 100%%.';
  end if;

  select id into v_socio1_id from public.socios where activo = true order by id asc limit 1;
  select id into v_socio2_id from public.socios where activo = true order by id asc offset 1 limit 1;

  if v_socio1_id is null or v_socio2_id is null then
    raise exception 'Se necesitan dos socios activos para cerrar la semana.';
  end if;

  -- No se reparte una pérdida: las distribuciones son cero cuando la utilidad es negativa.
  v_reinv := round(greatest(v_utilidad, 0) * v_reinv_pct / 100, 2);
  v_socio1 := round(greatest(v_utilidad, 0) * v_socio1_pct / 100, 2);
  v_socio2 := round(greatest(v_utilidad, 0) * v_socio2_pct / 100, 2);

  insert into public.cierres_semanales (
    fecha_inicio,
    fecha_fin,
    total_ventas,
    costo_mercancia_vendida,
    perdidas_garantias,
    utilidad_real,
    porcentaje_reinversion,
    porcentaje_socio_1,
    porcentaje_socio_2,
    monto_reinversion,
    monto_socio_1,
    monto_socio_2,
    notas
  )
  values (
    p_fecha_inicio,
    p_fecha_fin,
    v_total_ventas,
    v_costo,
    v_perdidas,
    v_utilidad,
    v_reinv_pct,
    v_socio1_pct,
    v_socio2_pct,
    v_reinv,
    v_socio1,
    v_socio2,
    nullif(trim(p_notas), '')
  )
  returning id into v_cierre_id;

  insert into public.distribuciones (cierre_id, tipo, socio_id, monto, estado)
  values
    (v_cierre_id, 'reinversion', null, v_reinv, 'reservado'),
    (v_cierre_id, 'socio', v_socio1_id, v_socio1, 'pendiente'),
    (v_cierre_id, 'socio', v_socio2_id, v_socio2, 'pendiente');

  if v_reinv <> 0 then
    insert into public.movimientos_capital (
      tipo, monto, cierre_id, notas
    )
    values (
      'reinversion', v_reinv, v_cierre_id, 'Reinversión reservada por cierre semanal'
    );
  end if;

  return v_cierre_id;
end;
$$;

grant execute on function public.cerrar_semana(date, date, text) to authenticated;

-- ------------------------------------------------------------
-- 9. MARCAR PAGO DE SOCIO
-- ------------------------------------------------------------
create or replace function public.marcar_distribucion_pagada(
  p_distribucion_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_tipo text;
  v_estado text;
begin
  select id, tipo, estado
  into v_id, v_tipo, v_estado
  from public.distribuciones
  where id = p_distribucion_id
  for update;

  if not found then
    raise exception 'La distribución no existe.';
  end if;

  if v_tipo <> 'socio' then
    raise exception 'Solo las distribuciones de socios se pueden marcar como pagadas.';
  end if;

  if v_estado = 'pagado' then
    return v_id;
  end if;

  update public.distribuciones
  set estado = 'pagado', fecha_pago = now()
  where id = p_distribucion_id;

  return v_id;
end;
$$;

grant execute on function public.marcar_distribucion_pagada(bigint) to authenticated;

-- ------------------------------------------------------------
-- 10. PERMISOS DE FUNCIONES
-- ------------------------------------------------------------
revoke all on function public.registrar_compra(bigint, text, jsonb) from public;
revoke all on function public.registrar_venta(bigint, numeric, text, text) from public;
revoke all on function public.registrar_garantia(bigint, text, text, bigint, numeric, text) from public;
revoke all on function public.obtener_resumen_semana(date, date) from public;
revoke all on function public.cerrar_semana(date, date, text) from public;
revoke all on function public.marcar_distribucion_pagada(bigint) from public;

grant execute on function public.registrar_compra(bigint, text, jsonb) to authenticated;
grant execute on function public.registrar_venta(bigint, numeric, text, text) to authenticated;
grant execute on function public.registrar_garantia(bigint, text, text, bigint, numeric, text) to authenticated;
grant execute on function public.obtener_resumen_semana(date, date) to authenticated;
grant execute on function public.cerrar_semana(date, date, text) to authenticated;
grant execute on function public.marcar_distribucion_pagada(bigint) to authenticated;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
