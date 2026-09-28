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
    { data: ventas, error: errorVentas },
    { count: inventarioDisponible, error: errorInventario },
    { data: garantias, count: garantiasHoy, error: errorGarantias },
    { data: resumenSemana, error: errorSemana },
  ] = await Promise.all([
    supabase
      .from('ventas')
      .select('precio_final, costo_unitario, fecha_venta')
      .gte('fecha_venta', inicioHoy)
      .lt('fecha_venta', finHoy),
    supabase
      .from('inventario')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'disponible'),
    supabase
      .from('garantias')
      .select(`
        id,
        tipo,
        monto_reembolso,
        fecha_garantia,
        inventario_reemplazo:inventario (
          productos (costo_mayorista)
        )
      `, { count: 'exact' })
      .gte('fecha_garantia', inicioHoy)
      .lt('fecha_garantia', finHoy),
    supabase.rpc('obtener_resumen_semana', {
      p_fecha_inicio: inicioSemana,
      p_fecha_fin: finSemana,
    }),
  ])

  if (errorVentas) throw errorVentas
  if (errorInventario) throw errorInventario
  if (errorGarantias) throw errorGarantias
  if (errorSemana) throw errorSemana

  const ventasHoy = (ventas ?? []).reduce(
    (total, venta) => total + Number(venta.precio_final),
    0
  )

  const utilidadBrutaHoy = (ventas ?? []).reduce(
    (total, venta) => total + Number(venta.precio_final) - Number(venta.costo_unitario),
    0
  )

  const perdidasGarantiasHoy = (garantias ?? []).reduce((total, garantia) => {
    if (garantia.tipo === 'devolucion') {
      return total + Number(garantia.monto_reembolso)
    }

    return total + Number(
      garantia.inventario_reemplazo?.productos?.costo_mayorista ?? 0
    )
  }, 0)

  return {
    ventasHoy,
    utilidadHoy: utilidadBrutaHoy - perdidasGarantiasHoy,
    inventarioDisponible: inventarioDisponible ?? 0,
    garantiasHoy: garantiasHoy ?? 0,
    semana: resumenSemana?.[0] ?? resumenSemana ?? null,
  }
}
