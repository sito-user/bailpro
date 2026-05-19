import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import LeasesPage from './pages/LeasesPage';
import MaintenancePage from './pages/MaintenancePage';
import TenantPortalPage from './pages/TenantPortal';
import MyReceiptsPage from './pages/MyReceipts';
import MyRequestsPage from './pages/MyRequests';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Chargement...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const RedirectByRole = () => {
  const { user } = useAuth();
  if (user?.role === 'locataire') return <Navigate to="/tenant" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<RedirectByRole />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="properties" element={<PropertiesPage />} />
      <Route path="leases" element={<LeasesPage />} />
      <Route path="maintenance" element={<MaintenancePage />} />
      <Route path="tenant" element={<TenantPortalPage />} />
      <Route path="my-receipts" element={<MyReceiptsPage />} />
      <Route path="my-requests" element={<MyRequestsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}