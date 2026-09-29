import { useMemo, useState } from 'react'
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Coins,
  History,
  LockKeyhole,
  Settings2,
  TrendingUp,
  Wallet,
  WalletCards,
  Clock3,
  X,
} from 'lucide-react'
import { useFinanzas } from '../../hooks/useFinanzas'
import {
  esDomingo,
  formatearRangoSemana,
  obtenerFechaColombia,
  obtenerInicioSemana,
  sumarDias,
} from '../../utils/dateUtils'
import { formatearFecha, formatearPesos } from '../../utils/formatters'

function Finanzas() {
  const hoy = obtenerFechaColombia()
  const [fechaInicio, setFechaInicio] = useState(obtenerInicioSemana(hoy))
  const fechaFin = useMemo(() => sumarDias(fechaInicio, 6), [fechaInicio])
  const [modalCierre, setModalCierre] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [notas, setNotas] = useState('')
  const [formConfig, setFormConfig] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const {
    resumen,
    configuracion,
    cierres,
    cierreActual,
    capital,
    loading,
    guardando,
    error,
    guardarConfiguracion,
    ejecutarCierre,
    pagarDistribucion,
    porCobrar,
    comisiones,
  } = useFinanzas(fechaInicio, fechaFin)

  const semanaEsCompleta = fechaFin <= hoy
  const puedeCerrar = semanaEsCompleta && !cierreActual
  const esSemanaActual = fechaInicio === obtenerInicioSemana(hoy)

  const distribucionPreview = useMemo(() => {
    if (!resumen || !configuracion) return null
    const utilidad = Math.max(0, Number(resumen.utilidad_real) || 0)
    return {
      reinversion: utilidad * Number(configuracion.porcentaje_reinversion) / 100 + Number(resumen.reinversion_ventas_externas || 0),
      socio1: utilidad * Number(configuracion.porcentaje_socio_1) / 100,
      socio2: utilidad * Number(configuracion.porcentaje_socio_2) / 100,
    }
  }, [resumen, configuracion])

  const abrirConfig = () => {
    setFormConfig({
      porcentaje_reinversion: configuracion?.porcentaje_reinversion ?? 40,
      porcentaje_socio_1: configuracion?.porcentaje_socio_1 ?? 30,
      porcentaje_socio_2: configuracion?.porcentaje_socio_2 ?? 30,
    })
    setMensaje('')
    setModalConfig(true)
  }

  const guardarConfig = async (e) => {
    e.preventDefault()
    const total = Object.values(formConfig).reduce((sum, value) => sum + Number(value || 0), 0)
    if (Math.abs(total - 100) > 0.001) {
      setMensaje('Los porcentajes deben sumar exactamente 100%.')
      return
    }
    try {
      await guardarConfiguracion(formConfig)
      setModalConfig(false)
    } catch (err) {
      setMensaje(err.message || 'No se pudo guardar la configuración.')
    }
  }

  const confirmarCierre = async () => {
    try {
      await ejecutarCierre({ fechaInicio, fechaFin, notas })
      setModalCierre(false)
      setNotas('')
      setMensaje('Semana cerrada correctamente.')
    } catch (err) {
      setMensaje(err.message || 'No se pudo cerrar la semana.')
    }
  }

  const irSemanaAnterior = () => setFechaInicio(sumarDias(fechaInicio, -7))
  const irSemanaSiguiente = () => {
    const siguiente = sumarDias(fechaInicio, 7)
    if (siguiente <= obtenerInicioSemana(hoy)) setFechaInicio(siguiente)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-semibold text-blue-600">Control financiero</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Finanzas</h1>
          <p className="mt-1 text-slate-500">Ventas, utilidad, reinversión y cierres semanales.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={abrirConfig} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50">
            <Settings2 size={18} /> Porcentajes
          </button>
          <button
            onClick={() => setModalCierre(true)}
            disabled={!puedeCerrar || guardando}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole size={18} /> Cerrar semana
          </button>
        </div>
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={21} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Semana</p>
              <p className="font-bold text-slate-900">{formatearRangoSemana(fechaInicio, fechaFin)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={irSemanaAnterior} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Anterior</button>
            <button onClick={() => setFechaInicio(obtenerInicioSemana(hoy))} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200">Actual</button>
            <button onClick={irSemanaSiguiente} disabled={esSemanaActual} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {cierreActual ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700"><CheckCircle2 size={16} /> Semana cerrada</span>
          ) : semanaEsCompleta ? (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">Semana completa y lista para cierre manual</span>
          ) : (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">Semana en curso</span>
          )}
          {esSemanaActual && !esDomingo(hoy) && !cierreActual && (
            <span className="text-slate-400">El cierre de la semana actual queda disponible cuando termine el domingo.</span>
          )}
        </div>
      </section>

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div>}
      {mensaje && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</div>}

      {loading ? (
        <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Cargando resumen financiero...</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={Banknote} label="Ventas" value={formatearPesos(resumen?.total_ventas)} />
            <Metric icon={WalletCards} label="Cobrado" value={formatearPesos(resumen?.total_cobrado)} />
            <Metric icon={Clock3} label="Por cobrar" value={formatearPesos(resumen?.por_cobrar)} />
            <Metric icon={Coins} label="Comisiones" value={formatearPesos(resumen?.comisiones_externas)} />
            <Metric icon={Wallet} label="Utilidad real" value={formatearPesos(resumen?.utilidad_real)} strong />
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Distribución estimada</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Si cerraras esta semana hoy</h2>
                </div>
                <Wallet className="text-blue-600" />
              </div>
              <div className="mt-5 space-y-3">
                <DistributionRow label="Reinversión" percent={configuracion?.porcentaje_reinversion} value={distribucionPreview?.reinversion} /><p className="text-xs text-slate-400">Incluye {formatearPesos(resumen?.reinversion_ventas_externas)} provenientes de ventas externas.</p>
                <DistributionRow label="Socio 1" percent={configuracion?.porcentaje_socio_1} value={distribucionPreview?.socio1} />
                <DistributionRow label="Socio 2" percent={configuracion?.porcentaje_socio_2} value={distribucionPreview?.socio2} />
              </div>
              <p className="mt-4 text-xs text-slate-400">Las distribuciones se calculan sobre utilidad real positiva, no sobre ventas.</p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-300">Capital de reinversión</p>
                  <h2 className="mt-1 text-3xl font-bold">{formatearPesos(capital.saldo)}</h2>
                </div>
                <Wallet size={30} />
              </div>
              <p className="mt-3 text-sm text-slate-300">Incluye reinversiones reservadas y se descuenta cuando registras una compra.</p>
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Movimientos</p>
                <p className="mt-1 text-lg font-bold">{capital.movimientos.length}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Cuentas por cobrar</h2>
              <p className="mt-1 text-sm text-slate-500">Ventas que todavía tienen saldo pendiente.</p>
              <div className="mt-4 space-y-2">
                {porCobrar.slice(0, 8).map(v => <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">#{v.id} · {v.inventario?.productos?.marca} {v.inventario?.productos?.modelo}</p><p className="text-xs text-slate-400">Pagado {formatearPesos(v.pagado)}</p></div><b className="text-red-600">{formatearPesos(v.pendiente)}</b></div>)}
                {!porCobrar.length && <p className="text-sm text-slate-400">No hay saldos pendientes.</p>}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Comisiones de vendedores</h2>
              <p className="mt-1 text-sm text-slate-500">Seguimiento de ventas hechas por terceros.</p>
              <div className="mt-4 space-y-2">
                {comisiones.slice(0, 8).map(v => <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{v.vendedores_externos?.nombre || 'Vendedor'} · Venta #{v.id}</p><p className="text-xs text-slate-400">Comisión {formatearPesos(v.comision_monto)}</p></div><span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">Externa</span></div>)}
                {!comisiones.length && <p className="text-sm text-slate-400">No hay ventas externas.</p>}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <History size={20} className="text-blue-600" />
              <div>
                <h2 className="font-bold text-slate-900">Historial de cierres</h2>
                <p className="text-sm text-slate-500">Las cifras quedan guardadas con los porcentajes usados ese día.</p>
              </div>
            </div>
            {cierres.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Todavía no hay semanas cerradas.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cierres.map((cierre) => (
                  <div key={cierre.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{formatearRangoSemana(cierre.fecha_inicio, cierre.fecha_fin)}</p>
                        <p className="mt-1 text-sm text-slate-500">Cerrado {formatearFecha(cierre.cerrado_at)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <SmallStat label="Ventas" value={formatearPesos(cierre.total_ventas)} />
                        <SmallStat label="Costo" value={formatearPesos(cierre.costo_mercancia_vendida)} />
                        <SmallStat label="Garantías" value={formatearPesos(cierre.perdidas_garantias)} />
                        <SmallStat label="Utilidad" value={formatearPesos(cierre.utilidad_real)} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(cierre.distribuciones ?? []).map((distribucion) => (
                        <div key={distribucion.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <span className="font-semibold text-slate-700">{distribucion.tipo === 'reinversion' ? 'Reinversión' : distribucion.socios?.nombre || 'Socio'}</span>
                          <span className="text-slate-500">{formatearPesos(distribucion.monto)}</span>
                          {distribucion.tipo === 'socio' && distribucion.estado === 'pendiente' ? (
                            <button
                              onClick={() => pagarDistribucion(distribucion.id)}
                              disabled={guardando}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Marcar pagado
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">{distribucion.estado}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {modalCierre && (
        <Modal title="Cerrar semana" onClose={() => !guardando && setModalCierre(false)}>
          <div className="space-y-5">
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
              Vas a cerrar <strong>{formatearRangoSemana(fechaInicio, fechaFin)}</strong>. Después de guardar, la cifra queda como histórico y los porcentajes utilizados quedan congelados.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SmallStat label="Ventas" value={formatearPesos(resumen?.total_ventas)} />
              <SmallStat label="Utilidad real" value={formatearPesos(resumen?.utilidad_real)} />
            </div>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows="3" placeholder="Notas del cierre (opcional)" disabled={guardando} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setModalCierre(false)} disabled={guardando} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700">Cancelar</button>
              <button onClick={confirmarCierre} disabled={guardando} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">{guardando ? 'Cerrando...' : 'Confirmar cierre'}</button>
            </div>
          </div>
        </Modal>
      )}

      {modalConfig && formConfig && (
        <Modal title="Configuración de distribución" onClose={() => !guardando && setModalConfig(false)}>
          <form onSubmit={guardarConfig} className="space-y-5">
            <p className="text-sm text-slate-500">Estos porcentajes se usarán en futuros cierres. Los cierres ya realizados no cambian.</p>
            <ConfigInput label="Reinversión" value={formConfig.porcentaje_reinversion} onChange={(value) => setFormConfig({ ...formConfig, porcentaje_reinversion: value })} />
            <ConfigInput label="Socio 1" value={formConfig.porcentaje_socio_1} onChange={(value) => setFormConfig({ ...formConfig, porcentaje_socio_1: value })} />
            <ConfigInput label="Socio 2" value={formConfig.porcentaje_socio_2} onChange={(value) => setFormConfig({ ...formConfig, porcentaje_socio_2: value })} />
            {mensaje && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{mensaje}</div>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalConfig(false)} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold">Cancelar</button>
              <button type="submit" disabled={guardando} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">Guardar porcentajes</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  )
}

function Metric({ icon: Icon, label, value, strong = false }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Icon size={20} className="text-blue-600" />
      </div>
      <p className={`mt-3 text-2xl font-bold ${strong ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function DistributionRow({ label, percent, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <div><p className="font-semibold text-slate-800">{label}</p><p className="text-xs text-slate-400">{Number(percent || 0)}%</p></div>
      <p className="font-bold text-slate-900">{formatearPesos(value)}</p>
    </div>
  )
}

function SmallStat({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>
}

function ConfigInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-slate-700">{label}</span>
      <div className="relative"><input type="number" min="0" max="100" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span></div>
    </label>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6">
      <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>
        {children}
      </section>
    </div>
  )
}

export default Finanzas
