import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const destination = user ? '/dashboard' : '/login';

  return (
    <div className="not-found-wrap">
      <div className="panel not-found-card text-center">
        <div className="not-found-code" aria-hidden="true">404</div>
        <div className="not-found-icon" aria-hidden="true">
          <i className="bi bi-compass" />
        </div>
        <h1>Página no encontrada</h1>
        <p>La dirección que intentaste abrir no existe o fue movida dentro del sistema.</p>
        <Link className="btn btn-primary px-4" to={destination}>
          <i className="bi bi-arrow-left me-2" />
          {user ? 'Volver al dashboard' : 'Ir al inicio de sesión'}
        </Link>
      </div>
    </div>
  );
}
