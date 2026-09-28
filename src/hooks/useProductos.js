import { useCallback, useEffect, useState } from 'react'

import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../services/productosService'

export function useProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const datos = await obtenerProductos()

      setProductos(datos)
    } catch (error) {
      console.error('Error cargando productos:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarProductos()
  }, [cargarProductos])

  const agregarProducto = async (producto) => {
    try {
      setError(null)

      const nuevoProducto = await crearProducto(producto)

      setProductos((actuales) => [
        ...actuales,
        nuevoProducto,
      ])

      return nuevoProducto
    } catch (error) {
      console.error('Error creando producto:', error)
      setError(error)
      throw error
    }
  }

  const editarProducto = async (id, producto) => {
    try {
      setError(null)

      const productoActualizado = await actualizarProducto(
        id,
        producto
      )

      setProductos((actuales) =>
        actuales.map((actual) =>
          actual.id === id
            ? productoActualizado
            : actual
        )
      )

      return productoActualizado
    } catch (error) {
      console.error('Error actualizando producto:', error)
      setError(error)
      throw error
    }
  }

  const borrarProducto = async (id) => {
    try {
      setError(null)

      await eliminarProducto(id)

      setProductos((actuales) =>
        actuales.filter((producto) => producto.id !== id)
      )
    } catch (error) {
      console.error('Error eliminando producto:', error)
      setError(error)
      throw error
    }
  }

  return {
    productos,
    loading,
    error,
    cargarProductos,
    agregarProducto,
    editarProducto,
    borrarProducto,
  }
}