-- ============================================================
-- VAPITOS 2.0 - MIGRACIÓN SOBRE LA BD EXISTENTE
-- NO ELIMINA DATOS.
-- Ejecutar DESPUÉS de final_migration.sql de Vapitos 1.0.
-- ============================================================

-- 0) UNA UNIDAD PUEDE TENER MÁS DE UNA VENTA EN SU HISTORIAL
-- Esto es necesario cuando una unidad vendida entra a garantía y luego se revende.
alter table public.ventas drop constraint if exists ventas_inventario_id_key;
create index if not exists idx_ventas_inventario_id on public.ventas(inventario_id);

-- 1) VENDEDORES EXTERNOS
create table if not exists public.vendedores_externos (
  id bigint generated always as identity primary key,
  nombre text not null,
  contacto text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.vendedores_externos enable row level security;
grant select, insert, update, delete on public.vendedores_externos to authenticated;
grant usage, select on sequence public.vendedores_externos_id_seq to authenticated;
drop policy if exists vendedores_externos_authenticated_all on public.vendedores_externos;
create policy vendedores_externos_authenticated_all on public.vendedores_externos
  for all to authenticated using (true) with check (true);

-- 2) ABONOS DE VENTAS
create table if not exists public.abonos_ventas (
  id bigint generated always as identity primary key,
  venta_id bigint not null references public.ventas(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  metodo_pago text not null check (metodo_pago in ('nequi','bancolombia','efectivo')),
  fecha_abono timestamptz not null default now(),
  notas text,
  created_at timestamptz not null default now()
);
create index if not exists idx_abonos_ventas_venta on public.abonos_ventas(venta_id);
create index if not exists idx_abonos_ventas_fecha on public.abonos_ventas(fecha_abono);
alter table public.abonos_ventas enable row level security;
grant select, insert, update, delete on public.abonos_ventas to authenticated;
grant usage, select on sequence public.abonos_ventas_id_seq to authenticated;
drop policy if exists abonos_ventas_authenticated_all on public.abonos_ventas;
create policy abonos_ventas_authenticated_all on public.abonos_ventas
  for all to authenticated using (true) with check (true);

-- 3) CAMPOS NUEVOS EN VENTAS
alter table public.ventas add column if not exists tipo_venta text not null default 'normal';
alter table public.ventas add column if not exists vendedor_externo_id bigint references public.vendedores_externos(id);
alter table public.ventas add column if not exists comision_tipo text;
alter table public.ventas add column if not exists comision_valor numeric(12,2) default 0;
alter table public.ventas add column if not exists comision_monto numeric(12,2) not null default 0;
alter table public.ventas add column if not exists destino_utilidad_externa text;
alter table public.ventas add column if not exists garantia_origen_id bigint;
alter table public.ventas add column if not exists estado_comision text;
alter table public.ventas add column if not exists fecha_pago_comision timestamptz;

alter table public.ventas drop constraint if exists ventas_tipo_venta_check;
alter table public.ventas add constraint ventas_tipo_venta_check
  check (tipo_venta in ('normal','externa','reventa_garantia'));
alter table public.ventas drop constraint if exists ventas_comision_tipo_check;
alter table public.ventas add constraint ventas_comision_tipo_check
  check (comision_tipo is null or comision_tipo in ('fijo','porcentaje'));
alter table public.ventas drop constraint if exists ventas_destino_utilidad_check;
alter table public.ventas add constraint ventas_destino_utilidad_check
  check (destino_utilidad_externa is null or destino_utilidad_externa in ('reinversion','utilidad'));
alter table public.ventas drop constraint if exists ventas_estado_comision_check;
alter table public.ventas add constraint ventas_estado_comision_check
  check (estado_comision is null or estado_comision in ('pendiente','pagada'));
update public.ventas set estado_comision='pendiente' where tipo_venta='externa' and estado_comision is null;

-- 4) DESTINO DEL VAPO DEFECTUOSO EN GARANTÍA
alter table public.garantias add column if not exists destino_defectuoso text;
alter table public.garantias add column if not exists precio_reventa numeric(12,2) not null default 0;
alter table public.garantias add column if not exists venta_reventa_id bigint;

alter table public.garantias drop constraint if exists garantias_destino_defectuoso_check;
alter table public.garantias add constraint garantias_destino_defectuoso_check
  check (destino_defectuoso is null or destino_defectuoso in ('desechado','conservado','revendido'));

