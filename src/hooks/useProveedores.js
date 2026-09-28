import { useCallback, useEffect, useState } from 'react'
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
} from '../services/proveedoresService'

export function useProveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarProveedores = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const datos = await obtenerProveedores()

      setProveedores(datos)
    } catch (error) {
      console.error('Error cargando proveedores:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarProveedores()
  }, [cargarProveedores])

  const agregarProveedor = async (proveedor) => {
    try {
      setError(null)

      const nuevoProveedor = await crearProveedor(proveedor)

      setProveedores((actuales) => [
        ...actuales,
        nuevoProveedor,
      ])

      return nuevoProveedor
    } catch (error) {
      console.error('Error creando proveedor:', error)
      setError(error)
      throw error
    }
  }

  const editarProveedor = async (id, proveedor) => {
    try {
      setError(null)

      const proveedorActualizado = await actualizarProveedor(
        id,
        proveedor
      )

      setProveedores((actuales) =>
        actuales.map((actual) =>
          actual.id === id
            ? proveedorActualizado
            : actual
        )
      )

      return proveedorActualizado
    } catch (error) {
      console.error('Error actualizando proveedor:', error)
      setError(error)
      throw error
    }
  }

  const borrarProveedor = async (id) => {
    try {
      setError(null)

      await eliminarProveedor(id)

      setProveedores((actuales) =>
        actuales.filter((proveedor) => proveedor.id !== id)
      )
    } catch (error) {
      console.error('Error eliminando proveedor:', error)
      setError(error)
      throw error
    }
  }

  return {
    proveedores,
    loading,
    error,
    cargarProveedores,
    agregarProveedor,
    editarProveedor,
    borrarProveedor,
  }
}