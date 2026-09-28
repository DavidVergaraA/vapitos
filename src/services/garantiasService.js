import { supabase } from '../lib/supabaseClient'

export async function obtenerVentasParaGarantia() {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      id,
      inventario_id,
      precio_final,
      costo_unitario,
      metodo_pago,
      resultado,
      fecha_venta,
      inventario (
        id,
        producto_id,
        sabor,
        estado,
        productos (
          id,
          marca,
          modelo,
          puffs
        )
      )
    `)
    .eq('resultado', 'exitosa')
    .order('fecha_venta', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data
}

export async function obtenerInventarioDisponible() {
  const { data, error } = await supabase
    .from('inventario')
    .select(`
      id,
      producto_id,
      sabor,
      estado,
      fecha_ingreso,
      productos (
        id,
        marca,
        modelo,
        puffs
      )
    `)
    .eq('estado', 'disponible')
    .order('fecha_ingreso', {
      ascending: true,
    })

  if (error) {
    throw error
  }

  return data
}

export async function obtenerGarantias() {
  const { data, error } = await supabase
    .from('garantias')
    .select(`
      id,
      venta_id,
      tipo,
      motivo,
      fecha_garantia,
      inventario_reemplazo_id,
      monto_reembolso,
      notas,
      ventas (
        id,
        precio_final,
        inventario (
          id,
          sabor,
          productos (
            marca,
            modelo
          )
        )
      )
    `)
    .order('fecha_garantia', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data
}

export async function registrarGarantia(garantia) {
  const { data, error } = await supabase.rpc(
    'registrar_garantia',
    {
      p_venta_id: Number(
        garantia.venta_id
      ),

      p_tipo: garantia.tipo,

      p_motivo: garantia.motivo,

      p_inventario_reemplazo_id:
        garantia.inventario_reemplazo_id
          ? Number(
              garantia.inventario_reemplazo_id
            )
          : null,

      p_monto_reembolso:
        Number(
          garantia.monto_reembolso
        ) || 0,

      p_notas:
        garantia.notas?.trim() || null,
    }
  )

  if (error) {
    throw error
  }

  return data
}