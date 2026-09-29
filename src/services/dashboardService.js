import { supabase } from '../lib/supabaseClient'
import { obtenerFechaColombia, obtenerInicioSemana, sumarDias } from '../utils/dateUtils'

function inicioDia(fecha) { return new Date(`${fecha}T00:00:00-05:00`).toISOString() }

export async function obtenerResumenDashboard() {
  const hoy = obtenerFechaColombia()
  const inicioHoy = inicioDia(hoy)
  const finHoy = inicioDia(sumarDias(hoy, 1))
  const inicioSemana = obtenerInicioSemana(hoy)
  const finSemana = sumarDias(inicioSemana, 6)
  const desde = inicioDia(sumarDias(hoy, -6))
  const hasta = finHoy

  const [ventasR, abonosR, invR, garantiasR, semanaR, porCobrarR, externosR] = await Promise.all([
    supabase.from('ventas').select('id,precio_final,costo_unitario,comision_monto,tipo_venta,fecha_venta,resultado').gte('fecha_venta', desde).lt('fecha_venta', hasta),
    supabase.from('abonos_ventas').select('monto,fecha_abono,venta_id').gte('fecha_abono', desde).lt('fecha_abono', hasta),
    supabase.from('inventario').select('*',{count:'exact',head:true}).eq('estado','disponible'),
    supabase.from('garantias').select('*',{count:'exact',head:true}).gte('fecha_garantia',inicioHoy).lt('fecha_garantia',finHoy),
    supabase.rpc('obtener_resumen_semana_v2',{p_fecha_inicio:inicioSemana,p_fecha_fin:finSemana}),
    supabase.from('ventas').select('id,precio_final,abonos_ventas(monto)').neq('resultado','garantia_devolucion'),
    supabase.from('ventas').select('id,precio_final,comision_monto,vendedores_externos(nombre)').eq('tipo_venta','externa'),
  ])
  for (const r of [ventasR,abonosR,invR,garantiasR,semanaR,porCobrarR,externosR]) if (r.error) throw r.error
  const ventas = ventasR.data ?? []
  const abonos = abonosR.data ?? []
  const ventasHoy = ventas.filter(v=>v.fecha_venta>=inicioHoy && v.fecha_venta<finHoy)
  const ventasHoyTotal = ventasHoy.reduce((s,v)=>s+Number(v.precio_final),0)
  const cobradoHoy = abonos.filter(a=>a.fecha_abono>=inicioHoy && a.fecha_abono<finHoy).reduce((s,a)=>s+Number(a.monto),0)
  const utilidadHoy = ventasHoy.reduce((s,v)=>s+Number(v.precio_final)-Number(v.costo_unitario)-Number(v.comision_monto||0),0)
  const porCobrar = (porCobrarR.data??[]).reduce((s,v)=>s+Math.max(Number(v.precio_final)-(v.abonos_ventas??[]).reduce((x,a)=>x+Number(a.monto),0),0),0)
  const series = Array.from({length:7},(_,i)=>{
    const fecha=sumarDias(hoy,i-6); const siguiente=sumarDias(fecha,1); const ini=inicioDia(fecha); const fin=inicioDia(siguiente)
    return {fecha, ventas:ventas.filter(v=>v.fecha_venta>=ini&&v.fecha_venta<fin).reduce((s,v)=>s+Number(v.precio_final),0), cobrado:abonos.filter(a=>a.fecha_abono>=ini&&a.fecha_abono<fin).reduce((s,a)=>s+Number(a.monto),0)}
  })
  const ranking = Object.values((ventasR.data??[]).reduce((acc,v)=>{return acc},{}))
  return {ventasHoy:ventasHoyTotal,cobradoHoy,porCobrarHoy:porCobrar,utilidadHoy,inventarioDisponible:invR.count??0,garantiasHoy:garantiasR.count??0,semana:semanaR.data?.[0]??semanaR.data??null,series,externas:externosR.data??[],ranking}
}
