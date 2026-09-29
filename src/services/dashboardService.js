import { supabase } from '../lib/supabaseClient'
import { obtenerInicioSemana, obtenerFechaColombia, sumarDias } from '../utils/dateUtils'

function inicioDiaColombia(fecha) {
  return new Date(`${fecha}T00:00:00-05:00`).toISOString()
}

export async function obtenerResumenDashboard() {
  const hoy = obtenerFechaColombia()
  const inicioHoy = inicioDiaColombia(hoy)
  const finHoy = inicioDiaColombia(sumarDias(hoy, 1))
  const inicioSemana = obtenerInicioSemana(hoy)
  const finSemana = sumarDias(inicioSemana, 6)

  const [
    { data: ventasHoyData, error: errorVentas },
    { data: abonosHoyData, error: errorAbonosHoy },
    { data: ventasAbiertas, error: errorAbiertas },
    { count: inventarioDisponible, error: errorInventario },
    { count: garantiasHoy, error: errorGarantias },
    { data: semana, error: errorSemana },
  ] = await Promise.all([
    supabase.from('ventas').select('id, precio_final, costo_unitario, comision_monto').gte('fecha_venta', inicioHoy).lt('fecha_venta', finHoy),
    supabase.from('abonos_ventas').select('monto').gte('fecha_abono', inicioHoy).lt('fecha_abono', finHoy),
    supabase.from('ventas').select('id, precio_final, abonos_ventas(monto)'),
    supabase.from('inventario').select('*', { count: 'exact', head: true }).eq('estado', 'disponible'),
    supabase.from('garantias').select('*', { count: 'exact', head: true }).gte('fecha_garantia', inicioHoy).lt('fecha_garantia', finHoy),
    supabase.rpc('obtener_resumen_semana_v2', { p_fecha_inicio: inicioSemana, p_fecha_fin: finSemana }),
  ])

  if (errorVentas) throw errorVentas
  if (errorAbonosHoy) throw errorAbonosHoy
  if (errorAbiertas) throw errorAbiertas
  if (errorInventario) throw errorInventario
  if (errorGarantias) throw errorGarantias
  if (errorSemana) throw errorSemana

  const ventasHoy = (ventasHoyData ?? []).reduce((s, v) => s + Number(v.precio_final), 0)
  const cobradoHoy = (abonosHoyData ?? []).reduce((s, a) => s + Number(a.monto), 0)
  const porCobrar = (ventasAbiertas ?? []).reduce((s, v) => {
    const pagado = (v.abonos_ventas ?? []).reduce((a, x) => a + Number(x.monto), 0)
    return s + Math.max(Number(v.precio_final) - pagado, 0)
  }, 0)
  const utilidadHoy = (ventasHoyData ?? []).reduce(
    (s, v) => s + Number(v.precio_final) - Number(v.costo_unitario) - Number(v.comision_monto || 0),
    0
  )

  return {
    ventasHoy,
    cobradoHoy,
    porCobrarHoy: porCobrar,
    utilidadHoy,
    inventarioDisponible: inventarioDisponible ?? 0,
    garantiasHoy: garantiasHoy ?? 0,
    semana: semana?.[0] ?? semana ?? null,
  }
}
