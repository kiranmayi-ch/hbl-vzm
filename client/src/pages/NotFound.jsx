import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-content">
      <div className="empty-state" style={{minHeight:'60vh'}}>
        <h1 className="text-5xl font-extrabold text-amber">404</h1>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-secondary">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn btn-primary">
          <Home size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
