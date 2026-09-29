import { useCallback, useEffect, useState } from 'react'
import {
  crearVendedorExterno,
  editarVenta,
  obtenerInventarioDisponible,
  obtenerVendedoresExternos,
  obtenerVentas,
  registrarAbono,
  registrarVenta,
  marcarComisionPagada,
} from '../services/ventasService'

export function useVentas() {
  const [ventas, setVentas] = useState([])
  const [inventarioDisponible, setInventarioDisponible] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingInventario, setLoadingInventario] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingInventario(true)
      setError(null)
      const [ventasData, inventarioData, vendedoresData] = await Promise.all([
        obtenerVentas(), obtenerInventarioDisponible(), obtenerVendedoresExternos(),
      ])
      setVentas(ventasData)
      setInventarioDisponible(inventarioData)
      setVendedores(vendedoresData)
    } catch (e) {
      console.error(e)
      setError(e)
    } finally {
      setLoading(false)
      setLoadingInventario(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const ejecutar = async (fn) => {
    try { setError(null); await fn(); await cargar() }
    catch (e) { setError(e); throw e }
  }

  return {
    ventas, inventarioDisponible, vendedores, loading, loadingInventario, error,
    recargar: cargar,
    crearVenta: (v) => ejecutar(() => registrarVenta(v)),
    actualizarVenta: (v) => ejecutar(() => editarVenta(v)),
    agregarAbono: (a) => ejecutar(() => registrarAbono(a)),
    pagarComision: (id) => ejecutar(() => marcarComisionPagada(id)),
    crearVendedor: async (v) => { const nuevo = await crearVendedorExterno(v); await cargar(); return nuevo },
  }
}
