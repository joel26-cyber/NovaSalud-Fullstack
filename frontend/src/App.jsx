import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import VentaDetalle from './pages/VentaDetalle';
import Historial from './pages/Historial';
import Medicamentos from './pages/Medicamentos';
import MedicamentoForm from './pages/MedicamentoForm';
import Lotes from './pages/Lotes';
import LoteForm from './pages/LoteForm';
import Vencimientos from './pages/Vencimientos';
import Inventario from './pages/Inventario';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ventas" element={<POS />} />
            <Route path="ventas/:id" element={<VentaDetalle />} />
            <Route path="historial" element={<Historial />} />
            <Route path="medicamentos" element={<Medicamentos />} />
            <Route path="lotes" element={<Lotes />} />
            <Route path="vencimientos" element={<Vencimientos />} />

            <Route element={<AdminRoute />}>
              <Route path="medicamentos/nuevo" element={<MedicamentoForm />} />
              <Route path="medicamentos/:id/editar" element={<MedicamentoForm />} />
              <Route path="lotes/nuevo" element={<LoteForm />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