-- Ahora sí podemos crear las FK circulares.
alter table public.ventas drop constraint if exists ventas_garantia_origen_fk;
alter table public.ventas add constraint ventas_garantia_origen_fk
  foreign key (garantia_origen_id) references public.garantias(id);
alter table public.garantias drop constraint if exists garantias_venta_reventa_fk;
alter table public.garantias add constraint garantias_venta_reventa_fk
  foreign key (venta_reventa_id) references public.ventas(id);

-- 5) ESTADOS NUEVOS DE INVENTARIO
alter table public.inventario drop constraint if exists inventario_estado_check;
alter table public.inventario add constraint inventario_estado_check
  check (estado in ('disponible','vendido','defectuoso','salida_garantia','conservado','desechado'));

-- 6) MIGRACIÓN DE VENTAS HISTÓRICAS CON DATOS CONFIRMADOS
--
-- Ventas confirmadas por el usuario antes de ejecutar V2:
-- * Lost Mary MO / Strawberry kiwi ice: $20.000, todavía NO pagada.
-- * Craftboh V-play / Wtf: precio real $32.000, comisión externa $8.000, destino reinversión.
-- * Ijoy Tropical Storm / Dragon Fruit Berry: precio real $20.000, comisión externa $6.000, destino reinversión.
-- Las demás ventas históricas se consideran cobradas completas.

do $$
declare
  v_lost_mary bigint;
  v_craftboh bigint;
  v_ijoy bigint;
  v_cantidad integer;
begin
  select count(*) into v_cantidad
  from public.ventas v
  join public.inventario i on i.id=v.inventario_id
  join public.productos p on p.id=i.producto_id
  where lower(trim(p.marca))='lost mary'
    and lower(trim(p.modelo))='mo'
    and lower(trim(i.sabor))='strawberry kiwi ice';
  if v_cantidad <> 1 then
    raise exception 'No se pudo identificar exactamente una venta Lost Mary MO / Strawberry kiwi ice.';
  end if;

  select v.id into v_lost_mary
  from public.ventas v
  join public.inventario i on i.id=v.inventario_id
  join public.productos p on p.id=i.producto_id
  where lower(trim(p.marca))='lost mary'
    and lower(trim(p.modelo))='mo'
    and lower(trim(i.sabor))='strawberry kiwi ice';

  select count(*) into v_cantidad
  from public.ventas v
  join public.inventario i on i.id=v.inventario_id
  join public.productos p on p.id=i.producto_id
  where lower(trim(p.marca))='craftboh'
    and lower(trim(p.modelo))='v-play'
    and lower(trim(i.sabor))='wtf';
  if v_cantidad <> 1 then
    raise exception 'No se pudo identificar exactamente una venta Craftboh V-play / Wtf.';
  end if;

  select v.id into v_craftboh
  from public.ventas v
  join public.inventario i on i.id=v.inventario_id
  join public.productos p on p.id=i.producto_id
  where lower(trim(p.marca))='craftboh'
    and lower(trim(p.modelo))='v-play'
    and lower(trim(i.sabor))='wtf';

  select count(*) into v_cantidad
  from public.ventas v
  join public.inventario i on i.id=v.inventario_id
  join public.productos p on p.id=i.producto_id
  where lower(trim(p.marca))='ijoy'
    and lower(trim(p.modelo))='tropical storm'
    and lower(trim(i.sabor))='dragon fruit berry';
  if v_cantidad <> 1 then
    raise exception 'No se pudo identificar exactamente una venta Ijoy Tropical Storm / Dragon Fruit Berry.';
  end if;

  select v.id into v_ijoy
  from public.ventas v
  join public.inventario i on i.id=v.inventario_id
  join public.productos p on p.id=i.producto_id
  where lower(trim(p.marca))='ijoy'
    and lower(trim(p.modelo))='tropical storm'
    and lower(trim(i.sabor))='dragon fruit berry';

  -- No continuamos si ya hay abonos manuales sobre estas ventas: evita sobrescribir
  -- información financiera si alguien vuelve a ejecutar la migración.
  if exists (select 1 from public.abonos_ventas where venta_id in (v_lost_mary,v_craftboh,v_ijoy)) then
    raise exception 'Ya existen abonos en una de las tres ventas históricas confirmadas; revisa antes de repetir la migración V2.';
  end if;

  -- Corrige las dos ventas externas históricas. El vendedor queda pendiente de asignar.
  update public.ventas
  set precio_final=32000,
      tipo_venta='externa',
      comision_tipo='fijo',
      comision_valor=8000,
      comision_monto=8000,
      destino_utilidad_externa='reinversion',
      estado_comision='pendiente'
  where id=v_craftboh;

  update public.ventas
  set precio_final=20000,
      tipo_venta='externa',
      comision_tipo='fijo',
      comision_valor=6000,
      comision_monto=6000,
      destino_utilidad_externa='reinversion',
      estado_comision='pendiente'
  where id=v_ijoy;

  -- Todas las ventas históricas excepto Lost Mary se consideran cobradas completas.
  insert into public.abonos_ventas (venta_id, monto, metodo_pago, fecha_abono, notas)
  select v.id, v.precio_final, v.metodo_pago, v.fecha_venta,
         'Abono histórico migrado desde Vapitos 1.0'
  from public.ventas v
  where v.id <> v_lost_mary
    and not exists (select 1 from public.abonos_ventas a where a.venta_id=v.id);

  -- Lost Mary queda con saldo completo pendiente: no se crea abono.
