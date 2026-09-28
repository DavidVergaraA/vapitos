import { supabase } from '../lib/supabaseClient'

export async function obtenerProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      proveedores (
        id,
        nombre
      )
    `)
    .order('marca', { ascending: true })
    .order('modelo', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function crearProducto(producto) {
  const { data, error } = await supabase
    .from('productos')
    .insert({
      proveedor_id: producto.proveedor_id,
      marca: producto.marca,
      modelo: producto.modelo,
      puffs: producto.puffs || null,
      costo_mayorista: producto.costo_mayorista,
    })
    .select(`
      *,
      proveedores (
        id,
        nombre
      )
    `)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function actualizarProducto(id, producto) {
  const { data, error } = await supabase
    .from('productos')
    .update({
      proveedor_id: producto.proveedor_id,
      marca: producto.marca,
      modelo: producto.modelo,
      puffs: producto.puffs || null,
      costo_mayorista: producto.costo_mayorista,
    })
    .eq('id', id)
    .select(`
      *,
      proveedores (
        id,
        nombre
      )
    `)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function eliminarProducto(id) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}