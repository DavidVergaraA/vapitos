import { useMemo, useState } from 'react'
import {
  Gift,
  History,
  RefreshCcw,
  RotateCcw,
  X,
} from 'lucide-react'

import { useGarantias } from '../../hooks/useGarantias'

function Garantias() {
  const {
    ventas,
    inventarioDisponible,
    garantias,
    estadisticas,
    loading,
    error,
    crearGarantia,
  } = useGarantias()

  const [modalAbierto, setModalAbierto] =
    useState(false)

  const [ventaId, setVentaId] =
    useState('')

  const [tipo, setTipo] =
    useState('')

  const [motivo, setMotivo] =
    useState('')

  const [inventarioReemplazoId, setInventarioReemplazoId] =
    useState('')

  const [montoReembolso, setMontoReembolso] =
    useState('')

  const [notas, setNotas] =
    useState('')

  const [guardando, setGuardando] =
    useState(false)

  const [errorFormulario, setErrorFormulario] =
    useState('')

  const ventaSeleccionada = useMemo(() => {
    return ventas.find(
      (venta) =>
        String(venta.id) ===
        String(ventaId)
    )
  }, [ventas, ventaId])

  const unidadesReemplazo = useMemo(() => {
    if (!ventaSeleccionada) {
      return []
    }

    return inventarioDisponible.filter(
      (unidad) =>
        unidad.producto_id ===
        ventaSeleccionada.inventario?.producto_id
    )
  }, [
    inventarioDisponible,
    ventaSeleccionada,
  ])

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(valor) || 0)
  }

  const formatearFecha = (fecha) => {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(fecha))
  }

  const obtenerMotivo = (valor) => {
    const motivos = {
      no_enciende: 'No enciende',
      no_carga: 'No carga',
      sabor_defectuoso: 'Sabor defectuoso',
      fuga: 'Fuga',
      golpeado: 'Golpeado',
      otro: 'Otro',
    }

    return motivos[valor] || valor
  }

  const abrirModal = () => {
    setVentaId('')
    setTipo('')
    setMotivo('')
    setInventarioReemplazoId('')
    setMontoReembolso('')
    setNotas('')
    setErrorFormulario('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (guardando) {
      return
    }

    setModalAbierto(false)
    setErrorFormulario('')
  }

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo)
    setInventarioReemplazoId('')
    setMontoReembolso('')
  }

  const cambiarVenta = (valor) => {
    setVentaId(valor)
    setInventarioReemplazoId('')

    const venta = ventas.find(
      (item) =>
        String(item.id) ===
        String(valor)
    )

    if (
      venta &&
      tipo === 'devolucion'
    ) {
      setMontoReembolso(
        venta.precio_final
      )
    }
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    setErrorFormulario('')

    if (!ventaId) {
      setErrorFormulario(
        'Selecciona una venta.'
      )
      return
    }

    if (!tipo) {
      setErrorFormulario(
        'Selecciona el tipo de garantía.'
      )
      return
    }

    if (!motivo) {
      setErrorFormulario(
        'Selecciona el motivo de la garantía.'
      )
      return
    }

    if (
      tipo === 'reemplazo' &&
      !inventarioReemplazoId
    ) {
      setErrorFormulario(
        'Selecciona la unidad de reemplazo.'
      )
      return
    }

    if (
      tipo === 'devolucion' &&
      (montoReembolso === '' ||
        Number(montoReembolso) < 0)
    ) {
      setErrorFormulario(
        'Ingresa un monto de reembolso válido.'
      )
      return
    }

    try {
      setGuardando(true)

      await crearGarantia({
        venta_id: Number(ventaId),
        tipo,
        motivo,
        inventario_reemplazo_id:
          tipo === 'reemplazo'
            ? Number(
                inventarioReemplazoId
              )
            : null,
        monto_reembolso:
          tipo === 'devolucion'
            ? Number(
                montoReembolso
              )
            : 0,
        notas,
      })

      cerrarModal()
    } catch (error) {
      setErrorFormulario(
        error.message ||
          'No se pudo registrar la garantía.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="space-y-6">

      {/* ========================================
          ENCABEZADO
      ======================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="font-semibold text-blue-600">
            Gestión del negocio
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Garantías
          </h1>

          <p className="mt-1 text-slate-500">
            Gestiona reemplazos y devoluciones de productos.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModal}
          disabled={ventas.length === 0}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Gift size={20} />
          Nueva garantía
        </button>

      </div>

      {/* ========================================
          ESTADÍSTICAS
      ======================================== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total garantías
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {estadisticas.total}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Reemplazos
          </p>

          <p className="mt-1 text-2xl font-bold text-amber-600">
            {estadisticas.reemplazos}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Devoluciones
          </p>

          <p className="mt-1 text-2xl font-bold text-red-600">
            {estadisticas.devoluciones}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Reembolsos
          </p>

          <p className="mt-1 text-xl font-bold text-slate-800">
            {formatearPrecio(
              estadisticas.reembolsos
            )}
          </p>
        </div>

      </div>

      {/* ========================================
          ERROR
      ======================================== */}
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message ||
            'Ocurrió un error cargando las garantías.'}
        </div>
      )}

      {/* ========================================
          HISTORIAL
      ======================================== */}
      <section className="rounded-3xl bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <History
                size={21}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Historial de garantías
              </h2>

              <p className="text-sm text-slate-500">
                {garantias.length} registrada
                {garantias.length !== 1
                  ? 's'
                  : ''}
              </p>
            </div>

          </div>

        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Cargando garantías...
          </div>
        ) : garantias.length === 0 ? (
          <div className="p-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Gift
                size={30}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Aún no hay garantías
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cuando un cliente reporte un problema,
              podrás registrarlo aquí.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {garantias.map((garantia) => {

              const venta =
                garantia.ventas

              const producto =
                venta?.inventario?.productos

              return (
                <article
                  key={garantia.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <div className="flex items-center gap-2">

                      {garantia.tipo ===
                      'reemplazo' ? (
                        <RefreshCcw
                          size={18}
                          className="text-amber-600"
                        />
                      ) : (
                        <RotateCcw
                          size={18}
                          className="text-red-600"
                        />
                      )}

                      <h3 className="font-bold text-slate-900">
                        {producto?.marca}{' '}
                        {producto?.modelo}
                      </h3>

                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {venta?.inventario?.sabor}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        {garantia.tipo ===
                        'reemplazo'
                          ? 'Reemplazo'
                          : 'Devolución'}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {obtenerMotivo(
                          garantia.motivo
                        )}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatearFecha(
                          garantia.fecha_garantia
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="text-left sm:text-right">

                    {garantia.tipo ===
                      'devolucion' && (
                      <p className="font-bold text-red-600">
                        Reembolso:{' '}
                        {formatearPrecio(
                          garantia.monto_reembolso
                        )}
                      </p>
                    )}

                    {garantia.tipo ===
                      'reemplazo' && (
                      <p className="font-semibold text-amber-600">
                        Unidad reemplazada
                      </p>
                    )}

                  </div>

                </article>
              )
            })}

          </div>
        )}

      </section>

      {/* ========================================
          MODAL
      ======================================== */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Nueva garantía
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registra qué ocurrió con la venta.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={22} />
              </button>

            </div>

            <form
              onSubmit={manejarSubmit}
              className="mt-6 space-y-5"
            >

              {/* Venta */}
              <div>

                <label
                  htmlFor="ventaGarantia"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Venta
                </label>

                <select
                  id="ventaGarantia"
                  value={ventaId}
                  onChange={(e) =>
                    cambiarVenta(
                      e.target.value
                    )
                  }
                  disabled={guardando}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Selecciona una venta
                  </option>

                  {ventas.map((venta) => (
                    <option
                      key={venta.id}
                      value={venta.id}
                    >
                      #{venta.id} ·{' '}
                      {venta.inventario?.productos?.marca}{' '}
                      {venta.inventario?.productos?.modelo}
                      {' · '}
                      {venta.inventario?.sabor}
                      {' · '}
                      {formatearPrecio(
                        venta.precio_final
                      )}
                    </option>
                  ))}

                </select>

              </div>

              {/* Información venta */}
              {ventaSeleccionada && (
                <div className="rounded-2xl bg-blue-50 p-4">

                  <p className="font-bold text-slate-900">
                    {ventaSeleccionada.inventario?.productos?.marca}{' '}
                    {ventaSeleccionada.inventario?.productos?.modelo}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Sabor:{' '}
                    {ventaSeleccionada.inventario?.sabor}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Venta:{' '}
                    <span className="font-bold">
                      {formatearPrecio(
                        ventaSeleccionada.precio_final
                      )}
                    </span>
                  </p>

                </div>
              )}

              {/* Tipo */}
              <div>

                <p className="mb-3 font-semibold text-slate-700">
                  Tipo de garantía
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      cambiarTipo(
                        'reemplazo'
                      )
                    }
                    disabled={guardando}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-bold transition ${
                      tipo === 'reemplazo'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCcw size={20} />
                    Reemplazo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarTipo(
                        'devolucion'
                      )
                    }
                    disabled={guardando}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-bold transition ${
                      tipo === 'devolucion'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw size={20} />
                    Devolución
                  </button>

                </div>

              </div>

              {/* Motivo */}
              <div>

                <label
                  htmlFor="motivoGarantia"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Motivo
                </label>

                <select
                  id="motivoGarantia"
                  value={motivo}
                  onChange={(e) =>
                    setMotivo(
                      e.target.value
                    )
                  }
                  disabled={guardando}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Selecciona un motivo
                  </option>

                  <option value="no_enciende">
                    No enciende
                  </option>

                  <option value="no_carga">
                    No carga
                  </option>

                  <option value="sabor_defectuoso">
                    Sabor defectuoso
                  </option>

                  <option value="fuga">
                    Fuga
                  </option>

                  <option value="golpeado">
                    Golpeado
                  </option>

                  <option value="otro">
                    Otro
                  </option>

                </select>

              </div>

              {/* Reemplazo */}
              {tipo === 'reemplazo' && (
                <div>

                  <label
                    htmlFor="unidadReemplazo"
                    className="mb-2 block font-semibold text-slate-700"
                  >
                    Unidad de reemplazo
                  </label>

                  <select
                    id="unidadReemplazo"
                    value={
                      inventarioReemplazoId
                    }
                    onChange={(e) =>
                      setInventarioReemplazoId(
                        e.target.value
                      )
                    }
                    disabled={
                      guardando ||
                      !ventaSeleccionada
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Selecciona una unidad
                    </option>

                    {unidadesReemplazo.map(
                      (unidad) => (
                        <option
                          key={unidad.id}
                          value={unidad.id}
                        >
                          Unidad #{unidad.id}
                          {' · '}
                          {unidad.sabor}
                        </option>
                      )
                    )}

                  </select>

                  {ventaSeleccionada &&
                    unidadesReemplazo.length ===
                      0 && (
                      <p className="mt-2 text-sm text-amber-600">
                        No hay unidades disponibles
                        del mismo producto para reemplazar.
                      </p>
                    )}

                </div>
              )}

              {/* Reembolso */}
              {tipo === 'devolucion' && (
                <div>

                  <label
                    htmlFor="montoReembolso"
                    className="mb-2 block font-semibold text-slate-700"
                  >
                    Monto del reembolso
                  </label>

                  <input
                    id="montoReembolso"
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoReembolso}
                    onChange={(e) =>
                      setMontoReembolso(
                        e.target.value
                      )
                    }
                    placeholder="Ej. 25000"
                    disabled={guardando}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />

                  {ventaSeleccionada && (
                    <p className="mt-2 text-xs text-slate-400">
                      Precio original:{' '}
                      {formatearPrecio(
                        ventaSeleccionada.precio_final
                      )}
                    </p>
                  )}

                </div>
              )}

              {/* Notas */}
              <div>

                <label
                  htmlFor="notasGarantia"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Notas
                  <span className="ml-1 font-normal text-slate-400">
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="notasGarantia"
                  value={notas}
                  onChange={(e) =>
                    setNotas(e.target.value)
                  }
                  rows="3"
                  placeholder="Detalles de la garantía..."
                  disabled={guardando}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Error */}
              {errorFormulario && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorFormulario}
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando
                    ? 'Registrando...'
                    : 'Registrar garantía'}
                </button>

              </div>

            </form>

          </section>

        </div>
      )}

    </main>
  )
}

export default Garantias