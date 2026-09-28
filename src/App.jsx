import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Proveedores from './pages/Proveedores/Proveedores'
import Productos from './pages/Productos/Productos'
import Compras from './pages/Compras/Compras'
import Inventario from './pages/Inventario/Inventario'
import Ventas from './pages/Ventas/Ventas'
import Garantias from './pages/Garantias/Garantias'
import Finanzas from './pages/Finanzas/Finanzas'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

function App() {
  const { session } = useAuth()

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/garantias" element={<Garantias />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/finanzas" element={<Finanzas />} />
        </Route>
        <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
