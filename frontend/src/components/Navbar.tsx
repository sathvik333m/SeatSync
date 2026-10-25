import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Building2, 
  BookOpen, 
  Calendar, 
  Database, 
  ShieldCheck, 
  UserCircle, 
  Activity, 
  Layers
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, switchDemoUser, isAdmin } = useAuth();
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await api.getHealth();
        setDbHealthy(res.database?.connected ?? false);
      } catch {
        setDbHealthy(false);
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => clearInterval(interval);
  }, []);

  const demoAccounts = [
    { name: 'Alex Chen', email: 'alex.chen@campus.edu', role: 'Student / React Teacher' },
    { name: 'Priya Sharma', email: 'priya.sharma@campus.edu', role: 'Student / SQL Teacher' },
    { name: 'Elena Rostova', email: 'elena.rostova@campus.edu', role: 'Student / Learner' },
    { name: 'Campus Admin', email: 'admin@campus.edu', role: 'Administrator' },
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Brand */}
        <div
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Layers size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                SeatSync
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#60a5fa',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                DBMS CORE
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Campus Resource Reservation & Peer Learning
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={16} /> Overview
          </button>
          <button
            className={`btn ${activeTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('resources')}
          >
            <Building2 size={16} /> Campus Rooms
          </button>
          <button
            className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('listings')}
          >
            <BookOpen size={16} /> Peer Learning
          </button>
          <button
            className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('sessions')}
          >
            <Calendar size={16} /> Sessions & Requests
          </button>
          <button
            className={`btn ${activeTab === 'dbms-lab' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderColor: activeTab === 'dbms-lab' ? 'transparent' : 'rgba(99, 102, 241, 0.4)',
            }}
            onClick={() => setActiveTab('dbms-lab')}
          >
            <Database size={16} color="#60a5fa" /> DBMS Evaluation Lab
          </button>
          {isAdmin && (
            <button
              className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={16} color="#34d399" /> Admin
            </button>
          )}
        </nav>

        {/* User Persona Switcher & DB Health */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* DB Indicator */}
          <div
            title={dbHealthy ? 'PostgreSQL 16 connection active' : 'PostgreSQL not reachable'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '6px 12px',
              borderRadius: 9999,
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dbHealthy ? '#10b981' : '#f43f5e',
                boxShadow: dbHealthy ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
              }}
            />
            <span style={{ color: dbHealthy ? '#6ee7b7' : '#fda4af', fontWeight: 600 }}>
              {dbHealthy ? 'PostgreSQL' : 'DB Offline'}
            </span>
          </div>

          {/* Persona Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCircle size={18} color="#94a3b8" />
            <select
              value={user?.email || ''}
              onChange={(e) => switchDemoUser(e.target.value)}
              className="input-field"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                width: 'auto',
                background: 'rgba(30, 41, 59, 0.8)',
                borderColor: 'var(--border-bright)',
                color: '#fff',
              }}
            >
              {demoAccounts.map((acc) => (
                <option key={acc.email} value={acc.email}>
                  {acc.name} ({acc.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
