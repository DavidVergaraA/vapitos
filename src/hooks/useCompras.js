import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  obtenerCompras,
  registrarCompra,
} from '../services/comprasService'

import { obtenerProductos } from '../services/productosService'
import { obtenerProveedores } from '../services/proveedoresService'

export function useCompras() {
  const [compras, setCompras] = useState([])
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingCatalogos, setLoadingCatalogos] =
    useState(true)

  const [error, setError] = useState(null)

  const cargarCompras = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const datos = await obtenerCompras()

      setCompras(datos)
    } catch (error) {
      console.error('Error cargando compras:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarCatalogos = useCallback(async () => {
    try {
      setLoadingCatalogos(true)

      const [
        productosData,
        proveedoresData,
      ] = await Promise.all([
        obtenerProductos(),
        obtenerProveedores(),
      ])

      setProductos(productosData)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error(
        'Error cargando catálogos:',
        error
      )

      setError(error)
    } finally {
      setLoadingCatalogos(false)
    }
  }, [])

  useEffect(() => {
    cargarCompras()
    cargarCatalogos()
  }, [cargarCompras, cargarCatalogos])

  const crearCompra = async (compra) => {
    try {
      setError(null)

      await registrarCompra(compra)

      await cargarCompras()
    } catch (error) {
      console.error(
        'Error registrando compra:',
        error
      )

      setError(error)
      throw error
    }
  }

  return {
    compras,
    productos,
    proveedores,

    loading,
    loadingCatalogos,
    error,

    cargarCompras,
    crearCompra,
  }
}