import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  actualizarConfiguracion,
  cerrarSemana,
  marcarDistribucionPagada,
  obtenerCapitalReinversion,
  obtenerPorCobrar,
  obtenerComisionesPendientes,
  obtenerCierres,
  obtenerConfiguracion,
  obtenerResumenSemana,
  obtenerSocios,
} from '../services/finanzasService'
import { marcarComisionPagada } from '../services/ventasService'

export function useFinanzas(fechaInicio, fechaFin) {
  const [resumen, setResumen] = useState(null)
  const [configuracion, setConfiguracion] = useState(null)
  const [socios, setSocios] = useState([])
  const [cierres, setCierres] = useState([])
  const [capital, setCapital] = useState({ movimientos: [], saldo: 0 })
  const [porCobrar, setPorCobrar] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return

    try {
      setLoading(true)
      setError(null)

      const [resumenData, configuracionData, sociosData, cierresData, capitalData, porCobrarData, comisionesData] =
        await Promise.all([
          obtenerResumenSemana(fechaInicio, fechaFin),
          obtenerConfiguracion(),
          obtenerSocios(),
          obtenerCierres(),
          obtenerCapitalReinversion(),
          obtenerPorCobrar(),
          obtenerComisionesPendientes(),
        ])

      setResumen(resumenData)
      setConfiguracion(configuracionData)
      setSocios(sociosData)
      setCierres(cierresData)
      setCapital(capitalData)
      setPorCobrar(porCobrarData)
      setComisiones(comisionesData)
    } catch (error) {
      console.error('Error cargando finanzas:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cierreActual = useMemo(() => {
    return cierres.find(
      (cierre) =>
        cierre.fecha_inicio === fechaInicio &&
        cierre.fecha_fin === fechaFin
    ) ?? null
  }, [cierres, fechaInicio, fechaFin])

  const distribucionesPendientes = useMemo(() => {
    return cierres.flatMap((cierre) =>
      (cierre.distribuciones ?? []).filter(
        (distribucion) =>
          distribucion.tipo === 'socio' &&
          distribucion.estado === 'pendiente'
      )
    )
  }, [cierres])

  const guardarConfiguracion = async (datos) => {
    try {
      setGuardando(true)
      setError(null)
      const nueva = await actualizarConfiguracion(datos)
      setConfiguracion(nueva)
      return nueva
    } catch (error) {
      setError(error)
      throw error
    } finally {
      setGuardando(false)
    }
  }

  const ejecutarCierre = async (datos) => {
    try {
      setGuardando(true)
      setError(null)
      await cerrarSemana(datos)
      await cargar()
    } catch (error) {
      setError(error)
      throw error
    } finally {
      setGuardando(false)
    }
  }

  const pagarComision = async (id) => {
    try {
      setGuardando(true)
      setError(null)
      await marcarComisionPagada(id)
      await cargar()
    } catch (error) {
      setError(error)
      throw error
    } finally {
      setGuardando(false)
    }
  }

  const pagarDistribucion = async (id) => {
    try {
      setGuardando(true)
      setError(null)
      await marcarDistribucionPagada(id)
      await cargar()
    } catch (error) {
      setError(error)
      throw error
    } finally {
      setGuardando(false)
    }
  }

  return {
    resumen,
    configuracion,
    socios,
    cierres,
    cierreActual,
    capital,
    porCobrar,
    comisiones,
    distribucionesPendientes,
    loading,
    guardando,
    error,
    recargar: cargar,
    guardarConfiguracion,
    ejecutarCierre,
    pagarDistribucion,
    pagarComision,
  }
}
