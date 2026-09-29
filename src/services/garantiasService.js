import { supabase } from '../lib/supabaseClient'

export async function obtenerVentasParaGarantia() {
  const { data, error } = await supabase.from('ventas').select(`
    id, inventario_id, precio_final, costo_unitario, resultado, fecha_venta,
    inventario (id, producto_id, sabor, estado, productos (id, marca, modelo, puffs))
  `).eq('resultado','exitosa').order('fecha_venta',{ascending:false})
  if (error) throw error
  return data ?? []
}

export async function obtenerInventarioDisponible() {
  const { data, error } = await supabase.from('inventario').select(`
    id, producto_id, sabor, estado, fecha_ingreso,
    productos (id, marca, modelo, puffs)
  `).eq('estado','disponible').order('fecha_ingreso',{ascending:true})
  if (error) throw error
  return data ?? []
}

export async function obtenerInventarioDefectuoso() {
  const { data, error } = await supabase.from('inventario').select(`
    id, producto_id, sabor, estado, fecha_ingreso,
    productos (id, marca, modelo, puffs)
  `).eq('estado','defectuoso').order('fecha_ingreso',{ascending:true})
  if (error) throw error
  return data ?? []
}

export async function obtenerGarantias() {
  // IMPORTANTE:
  // garantias tiene dos FK hacia ventas (venta_id y venta_reventa_id),
  // por lo que PostgREST no puede inferir automáticamente la relación.
  // Hacemos dos consultas explícitas para evitar la relación ambigua.
  const { data: garantias, error } = await supabase
    .from('garantias')
    .select(`
      id, venta_id, tipo, motivo, fecha_garantia, inventario_reemplazo_id,
      monto_reembolso, notas, destino_defectuoso, precio_reventa, venta_reventa_id
    `)
    .order('fecha_garantia',{ascending:false})

  if (error) throw error
  if (!garantias?.length) return []

  const ventaIds = [...new Set(garantias.map(g => g.venta_id).filter(Boolean))]

  const { data: ventas, error: errorVentas } = await supabase
    .from('ventas')
    .select(`
      id, precio_final,
      inventario (id, sabor, productos (marca, modelo))
    `)
    .in('id', ventaIds)

  if (errorVentas) throw errorVentas

  const ventasMap = new Map((ventas ?? []).map(v => [v.id, v]))

  return garantias.map(g => ({
    ...g,
    ventas: ventasMap.get(g.venta_id) ?? null,
  }))
}

export async function registrarGarantia(garantia) {
  const { data, error } = await supabase.rpc('registrar_garantia_v2', {
    p_venta_id:Number(garantia.venta_id), p_tipo:garantia.tipo, p_motivo:garantia.motivo,
    p_inventario_reemplazo_id:garantia.inventario_reemplazo_id ? Number(garantia.inventario_reemplazo_id) : null,
    p_monto_reembolso:Number(garantia.monto_reembolso)||0, p_notas:garantia.notas?.trim()||null,
    p_destino_defectuoso:garantia.destino_defectuoso,
  })
  if (error) throw error
  return data
}

export async function actualizarDestinoGarantia(datos) {
  const { data, error } = await supabase.rpc('actualizar_destino_garantia', {
    p_garantia_id: Number(datos.garantia_id),
    p_destino_defectuoso: datos.destino_defectuoso,
    p_precio_reventa: Number(datos.precio_reventa) || 0,
  })
  if (error) throw error
  return data
}

export async function registrarReventaGarantia(datos) {
  const { data, error } = await supabase.rpc('registrar_reventa_garantia', {
    p_garantia_id:Number(datos.garantia_id), p_inventario_id:Number(datos.inventario_id),
    p_precio:Number(datos.precio), p_metodo_pago:datos.metodo_pago,
    p_monto_inicial:Number(datos.monto_inicial)||0, p_notas:datos.notas?.trim()||null,
  })
  if (error) throw error
  return data
}
