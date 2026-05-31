import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import MaintenancePage from './pages/MaintenancePage';
import TenantPortalPage from './pages/TenantPortal';
import MyReceiptsPage from './pages/MyReceipts';
import MyRequestsPage from './pages/MyRequests';
import ReceiptViewPage from './pages/ReceiptView';
import WelcomePage from './pages/WelcomePage';
import AiAssistantPage from './pages/AiAssistant';
import TenantsManagerPage from './pages/TenantsManager';
import PaymentCalendarPage from './pages/PaymentCalendar';
import TenantProfilePage from './pages/TenantProfile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Chargement...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Chargement...</div>;
  if (user) return <Navigate to="/app" replace />;
  return children;
};

const RedirectByRole = () => {
  const { user } = useAuth();
  if (user?.role === 'locataire') return <Navigate to="/app/tenant" replace />;
  return <Navigate to="/app/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PublicRoute><WelcomePage /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<RedirectByRole />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="properties" element={<PropertiesPage />} />
      <Route path="maintenance" element={<MaintenancePage />} />
      <Route path="tenant" element={<TenantPortalPage />} />
      <Route path="my-receipts" element={<MyReceiptsPage />} />
      <Route path="my-requests" element={<MyRequestsPage />} />
      <Route path="ai" element={<AiAssistantPage />} />
      <Route path="tenants" element={<TenantsManagerPage />} />
      <Route path="calendar" element={<PaymentCalendarPage />} />
      <Route path="tenants/:id" element={<TenantProfilePage />} />
    </Route>
    <Route path="/receipt/:paymentId" element={<ProtectedRoute><ReceiptViewPage /></ProtectedRoute>} />
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