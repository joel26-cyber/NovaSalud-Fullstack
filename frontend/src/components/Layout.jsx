import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'bi-grid', label: 'Dashboard' },
  { to: '/ventas', icon: 'bi-cart3', label: 'Punto de venta' },
  { to: '/historial', icon: 'bi-receipt', label: 'Historial de ventas' },
  { to: '/medicamentos', icon: 'bi-capsule', label: 'Medicamentos' },
  { to: '/lotes', icon: 'bi-box-seam', label: 'Lotes' },
  { to: '/vencimientos', icon: 'bi-calendar2-check', label: 'Vencimientos' },
  { to: '/inventario', icon: 'bi-arrow-left-right', label: 'Inventario', adminOnly: true },
  { to: '/reportes', icon: 'bi-bar-chart', label: 'Reportes', adminOnly: true },
  { to: '/usuarios', icon: 'bi-people', label: 'Usuarios y ajustes', adminOnly: true },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const handleLogout = async () => {
    const accepted = await confirm({
      title: 'Cerrar sesión',
      message: '¿Deseas salir del sistema? Tendrás que ingresar tus credenciales nuevamente.',
      confirmText: 'Sí, cerrar sesión',
    });
    if (!accepted) return;
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-brand-link">
            <img src="/assets/img/logo-horizontal.png" alt="NOVA SALUD" className="sidebar-logo-img" />
          </Link>
        </div>
        <nav className="nav flex-column sidebar-nav">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop show"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-wrap">
        <header className="topbar">
          <button
            className="btn btn-light d-lg-none"
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label="Abrir menú"
          >
            <i className="bi bi-list" />
          </button>
          <div className="ms-auto d-flex align-items-center gap-3">
            <div className="text-end">
              <strong>{user?.nombres}</strong>
              <small className="d-block text-muted">{user?.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : ''}</small>
            </div>
            <button className="btn btn-outline-secondary btn-sm" title="Cerrar sesión" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </header>

        <main className="content container-fluid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
