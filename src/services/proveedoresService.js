import { supabase } from '../lib/supabaseClient'

export async function obtenerProveedores() {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function crearProveedor(proveedor) {
  const { data, error } = await supabase
    .from('proveedores')
    .insert({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || null,
      ubicacion: proveedor.ubicacion || null,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function actualizarProveedor(id, proveedor) {
  const { data, error } = await supabase
    .from('proveedores')
    .update({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || null,
      ubicacion: proveedor.ubicacion || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function eliminarProveedor(id) {
  const { error } = await supabase
    .from('proveedores')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}