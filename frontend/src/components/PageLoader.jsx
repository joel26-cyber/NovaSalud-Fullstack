export default function PageLoader({ text = 'Cargando información...' }) {
  return (
    <div className="page-loader">
      <div className="text-center">
        <div className="spinner-border text-danger mb-3" role="status" />
        <p className="text-muted mb-0">{text}</p>
      </div>
    </div>
  );
}