end $$;

-- 7) VENDEDORES DE EJEMPLO: no insertamos ninguno automáticamente.

-- 7b) CAMPOS FINANCIEROS DEL CIERRE
alter table public.cierres_semanales add column if not exists total_cobrado numeric(12,2) not null default 0;
alter table public.cierres_semanales add column if not exists por_cobrar numeric(12,2) not null default 0;
alter table public.cierres_semanales add column if not exists comisiones_externas numeric(12,2) not null default 0;
alter table public.cierres_semanales add column if not exists ingresos_reventa_garantia numeric(12,2) not null default 0;
alter table public.cierres_semanales add column if not exists reinversion_ventas_externas numeric(12,2) not null default 0;

-- 8) RESUMEN DE VENTA / PAGOS
create or replace function public.obtener_estado_pago_venta(p_venta_id bigint)
returns table(total numeric, pagado numeric, pendiente numeric)
language sql security definer set search_path = public as $$
  select
    v.precio_final,
    coalesce(sum(a.monto),0),
    greatest(v.precio_final - coalesce(sum(a.monto),0), 0)
  from public.ventas v
  left join public.abonos_ventas a on a.venta_id = v.id
  where v.id = p_venta_id
  group by v.id, v.precio_final;
$$;
grant execute on function public.obtener_estado_pago_venta(bigint) to authenticated;

-- 9) REGISTRAR VENTA 2.0
create or replace function public.registrar_venta_v2(
  p_inventario_id bigint,
  p_precio_final numeric(12,2),
  p_metodo_pago text,
  p_monto_inicial numeric(12,2) default 0,
  p_notas text default null,
  p_tipo_venta text default 'normal',
  p_vendedor_externo_id bigint default null,
  p_comision_tipo text default null,
  p_comision_valor numeric(12,2) default 0,
  p_destino_utilidad_externa text default null,
  p_garantia_origen_id bigint default null
)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_venta_id bigint;
  v_costo numeric(12,2);
  v_estado text;
  v_comision numeric(12,2) := 0;
  v_monto_inicial numeric(12,2) := coalesce(p_monto_inicial,0);
