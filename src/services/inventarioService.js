import { supabase } from '../lib/supabaseClient'

export async function obtenerInventario() {
  const { data, error } = await supabase
    .from('inventario')
    .select(`
      id,
      producto_id,
      sabor,
      estado,
      fecha_ingreso,
      fecha_salida,
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
    .order('fecha_ingreso', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data
}