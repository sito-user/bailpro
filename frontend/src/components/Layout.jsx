import React from 'react';
import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Building2, FileText, Wrench, LogOut, Menu, X } from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/properties', icon: Building2, label: 'Logements' },
  { to: '/leases', icon: FileText, label: 'Baux' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
