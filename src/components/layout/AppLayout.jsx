import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BarChart3, Boxes, Gift, LogOut, Menu, Package, ShoppingBag, Store, Users, Wallet, X, UserRound } from 'lucide-react'

const navigation = [
  { to:'/dashboard', label:'Inicio', icon:BarChart3 },
  { to:'/ventas', label:'Ventas', icon:ShoppingBag },
  { to:'/inventario', label:'Inventario', icon:Boxes },
  { to:'/productos', label:'Productos', icon:Package },
  { to:'/compras', label:'Compras', icon:Store },
  { to:'/garantias', label:'Garantías', icon:Gift },
  { to:'/finanzas', label:'Finanzas', icon:Wallet },
  { to:'/proveedores', label:'Proveedores', icon:Users },
]

function AppLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const [open, setOpen] = useState(false)
  return <div className="vapitos-shell min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white sm:flex">
      <Brand />
      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">{navigation.map(item=><NavigationItem key={item.to} item={item}/>)}</nav>
      <div className="border-t border-slate-100 p-4"><div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">{(usuario?.email||'V')[0].toUpperCase()}</div><p className="truncate text-xs font-semibold text-slate-500">{usuario?.email}</p></div><button onClick={cerrarSesion} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut size={18}/>Cerrar sesión</button></div>
    </aside>
    <div className="sm:ml-64">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:hidden"><Brand compact/><button onClick={()=>setOpen(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"><Menu/></button></header>
      <main className="mx-auto max-w-[1500px] px-4 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-10"><Outlet/></main>
    </div>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"><div className="grid grid-cols-4">{navigation.slice(0,4).map(item=><MobileItem key={item.to} item={item}/>)}</div></nav>
    {open && <div className="fixed inset-0 z-50 bg-slate-950/40 sm:hidden" onClick={()=>setOpen(false)}><aside onClick={e=>e.stopPropagation()} className="ml-auto flex h-full w-[88%] max-w-sm flex-col bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><Brand compact/><button onClick={()=>setOpen(false)} className="rounded-xl p-2 text-slate-400"><X/></button></div><nav className="mt-6 flex-1 space-y-1 overflow-y-auto">{navigation.map(item=><NavigationItem key={item.to} item={item} onNavigate={()=>setOpen(false)}/>)}</nav><button onClick={cerrarSesion} className="flex items-center gap-3 border-t border-slate-100 pt-5 font-bold text-red-600"><LogOut size={18}/>Cerrar sesión</button></aside></div>}
  </div>
}
function Brand({compact=false}){return <div className={`flex items-center gap-3 ${compact?'':'border-b border-slate-100 px-5 py-5'}`}><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200">V</div><div><p className="font-black tracking-tight text-slate-950">Vapitos</p><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Business OS</p></div></div>}
function NavigationItem({item,onNavigate}){const Icon=item.icon;return <NavLink to={item.to} onClick={onNavigate} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${isActive?'bg-blue-600 text-white shadow-lg shadow-blue-100':'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={19}/>{item.label}</NavLink>}
function MobileItem({item}){const Icon=item.icon;return <NavLink to={item.to} className={({isActive})=>`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-bold ${isActive?'text-blue-600':'text-slate-400'}`}><Icon size={20}/>{item.label}</NavLink>}
export default AppLayout
