import { supabase } from '../lib/supabaseClient'

export async function obtenerCompras() {
  const { data, error } = await supabase
    .from('compras')
    .select(`
      *,
      proveedores (
        id,
        nombre
      ),
      detalle_compras (
        id,
        producto_id,
        sabor,
        cantidad,
        costo_unitario,
        subtotal,
        productos (
          id,
          marca,
          modelo
        )
      )
    `)
    .order('fecha_compra', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data
}

export async function registrarCompra(compra) {
  const detalles = compra.detalles.map((detalle) => ({
    producto_id: Number(detalle.producto_id),
    sabor: detalle.sabor.trim(),
    cantidad: Number(detalle.cantidad),
    costo_unitario: Number(detalle.costo_unitario),
  }))

  const { data, error } = await supabase.rpc(
    'registrar_compra',
    {
      p_proveedor_id: Number(compra.proveedor_id),
      p_notas: compra.notas?.trim() || null,
      p_detalles: detalles,
    }
  )

  if (error) {
    throw error
  }

  return data
}