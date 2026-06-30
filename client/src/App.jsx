import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MySection from './pages/MySection';
import PlantOverview from './pages/PlantOverview';
import AllSections from './pages/AllSections';
import MonthlyTrends from './pages/MonthlyTrends';
import Reports from './pages/Reports';
import WhatsAppReports from './pages/WhatsAppReports';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-section" element={
          <ProtectedRoute roles={['admin', 'section_user']}>
            <MySection />
          </ProtectedRoute>
        } />
        <Route path="/plant-overview" element={<PlantOverview />} />
        <Route path="/all-sections" element={<AllSections />} />
        <Route path="/trends" element={<MonthlyTrends />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/whatsapp" element={<WhatsAppReports />} />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
