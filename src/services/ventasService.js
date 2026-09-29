import { supabase } from '../lib/supabaseClient'

const ventaSelect = `
  id,
  inventario_id,
  precio_final,
  costo_unitario,
  metodo_pago,
  resultado,
  fecha_venta,
  notas,
  tipo_venta,
  vendedor_externo_id,
  comision_tipo,
  comision_valor,
  comision_monto,
  destino_utilidad_externa,
  inventario (
    id,
    sabor,
    estado,
    producto_id,
    productos (id, marca, modelo, puffs)
  ),
  vendedores_externos (id, nombre),
  abonos_ventas (id, monto, metodo_pago, fecha_abono, notas)
`

export async function obtenerVentas() {
  const { data, error } = await supabase
    .from('ventas')
    .select(ventaSelect)
    .order('fecha_venta', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function obtenerInventarioDisponible() {
  const { data, error } = await supabase
    .from('inventario')
    .select(`
      id, producto_id, sabor, estado, fecha_ingreso,
      productos (id, marca, modelo, puffs, costo_mayorista, proveedores (id, nombre))
    `)
    .eq('estado', 'disponible')
    .order('fecha_ingreso', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function obtenerInventarioDefectuoso() {
  const { data, error } = await supabase
    .from('inventario')
    .select(`id, producto_id, sabor, estado, fecha_ingreso, productos (id, marca, modelo, puffs, costo_mayorista)`)
    .eq('estado', 'defectuoso')
    .order('fecha_ingreso', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function obtenerVendedoresExternos() {
  const { data, error } = await supabase
    .from('vendedores_externos')
    .select('id, nombre, contacto, activo')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data ?? []
}

export async function crearVendedorExterno(datos) {
  const { data, error } = await supabase
    .from('vendedores_externos')
    .insert({ nombre: datos.nombre.trim(), contacto: datos.contacto?.trim() || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function registrarVenta(venta) {
  const { data, error } = await supabase.rpc('registrar_venta_v2', {
    p_inventario_id: Number(venta.inventario_id),
    p_precio_final: Number(venta.precio_final),
    p_metodo_pago: venta.metodo_pago,
    p_monto_inicial: Number(venta.monto_inicial) || 0,
    p_notas: venta.notas?.trim() || null,
    p_tipo_venta: venta.tipo_venta || 'normal',
    p_vendedor_externo_id: venta.vendedor_externo_id ? Number(venta.vendedor_externo_id) : null,
    p_comision_tipo: venta.comision_tipo || null,
    p_comision_valor: Number(venta.comision_valor) || 0,
    p_destino_utilidad_externa: venta.destino_utilidad_externa || null,
    p_garantia_origen_id: venta.garantia_origen_id ? Number(venta.garantia_origen_id) : null,
  })
  if (error) throw error
  return data
}

export async function editarVenta(venta) {
  const { data, error } = await supabase.rpc('editar_venta_v2', {
    p_venta_id: Number(venta.id),
    p_inventario_nuevo_id: Number(venta.inventario_id),
    p_precio_final: Number(venta.precio_final),
    p_metodo_pago: venta.metodo_pago,
    p_notas: venta.notas?.trim() || null,
  })
  if (error) throw error
  return data
}

export async function registrarAbono(abono) {
  const { data, error } = await supabase.rpc('registrar_abono_venta', {
    p_venta_id: Number(abono.venta_id),
    p_monto: Number(abono.monto),
    p_metodo_pago: abono.metodo_pago,
    p_notas: abono.notas?.trim() || null,
  })
  if (error) throw error
  return data
}

export async function marcarComisionPagada(ventaId) {
  const { data, error } = await supabase.rpc('marcar_comision_pagada', { p_venta_id: Number(ventaId) })
  if (error) throw error
  return data
}
