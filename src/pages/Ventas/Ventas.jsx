import { useMemo, useState } from 'react'
import { CircleDollarSign, Edit3, Plus, UserPlus, WalletCards, X, Percent, UserRound, Landmark } from 'lucide-react'
import { useVentas } from '../../hooks/useVentas'
import { formatearFecha, formatearPesos } from '../../utils/formatters'

const pagos = [
  ['nequi', 'Nequi'],
  ['bancolombia', 'Bancolombia'],
  ['efectivo', 'Efectivo'],
]

const ventaInicial = {
  tipo_venta: 'normal',
  inventario_id: '',
  precio_final: '',
  monto_inicial: '',
  metodo_pago: '',
  notas: '',
  vendedor_externo_id: '',
  comision_tipo: 'fijo',
  comision_valor: '',
  destino_utilidad_externa: 'reinversion',
}

function Ventas() {
  const {
    ventas,
    inventarioDisponible,
    vendedores,
    loading,
    error,
    crearVenta,
    actualizarVenta,
    agregarAbono,
    crearVendedor,
    pagarComision,
  } = useVentas()

  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [procesandoComision, setProcesandoComision] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(ventaInicial)

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return ventas
    return ventas.filter((v) =>
      `${v.inventario?.productos?.marca} ${v.inventario?.productos?.modelo} ${v.inventario?.sabor} ${v.vendedores_externos?.nombre || ''} ${v.tipo_venta || ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [ventas, busqueda])

  const totalCobrado = ventas.reduce(
    (s, v) => s + (v.abonos_ventas || []).reduce((a, x) => a + Number(x.monto), 0),
    0
  )

  const totalPendiente = ventas.reduce((s, v) => {
    const pagado = (v.abonos_ventas || []).reduce((a, x) => a + Number(x.monto), 0)
    return s + Math.max(Number(v.precio_final) - pagado, 0)
  }, 0)

  const reset = () => setForm({ ...ventaInicial })

  const abrirNueva = () => {
    reset()
    setMensaje('')
    setModal('nueva')
  }

  const submitNueva = async (e) => {
    e.preventDefault()
    setMensaje('')
    try {
      setGuardando(true)
      await crearVenta(form)
      setModal(null)
    } catch (e) {
      setMensaje(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const submitEdicion = async (e) => {
    e.preventDefault()
    setMensaje('')
    try {
      setGuardando(true)
      await actualizarVenta(form)
      setModal(null)
    } catch (e) {
      setMensaje(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const abrirEdicion = (v) => {
    setForm({
      id: v.id,
      inventario_id: String(v.inventario_id),
      precio_final: String(v.precio_final),
      metodo_pago: v.metodo_pago,
      notas: v.notas || '',
      tipo_venta: v.tipo_venta || 'normal',
      vendedor_externo_id: v.vendedor_externo_id ? String(v.vendedor_externo_id) : '',
      comision_tipo: v.comision_tipo || 'fijo',
      comision_valor: v.comision_valor != null ? String(v.comision_valor) : '',
      destino_utilidad_externa: v.destino_utilidad_externa || 'reinversion',
    })
    setMensaje('')
    setModal('editar')
  }

  const abrirAbono = (v) => {
    setForm({ venta_id: v.id, monto: '', metodo_pago: '', notas: '' })
    setMensaje('')
    setModal('abono')
  }

  const submitAbono = async (e) => {
    e.preventDefault()
    setMensaje('')
    try {
      setGuardando(true)
      await agregarAbono(form)
      setModal(null)
    } catch (e) {
      setMensaje(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const agregarVendedor = async () => {
    const nombre = window.prompt('Nombre del vendedor externo')
    if (!nombre?.trim()) return
    const contacto = window.prompt('Contacto (opcional)') || ''
    try {
      await crearVendedor({ nombre, contacto })
    } catch (e) {
      window.alert(e.message)
    }
  }

  const calcularComisionPreview = () => {
    if (form.tipo_venta !== 'externa') return 0
    const precio = Number(form.precio_final) || 0
    const valor = Number(form.comision_valor) || 0
    return form.comision_tipo === 'porcentaje'
      ? Math.round((precio * valor) / 100)
      : valor
  }

  if (loading) {
    return <div className="rounded-3xl bg-white p-10 text-center text-slate-500">Cargando ventas...</div>
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold text-blue-600">Operación</p>
          <h1 className="mt-1 text-3xl font-bold">Ventas</h1>
          <p className="mt-1 text-slate-500">
            Ventas, abonos, cuentas por cobrar y vendedores externos.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={agregarVendedor} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700">
            <UserPlus size={18} className="mr-2 inline" />Vendedor
          </button>
          <button onClick={abrirNueva} disabled={!inventarioDisponible.length} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">
            <Plus size={18} className="mr-2 inline" />Nueva venta
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Ventas" value={ventas.length} />
        <Metric label="Cobrado" value={formatearPesos(totalCobrado)} />
        <Metric label="Por cobrar" value={formatearPesos(totalPendiente)} danger={totalPendiente > 0} />
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error.message}</div>}

      <section className="rounded-3xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto, sabor o vendedor..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {filtradas.map((v) => {
            const pagado = (v.abonos_ventas || []).reduce((s, a) => s + Number(a.monto), 0)
            const pendiente = Math.max(Number(v.precio_final) - pagado, 0)
            const utilidad = Number(v.precio_final) - Number(v.costo_unitario) - Number(v.comision_monto || 0)

            return (
              <article key={v.id} className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {v.inventario?.productos?.marca} {v.inventario?.productos?.modelo}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{v.inventario?.sabor}</span>
                      {v.tipo_venta === 'externa' && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">Externa</span>}
                      {v.tipo_venta === 'reventa_garantia' && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Reventa garantía</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">Venta #{v.id} · {formatearFecha(v.fecha_venta)}</p>

                    {v.tipo_venta === 'externa' && (
                      <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50 p-3">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                          <span className="font-semibold text-violet-900">
                            <UserRound size={15} className="mr-1 inline" />
                            {v.vendedores_externos?.nombre || 'Sin vendedor'}
                          </span>
                          <span className="text-violet-800">
                            <CircleDollarSign size={15} className="mr-1 inline" />
                            Comisión: <b>{formatearPesos(v.comision_monto)}</b>
                          </span>
                          <span className="text-violet-800">
                            Destino: <b>{v.destino_utilidad_externa === 'reinversion' ? 'Reinversión' : 'Utilidad'}</b>
                          </span>
                          <span className={v.estado_comision === 'pagada' ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                            Comisión {v.estado_comision === 'pagada' ? 'pagada' : 'pendiente'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
                    <Info label="Venta" value={formatearPesos(v.precio_final)} />
                    <Info label="Cobrado" value={formatearPesos(pagado)} />
                    <Info label="Pendiente" value={formatearPesos(pendiente)} danger={pendiente > 0} />
                    <Info label="Utilidad" value={formatearPesos(utilidad)} />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => abrirEdicion(v)} className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50" title="Editar">
                      <Edit3 size={18} />
                    </button>
                    {pendiente > 0 && (
                      <button onClick={() => abrirAbono(v)} className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white">
                        <WalletCards size={18} className="mr-2 inline" />Abonar
                      </button>
                    )}
                  </div>
                </div>

                {v.tipo_venta === 'externa' && v.estado_comision === 'pendiente' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      disabled={procesandoComision === v.id}
                      onClick={async () => {
                        try {
                          setProcesandoComision(v.id)
                          await pagarComision(v.id)
                        } catch (e) {
                          window.alert(e.message)
                        } finally {
                          setProcesandoComision(null)
                        }
                      }}
                      className="rounded-xl bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700"
                    >
                      {procesandoComision === v.id ? 'Guardando...' : 'Marcar comisión pagada'}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
          {!filtradas.length && <div className="p-10 text-center text-slate-400">No hay ventas que coincidan.</div>}
        </div>
      </section>

      {modal === 'nueva' && (
        <Modal title="Nueva venta" onClose={() => !guardando && setModal(null)}>
          <form onSubmit={submitNueva} className="space-y-4">
            <TipoVenta form={form} setForm={setForm} disabled={false} />
            <UnidadVenta form={form} setForm={setForm} inventarioDisponible={inventarioDisponible} />
            <PrecioVenta form={form} setForm={setForm} />
            <Payment value={form.metodo_pago} onChange={(v) => setForm({ ...form, metodo_pago: v })} />
            {form.tipo_venta === 'externa' && (
              <PanelExterna form={form} setForm={setForm} vendedores={vendedores} agregarVendedor={agregarVendedor} preview={calcularComisionPreview()} />
            )}
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Notas" className="field min-h-20" />
            {mensaje && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{mensaje}</p>}
            <Actions onClose={() => setModal(null)} loading={guardando} label="Registrar venta" />
          </form>
        </Modal>
      )}

      {modal === 'editar' && (
        <Modal title={`Editar venta #${form.id}`} onClose={() => !guardando && setModal(null)}>
          <form onSubmit={submitEdicion} className="space-y-4">
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              La edición no puede dejar el precio por debajo de lo que ya fue abonado. Los abonos existentes no se eliminan.
            </div>
            <TipoVenta form={form} setForm={setForm} disabled={form.tipo_venta === 'reventa_garantia'} />
            <UnidadVenta form={form} setForm={setForm} inventarioDisponible={inventarioDisponible} ventas={ventas} modoEdicion />
            <PrecioVenta form={form} setForm={setForm} />
            <Payment value={form.metodo_pago} onChange={(v) => setForm({ ...form, metodo_pago: v })} />
            {form.tipo_venta === 'externa' && (
              <PanelExterna form={form} setForm={setForm} vendedores={vendedores} agregarVendedor={agregarVendedor} preview={calcularComisionPreview()} />
            )}
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="field min-h-20" placeholder="Notas" />
            {mensaje && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{mensaje}</p>}
            <Actions onClose={() => setModal(null)} loading={guardando} label="Guardar cambios" />
          </form>
        </Modal>
      )}

      {modal === 'abono' && (
        <Modal title="Registrar abono" onClose={() => !guardando && setModal(null)}>
          <form onSubmit={submitAbono} className="space-y-4">
            <p className="text-sm text-slate-500">Registra solamente el dinero que recibiste hoy.</p>
            <label className="block text-sm font-semibold">Monto<input required type="number" min="1" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="field" /></label>
            <Payment value={form.metodo_pago} onChange={(v) => setForm({ ...form, metodo_pago: v })} />
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="field" placeholder="Notas del abono" />
            {mensaje && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{mensaje}</p>}
            <Actions onClose={() => setModal(null)} loading={guardando} label="Registrar abono" />
          </form>
        </Modal>
      )}
    </main>
  )
}

