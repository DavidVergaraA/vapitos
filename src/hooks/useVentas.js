import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  obtenerVentas,
  obtenerInventarioDisponible,
  registrarVenta,
} from '../services/ventasService'

export function useVentas() {
  const [ventas, setVentas] = useState([])
  const [inventarioDisponible, setInventarioDisponible] =
    useState([])

  const [loading, setLoading] = useState(true)
  const [loadingInventario, setLoadingInventario] =
    useState(true)

  const [error, setError] = useState(null)

  const cargarVentas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const datos = await obtenerVentas()

      setVentas(datos)
    } catch (error) {
      console.error(
        'Error cargando ventas:',
        error
      )

      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarInventarioDisponible =
    useCallback(async () => {
      try {
        setLoadingInventario(true)

        const datos =
          await obtenerInventarioDisponible()

        setInventarioDisponible(datos)
      } catch (error) {
        console.error(
          'Error cargando inventario disponible:',
          error
        )

        setError(error)
      } finally {
        setLoadingInventario(false)
      }
    }, [])

  useEffect(() => {
    cargarVentas()
    cargarInventarioDisponible()
  }, [
    cargarVentas,
    cargarInventarioDisponible,
  ])

  const crearVenta = async (venta) => {
    try {
      setError(null)

      await registrarVenta(venta)

      await Promise.all([
        cargarVentas(),
        cargarInventarioDisponible(),
      ])
    } catch (error) {
      console.error(
        'Error registrando venta:',
        error
      )

      setError(error)
      throw error
    }
  }

  return {
    ventas,
    inventarioDisponible,

    loading,
    loadingInventario,
    error,

    cargarVentas,
    cargarInventarioDisponible,
    crearVenta,
  }
}