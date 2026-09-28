import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, ChartNoAxesCombined, CircleDollarSign, Gift, ShoppingCart, Wallet } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useDashboard } from '../../hooks/useDashboard'
import { formatearPesos } from '../../utils/formatters'

function Dashboard() {
  const { usuario } = useAuth()
  const { resumen, loading, error, recargar } = useDashboard()
  const nombre = usuario?.email?.split('@')[0] || 'equipo'

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={recargar} />

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Resumen del negocio</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Hola, {nombre}</h1>
        <p className="mt-1 text-slate-500">Aquí tienes el estado de Vapitos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ventas de hoy" value={formatearPesos(resumen.ventasHoy)} icon={CircleDollarSign} />
        <Metric label="Utilidad de hoy" value={formatearPesos(resumen.utilidadHoy)} icon={ChartNoAxesCombined} />
        <Metric label="Disponibles" value={resumen.inventarioDisponible} icon={Boxes} suffix="unidades" />
        <Metric label="Garantías hoy" value={resumen.garantiasHoy} icon={Gift} suffix="casos" />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Semana en curso</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Control financiero</h2>
            </div>
            <Wallet className="text-blue-600" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Mini label="Ventas" value={formatearPesos(resumen.semana?.total_ventas)} />
            <Mini label="Utilidad real" value={formatearPesos(resumen.semana?.utilidad_real)} />
          </div>
          <Link to="/finanzas" className="mt-4 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">Abrir finanzas <ArrowRight size={17} /></Link>
        </div>

        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-slate-300">Acciones rápidas</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickLink to="/ventas" icon={CircleDollarSign} label="Nueva venta" />
            <QuickLink to="/compras" icon={ShoppingCart} label="Nueva compra" />
            <QuickLink to="/inventario" icon={Boxes} label="Inventario" />
            <QuickLink to="/garantias" icon={Gift} label="Garantías" />
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, icon: Icon, suffix }) {
  return <div className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><Icon size={20} className="text-blue-600" /></div><p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>{suffix && <p className="mt-1 text-sm text-slate-400">{suffix}</p>}</div>
}

function Mini({ label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-800">{value}</p></div>
}

function QuickLink({ to, icon: Icon, label }) {
  return <Link to={to} className="flex min-h-24 flex-col justify-between rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"><Icon size={20} /><span className="font-bold">{label}</span></Link>
}

function Loading() {
  return <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Cargando resumen...</div>
}

function ErrorState({ error, onRetry }) {
  return <div className="rounded-3xl bg-red-50 p-6"><p className="font-bold text-red-700">No pudimos cargar el resumen.</p><p className="mt-2 text-sm text-red-600">{error.message}</p><button onClick={onRetry} className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-bold text-white">Intentar nuevamente</button></div>
}

export default Dashboard
