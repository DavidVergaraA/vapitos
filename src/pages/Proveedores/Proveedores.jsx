import { useState } from 'react'
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { useProveedores } from '../../hooks/useProveedores'

function Proveedores() {
  const {
    proveedores,
    loading,
    error,
    agregarProveedor,
    editarProveedor,
    borrarProveedor,
  } = useProveedores()

  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')

  const [formulario, setFormulario] = useState({
    nombre: '',
    contacto: '',
    ubicacion: '',
  })

  const proveedoresFiltrados = proveedores.filter((proveedor) =>
    proveedor.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  const abrirNuevo = () => {
    setProveedorEditando(null)

    setFormulario({
      nombre: '',
      contacto: '',
      ubicacion: '',
    })

    setErrorFormulario('')
    setModalAbierto(true)
  }

  const abrirEditar = (proveedor) => {
    setProveedorEditando(proveedor)

    setFormulario({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || '',
      ubicacion: proveedor.ubicacion || '',
    })

    setErrorFormulario('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (guardando) return

    setModalAbierto(false)
    setProveedorEditando(null)
    setErrorFormulario('')
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const guardarProveedor = async (e) => {
    e.preventDefault()

    if (!formulario.nombre.trim()) {
      setErrorFormulario('El nombre del proveedor es obligatorio.')
      return
    }

    try {
      setGuardando(true)
      setErrorFormulario('')

      if (proveedorEditando) {
        await editarProveedor(
          proveedorEditando.id,
          {
            nombre: formulario.nombre.trim(),
            contacto: formulario.contacto.trim(),
            ubicacion: formulario.ubicacion.trim(),
          }
        )
      } else {
        await agregarProveedor({
          nombre: formulario.nombre.trim(),
          contacto: formulario.contacto.trim(),
          ubicacion: formulario.ubicacion.trim(),
        })
      }

      cerrarModal()
    } catch (error) {
      setErrorFormulario(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (proveedor) => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar a ${proveedor.nombre}?`
    )

    if (!confirmar) return

    try {
      await borrarProveedor(proveedor.id)
    } catch (error) {
      window.alert(`No se pudo eliminar: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-blue-600">
            Gestión del negocio
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Proveedores
          </h1>

          <p className="mt-1 text-slate-500">
            Administra las personas o empresas a quienes compras mercancía.
          </p>
        </div>

        <button
          onClick={abrirNuevo}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo proveedor
        </button>

      </div>


      {/* Error general */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
          No pudimos cargar los proveedores: {error.message}
        </div>
      )}


      {/* Buscador */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proveedor..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>


      {/* Lista */}
      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">
            Cargando proveedores...
          </p>
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Users size={30} className="text-slate-400" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {busqueda
              ? 'No encontramos proveedores'
              : 'Aún no tienes proveedores'}
          </h2>

          <p className="mt-2 text-slate-500">
            {busqueda
              ? 'Prueba con otro nombre.'
              : 'Agrega tu primer proveedor para comenzar.'}
          </p>

          {!busqueda && (
            <button
              onClick={abrirNuevo}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              Agregar proveedor
            </button>
          )}

        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {proveedoresFiltrados.map((proveedor) => (
            <article
              key={proveedor.id}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-slate-900">
                    {proveedor.nombre}
                  </h2>

                  {proveedor.contacto && (
                    <p className="mt-2 text-sm text-slate-500">
                      📱 {proveedor.contacto}
                    </p>
                  )}

                  {proveedor.ubicacion && (
                    <p className="mt-1 text-sm text-slate-500">
                      📍 {proveedor.ubicacion}
                    </p>
                  )}
                </div>

              </div>

              <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">

                <button
                  onClick={() => abrirEditar(proveedor)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-200"
                >
                  <Pencil size={17} />
                  Editar
                </button>

                <button
                  onClick={() => eliminar(proveedor)}
                  className="flex items-center justify-center rounded-xl px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar proveedor"
                >
                  <Trash2 size={18} />
                </button>

              </div>
            </article>
          ))}

        </div>
      )}


      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {proveedorEditando
                    ? 'Editar proveedor'
                    : 'Nuevo proveedor'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Completa la información del proveedor.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>

            </div>


            <form
              onSubmit={guardarProveedor}
              className="mt-6 space-y-4"
            >

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Nombre *
                </label>

                <input
                  name="nombre"
                  value={formulario.nombre}
                  onChange={manejarCambio}
                  placeholder="Ej. VapeStore"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>


              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Contacto
                </label>

                <input
                  name="contacto"
                  value={formulario.contacto}
                  onChange={manejarCambio}
                  placeholder="Teléfono, WhatsApp, etc."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>


              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Ubicación
                </label>

                <input
                  name="ubicacion"
                  value={formulario.ubicacion}
                  onChange={manejarCambio}
                  placeholder="Ej. Medellín"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>


              {errorFormulario && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                  {errorFormulario}
                </div>
              )}


              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {guardando
                    ? 'Guardando...'
                    : proveedorEditando
                      ? 'Guardar cambios'
                      : 'Guardar proveedor'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default Proveedores