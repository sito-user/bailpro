import React, { useState, useEffect } from 'react';
import { getLeases, getLeasePayments } from '../api/leases';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PaymentCalendar.css';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PaymentCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const leasesRes = await getLeases();
        const allLeases = leasesRes.data.data;
        setLeases(allLeases);

        const allPayments = [];
        for (const lease of allLeases) {
          const pRes = await getLeasePayments(lease.id);
          pRes.data.data.forEach(p => allPayments.push({
            ...p,
            tenant_name: lease.tenant_name,
            property_address: lease.property_address,
          }));
        }
        setPayments(allPayments);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return { daysInMonth, offset };
  };

  const getPaymentsForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return payments.filter(p => {
      const d = new Date(p.due_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  const { daysInMonth, offset } = getDaysInMonth();
  const isToday = (day) => {
    return today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day;
  };

  // Stats for current month
  const monthPayments = payments.filter(p => {
    const d = new Date(p.due_date);
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
  });
  const paidCount = monthPayments.filter(p => p.status === 'paid').length;
  const pendingCount = monthPayments.filter(p => p.status === 'pending').length;
  const totalRevenue = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="payment-calendar">
      <div className="page-header">
        <h1 className="page-title">Calendrier des paiements</h1>
        <p className="page-subtitle">Suivez les échéances de loyer</p>
      </div>

      {/* Month stats */}
      <div className="cal-stats">
        <div className="cal-stat">
          <span className="cal-stat__value cal-stat__value--green">{paidCount}</span>
          <span className="cal-stat__label">Payés</span>
        </div>
        <div className="cal-stat">
          <span className="cal-stat__value cal-stat__value--orange">{pendingCount}</span>
          <span className="cal-stat__label">En attente</span>
        </div>
        <div className="cal-stat">
          <span className="cal-stat__value">{formatAmount(totalRevenue)}</span>
          <span className="cal-stat__label">Encaissé ce mois</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="card cal-card">
        {/* Header */}
        <div className="cal-header">
          <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <h2 className="cal-month">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button className="cal-nav" onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>

        {/* Days of week */}
        <div className="cal-grid cal-grid--header">
          {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        </div>

        {/* Days */}
        {loading ? (
          <div className="page-status">Chargement...</div>
        ) : (
          <div className="cal-grid">
            {/* Empty cells */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPayments = getPaymentsForDay(day);
              const hasPaid = dayPayments.some(p => p.status === 'paid');
              const hasPending = dayPayments.some(p => p.status === 'pending');

              return (
                <div
                  key={day}
                  className={`cal-cell ${isToday(day) ? 'cal-cell--today' : ''} ${dayPayments.length > 0 ? 'cal-cell--has-events' : ''}`}
                  onClick={() => dayPayments.length > 0 && setSelected({ day, payments: dayPayments })}
                >
                  <span className="cal-cell__day">{day}</span>
                  {dayPayments.length > 0 && (
                    <div className="cal-cell__dots">
                      {hasPaid && <span className="cal-dot cal-dot--paid" />}
                      {hasPending && <span className="cal-dot cal-dot--pending" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="cal-legend">
          <span className="cal-legend__item"><span className="cal-dot cal-dot--paid" /> Payé</span>
          <span className="cal-legend__item"><span className="cal-dot cal-dot--pending" /> En attente</span>
        </div>
      </div>

      {/* Day detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selected.day} {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button className="modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal__body">
              {selected.payments.map(p => (
                <div key={p.id} className="cal-event">
                  <div className="cal-event__top">
                    <span className="cal-event__tenant">{p.tenant_name}</span>
                    <span className={`badge badge--${p.status === 'paid' ? 'available' : 'unpaid'}`}>
                      {p.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                  <span className="cal-event__address">{p.property_address}</span>
                  <span className="cal-event__amount">{formatAmount(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