begin
  if p_precio_final is null or p_precio_final < 0 then raise exception 'El precio final no es válido.'; end if;
  if p_metodo_pago not in ('nequi','bancolombia','efectivo') then raise exception 'El método de pago no es válido.'; end if;
  if p_tipo_venta not in ('normal','externa','reventa_garantia') then raise exception 'El tipo de venta no es válido.'; end if;
  if v_monto_inicial < 0 or v_monto_inicial > p_precio_final then raise exception 'El pago inicial debe estar entre $0 y el precio total.'; end if;

  select i.estado, p.costo_mayorista into v_estado, v_costo
  from public.inventario i join public.productos p on p.id=i.producto_id
  where i.id=p_inventario_id for update;
  if not found then raise exception 'La unidad seleccionada no existe.'; end if;

  if p_tipo_venta='reventa_garantia' then
    if v_estado <> 'defectuoso' then raise exception 'La unidad no está disponible para reventa de garantía.'; end if;
    if p_garantia_origen_id is null then raise exception 'La reventa debe estar vinculada a una garantía.'; end if;
    if not exists (
      select 1
      from public.garantias g
      join public.ventas vo on vo.id = g.venta_id
      where g.id = p_garantia_origen_id
        and vo.inventario_id = p_inventario_id
        and g.destino_defectuoso = 'revendido'
        and g.venta_reventa_id is null
    ) then
      raise exception 'La unidad no corresponde al Vapo defectuoso de esa garantía o ya fue revendida.';
    end if;
    -- El costo de esta reventa es 0 para evitar contabilizar dos veces
    -- el costo original: ya fue reconocido en la venta original y la garantía.
    v_costo := 0;
  else
    if v_estado <> 'disponible' then raise exception 'La unidad seleccionada no está disponible.'; end if;
  end if;

  if p_tipo_venta='externa' then
    if p_vendedor_externo_id is null then raise exception 'Selecciona el vendedor externo.'; end if;
    if p_comision_tipo not in ('fijo','porcentaje') then raise exception 'Selecciona el tipo de comisión.'; end if;
    if coalesce(p_comision_valor,0) < 0 then raise exception 'La comisión no es válida.'; end if;
    if p_destino_utilidad_externa not in ('reinversion','utilidad') then raise exception 'Selecciona el destino de la utilidad.'; end if;
    if p_comision_tipo='fijo' then v_comision := p_comision_valor;
    else v_comision := round(p_precio_final * p_comision_valor / 100,2);
    end if;
    if v_comision > p_precio_final then raise exception 'La comisión no puede superar el precio de venta.'; end if;
  end if;

  insert into public.ventas(
    inventario_id, precio_final, costo_unitario, metodo_pago, resultado, notas,
    tipo_venta, vendedor_externo_id, comision_tipo, comision_valor, comision_monto,
    destino_utilidad_externa, garantia_origen_id, estado_comision
  ) values (
    p_inventario_id, p_precio_final, v_costo, p_metodo_pago, 'exitosa', nullif(trim(p_notas),''),
    p_tipo_venta, p_vendedor_externo_id, p_comision_tipo, coalesce(p_comision_valor,0), v_comision,
    p_destino_utilidad_externa, p_garantia_origen_id, case when p_tipo_venta='externa' then 'pendiente' else null end
  ) returning id into v_venta_id;

  update public.inventario set estado='vendido', fecha_salida=now() where id=p_inventario_id;

  if v_monto_inicial > 0 then
    insert into public.abonos_ventas(venta_id,monto,metodo_pago,notas)
    values(v_venta_id,v_monto_inicial,p_metodo_pago,'Pago inicial de la venta');
  end if;

  return v_venta_id;
end;
$$;
grant execute on function public.registrar_venta_v2(bigint,numeric,text,numeric,text,text,bigint,text,numeric,text,bigint) to authenticated;

-- 10) EDITAR VENTA
create or replace function public.editar_venta_v2(
  p_venta_id bigint,
  p_inventario_nuevo_id bigint,
  p_precio_final numeric(12,2),
  p_metodo_pago text,
  p_notas text default null
)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_venta record;
  v_pagado numeric(12,2);
  v_estado_nuevo text;
  v_costo_nuevo numeric(12,2);
  v_comision_nueva numeric(12,2) := 0;
begin
  if p_precio_final is null or p_precio_final < 0 then raise exception 'El precio final no es válido.'; end if;
  if p_metodo_pago not in ('nequi','bancolombia','efectivo') then raise exception 'El método de pago no es válido.'; end if;

  select * into v_venta from public.ventas where id=p_venta_id for update;
  if not found then raise exception 'La venta no existe.'; end if;
  if exists(select 1 from public.garantias where venta_id=p_venta_id) then raise exception 'No puedes editar una venta que ya tiene garantía.'; end if;
  select coalesce(sum(monto),0) into v_pagado from public.abonos_ventas where venta_id=p_venta_id;
  if p_precio_final < v_pagado then raise exception 'El nuevo precio no puede ser menor a lo ya abonado.'; end if;

  if v_venta.tipo_venta='reventa_garantia' and p_inventario_nuevo_id <> v_venta.inventario_id then
    raise exception 'La unidad de una reventa de garantía no se puede cambiar.';
  end if;

  if p_inventario_nuevo_id <> v_venta.inventario_id then
    select i.estado,p.costo_mayorista into v_estado_nuevo,v_costo_nuevo
    from public.inventario i join public.productos p on p.id=i.producto_id
    where i.id=p_inventario_nuevo_id for update;
    if not found or v_estado_nuevo <> 'disponible' then raise exception 'La nueva unidad no está disponible.'; end if;
    update public.inventario set estado='disponible', fecha_salida=null where id=v_venta.inventario_id;
    update public.inventario set estado='vendido', fecha_salida=now() where id=p_inventario_nuevo_id;
  elsif v_venta.tipo_venta='reventa_garantia' then
    v_costo_nuevo := 0;
  else
    v_costo_nuevo := v_venta.costo_unitario;
  end if;

  if v_venta.tipo_venta='externa' then
    if v_venta.comision_tipo='fijo' then
      v_comision_nueva := coalesce(v_venta.comision_valor,0);
    elsif v_venta.comision_tipo='porcentaje' then
      v_comision_nueva := round(p_precio_final * coalesce(v_venta.comision_valor,0) / 100,2);
    end if;
    if v_comision_nueva > p_precio_final then raise exception 'La comisión no puede superar el precio de venta.'; end if;
  end if;

  update public.ventas set
    inventario_id=p_inventario_nuevo_id,
    precio_final=p_precio_final,
    costo_unitario=v_costo_nuevo,
    metodo_pago=p_metodo_pago,
    notas=nullif(trim(p_notas),''),
    comision_monto=case when v_venta.tipo_venta='externa' then v_comision_nueva else comision_monto end
  where id=p_venta_id;
  return p_venta_id;
