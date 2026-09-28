import { supabase } from '../lib/supabaseClient'

export async function obtenerResumenSemana(fechaInicio, fechaFin) {
  const { data, error } = await supabase.rpc('obtener_resumen_semana', {
    p_fecha_inicio: fechaInicio,
    p_fecha_fin: fechaFin,
  })

  if (error) throw error
  return data?.[0] ?? data ?? null
}

export async function obtenerConfiguracion() {
  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('*')
    .eq('id', true)
    .single()

  if (error) throw error
  return data
}

export async function actualizarConfiguracion(configuracion) {
  const { data, error } = await supabase
    .from('configuracion_negocio')
    .update({
      porcentaje_reinversion: Number(configuracion.porcentaje_reinversion),
      porcentaje_socio_1: Number(configuracion.porcentaje_socio_1),
      porcentaje_socio_2: Number(configuracion.porcentaje_socio_2),
      updated_at: new Date().toISOString(),
    })
    .eq('id', true)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function obtenerSocios() {
  const { data, error } = await supabase
    .from('socios')
    .select('id, nombre, activo')
    .eq('activo', true)
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

export async function obtenerCierres() {
  const { data, error } = await supabase
    .from('cierres_semanales')
    .select(`
      *,
      distribuciones (
        id,
        tipo,
        socio_id,
        monto,
        estado,
        fecha_pago,
        notas,
        socios (id, nombre)
      )
    `)
    .order('fecha_inicio', { ascending: false })

  if (error) throw error
  return data
}

export async function obtenerCapitalReinversion() {
  const { data, error } = await supabase
    .from('movimientos_capital')
    .select('id, tipo, monto, compra_id, cierre_id, fecha, notas')
    .order('fecha', { ascending: false })

  if (error) throw error

  const saldo = data.reduce(
    (total, movimiento) => total + Number(movimiento.monto),
    0
  )

  return { movimientos: data, saldo }
}

export async function cerrarSemana({ fechaInicio, fechaFin, notas }) {
  const { data, error } = await supabase.rpc('cerrar_semana', {
    p_fecha_inicio: fechaInicio,
    p_fecha_fin: fechaFin,
    p_notas: notas?.trim() || null,
  })

  if (error) throw error
  return data
}

export async function marcarDistribucionPagada(id) {
  const { data, error } = await supabase.rpc('marcar_distribucion_pagada', {
    p_distribucion_id: Number(id),
  })

  if (error) throw error
  return data
}