function TipoVenta({ form, setForm, disabled }) {
  return (
    <label className="block text-sm font-semibold">
      Tipo de venta
      <select disabled={disabled} value={form.tipo_venta} onChange={(e) => setForm({ ...form, tipo_venta: e.target.value })} className="field disabled:bg-slate-100">
        <option value="normal">Venta normal</option>
        <option value="externa">Vendedor externo</option>
        {form.tipo_venta === 'reventa_garantia' && <option value="reventa_garantia">Reventa de garantía</option>}
      </select>
    </label>
  )
}

function UnidadVenta({ form, setForm, inventarioDisponible, ventas = [], modoEdicion = false }) {
  const actual = ventas.find((v) => v.id === form.id)?.inventario
  const unidades = modoEdicion ? [...inventarioDisponible, actual].filter(Boolean).filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index) : inventarioDisponible
  return (
    <label className="block text-sm font-semibold">
      Unidad
      <select required value={form.inventario_id} onChange={(e) => setForm({ ...form, inventario_id: e.target.value })} className="field">
        <option value="">Selecciona...</option>
        {unidades.map((i) => <option key={i.id} value={i.id}>{i.productos?.marca} {i.productos?.modelo} · {i.sabor} · Unidad #{i.id}</option>)}
      </select>
    </label>
  )
}

function PrecioVenta({ form, setForm }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">Precio de venta<input required type="number" min="0" value={form.precio_final} onChange={(e) => setForm({ ...form, precio_final: e.target.value })} className="field" /></label>
      {form.id ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500"><b className="block text-slate-700">Edición financiera</b>El saldo pendiente se recalcula automáticamente con los abonos existentes.</div> : <label className="block text-sm font-semibold">Pago inicial<input type="number" min="0" value={form.monto_inicial} onChange={(e) => setForm({ ...form, monto_inicial: e.target.value })} className="field" placeholder="0 si queda pendiente" /></label>}
    </div>
  )
}

function PanelExterna({ form, setForm, vendedores, agregarVendedor, preview }) {
  return (
    <div className="space-y-4 rounded-3xl border border-violet-100 bg-violet-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="font-bold text-violet-950">Venta con vendedor externo</p><p className="text-xs text-violet-700">Aquí queda vinculada la comisión a esta venta.</p></div>
        <button type="button" onClick={agregarVendedor} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-violet-700 shadow-sm"><UserPlus size={15} className="mr-1 inline" />Vendedor</button>
      </div>
      <label className="block text-sm font-semibold">Vendedor<select required value={form.vendedor_externo_id} onChange={(e) => setForm({ ...form, vendedor_externo_id: e.target.value })} className="field bg-white"><option value="">Selecciona...</option>{vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Tipo de comisión<select value={form.comision_tipo} onChange={(e) => setForm({ ...form, comision_tipo: e.target.value })} className="field bg-white"><option value="fijo">Valor fijo</option><option value="porcentaje">Porcentaje</option></select></label>
        <label className="block text-sm font-semibold">{form.comision_tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Valor ($)'}<input required type="number" min="0" step="0.01" value={form.comision_valor} onChange={(e) => setForm({ ...form, comision_valor: e.target.value })} className="field bg-white" /></label>
      </div>
      <label className="block text-sm font-semibold">Destino de la utilidad restante<select value={form.destino_utilidad_externa} onChange={(e) => setForm({ ...form, destino_utilidad_externa: e.target.value })} className="field bg-white"><option value="reinversion">Reinversión</option><option value="utilidad">Utilidad normal</option></select></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary icon={UserRound} label="Vendedor" value={vendedores.find((v) => String(v.id) === String(form.vendedor_externo_id))?.nombre || '—'} />
        <Summary icon={CircleDollarSign} label="Comisión calculada" value={formatearPesos(preview)} />
        <Summary icon={Landmark} label="Destino" value={form.destino_utilidad_externa === 'reinversion' ? 'Reinversión' : 'Utilidad'} />
      </div>
    </div>
  )
}

function Summary({ icon: Icon, label, value }) {
  return <div className="rounded-2xl bg-white p-3"><p className="text-xs text-slate-400"><Icon size={13} className="mr-1 inline" />{label}</p><p className="mt-1 font-bold text-slate-800">{value}</p></div>
}

function Metric({ label, value, danger }) {
  return <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</p></div>
}

function Info({ label, value, danger }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className={`font-bold ${danger ? 'text-red-600' : 'text-slate-800'}`}>{value}</p></div>
}

function Payment({ value, onChange }) {
  return <div><p className="mb-2 text-sm font-semibold">Método de pago</p><div className="grid grid-cols-3 gap-2">{pagos.map(([v, l]) => <button type="button" key={v} onClick={() => onChange(v)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${value === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>{l}</button>)}</div></div>
}

function Actions({ onClose, loading, label }) {
  return <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-3 font-semibold">Cancelar</button><button disabled={loading} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Guardando...' : label}</button></div>
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button></div>{children}</div></div>
}

export default Ventas