end;
$$;

-- 11) ABONAR UNA VENTA
create or replace function public.registrar_abono_venta(
  p_venta_id bigint, p_monto numeric(12,2), p_metodo_pago text, p_notas text default null
)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint; v_total numeric; v_pagado numeric;
begin
  if p_monto <= 0 then raise exception 'El abono debe ser mayor que cero.'; end if;
  if p_metodo_pago not in ('nequi','bancolombia','efectivo') then raise exception 'Método de pago no válido.'; end if;
  select precio_final into v_total from public.ventas where id=p_venta_id for update;
  if not found then raise exception 'La venta no existe.'; end if;
  select coalesce(sum(monto),0) into v_pagado from public.abonos_ventas where venta_id=p_venta_id;
  if v_pagado + p_monto > v_total then raise exception 'El abono supera el saldo pendiente.'; end if;
  insert into public.abonos_ventas(venta_id,monto,metodo_pago,notas) values(p_venta_id,p_monto,p_metodo_pago,nullif(trim(p_notas),'')) returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.registrar_abono_venta(bigint,numeric,text,text) to authenticated;

-- 11b) PAGAR COMISIÓN
create or replace function public.marcar_comision_pagada(p_venta_id bigint)
returns bigint language plpgsql security definer set search_path=public as $$
begin
  update public.ventas set estado_comision='pagada', fecha_pago_comision=now()
  where id=p_venta_id and tipo_venta='externa';
  if not found then raise exception 'La venta externa no existe.'; end if;
  return p_venta_id;
end;
$$;
grant execute on function public.marcar_comision_pagada(bigint) to authenticated;

-- 12) GARANTÍA 2.0
create or replace function public.registrar_garantia_v2(
  p_venta_id bigint,p_tipo text,p_motivo text,p_inventario_reemplazo_id bigint default null,
  p_monto_reembolso numeric(12,2) default 0,p_notas text default null,p_destino_defectuoso text default null
)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint; v_inv bigint; v_producto bigint; v_estado text; v_prod_rep bigint; v_garantia_existente bigint;
begin
  if p_tipo not in ('reemplazo','devolucion') then raise exception 'Tipo de garantía inválido.'; end if;
  if p_destino_defectuoso is null or p_destino_defectuoso not in ('desechado','conservado','revendido') then raise exception 'Selecciona qué ocurrió con el Vapo defectuoso.'; end if;
  select inventario_id into v_inv from public.ventas where id=p_venta_id for update;
  if not found then raise exception 'La venta no existe.'; end if;
  if exists(select 1 from public.garantias where venta_id=p_venta_id) then raise exception 'Esta venta ya tiene una garantía.'; end if;
  select producto_id,estado into v_producto,v_estado from public.inventario where id=v_inv for update;
  if v_estado <> 'vendido' then raise exception 'La unidad original no está en estado vendido.'; end if;

  if p_tipo='reemplazo' then
    if p_inventario_reemplazo_id is null then raise exception 'Selecciona una unidad de reemplazo.'; end if;
    select producto_id,estado into v_prod_rep,v_estado from public.inventario where id=p_inventario_reemplazo_id for update;
    if v_estado <> 'disponible' or v_prod_rep <> v_producto then raise exception 'La unidad de reemplazo no es válida.'; end if;
    if p_monto_reembolso <> 0 then raise exception 'Un reemplazo no puede tener reembolso.'; end if;
    update public.inventario set estado='defectuoso',fecha_salida=now() where id=v_inv;
    update public.inventario set estado='salida_garantia',fecha_salida=now() where id=p_inventario_reemplazo_id;
    update public.ventas set resultado='garantia_reemplazo' where id=p_venta_id;
  else
    if p_inventario_reemplazo_id is not null then raise exception 'Una devolución no lleva reemplazo.'; end if;
    update public.inventario set estado='defectuoso',fecha_salida=now() where id=v_inv;
    update public.ventas set resultado='garantia_devolucion' where id=p_venta_id;
  end if;

  insert into public.garantias(venta_id,tipo,motivo,inventario_reemplazo_id,monto_reembolso,notas,destino_defectuoso)
  values(p_venta_id,p_tipo,p_motivo,case when p_tipo='reemplazo' then p_inventario_reemplazo_id else null end,
    case when p_tipo='reemplazo' then 0 else p_monto_reembolso end,nullif(trim(p_notas),''),p_destino_defectuoso)
  returning id into v_id;

  if p_destino_defectuoso='desechado' then
    update public.inventario set estado='desechado' where id=v_inv;
  elsif p_destino_defectuoso='conservado' then
    update public.inventario set estado='conservado' where id=v_inv;
  end if;
  return v_id;
