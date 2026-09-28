import { useMemo, useState } from 'react'
import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Search,
  Package,
} from 'lucide-react'

import { useInventario } from '../../hooks/useInventario'

function Inventario() {
  const {
    inventarioAgrupado,
    estadisticas,
    loading,
    error,
  } = useInventario()

  const [busqueda, setBusqueda] = useState('')
  const [soloDisponibles, setSoloDisponibles] =
    useState(true)

  const [grupoExpandido, setGrupoExpandido] =
    useState(null)

  const gruposFiltrados = useMemo(() => {
    const texto = busqueda
      .toLowerCase()
      .trim()

    return inventarioAgrupado.filter((grupo) => {
      const coincideBusqueda =
        !texto ||
        grupo.marca
          .toLowerCase()
          .includes(texto) ||
        grupo.modelo
          .toLowerCase()
          .includes(texto) ||
        grupo.sabor
          .toLowerCase()
          .includes(texto) ||
        grupo.proveedor
          .toLowerCase()
          .includes(texto)

      const coincideDisponibilidad =
        !soloDisponibles ||
        grupo.disponibles > 0

      return (
        coincideBusqueda &&
        coincideDisponibilidad
      )
    })
  }, [
    inventarioAgrupado,
    busqueda,
    soloDisponibles,
  ])

  const formatearFecha = (fecha) => {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
    }).format(new Date(fecha))
  }

  const obtenerEstado = (estado) => {
    const estados = {
      disponible: {
        texto: 'Disponible',
        clase:
          'bg-green-50 text-green-700',
      },

      vendido: {
        texto: 'Vendido',
        clase:
          'bg-slate-100 text-slate-600',
      },

      defectuoso: {
        texto: 'Defectuoso',
        clase:
          'bg-red-50 text-red-700',
      },

      salida_garantia: {
        texto: 'Garantía',
        clase:
          'bg-amber-50 text-amber-700',
      },
    }

    return (
      estados[estado] || {
        texto: estado,
        clase:
          'bg-slate-100 text-slate-600',
      }
    )
  }

  return (
    <main className="space-y-6">

      {/* ========================================
          ENCABEZADO
      ========================================= */}
      <div>
        <p className="font-semibold text-blue-600">
          Gestión del negocio
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Inventario
        </h1>

        <p className="mt-1 text-slate-500">
          Consulta las unidades disponibles y su estado.
        </p>
      </div>

      {/* ========================================
          ESTADÍSTICAS
      ========================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Disponibles
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {estadisticas.disponibles}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Vendidas
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-700">
            {estadisticas.vendidos}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Defectuosas
          </p>

          <p className="mt-1 text-2xl font-bold text-red-600">
            {estadisticas.defectuosos}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total unidades
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {estadisticas.total}
          </p>
        </div>

      </div>

      {/* ========================================
          FILTROS
      ========================================= */}
      <section className="rounded-3xl bg-white p-4 shadow-sm">

        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            placeholder="Buscar por marca, modelo, sabor o proveedor..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() =>
              setSoloDisponibles(
                (actual) => !actual
              )
            }
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              soloDisponibles
                ? 'bg-blue-50 text-blue-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {soloDisponibles
              ? '✓ Solo disponibles'
              : 'Mostrar todos'}
          </button>
        </div>

      </section>

      {/* ========================================
          ERROR
      ========================================= */}
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message ||
            'No se pudo cargar el inventario.'}
        </div>
      )}

      {/* ========================================
          LISTADO
      ========================================= */}
      <section className="rounded-3xl bg-white shadow-sm">

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Cargando inventario...
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Package
                size={30}
                className="text-slate-400"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-800">
              {busqueda
                ? 'No encontramos resultados'
                : soloDisponibles
                  ? 'No hay unidades disponibles'
                  : 'El inventario está vacío'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {busqueda
                ? 'Prueba con otra búsqueda.'
                : 'Las unidades aparecerán aquí cuando registres compras.'}
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {gruposFiltrados.map((grupo) => {
              const expandido =
                grupoExpandido === grupo.clave

              return (
                <article
                  key={grupo.clave}
                  className="p-5"
                >

                  {/* Cabecera grupo */}
                  <button
                    type="button"
                    onClick={() =>
                      setGrupoExpandido(
                        expandido
                          ? null
                          : grupo.clave
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 gap-4">

                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 sm:flex">
                          <Boxes
                            size={23}
                            className="text-blue-600"
                          />
                        </div>

                        <div className="min-w-0">

                          <h2 className="font-bold text-slate-900">
                            {grupo.marca}{' '}
                            {grupo.modelo}
                          </h2>

                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {grupo.sabor}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {grupo.proveedor}
                            {grupo.puffs
                              ? ` · ${grupo.puffs.toLocaleString()} puffs`
                              : ''}
                          </p>

                        </div>

                      </div>

                      <div className="flex shrink-0 items-center gap-3">

                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {grupo.disponibles}
                          </p>

                          <p className="text-xs font-semibold text-slate-400">
                            disponibles
                          </p>
                        </div>

                        {expandido ? (
                          <ChevronUp
                            size={20}
                            className="text-slate-400"
                          />
                        ) : (
                          <ChevronDown
                            size={20}
                            className="text-slate-400"
                          />
                        )}

                      </div>

                    </div>

                    {/* Estados */}
                    <div className="mt-4 flex flex-wrap gap-2">

                      {grupo.disponibles > 0 && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          {grupo.disponibles}{' '}
                          disponibles
                        </span>
                      )}

                      {grupo.vendidas > 0 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {grupo.vendidas}{' '}
                          vendidas
                        </span>
                      )}

                      {grupo.defectuosas > 0 && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          {grupo.defectuosas}{' '}
                          defectuosas
                        </span>
                      )}

                      {grupo.salidasGarantia > 0 && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {grupo.salidasGarantia}{' '}
                          garantía
                        </span>
                      )}

                    </div>
                  </button>

                  {/* ==================================
                      UNIDADES INDIVIDUALES
                  ================================== */}
                  {expandido && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">

                      <p className="mb-3 text-sm font-bold text-slate-700">
                        Unidades
                      </p>

                      <div className="space-y-2">

                        {grupo.unidades.map(
                          (unidad) => {
                            const estado =
                              obtenerEstado(
                                unidad.estado
                              )

                            return (
                              <div
                                key={unidad.id}
                                className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                              >

                                <div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    Unidad #
                                    {unidad.id}
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    Ingresó{' '}
                                    {formatearFecha(
                                      unidad.fecha_ingreso
                                    )}
                                  </p>
                                </div>

                                <span
                                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}
                                >
                                  {estado.texto}
                                </span>

                              </div>
                            )
                          }
                        )}

                      </div>

                    </div>
                  )}

                </article>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}

export default Inventario