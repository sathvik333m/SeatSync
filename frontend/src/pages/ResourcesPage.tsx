import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Filter
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [minCapacity, setMinCapacity] = useState<string>('');

  // Booking Modal State
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [purpose, setPurpose] = useState<string>('Peer Study & Database Review');
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);

  // My Reservations tab state
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-bookings'>('catalog');
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Alert State
  const [alert, setAlert] = useState<{
    type: 'error' | 'success' | 'dbms_conflict' | 'info';
    title?: string;
    message: string;
    dbmsRule?: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    loadResources();
  }, [typeFilter, minCapacity]);

  useEffect(() => {
    if (activeTab === 'my-bookings') {
      loadMyBookings();
    }
  }, [activeTab]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await api.getResources({
        type: typeFilter || undefined,
        minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined,
      });
      setResources(res.data);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const res = await api.getMyReservations();
      setMyBookings(res.data);
    } catch (err: any) {
      console.error('Failed to load my reservations:', err);
    }
  };

  const handleOpenBooking = async (resource: any) => {
    setSelectedResource(resource);
    setAlert(null);
    await fetchResourceSchedule(resource.resource_id, bookingDate);
  };

  const fetchResourceSchedule = async (resourceId: number, date: string) => {
    try {
      const res = await api.getResourceSchedule(resourceId, date);
      setScheduleData(res.data);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    }
  };

  const handleDateChange = async (date: string) => {
    setBookingDate(date);
    if (selectedResource) {
      await fetchResourceSchedule(selectedResource.resource_id, date);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    setBookingLoading(true);
    setAlert(null);

    const fullStart = `${bookingDate}T${startTime}:00Z`;
    const fullEnd = `${bookingDate}T${endTime}:00Z`;

    try {
      const res = await api.createReservation({
        resourceId: selectedResource.resource_id,
        startTime: fullStart,
        endTime: fullEnd,
        purpose,
      });

      setAlert({
        type: 'success',
        title: 'Reservation Confirmed (Transaction 1)',
        message: `Successfully booked "${selectedResource.name}" from ${startTime} to ${endTime} UTC. GiST exclusion check passed.`,
      });

      // Refresh schedule
      await fetchResourceSchedule(selectedResource.resource_id, bookingDate);
      loadMyBookings();
    } catch (err: any) {
      setAlert({
        type: err.dbmsRule ? 'dbms_conflict' : 'error',
        title: err.dbmsRule ? 'PostgreSQL Conflict Encountered' : 'Booking Error',
        message: err.message || 'Booking failed.',
        dbmsRule: err.dbmsRule,
        detail: err.detail,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm('Are you sure you want to cancel this reservation? Linked learning sessions will also be cancelled.')) return;
    try {
      await api.cancelReservation(reservationId);
      setAlert({
        type: 'info',
        title: 'Reservation Cancelled',
        message: 'The reservation and any linked sessions were updated atomically to cancelled.',
      });
      loadMyBookings();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to cancel reservation.',
      });
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem' }}>
            <Building2 size={16} /> MODULE A: RESOURCE RESERVATION
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginTop: 4 }}>Campus Facilities & Rooms</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Reserve laboratories, seminar rooms, and quiet study pods with database-enforced non-overlapping exclusion constraints.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-card)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('catalog')}
          >
            Browse Facilities
          </button>
          <button
            className={`btn ${activeTab === 'my-bookings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('my-bookings')}
          >
            My Reservations
          </button>
        </div>
      </div>

      {alert && (
        <AlertBanner
          type={alert.type}
          title={alert.title}
          message={alert.message}
          dbmsRule={alert.dbmsRule}
          detail={alert.detail}
          onClose={() => setAlert(null)}
        />
      )}

      {activeTab === 'catalog' ? (
        <>
          {/* Filters Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Filter size={16} /> Filter by:
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minWidth: 160 }}
            >
              <option value="">All Resource Types</option>
              <option value="study_room">Study Rooms</option>
              <option value="lab">Laboratories</option>
              <option value="meeting_room">Meeting / Seminar Halls</option>
              <option value="other">Other Studios</option>
            </select>

            <select
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minWidth: 160 }}
            >
              <option value="">Any Capacity</option>
              <option value="4">4+ Persons</option>
              <option value="8">8+ Persons</option>
              <option value="15">15+ Persons</option>
            </select>

            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Showing {resources.length} active campus resources
            </div>
          </div>

          {/* Resources Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {resources.map((resource) => (
              <div
                key={resource.resource_id}
                className="glass-panel"
                style={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#60a5fa',
                        borderRadius: 6,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {resource.resource_type.replace('_', ' ')}
                    </span>
                    <StatusBadge status={resource.is_active ? 'active' : 'inactive'} />
                  </div>

                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 6 }}>
                    {resource.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    <MapPin size={15} color="#10b981" />
                    <span>{resource.location}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Users size={15} color="#3b82f6" />
                    <span>Capacity: <strong style={{ color: 'var(--text-main)' }}>{resource.capacity} students</strong></span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleOpenBooking(resource)}
                >
                  <Calendar size={16} /> Check Availability & Book
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* My Bookings Tab */
        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: 18 }}>Your Reservation History</h2>

          {myBookings.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              No reservation history found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myBookings.map((b) => (
                <div
                  key={b.reservation_id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                        {b.resource_name}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {b.location} • Booked: {new Date(b.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#60a5fa', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} />
                      <span>
                        {new Date(b.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} —{' '}
                        {new Date(b.end_time).toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {b.status === 'confirmed' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      onClick={() => handleCancelReservation(b.reservation_id)}
                    >
                      <Trash2 size={14} /> Cancel Booking
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {selectedResource && (
        <Modal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          title={`Reserve ${selectedResource.name}`}
        >
          <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div><strong>Location:</strong> {selectedResource.location}</div>
              <div><strong>Capacity:</strong> {selectedResource.capacity} students</div>
              <div style={{ marginTop: 4, color: '#3b82f6', fontSize: '0.78rem' }}>
                Protected by PostgreSQL Transaction 1 with FOR UPDATE row locks & GiST exclusion constraints.
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Reservation Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Existing Schedule for date */}
            {scheduleData && (
              <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  Active Bookings & Maintenance for {bookingDate}:
                </div>

                {scheduleData.reservations.length === 0 && scheduleData.maintenance.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#34d399' }}>
                    ✓ No conflicting reservations or maintenance scheduled on this date.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {scheduleData.maintenance.map((m: any) => (
                      <div key={m.maintenance_id} style={{ fontSize: '0.78rem', color: '#fb7185', background: 'rgba(244,63,94,0.15)', padding: '4px 8px', borderRadius: 4 }}>
                        ⚠️ Maintenance: {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(m.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({m.reason})
                      </div>
                    ))}
                    {scheduleData.reservations.map((r: any) => (
                      <div key={r.reservation_id} style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '4px 8px', borderRadius: 4 }}>
                        🔒 Reserved: {new Date(r.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(r.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (by {r.booked_by})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Time Slot Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Start Time (UTC)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  End Time (UTC)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Purpose / Session Topic
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="input-field"
                placeholder="e.g. DBMS Group Study, Code Sprint"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedResource(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Executing Transaction...' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