end;
$$;
grant execute on function public.registrar_garantia_v2(bigint,text,text,bigint,numeric,text,text) to authenticated;

-- 12b) COMPLETAR / CORREGIR EL DESTINO DE UNA GARANTÍA
create or replace function public.actualizar_destino_garantia(
  p_garantia_id bigint, p_destino_defectuoso text, p_precio_reventa numeric(12,2) default 0
)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint; v_inv bigint; v_reventa bigint;
begin
  if p_destino_defectuoso not in ('desechado','conservado','revendido') then raise exception 'Destino inválido.'; end if;
  if p_precio_reventa is null or p_precio_reventa < 0 then raise exception 'El precio de reventa no es válido.'; end if;
  select g.id,v.inventario_id,g.venta_reventa_id into v_id,v_inv,v_reventa
  from public.garantias g join public.ventas v on v.id=g.venta_id
  where g.id=p_garantia_id for update;
  if not found then raise exception 'La garantía no existe.'; end if;
  if v_reventa is not null then raise exception 'La garantía ya tiene una reventa registrada.'; end if;
  update public.garantias
  set destino_defectuoso=p_destino_defectuoso,
      precio_reventa=case when p_destino_defectuoso='revendido' then p_precio_reventa else 0 end
  where id=p_garantia_id;
  update public.inventario
  set estado=case p_destino_defectuoso when 'desechado' then 'desechado' when 'conservado' then 'conservado' else 'defectuoso' end
  where id=v_inv;
  return v_id;
end;
$$;
grant execute on function public.actualizar_destino_garantia(bigint,text,numeric) to authenticated;

-- 13) REVENTA DE UN VAPO DEFECTUOSO
create or replace function public.registrar_reventa_garantia(
  p_garantia_id bigint,p_inventario_id bigint,p_precio numeric(12,2),p_metodo_pago text,p_monto_inicial numeric(12,2) default 0,p_notas text default null
)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint; v_destino text; v_inventario_original bigint; v_venta_reventa bigint;
begin
  select g.destino_defectuoso,g.venta_reventa_id,v.inventario_id
  into v_destino,v_venta_reventa,v_inventario_original
  from public.garantias g
  join public.ventas v on v.id=g.venta_id
  where g.id=p_garantia_id for update;
  if not found then raise exception 'La garantía no existe.'; end if;
  if v_destino <> 'revendido' then raise exception 'La garantía no está marcada para reventa.'; end if;
  if v_venta_reventa is not null then raise exception 'Esta garantía ya tiene una reventa registrada.'; end if;
  if p_inventario_id <> v_inventario_original then raise exception 'La unidad seleccionada no es el Vapo defectuoso de esta garantía.'; end if;
  v_id := public.registrar_venta_v2(p_inventario_id,p_precio,p_metodo_pago,p_monto_inicial,p_notas,'reventa_garantia',null,null,0,'reinversion',p_garantia_id);
  update public.garantias set venta_reventa_id=v_id, precio_reventa=p_precio where id=p_garantia_id;
  return v_id;
end;
$$;

-- 14) VENDEDORES: RPC sencilla para borrado lógico
create or replace function public.desactivar_vendedor(p_id bigint)
returns bigint language sql security definer set search_path=public as $$
  update public.vendedores_externos set activo=false where id=p_id returning id;
