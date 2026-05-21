import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Building2, FileText, Wrench,
  LogOut, Menu, X, Home, Receipt, ClipboardList, Sparkles, UserPlus, Calendar
} from 'lucide-react';
import './Layout.css';

const adminNavItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/app/properties', icon: Building2, label: 'Logements' },
  { to: '/app/leases', icon: FileText, label: 'Baux' },
  { to: '/app/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/app/ai', icon: Sparkles, label: 'Assistant IA' },
  { to: '/app/tenants', icon: UserPlus, label: 'Locataires' },
  { to: '/app/calendar', icon: Calendar, label: 'Calendrier' },

];

const tenantNavItems = [
  { to: '/app/tenant', icon: Home, label: 'Mon espace' },
  { to: '/app/my-receipts', icon: Receipt, label: 'Mes quittances' },
  { to: '/app/my-requests', icon: ClipboardList, label: 'Mes demandes' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLocataire = user?.role === 'locataire';
  const navItems = isLocataire ? tenantNavItems : adminNavItems;

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <span className="sidebar__logo">BailPro</span>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sidebar__nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__avatar">{user?.full_name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="sidebar__user">
            <span className="sidebar__user-name">{user?.full_name}</span>
            <span className="sidebar__user-role">{user?.role}</span>
          </div>
          <button className="sidebar__logout" onClick={logout}><LogOut size={16} /></button>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar__overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="layout__main">
        <header className="topbar">
          <button className="topbar__menu" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <span className="topbar__logo">BailPro</span>
          <NotificationBell />
          <div className="sidebar__avatar topbar__avatar">{user?.full_name?.[0]?.toUpperCase() || 'U'}</div>
        </header>
        <main className="layout__content"><Outlet /></main>
        <nav className="bottom-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}>
              <Icon size={20} /><span>{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
