import { supabase } from '../lib/supabaseClient'

export async function obtenerVentas() {
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
      notas,
      inventario (
        id,
        sabor,
        productos (
          id,
          marca,
          modelo,
          puffs
        )
      )
    `)
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
        puffs,
        costo_mayorista,
        proveedores (
          id,
          nombre
        )
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

export async function registrarVenta(venta) {
  const { data, error } = await supabase.rpc(
    'registrar_venta',
    {
      p_inventario_id: Number(
        venta.inventario_id
      ),
      p_precio_final: Number(
        venta.precio_final
      ),
      p_metodo_pago: venta.metodo_pago,
      p_notas: venta.notas?.trim() || null,
    }
  )

  if (error) {
    throw error
  }

  return data
}