$$;
grant execute on function public.desactivar_vendedor(bigint) to authenticated;

-- 15) RESUMEN FINANCIERO V2
create or replace function public.obtener_resumen_semana_v2(p_fecha_inicio date,p_fecha_fin date)
returns table(
 fecha_inicio date,fecha_fin date,total_ventas numeric,total_cobrado numeric,por_cobrar numeric,
 costo_mercancia_vendida numeric,comisiones_externas numeric,perdidas_garantias numeric,ingresos_reventa_garantia numeric,
 reinversion_ventas_externas numeric,utilidad_real numeric
)
language sql security definer set search_path=public as $$
with ventas_periodo as (
 select v.*
 from public.ventas v
 where v.fecha_venta >= (p_fecha_inicio::timestamp at time zone 'America/Bogota')
   and v.fecha_venta < ((p_fecha_fin+1)::timestamp at time zone 'America/Bogota')
),
pagos_hasta_fin as (
 select a.venta_id,coalesce(sum(a.monto),0) pagado
 from public.abonos_ventas a
 where a.fecha_abono < ((p_fecha_fin+1)::timestamp at time zone 'America/Bogota')
 group by a.venta_id
),
ventas_calc as (
 select v.*,coalesce(ph.pagado,0) pagado_hasta_fin,
   case
     when v.tipo_venta='externa' and v.destino_utilidad_externa='reinversion' then 0
     when v.tipo_venta='reventa_garantia' then v.precio_final - v.costo_unitario
     else v.precio_final - v.costo_unitario - coalesce(v.comision_monto,0)
   end utilidad_para_reparto,
   case
     when v.tipo_venta='externa' and v.destino_utilidad_externa='reinversion' then
       greatest(v.pagado_hasta_fin - case when v.precio_final > 0 then v.comision_monto * v.pagado_hasta_fin / v.precio_final else 0 end, 0)
     else 0
   end reinversion_externa_total
 from ventas_periodo v
 left join pagos_hasta_fin ph on ph.venta_id=v.id
),
pagos_periodo as (
 select coalesce(sum(a.monto),0) total_cobrado
 from public.abonos_ventas a
 where a.fecha_abono >= (p_fecha_inicio::timestamp at time zone 'America/Bogota')
   and a.fecha_abono < ((p_fecha_fin+1)::timestamp at time zone 'America/Bogota')
),
por_cobrar_calc as (
 select coalesce(sum(greatest(v.precio_final-v.pagado_hasta_fin,0)),0) por_cobrar
 from ventas_calc v
),
reventas as (
 select coalesce(sum(v.precio_final),0) ingreso
 from ventas_periodo v where v.tipo_venta='reventa_garantia'
),
garantias_calc as (
 select coalesce(sum(case when g.tipo='devolucion' then g.monto_reembolso when g.tipo='reemplazo' then coalesce(pr.costo_mayorista,0) else 0 end),0) perdida
 from public.garantias g
 left join public.inventario ir on ir.id=g.inventario_reemplazo_id
 left join public.productos pr on pr.id=ir.producto_id
 where g.fecha_garantia >= (p_fecha_inicio::timestamp at time zone 'America/Bogota')
   and g.fecha_garantia < ((p_fecha_fin+1)::timestamp at time zone 'America/Bogota')
)
select
 p_fecha_inicio,p_fecha_fin,
 coalesce(sum(v.precio_final),0),
 pp.total_cobrado,
 pc.por_cobrar,
 coalesce(sum(v.costo_unitario),0),
 coalesce(sum(v.comision_monto),0),
 gc.perdida,
 rv.ingreso,
 coalesce(sum(v.reinversion_externa_total),0),
 coalesce(sum(v.utilidad_para_reparto),0)-gc.perdida
from ventas_calc v, pagos_periodo pp, por_cobrar_calc pc, garantias_calc gc, reventas rv
group by pp.total_cobrado,pc.por_cobrar,gc.perdida,rv.ingreso;
$$;

