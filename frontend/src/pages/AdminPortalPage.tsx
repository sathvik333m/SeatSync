import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { AlertBanner } from '../components/AlertBanner';
import { 
  ShieldCheck, 
  Wrench, 
  Building2, 
  PlusCircle, 
  AlertTriangle, 
  Clock, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const AdminPortalPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState<boolean>(false);

  // New Resource Form
  const [resName, setResName] = useState<string>('');
  const [resLocation, setResLocation] = useState<string>('');
  const [resCapacity, setResCapacity] = useState<number>(10);
  const [resType, setResType] = useState<string>('study_room');

  // Maintenance Form
  const [maintResourceId, setMaintResourceId] = useState<string>('');
  const [maintStartDate, setMaintStartDate] = useState<string>(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [maintStartTime, setMaintStartTime] = useState<string>('08:00');
  const [maintEndTime, setMaintEndTime] = useState<string>('12:00');
  const [maintReason, setMaintReason] = useState<string>('Network switch firmware patching');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    type: 'error' | 'success' | 'dbms_conflict' | 'info';
    title?: string;
    message: string;
    dbmsRule?: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [resList, maintList, statsRes] = await Promise.all([
        api.getResources(),
        api.getMaintenanceList(),
        api.getAdminStats(),
      ]);
      setResources(resList.data);
      setMaintenanceList(maintList.data);
      setStats(statsRes.stats);
      if (resList.data.length > 0 && !maintResourceId) {
        setMaintResourceId(String(resList.data[0].resource_id));
      }
    } catch (err: any) {
      console.error('Failed to load admin portal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    try {
      await api.createResource({
        name: resName,
        location: resLocation,
        capacity: resCapacity,
        resourceType: resType,
      });

      setAlert({
        type: 'success',
        title: 'Resource Created',
        message: `Successfully created "${resName}" with capacity of ${resCapacity}.`,
      });

      setIsResourceModalOpen(false);
      setResName('');
      setResLocation('');
      loadAdminData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to create resource.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    const fullStart = `${maintStartDate}T${maintStartTime}:00Z`;
    const fullEnd = `${maintStartDate}T${maintEndTime}:00Z`;

    try {
      const res = await api.scheduleMaintenance({
        resourceId: parseInt(maintResourceId, 10),
        startTime: fullStart,
        endTime: fullEnd,
        reason: maintReason,
      });

      setAlert({
        type: res.conflicts?.length > 0 ? 'info' : 'success',
        title: res.conflicts?.length > 0 ? 'Maintenance Scheduled with Warning' : 'Maintenance Scheduled',
        message: res.message,
      });

      setIsMaintModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      setAlert({
        type: err.dbmsRule ? 'dbms_conflict' : 'error',
        message: err.message || 'Failed to schedule maintenance.',
        dbmsRule: err.dbmsRule,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: 40 }}>
          <ShieldCheck size={48} color="#f43f5e" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: 8 }}>Administrator Privileges Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            You are currently logged in as a student. To evaluate the Administrator portal, switch to <strong>Campus Admin</strong> in the top-right persona selector.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>
            <ShieldCheck size={16} /> ADMINISTRATOR CONTROL PORTAL
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginTop: 4 }}>Campus Operations & Maintenance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage physical campus facilities, schedule maintenance intervals, and detect booking overlap collisions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsResourceModalOpen(true)}
          >
            <PlusCircle size={16} /> Add Campus Room
          </button>
          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            onClick={() => setIsMaintModalOpen(true)}
          >
            <Wrench size={16} /> Schedule Maintenance
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

      {/* Maintenance Intervals List */}
      <div className="glass-panel" style={{ padding: 28, marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 6 }}>
          Scheduled Resource Maintenance Periods
        </h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 18 }}>
          Enforced cross-table during booking creation in Transaction 1 to serialize against booking attempts.
        </div>

        {maintenanceList.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
            No maintenance windows scheduled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {maintenanceList.map((m) => (
              <div
                key={m.maintenance_id}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {m.resource_name} ({m.location})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#fb7185', marginTop: 2 }}>
                    Reason: {m.reason}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Clock size={13} />
                    <span>
                      {new Date(m.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} —{' '}
                      {new Date(m.end_time).toLocaleTimeString([], { timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(244,63,94,0.2)' }}>
                  Active Lockout
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Add Campus Resource"
      >
        <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Resource Name
            </label>
            <input
              type="text"
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              placeholder="e.g. von Neumann Algorithms Suite"
              className="input-field"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Physical Location
            </label>
            <input
              type="text"
              value={resLocation}
              onChange={(e) => setResLocation(e.target.value)}
              placeholder="e.g. Science Complex, 3rd Floor"
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Capacity (CHECK &gt; 0)
              </label>
              <input
                type="number"
                min="1"
                value={resCapacity}
                onChange={(e) => setResCapacity(parseInt(e.target.value, 10))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Resource Type
              </label>
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value)}
                className="input-field"
              >
                <option value="study_room">Study Room</option>
                <option value="lab">Laboratory</option>
                <option value="meeting_room">Meeting / Seminar Room</option>
                <option value="other">Other Studio</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsResourceModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="Schedule Resource Maintenance Period"
      >
        <form onSubmit={handleScheduleMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Select Resource
            </label>
            <select
              value={maintResourceId}
              onChange={(e) => setMaintResourceId(e.target.value)}
              className="input-field"
              required
            >
              {resources.map((r) => (
                <option key={r.resource_id} value={r.resource_id}>
                  {r.name} ({r.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Maintenance Date
            </label>
            <input
              type="date"
              value={maintStartDate}
              onChange={(e) => setMaintStartDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Start Time (UTC)
              </label>
              <input
                type="time"
                value={maintStartTime}
                onChange={(e) => setMaintStartTime(e.target.value)}
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
                value={maintEndTime}
                onChange={(e) => setMaintEndTime(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Maintenance Reason / Description
            </label>
            <input
              type="text"
              value={maintReason}
              onChange={(e) => setMaintReason(e.target.value)}
              placeholder="e.g. AC repair, network wiring upgrade"
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsMaintModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Scheduling...' : 'Lock Resource for Maintenance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
