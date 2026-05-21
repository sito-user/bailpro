import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import './NotificationBell.css';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'gestionnaire';

  useEffect(() => {
    if (!isAdmin) return;

    const load = () => {
      client.get('/notifications')
        .then(res => {
          setNotifications(res.data.data);
          setUnread(res.data.unread);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAdmin) return null;

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getIcon = (type) => {
    return type === 'late_payment' ? '⚠️' : '🔧';
  };

  const getPriorityColor = (priority) => {
    const colors = { urgent: '#dc2626', high: '#f59e0b', medium: '#6366f1', low: '#71717a' };
    return colors[priority] || '#71717a';
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button className="notif-trigger" onClick={() => setOpen(!open)}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <h3>Notifications</h3>
            {unread > 0 && <span className="notif-count">{unread} non lue(s)</span>}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={24} color="var(--color-gray-300)" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notif-item notif-item--${n.type}`}>
                  <span className="notif-icon">{getIcon(n.type)}</span>
                  <div className="notif-content">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-message">{n.message}</span>
                    {n.priority && (
                      <span className="notif-priority" style={{ color: getPriorityColor(n.priority) }}>
                        Priorité : {n.priority}
                      </span>
                    )}
                    {n.amount && (
                      <span className="notif-amount">
                        {new Intl.NumberFormat('fr-FR').format(n.amount)} FCFA
                      </span>
                    )}
                  </div>
                  <span className="notif-date">{formatDate(n.date)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