-- 15b) CIERRE SEMANAL V2
create or replace function public.cerrar_semana(
  p_fecha_inicio date,p_fecha_fin date,p_notas text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare
  v_cierre_id bigint; v_total numeric(12,2); v_cobrado numeric(12,2); v_pendiente numeric(12,2); v_costo numeric(12,2); v_comisiones numeric(12,2); v_perdidas numeric(12,2); v_reventa numeric(12,2); v_reinv_ext numeric(12,2); v_utilidad numeric(12,2);
  v_reinv_pct numeric(5,2); v_socio1_pct numeric(5,2); v_socio2_pct numeric(5,2); v_reinv numeric(12,2); v_socio1 numeric(12,2); v_socio2 numeric(12,2); v_socio1_id bigint; v_socio2_id bigint;
begin
  if p_fecha_fin < p_fecha_inicio then raise exception 'El rango de fechas no es válido.'; end if;
  if extract(isodow from p_fecha_inicio) <> 1 or extract(isodow from p_fecha_fin) <> 7 then raise exception 'El cierre debe cubrir una semana completa de lunes a domingo.'; end if;
  if p_fecha_fin > (now() at time zone 'America/Bogota')::date then raise exception 'No puedes cerrar una semana que todavía no ha terminado.'; end if;
  if exists(select 1 from public.cierres_semanales where fecha_inicio=p_fecha_inicio and fecha_fin=p_fecha_fin) then raise exception 'Esta semana ya está cerrada.'; end if;
  select total_ventas,total_cobrado,por_cobrar,costo_mercancia_vendida,comisiones_externas,perdidas_garantias,ingresos_reventa_garantia,reinversion_ventas_externas,utilidad_real into v_total,v_cobrado,v_pendiente,v_costo,v_comisiones,v_perdidas,v_reventa,v_reinv_ext,v_utilidad from public.obtener_resumen_semana_v2(p_fecha_inicio,p_fecha_fin);
  select porcentaje_reinversion,porcentaje_socio_1,porcentaje_socio_2 into v_reinv_pct,v_socio1_pct,v_socio2_pct from public.configuracion_negocio where id=true;
  if not found then raise exception 'No existe la configuración del negocio.'; end if;
  if v_reinv_pct+v_socio1_pct+v_socio2_pct<>100 then raise exception 'Los porcentajes deben sumar 100%%.'; end if;
  select id into v_socio1_id from public.socios where activo=true order by id limit 1;
  select id into v_socio2_id from public.socios where activo=true order by id offset 1 limit 1;
  if v_socio1_id is null or v_socio2_id is null then raise exception 'Se necesitan dos socios activos.'; end if;
  v_reinv:=round(greatest(v_utilidad,0)*v_reinv_pct/100,2) + v_reinv_ext; v_socio1:=round(greatest(v_utilidad,0)*v_socio1_pct/100,2); v_socio2:=round(greatest(v_utilidad,0)*v_socio2_pct/100,2);
  insert into public.cierres_semanales(fecha_inicio,fecha_fin,total_ventas,total_cobrado,por_cobrar,costo_mercancia_vendida,comisiones_externas,perdidas_garantias,ingresos_reventa_garantia,reinversion_ventas_externas,utilidad_real,porcentaje_reinversion,porcentaje_socio_1,porcentaje_socio_2,monto_reinversion,monto_socio_1,monto_socio_2,notas) values(p_fecha_inicio,p_fecha_fin,v_total,v_cobrado,v_pendiente,v_costo,v_comisiones,v_perdidas,v_reventa,v_reinv_ext,v_utilidad,v_reinv_pct,v_socio1_pct,v_socio2_pct,v_reinv,v_socio1,v_socio2,nullif(trim(p_notas),'')) returning id into v_cierre_id;
  insert into public.distribuciones(cierre_id,tipo,socio_id,monto,estado) values(v_cierre_id,'reinversion',null,v_reinv,'reservado'),(v_cierre_id,'socio',v_socio1_id,v_socio1,'pendiente'),(v_cierre_id,'socio',v_socio2_id,v_socio2,'pendiente');
  if v_reinv<>0 then insert into public.movimientos_capital(tipo,monto,cierre_id,notas) values('reinversion',v_reinv,v_cierre_id,'Reinversión reservada por cierre semanal'); end if;
  return v_cierre_id;
end;
$$;
grant execute on function public.cerrar_semana(date,date,text) to authenticated;

-- 16) ÍNDICES / PERMISOS
create index if not exists idx_ventas_tipo_venta on public.ventas(tipo_venta);
create index if not exists idx_ventas_vendedor on public.ventas(vendedor_externo_id);
create index if not exists idx_garantias_destino on public.garantias(destino_defectuoso);
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.ventas,public.garantias,public.inventario,public.abonos_ventas,public.vendedores_externos to authenticated;
grant usage,select on all sequences in schema public to authenticated;

-- FIN VAPITOS 2.0
