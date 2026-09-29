-- ============================================================
-- VAPITOS 2.0 - PATCH 02
-- Corrige relación PostgREST de garantías y permite editar
-- completamente las ventas externas.
-- NO elimina datos.
-- ============================================================

-- 1) Edición completa de venta.
-- Se crea una función nueva para no depender de la firma anterior.
create or replace function public.editar_venta_v3(
  p_venta_id bigint,
  p_inventario_nuevo_id bigint,
  p_precio_final numeric(12,2),
  p_metodo_pago text,
  p_notas text default null,
  p_tipo_venta text default 'normal',
  p_vendedor_externo_id bigint default null,
  p_comision_tipo text default null,
  p_comision_valor numeric(12,2) default 0,
  p_destino_utilidad_externa text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta record;
  v_pagado numeric(12,2);
  v_estado_nuevo text;
  v_costo_nuevo numeric(12,2);
  v_comision numeric(12,2) := 0;
begin
  if p_precio_final is null or p_precio_final < 0 then
    raise exception 'El precio final no es válido.';
  end if;

  if p_metodo_pago not in ('nequi','bancolombia','efectivo') then
    raise exception 'El método de pago no es válido.';
  end if;

  if p_tipo_venta not in ('normal','externa','reventa_garantia') then
    raise exception 'El tipo de venta no es válido.';
  end if;

  select *
  into v_venta
  from public.ventas
  where id = p_venta_id
  for update;

  if not found then
    raise exception 'La venta no existe.';
  end if;

  if exists (
    select 1 from public.garantias
    where venta_id = p_venta_id
  ) then
    raise exception 'No puedes editar una venta que ya tiene garantía.';
  end if;

  select coalesce(sum(monto), 0)
  into v_pagado
  from public.abonos_ventas
  where venta_id = p_venta_id;

  if p_precio_final < v_pagado then
    raise exception 'El nuevo precio no puede ser menor a lo ya abonado.';
  end if;

  -- Una reventa de garantía no puede cambiar de unidad ni convertirse
  -- en una venta normal/external.
  if v_venta.tipo_venta = 'reventa_garantia' then
    if p_tipo_venta <> 'reventa_garantia' then
      raise exception 'Una reventa de garantía no puede cambiar de tipo.';
    end if;
    if p_inventario_nuevo_id <> v_venta.inventario_id then
      raise exception 'La unidad de una reventa de garantía no se puede cambiar.';
    end if;
    v_costo_nuevo := 0;
  end if;

  if p_tipo_venta <> 'reventa_garantia' and p_inventario_nuevo_id <> v_venta.inventario_id then
    select i.estado, p.costo_mayorista
    into v_estado_nuevo, v_costo_nuevo
    from public.inventario i
    join public.productos p on p.id = i.producto_id
    where i.id = p_inventario_nuevo_id
    for update;

    if not found or v_estado_nuevo <> 'disponible' then
      raise exception 'La nueva unidad no está disponible.';
    end if;

    update public.inventario
    set estado = 'disponible', fecha_salida = null
    where id = v_venta.inventario_id;

    update public.inventario
    set estado = 'vendido', fecha_salida = now()
    where id = p_inventario_nuevo_id;
  elsif p_tipo_venta <> 'reventa_garantia' then
    v_costo_nuevo := v_venta.costo_unitario;
  end if;

  if p_tipo_venta = 'externa' then
    if p_vendedor_externo_id is null then
      raise exception 'Selecciona el vendedor externo.';
    end if;

    if p_comision_tipo not in ('fijo','porcentaje') then
      raise exception 'Selecciona el tipo de comisión.';
    end if;

    if coalesce(p_comision_valor, 0) < 0 then
      raise exception 'La comisión no es válida.';
    end if;

    if p_destino_utilidad_externa not in ('reinversion','utilidad') then
      raise exception 'Selecciona el destino de la utilidad.';
    end if;

    if p_comision_tipo = 'fijo' then
      v_comision := coalesce(p_comision_valor, 0);
    else
      v_comision := round(
        p_precio_final * coalesce(p_comision_valor, 0) / 100,
        2
      );
    end if;

    if v_comision > p_precio_final then
      raise exception 'La comisión no puede superar el precio de venta.';
    end if;
  end if;

  update public.ventas
  set
    inventario_id = p_inventario_nuevo_id,
    precio_final = p_precio_final,
    costo_unitario = v_costo_nuevo,
    metodo_pago = p_metodo_pago,
    notas = nullif(trim(p_notas), ''),
    tipo_venta = p_tipo_venta,
    vendedor_externo_id = case
      when p_tipo_venta = 'externa' then p_vendedor_externo_id
      else null
    end,
    comision_tipo = case
      when p_tipo_venta = 'externa' then p_comision_tipo
      else null
    end,
    comision_valor = case
      when p_tipo_venta = 'externa' then coalesce(p_comision_valor, 0)
      else 0
    end,
    comision_monto = case
      when p_tipo_venta = 'externa' then v_comision
      else 0
    end,
    destino_utilidad_externa = case
      when p_tipo_venta = 'externa' then p_destino_utilidad_externa
      else null
    end,
    estado_comision = case
      when p_tipo_venta = 'externa' then coalesce(v_venta.estado_comision, 'pendiente')
      else null
    end
  where id = p_venta_id;

  return p_venta_id;
end;
$$;

grant execute on function public.editar_venta_v3(
  bigint,numeric,text,numeric,text,text,bigint,text,numeric,text
) to authenticated;

-- 2) No hace falta cambiar la estructura de garantías.
-- El frontend evita la relación ambigua entre garantias -> ventas.

-- 3) Verificación rápida opcional:
-- select proname, oid::regprocedure
-- from pg_proc
-- where proname = 'editar_venta_v3';
