import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Building2, 
  BookOpen, 
  Calendar, 
  Database, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Sun, 
  Moon, 
  UserCircle, 
  ChevronDown,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, switchDemoUser, isAdmin, theme, toggleTheme } = useAuth();
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState<boolean>(false);

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

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'resources', label: 'Campus Rooms', icon: Building2, badge: 'Module A' },
    { id: 'listings', label: 'Peer Learning', icon: BookOpen, badge: 'Module B' },
    { id: 'sessions', label: 'Sessions & Requests', icon: Calendar },
    { id: 'dbms-lab', label: 'DBMS Evaluation Lab', icon: Database, highlight: true },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldCheck, badge: 'Admin' }] : []),
  ];

  return (
    <aside
      style={{
        width: 270,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 18px',
        flexShrink: 0,
        zIndex: 40,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Top Brand & Nav */}
      <div>
        {/* Brand */}
        <div
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 28 }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            <Layers size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                SeatSync
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#6366f1',
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontWeight: 700,
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                DBMS
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Campus Platform
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                style={item.highlight && !isActive ? { borderColor: 'rgba(99, 102, 241, 0.3)' } : {}}
              >
                <Icon size={18} color={isActive ? '#fff' : item.highlight ? '#818cf8' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && !isActive && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Theme, DB Health & Persona Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Controls Row: Theme Toggle & DB Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Database Health Pill */}
          <div
            title={dbHealthy ? 'PostgreSQL 16 connection active' : 'PostgreSQL in offline/memory mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-input)',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: dbHealthy ? '#10b981' : '#f59e0b',
                boxShadow: dbHealthy ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              }}
            />
            <span style={{ color: dbHealthy ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {dbHealthy ? 'PostgreSQL' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Persona Selector Card */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                className="persona-avatar"
                style={{
                  background:
                    user?.role === 'admin'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : user?.user_id === 2
                      ? 'linear-gradient(135deg, #ec4899, #be185d)'
                      : user?.user_id === 3
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                }}
              >
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Alex Chen'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.title || (user?.role === 'admin' ? 'Administrator' : 'Student')}
                </div>
              </div>
            </div>
            <ChevronDown size={16} color="var(--text-dim)" />
          </div>

          {/* Persona Dropdown Menu */}
          {isPersonaMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: 8,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-bright)',
                borderRadius: 12,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                padding: '8px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                Switch Evaluation Persona
              </div>

              {DEMO_PERSONAS.map((p) => {
                const isCurrent = user?.email.toLowerCase() === p.email.toLowerCase();
                return (
                  <div
                    key={p.email}
                    onClick={() => {
                      switchDemoUser(p.email);
                      setIsPersonaMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isCurrent ? '#6366f1' : 'var(--text-main)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {p.title}
                      </div>
                    </div>
                    {isCurrent && <CheckCircle size={15} color="#6366f1" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
