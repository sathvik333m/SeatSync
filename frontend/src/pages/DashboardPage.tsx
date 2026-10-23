import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Building2, 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    activeResources: 0,
    confirmedReservations: 0,
    publishedListings: 0,
    scheduledSessions: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes, reservationsRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getUpcomingSessionsReport(),
        api.getMyReservations(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats);
      if (sessionsRes.status === 'fulfilled') setUpcomingSessions(sessionsRes.value.data.slice(0, 4));
      if (reservationsRes.status === 'fulfilled') setMyReservations(reservationsRes.value.data.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '32px',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--hero-gradient)',
          border: '1px solid var(--border-bright)',
        }}
      >
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <ShieldCheck size={16} /> PostgreSQL Transaction & Concurrency Engineered Platform
          </div>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--text-main)', marginBottom: 12, lineHeight: 1.15 }}>
            Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.name || 'Student'}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 24 }}>
            Reserve campus study facilities, discover peer-led technical workshops, and collaborate without booking conflicts. Every reservation is serialized at the database engine level.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('resources')}
            >
              <Building2 size={18} /> Reserve a Campus Room
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('listings')}
            >
              <BookOpen size={18} /> Explore Peer Skills
            </button>
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
              onClick={() => setActiveTab('dbms-lab')}
            >
              <TrendingUp size={18} color="#818cf8" /> DBMS Evaluation Lab
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAMPUS RESOURCES</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: 8, borderRadius: 10 }}>
              <Building2 size={20} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.activeResources || 5}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: 4 }}>
            Active labs, pods & halls
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONFIRMED BOOKINGS</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: 8, borderRadius: 10 }}>
              <Calendar size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.confirmedReservations || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Guaranteed zero overlaps
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUBLISHED SKILLS</span>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: 8, borderRadius: 10 }}>
              <BookOpen size={20} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.publishedListings || 4}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#a855f7', marginTop: 4 }}>
            React, SQL, Python, Docker
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED WORKSHOPS</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: 8, borderRadius: 10 }}>
              <Users size={20} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.scheduledSessions || 2}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Capacity enforced by DB lock
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Sessions & My Reservations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
        {/* Left: Upcoming Peer Sessions */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Upcoming Peer Sessions</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Multi-table joins: listings + teacher + room reservation
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setActiveTab('sessions')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {upcomingSessions.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
                No scheduled peer sessions yet.
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div
                  key={session.session_id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                      {session.title}
                    </div>
                    <StatusBadge status="scheduled" />
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={14} color="#818cf8" />
                      <span>Teacher: <strong style={{ color: 'var(--text-main)' }}>{session.teacher}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={14} color="#34d399" />
                      <span>{session.room}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={14} color="#fbbf24" />
                      <span>{new Date(session.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Seats Enrolled: <strong style={{ color: 'var(--text-main)' }}>{session.enrolled_learners}</strong> / {session.capacity}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Personal Bookings & History */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>My Campus Reservations</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Active time slots booked under your account
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setActiveTab('resources')}
            >
              Book New <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myReservations.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
                You have no active room reservations. Explore Campus Rooms to book a slot.
              </div>
            ) : (
              myReservations.map((res) => (
                <div
                  key={res.reservation_id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {res.resource_name}
                    </div>
                    <StatusBadge status={res.status} />
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Location: {res.location}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#818cf8" />
                    <span>
                      {new Date(res.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                      ({new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>

                  {res.linked_session_title && (
                    <div style={{ fontSize: '0.74rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: 6 }}>
                      Linked Session: {res.linked_session_title}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
