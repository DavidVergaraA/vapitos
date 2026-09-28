import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { obtenerInventario } from '../services/inventarioService'

export function useInventario() {
  const [inventario, setInventario] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarInventario = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const datos = await obtenerInventario()

      setInventario(datos)
    } catch (error) {
      console.error(
        'Error cargando inventario:',
        error
      )

      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarInventario()
  }, [cargarInventario])

  /*
   * Agrupamos las unidades por:
   *
   * Marca + Modelo + Sabor
   *
   * Así podemos mostrar:
   *
   * Vapito 1223
   * Pene
   * 5 disponibles
   *
   * en lugar de mostrar 5 tarjetas diferentes.
   */
  const inventarioAgrupado = useMemo(() => {
    const grupos = {}

    inventario.forEach((unidad) => {
      const marca =
        unidad.productos?.marca || 'Sin marca'

      const modelo =
        unidad.productos?.modelo || 'Sin modelo'

      const sabor = unidad.sabor || 'Sin sabor'

      const clave = `${unidad.producto_id}-${sabor}`

      if (!grupos[clave]) {
        grupos[clave] = {
          clave,
          producto_id: unidad.producto_id,
          marca,
          modelo,
          sabor,
          puffs: unidad.productos?.puffs,
          proveedor:
            unidad.productos?.proveedores?.nombre ||
            'Sin proveedor',

          unidades: [],
          disponibles: 0,
          vendidas: 0,
          defectuosas: 0,
          salidasGarantia: 0,
        }
      }

      grupos[clave].unidades.push(unidad)

      switch (unidad.estado) {
        case 'disponible':
          grupos[clave].disponibles += 1
          break

        case 'vendido':
          grupos[clave].vendidas += 1
          break

        case 'defectuoso':
          grupos[clave].defectuosas += 1
          break

        case 'salida_garantia':
          grupos[clave].salidasGarantia += 1
          break

        default:
          break
      }
    })

    return Object.values(grupos).sort((a, b) => {
      if (a.marca !== b.marca) {
        return a.marca.localeCompare(b.marca)
      }

      if (a.modelo !== b.modelo) {
        return a.modelo.localeCompare(b.modelo)
      }

      return a.sabor.localeCompare(b.sabor)
    })
  }, [inventario])

  const estadisticas = useMemo(() => {
    return {
      total: inventario.length,

      disponibles: inventario.filter(
        (unidad) =>
          unidad.estado === 'disponible'
      ).length,

      vendidos: inventario.filter(
        (unidad) =>
          unidad.estado === 'vendido'
      ).length,

      defectuosos: inventario.filter(
        (unidad) =>
          unidad.estado === 'defectuoso'
      ).length,

      salidasGarantia: inventario.filter(
        (unidad) =>
          unidad.estado === 'salida_garantia'
      ).length,
    }
  }, [inventario])

  return {
    inventario,
    inventarioAgrupado,
    estadisticas,
    loading,
    error,
    cargarInventario,
  }
}