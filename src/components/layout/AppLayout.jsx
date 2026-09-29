import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  BarChart3, Boxes, ChevronUp, Gift, LogOut, Menu, Package, ShoppingCart, Store, Users, Wallet, X,
} from 'lucide-react'

const navigation = [
  { to: '/dashboard', label: 'Inicio', icon: BarChart3 },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/compras', label: 'Compras', icon: Store },
  { to: '/proveedores', label: 'Proveedores', icon: Users },
  { to: '/garantias', label: 'Garantías', icon: Gift },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
]

function AppLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white sm:flex">
        <Logo />
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => <NavigationItem key={item.to} item={item} />)}
        </nav>
        <UserArea usuario={usuario} cerrarSesion={cerrarSesion} />
      </aside>

      <div className="sm:ml-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:hidden">
          <Logo compact />
          <button onClick={() => setMenuAbierto(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100" aria-label="Abrir menú"><Menu size={23} /></button>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8"><Outlet /></main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white sm:hidden">
        <div className="grid grid-cols-4">
          {navigation.slice(0, 4).map((item) => <MobileNavigationItem key={item.to} item={item} />)}
        </div>
      </nav>

      {menuAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 sm:hidden" onClick={() => setMenuAbierto(false)}>
          <aside className="ml-auto flex h-full w-[88%] max-w-sm flex-col bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Vapitos</p><h2 className="text-xl font-bold text-slate-900">Menú</h2></div><button onClick={() => setMenuAbierto(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div>
            <nav className="mt-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => <NavigationItem key={item.to} item={item} onNavigate={() => setMenuAbierto(false)} />)}
            </nav>
            <div className="mt-auto border-t border-slate-200 pt-4"><p className="truncate px-2 text-xs text-slate-400">{usuario?.email}</p><button onClick={cerrarSesion} className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut size={20} />Cerrar sesión</button></div>
          </aside>
        </div>
      )}
    </div>
  )
}

function Logo({ compact = false }) {
  return <div className={`flex items-center gap-3 ${compact ? '' : 'border-b border-slate-200 px-6 py-5'}`}><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-black">V</div><div><h1 className="font-bold text-slate-900">Vapitos</h1><p className="text-xs text-slate-400">Gestión del negocio</p></div></div>
}

function NavigationItem({ item, onNavigate }) {
  const Icon = item.icon
  return <NavLink to={item.to} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={20} />{item.label}</NavLink>
}

function MobileNavigationItem({ item }) {
  const Icon = item.icon
  return <NavLink to={item.to} className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}><Icon size={21} />{item.label}</NavLink>
}

function UserArea({ usuario, cerrarSesion }) {
  return <div className="border-t border-slate-200 p-4"><p className="mb-3 truncate px-2 text-xs text-slate-400">{usuario?.email}</p><button onClick={cerrarSesion} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut size={20} />Cerrar sesión</button></div>
}

export default AppLayout
