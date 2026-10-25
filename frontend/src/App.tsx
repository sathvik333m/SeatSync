import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { PeerLearningPage } from './pages/PeerLearningPage';
import { SessionsPage } from './pages/SessionsPage';
import { DbmsLabPage } from './pages/DbmsLabPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { Layers, Database, ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <main style={{ flex: 1, paddingBottom: 40 }}>
          {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
          {activeTab === 'resources' && <ResourcesPage />}
          {activeTab === 'listings' && <PeerLearningPage />}
          {activeTab === 'sessions' && <SessionsPage />}
          {activeTab === 'dbms-lab' && <DbmsLabPage />}
          {activeTab === 'admin' && <AdminPortalPage />}
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            padding: '20px 32px',
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={15} color="#3b82f6" />
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>SeatSync</span> — Campus Resource Reservation & Peer Learning
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Database size={14} color="#10b981" /> PostgreSQL 16
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={14} color="#3b82f6" /> btree_gist GiST Exclusions
              </span>
              <span>DBMS College Project</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
