import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
} from 'lucide-react'

import { useProductos } from '../../hooks/useProductos'
import { useProveedores } from '../../hooks/useProveedores'

function Productos() {
  const {
    productos,
    loading,
    error,
    agregarProducto,
    editarProducto,
    borrarProducto,
  } = useProductos()

  const {
    proveedores,
    loading: loadingProveedores,
  } = useProveedores()

  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)

  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [puffs, setPuffs] = useState('')
  const [costoMayorista, setCostoMayorista] = useState('')
  const [proveedorId, setProveedorId] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim()

    if (!texto) {
      return productos
    }

    return productos.filter((producto) => {
      return (
        producto.marca.toLowerCase().includes(texto) ||
        producto.modelo.toLowerCase().includes(texto) ||
        producto.proveedores?.nombre
          ?.toLowerCase()
          .includes(texto)
      )
    })
  }, [productos, busqueda])

  const abrirCrear = () => {
    setProductoEditando(null)

    setMarca('')
    setModelo('')
    setPuffs('')
    setCostoMayorista('')
    setProveedorId('')

    setErrorFormulario('')
    setModalAbierto(true)
  }

  const abrirEditar = (producto) => {
    setProductoEditando(producto)

    setMarca(producto.marca)
    setModelo(producto.modelo)
    setPuffs(producto.puffs ?? '')
    setCostoMayorista(producto.costo_mayorista)
    setProveedorId(producto.proveedor_id)

    setErrorFormulario('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (guardando) {
      return
    }

    setModalAbierto(false)
    setProductoEditando(null)
    setErrorFormulario('')
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    setErrorFormulario('')

    if (!proveedorId) {
      setErrorFormulario('Selecciona un proveedor.')
      return
    }

    if (!marca.trim()) {
      setErrorFormulario('La marca es obligatoria.')
      return
    }

    if (!modelo.trim()) {
      setErrorFormulario('El modelo es obligatorio.')
      return
    }

    if (!costoMayorista || Number(costoMayorista) < 0) {
      setErrorFormulario(
        'Ingresa un costo mayorista válido.'
      )
      return
    }

    try {
      setGuardando(true)

      const datos = {
        proveedor_id: Number(proveedorId),
        marca: marca.trim(),
        modelo: modelo.trim(),
        puffs: puffs ? Number(puffs) : null,
        costo_mayorista: Number(costoMayorista),
      }

      if (productoEditando) {
        await editarProducto(
          productoEditando.id,
          datos
        )
      } else {
        await agregarProducto(datos)
      }

      cerrarModal()
    } catch (error) {
      setErrorFormulario(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const manejarEliminar = async (producto) => {
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar "${producto.marca} ${producto.modelo}"?`
    )

    if (!confirmado) {
      return
    }

    try {
      await borrarProducto(producto.id)
    } catch (error) {
      window.alert(
        error.message ||
          'No se pudo eliminar el producto.'
      )
    }
  }

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor)
  }

  return (
    <main className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Productos
          </h1>

          <p className="mt-1 text-slate-500">
            Gestiona los productos que manejas en Vapitos.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo producto
        </button>
      </div>

      {/* Buscador */}
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por marca, modelo o proveedor..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      {/* Error general */}
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message ||
            'Ocurrió un error cargando los productos.'}
        </div>
      )}

      {/* Lista */}
      <section className="rounded-3xl bg-white shadow-sm">

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Cargando productos...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Package
                size={30}
                className="text-slate-400"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-800">
              No hay productos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {busqueda
                ? 'No encontramos productos con esa búsqueda.'
                : 'Agrega tu primer producto para comenzar.'}
            </p>

            {!busqueda && (
              <button
                type="button"
                onClick={abrirCrear}
                className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              >
                Agregar producto
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {productosFiltrados.map((producto) => (
              <article
                key={producto.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">
                    {producto.marca} {producto.modelo}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Proveedor:{' '}
                    <span className="font-semibold text-slate-700">
                      {producto.proveedores?.nombre ||
                        'Sin proveedor'}
                    </span>
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {producto.puffs && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {producto.puffs.toLocaleString()} puffs
                      </span>
                    )}

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {formatearPrecio(
                        producto.costo_mayorista
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEditar(producto)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                  >
                    <Pencil size={18} />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      manejarEliminar(producto)
                    }
                    className="flex items-center justify-center rounded-xl border border-red-100 px-4 py-3 text-red-600 transition hover:bg-red-50"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {productoEditando
                    ? 'Editar producto'
                    : 'Nuevo producto'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Completa la información del producto.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={manejarSubmit}
              className="mt-6 space-y-5"
            >

              {/* Proveedor */}
              <div>
                <label
                  htmlFor="proveedor"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Proveedor
                </label>

                <select
                  id="proveedor"
                  value={proveedorId}
                  onChange={(e) =>
                    setProveedorId(e.target.value)
                  }
                  disabled={loadingProveedores}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    {loadingProveedores
                      ? 'Cargando proveedores...'
                      : 'Selecciona un proveedor'}
                  </option>

                  {proveedores.map((proveedor) => (
                    <option
                      key={proveedor.id}
                      value={proveedor.id}
                    >
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div>
                <label
                  htmlFor="marca"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Marca
                </label>

                <input
                  id="marca"
                  type="text"
                  value={marca}
                  onChange={(e) =>
                    setMarca(e.target.value)
                  }
                  placeholder="Ej. Vaporesso"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Modelo */}
              <div>
                <label
                  htmlFor="modelo"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Modelo
                </label>

                <input
                  id="modelo"
                  type="text"
                  value={modelo}
                  onChange={(e) =>
                    setModelo(e.target.value)
                  }
                  placeholder="Ej. XROS 4"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Puffs */}
              <div>
                <label
                  htmlFor="puffs"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Puffs
                </label>

                <input
                  id="puffs"
                  type="number"
                  min="1"
                  value={puffs}
                  onChange={(e) =>
                    setPuffs(e.target.value)
                  }
                  placeholder="Ej. 10000"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Costo */}
              <div>
                <label
                  htmlFor="costoMayorista"
                  className="mb-2 block font-semibold text-slate-700"
                >
                  Costo mayorista
                </label>

                <input
                  id="costoMayorista"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoMayorista}
                  onChange={(e) =>
                    setCostoMayorista(e.target.value)
                  }
                  placeholder="Ej. 20000"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                    ? 'Guardando...'
                    : productoEditando
                      ? 'Guardar cambios'
                      : 'Crear producto'}
                </button>
              </div>

            </form>

          </section>
        </div>
      )}

    </main>
  )
}

export default Productos