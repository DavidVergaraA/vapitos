import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  obtenerVentasParaGarantia,
  obtenerInventarioDisponible,
  obtenerGarantias,
  registrarGarantia,
} from '../services/garantiasService'

export function useGarantias() {
  const [ventas, setVentas] = useState([])
  const [inventarioDisponible, setInventarioDisponible] =
    useState([])
  const [garantias, setGarantias] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        ventasData,
        inventarioData,
        garantiasData,
      ] = await Promise.all([
        obtenerVentasParaGarantia(),
        obtenerInventarioDisponible(),
        obtenerGarantias(),
      ])

      setVentas(ventasData)
      setInventarioDisponible(inventarioData)
      setGarantias(garantiasData)
    } catch (error) {
      console.error(
        'Error cargando garantías:',
        error
      )

      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const estadisticas = useMemo(() => {
    const reemplazos = garantias.filter(
      (garantia) =>
        garantia.tipo === 'reemplazo'
    ).length

    const devoluciones = garantias.filter(
      (garantia) =>
        garantia.tipo === 'devolucion'
    ).length

    const reembolsos = garantias.reduce(
      (total, garantia) =>
        total +
        Number(
          garantia.monto_reembolso
        ),
      0
    )

    return {
      total: garantias.length,
      reemplazos,
      devoluciones,
      reembolsos,
    }
  }, [garantias])

  const crearGarantia = async (garantia) => {
    try {
      setError(null)

      await registrarGarantia(
        garantia
      )

      await cargarDatos()
    } catch (error) {
      console.error(
        'Error registrando garantía:',
        error
      )

      setError(error)
      throw error
    }
  }

  return {
    ventas,
    inventarioDisponible,
    garantias,
    estadisticas,

    loading,
    error,

    cargarDatos,
    crearGarantia,
  }
}