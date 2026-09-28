import { useMemo, useState } from 'react'
import {
  Banknote,
  CreditCard,
  History,
  Landmark,
  Plus,
  X,
} from 'lucide-react'

import { useVentas } from '../../hooks/useVentas'

function Ventas() {
  const {
    ventas,
    inventarioDisponible,
    loading,
    loadingInventario,
    error,
    crearVenta,
  } = useVentas()

  const [modalAbierto, setModalAbierto] =
    useState(false)

  const [inventarioId, setInventarioId] =
    useState('')

  const [precioFinal, setPrecioFinal] =
    useState('')

  const [metodoPago, setMetodoPago] =
    useState('')

  const [notas, setNotas] = useState('')

  const [guardando, setGuardando] =
    useState(false)

  const [errorFormulario, setErrorFormulario] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const ventasFiltradas = useMemo(() => {
    const texto = busqueda
      .toLowerCase()
      .trim()

    if (!texto) {
      return ventas
    }

    return ventas.filter((venta) => {
      const marca =
        venta.inventario?.productos?.marca || ''

      const modelo =
        venta.inventario?.productos?.modelo || ''

      const sabor =
        venta.inventario?.sabor || ''

      return (
        marca.toLowerCase().includes(texto) ||
        modelo.toLowerCase().includes(texto) ||
        sabor.toLowerCase().includes(texto) ||
        venta.metodo_pago
          .toLowerCase()
          .includes(texto)
      )
    })
  }, [ventas, busqueda])

  const ventaSeleccionada =
    inventarioDisponible.find(
      (unidad) =>
        String(unidad.id) ===
        String(inventarioId)
    )

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

  const obtenerNombrePago = (metodo) => {
    const nombres = {
      nequi: 'Nequi',
      bancolombia: 'Bancolombia',
      efectivo: 'Efectivo',
    }

    return nombres[metodo] || metodo
  }

  const abrirModal = () => {
    setInventarioId('')
    setPrecioFinal('')
    setMetodoPago('')
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

  const manejarSubmit = async (e) => {
    e.preventDefault()

    setErrorFormulario('')

    if (!inventarioId) {
      setErrorFormulario(
        'Selecciona una unidad.'
      )
      return
    }

    if (
      precioFinal === '' ||
      Number(precioFinal) < 0
    ) {
      setErrorFormulario(
        'Ingresa un precio de venta válido.'
      )
      return
    }

    if (!metodoPago) {
      setErrorFormulario(
        'Selecciona un método de pago.'
      )
      return
    }

    try {
      setGuardando(true)

      await crearVenta({
        inventario_id: Number(inventarioId),
        precio_final: Number(precioFinal),
        metodo_pago: metodoPago,
        notas,
      })

      cerrarModal()
    } catch (error) {
      setErrorFormulario(
        error.message ||
          'No se pudo registrar la venta.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="space-y-6">

      {/* ========================================
          ENCABEZADO
      ========================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="font-semibold text-blue-600">
            Gestión del negocio
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Ventas
          </h1>

          <p className="mt-1 text-slate-500">
            Registra ventas y controla las unidades que salen del inventario.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModal}
          disabled={
            loadingInventario ||
            inventarioDisponible.length === 0
          }
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={20} />
          Nueva venta
        </button>

      </div>

      {/* ========================================
          RESUMEN
      ========================================= */}
      <div className="grid grid-cols-2 gap-3">

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Disponibles para vender
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {inventarioDisponible.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Ventas registradas
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {ventas.length}
          </p>
        </div>

      </div>

      {/* ========================================
          ERROR GENERAL
      ========================================= */}
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message ||
            'Ocurrió un error cargando las ventas.'}
        </div>
      )}

      {/* ========================================
          HISTORIAL
      ========================================= */}
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
                Historial de ventas
              </h2>

              <p className="text-sm text-slate-500">
                Consulta las ventas realizadas.
              </p>
            </div>

          </div>

          {/* Buscador */}
          <div className="mt-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar venta..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Cargando ventas...
          </div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="p-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <History
                size={30}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              {busqueda
                ? 'No encontramos ventas'
                : 'Aún no hay ventas'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {busqueda
                ? 'Prueba con otra búsqueda.'
                : 'Registra tu primera venta para comenzar.'}
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {ventasFiltradas.map((venta) => (
              <article
                key={venta.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >

                <div>
                  <h3 className="font-bold text-slate-900">
                    {venta.inventario?.productos?.marca}{' '}
                    {venta.inventario?.productos?.modelo}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {venta.inventario?.sabor}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {obtenerNombrePago(
                        venta.metodo_pago
                      )}
                    </span>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Exitosa
                    </span>

                    <span className="text-xs text-slate-400">
                      {formatearFecha(
                        venta.fecha_venta
                      )}
                    </span>

                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xl font-bold text-slate-900">
                    {formatearPrecio(
                      venta.precio_final
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Costo:{' '}
                    {formatearPrecio(
                      venta.costo_unitario
                    )}
                  </p>
                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* ========================================
          MODAL NUEVA VENTA
      ======================================== */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Nueva venta
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Selecciona la unidad que vas a vender.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>

            </div>

            <form
              onSubmit={manejarSubmit}
              className="mt-6 space-y-5"
            >

              {/* ==================================
                  UNIDAD
              ================================== */}
              <div>

                <label
                  htmlFor="unidadVenta"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Unidad
                </label>

                <select
                  id="unidadVenta"
                  value={inventarioId}
                  onChange={(e) =>
                    setInventarioId(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingInventario ||
                    guardando
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Selecciona una unidad
                  </option>

                  {inventarioDisponible.map(
                    (unidad) => (
                      <option
                        key={unidad.id}
                        value={unidad.id}
                      >
                        {unidad.productos?.marca}{' '}
                        {unidad.productos?.modelo}
                        {' · '}
                        {unidad.sabor}
                        {' · '}
                        Unidad #{unidad.id}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* ==================================
                  INFORMACIÓN UNIDAD
              ================================== */}
              {ventaSeleccionada && (
                <div className="rounded-2xl bg-blue-50 p-4">

                  <p className="font-bold text-slate-900">
                    {ventaSeleccionada.productos?.marca}{' '}
                    {ventaSeleccionada.productos?.modelo}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Sabor: {ventaSeleccionada.sabor}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Costo:
                    {' '}
                    <span className="font-bold">
                      {formatearPrecio(
                        ventaSeleccionada.productos
                          ?.costo_mayorista
                      )}
                    </span>
                  </p>

                </div>
              )}

              {/* ==================================
                  PRECIO
              ================================== */}
              <div>

                <label
                  htmlFor="precioVenta"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Precio de venta
                </label>

                <input
                  id="precioVenta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioFinal}
                  onChange={(e) =>
                    setPrecioFinal(
                      e.target.value
                    )
                  }
                  placeholder="Ej. 50000"
                  disabled={guardando}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* ==================================
                  MÉTODO DE PAGO
              ================================== */}
              <div>

                <p className="mb-3 font-semibold text-slate-700">
                  Método de pago
                </p>

                <div className="grid grid-cols-3 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setMetodoPago('nequi')
                    }
                    disabled={guardando}
                    className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-bold transition ${
                      metodoPago === 'nequi'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={22} />
                    Nequi
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMetodoPago(
                        'bancolombia'
                      )
                    }
                    disabled={guardando}
                    className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-bold transition ${
                      metodoPago ===
                      'bancolombia'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Landmark size={22} />
                    Bancolombia
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMetodoPago('efectivo')
                    }
                    disabled={guardando}
                    className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-bold transition ${
                      metodoPago ===
                      'efectivo'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote size={22} />
                    Efectivo
                  </button>

                </div>

              </div>

              {/* ==================================
                  NOTAS
              ================================== */}
              <div>

                <label
                  htmlFor="notasVenta"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Notas
                  <span className="ml-1 font-normal text-slate-400">
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="notasVenta"
                  value={notas}
                  onChange={(e) =>
                    setNotas(e.target.value)
                  }
                  rows="2"
                  placeholder="Observaciones..."
                  disabled={guardando}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* ==================================
                  ERROR
              ================================== */}
              {errorFormulario && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorFormulario}
                </div>
              )}

              {/* ==================================
                  BOTONES
              ================================== */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
                    : 'Registrar venta'}
                </button>

              </div>

            </form>

          </section>

        </div>
      )}

    </main>
  )
}

export default Ventas