import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { useCompras } from '../../hooks/useCompras'

function Compras() {
  const {
    compras,
    productos,
    proveedores,
    loading,
    loadingCatalogos,
    error,
    crearCompra,
  } = useCompras()

  const [modalAbierto, setModalAbierto] =
    useState(false)

  const [proveedorId, setProveedorId] =
    useState('')

  const [notas, setNotas] = useState('')

  const [detalles, setDetalles] = useState([
    {
      id: crypto.randomUUID(),
      producto_id: '',
      sabor: '',
      cantidad: 1,
      costo_unitario: '',
    },
  ])

  const [guardando, setGuardando] =
    useState(false)

  const [errorFormulario, setErrorFormulario] =
    useState('')

  const [compraExpandida, setCompraExpandida] =
    useState(null)

  const productosDisponibles = useMemo(() => {
    if (!proveedorId) {
      return []
    }

    return productos.filter(
      (producto) =>
        String(producto.proveedor_id) ===
        String(proveedorId)
    )
  }, [productos, proveedorId])

  const totalCompra = useMemo(() => {
    return detalles.reduce((total, detalle) => {
      const cantidad =
        Number(detalle.cantidad) || 0

      const costo =
        Number(detalle.costo_unitario) || 0

      return total + cantidad * costo
    }, 0)
  }, [detalles])

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

  const abrirModal = () => {
    setProveedorId('')
    setNotas('')

    setDetalles([
      {
        id: crypto.randomUUID(),
        producto_id: '',
        sabor: '',
        cantidad: 1,
        costo_unitario: '',
      },
    ])

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

  const cambiarProveedor = (valor) => {
    setProveedorId(valor)

    setDetalles((actuales) =>
      actuales.map((detalle) => ({
        ...detalle,
        producto_id: '',
        costo_unitario: '',
      }))
    )
  }

  const agregarDetalle = () => {
    setDetalles((actuales) => [
      ...actuales,
      {
        id: crypto.randomUUID(),
        producto_id: '',
        sabor: '',
        cantidad: 1,
        costo_unitario: '',
      },
    ])
  }

  const eliminarDetalle = (id) => {
    if (detalles.length === 1) {
      return
    }

    setDetalles((actuales) =>
      actuales.filter((detalle) => detalle.id !== id)
    )
  }

  const actualizarDetalle = (
    id,
    campo,
    valor
  ) => {
    setDetalles((actuales) =>
      actuales.map((detalle) => {
        if (detalle.id !== id) {
          return detalle
        }

        return {
          ...detalle,
          [campo]: valor,
        }
      })
    )
  }

  const seleccionarProducto = (
    id,
    productoId
  ) => {
    const producto = productos.find(
      (item) =>
        String(item.id) === String(productoId)
    )

    setDetalles((actuales) =>
      actuales.map((detalle) => {
        if (detalle.id !== id) {
          return detalle
        }

        return {
          ...detalle,
          producto_id: productoId,
          costo_unitario:
            producto?.costo_mayorista ?? '',
        }
      })
    )
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    setErrorFormulario('')

    if (!proveedorId) {
      setErrorFormulario(
        'Selecciona un proveedor.'
      )
      return
    }

    if (detalles.length === 0) {
      setErrorFormulario(
        'Agrega al menos un producto.'
      )
      return
    }

    for (const detalle of detalles) {
      if (!detalle.producto_id) {
        setErrorFormulario(
          'Selecciona un producto en todas las líneas.'
        )
        return
      }

      if (!detalle.sabor.trim()) {
        setErrorFormulario(
          'Escribe el sabor en todas las líneas.'
        )
        return
      }

      if (
        !detalle.cantidad ||
        Number(detalle.cantidad) <= 0
      ) {
        setErrorFormulario(
          'Todas las cantidades deben ser mayores que cero.'
        )
        return
      }

      if (
        detalle.costo_unitario === '' ||
        Number(detalle.costo_unitario) < 0
      ) {
        setErrorFormulario(
          'Todos los costos unitarios deben ser válidos.'
        )
        return
      }
    }

    try {
      setGuardando(true)

      await crearCompra({
        proveedor_id: Number(proveedorId),
        notas,
        detalles,
      })

      cerrarModal()
    } catch (error) {
      setErrorFormulario(
        error.message ||
          'No se pudo registrar la compra.'
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
            Compras
          </h1>

          <p className="mt-1 text-slate-500">
            Registra mercancía y agrega automáticamente
            las unidades al inventario.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModal}
          disabled={loadingCatalogos}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={20} />
          Nueva compra
        </button>
      </div>

      {/* ========================================
          ERROR GENERAL
      ========================================= */}
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message ||
            'Ocurrió un error cargando las compras.'}
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
                Historial de compras
              </h2>

              <p className="text-sm text-slate-500">
                {compras.length} compra
                {compras.length !== 1
                  ? 's'
                  : ''}
                {' '}registrada
                {compras.length !== 1
                  ? 's'
                  : ''}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Cargando compras...
          </div>
        ) : compras.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <History
                size={30}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Aún no tienes compras
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Registra tu primera compra para comenzar.
            </p>

            <button
              type="button"
              onClick={abrirModal}
              className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              Registrar compra
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {compras.map((compra) => {
              const expandida =
                compraExpandida === compra.id

              const cantidadUnidades =
                compra.detalle_compras?.reduce(
                  (total, detalle) =>
                    total +
                    Number(detalle.cantidad),
                  0
                ) ?? 0

              return (
                <article
                  key={compra.id}
                  className="p-5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCompraExpandida(
                        expandida
                          ? null
                          : compra.id
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">
                        {compra.proveedores?.nombre ||
                          'Proveedor'}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatearFecha(
                          compra.fecha_compra
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {cantidadUnidades} unidad
                        {cantidadUnidades !== 1
                          ? 'es'
                          : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">
                        {formatearPrecio(
                          compra.total
                        )}
                      </span>

                      {expandida ? (
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
                  </button>

                  {expandida && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <div className="space-y-3">
                        {compra.detalle_compras?.map(
                          (detalle) => (
                            <div
                              key={detalle.id}
                              className="flex flex-col gap-1 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {
                                    detalle
                                      .productos
                                      ?.marca
                                  }{' '}
                                  {
                                    detalle
                                      .productos
                                      ?.modelo
                                  }
                                </p>

                                <p className="text-sm text-slate-500">
                                  {detalle.sabor} ·{' '}
                                  {detalle.cantidad}{' '}
                                  unidades
                                </p>
                              </div>

                              <div className="text-sm font-semibold text-slate-700">
                                {formatearPrecio(
                                  detalle.costo_unitario
                                )}{' '}
                                c/u
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {compra.notas && (
                        <p className="mt-4 text-sm text-slate-500">
                          <strong>Notas:</strong>{' '}
                          {compra.notas}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

      </section>

      {/* ========================================
          MODAL NUEVA COMPRA
      ========================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">

            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Nueva compra
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registra la mercancía que acabas de comprar.
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
              className="mt-6 space-y-6"
            >

              {/* Proveedor */}
              <div>
                <label
                  htmlFor="proveedorCompra"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Proveedor
                </label>

                <select
                  id="proveedorCompra"
                  value={proveedorId}
                  onChange={(e) =>
                    cambiarProveedor(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingCatalogos ||
                    guardando
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Selecciona un proveedor
                  </option>

                  {proveedores.map(
                    (proveedor) => (
                      <option
                        key={proveedor.id}
                        value={proveedor.id}
                      >
                        {proveedor.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Productos */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Productos
                    </h3>

                    <p className="text-sm text-slate-500">
                      Agrega cada producto y sabor comprado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={agregarDetalle}
                    disabled={
                      !proveedorId ||
                      guardando
                    }
                    className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={17} />
                    Agregar
                  </button>
                </div>

                <div className="space-y-4">
                  {detalles.map(
                    (detalle, index) => (
                      <div
                        key={detalle.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-500">
                            Producto {index + 1}
                          </span>

                          {detalles.length >
                            1 && (
                            <button
                              type="button"
                              onClick={() =>
                                eliminarDetalle(
                                  detalle.id
                                )
                              }
                              disabled={guardando}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">

                          {/* Producto */}
                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Producto
                            </label>

                            <select
                              value={
                                detalle.producto_id
                              }
                              onChange={(e) =>
                                seleccionarProducto(
                                  detalle.id,
                                  e.target.value
                                )
                              }
                              disabled={
                                !proveedorId ||
                                guardando
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="">
                                {proveedorId
                                  ? 'Selecciona un producto'
                                  : 'Primero selecciona un proveedor'}
                              </option>

                              {productosDisponibles.map(
                                (producto) => (
                                  <option
                                    key={
                                      producto.id
                                    }
                                    value={
                                      producto.id
                                    }
                                  >
                                    {producto.marca}{' '}
                                    {
                                      producto.modelo
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          {/* Sabor */}
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Sabor
                            </label>

                            <input
                              type="text"
                              value={
                                detalle.sabor
                              }
                              onChange={(e) =>
                                actualizarDetalle(
                                  detalle.id,
                                  'sabor',
                                  e.target.value
                                )
                              }
                              placeholder="Ej. Mango"
                              disabled={guardando}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          {/* Cantidad */}
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Cantidad
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={
                                detalle.cantidad
                              }
                              onChange={(e) =>
                                actualizarDetalle(
                                  detalle.id,
                                  'cantidad',
                                  e.target.value
                                )
                              }
                              disabled={guardando}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          {/* Costo */}
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Costo unitario
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                detalle.costo_unitario
                              }
                              onChange={(e) =>
                                actualizarDetalle(
                                  detalle.id,
                                  'costo_unitario',
                                  e.target.value
                                )
                              }
                              disabled={guardando}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          {/* Subtotal */}
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Subtotal
                            </label>

                            <div className="rounded-xl bg-slate-200 px-3 py-3 font-bold text-slate-800">
                              {formatearPrecio(
                                (Number(
                                  detalle.cantidad
                                ) || 0) *
                                  (Number(
                                    detalle.costo_unitario
                                  ) || 0)
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label
                  htmlFor="notasCompra"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Notas
                  <span className="ml-1 font-normal text-slate-400">
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="notasCompra"
                  value={notas}
                  onChange={(e) =>
                    setNotas(e.target.value)
                  }
                  placeholder="Ej. Pedido recibido completo."
                  rows="3"
                  disabled={guardando}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Total */}
              <div className="rounded-2xl bg-blue-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">
                    Total de la compra
                  </span>

                  <span className="text-2xl font-bold text-blue-600">
                    {formatearPrecio(
                      totalCompra
                    )}
                  </span>
                </div>
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
                  className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando ||
                    loadingCatalogos
                  }
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando
                    ? 'Registrando compra...'
                    : 'Registrar compra'}
                </button>
              </div>

            </form>
          </section>
        </div>
      )}

    </main>
  )
}

export default Compras