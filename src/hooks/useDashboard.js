import { useCallback, useEffect, useState } from 'react'
import { obtenerResumenDashboard } from '../services/dashboardService'

export function useDashboard() {
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarResumen = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const datos = await obtenerResumenDashboard()

      setResumen(datos)
    } catch (error) {
      console.error('Error cargando dashboard:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarResumen()
  }, [cargarResumen])

  return {
    resumen,
    loading,
    error,
    recargar: cargarResumen,
  }
}