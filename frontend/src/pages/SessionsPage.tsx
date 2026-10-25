import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Building2, 
  Inbox,
  UserCheck
} from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'sessions' | 'incoming' | 'outgoing'>('sessions');

  const [sessions, setSessions] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Schedule Session Modal (Transaction 3)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(() => {
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>('15:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Enroll Learner Modal (Transaction 2)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [requestToEnroll, setRequestToEnroll] = useState<any | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<string>('');

  // Participants View Modal
  const [viewingParticipants, setViewingParticipants] = useState<{ sessionId: number; list: any[] } | null>(null);

  // Alerts
  const [alert, setAlert] = useState<{
    type: 'error' | 'success' | 'dbms_conflict' | 'info';
    title?: string;
    message: string;
    dbmsRule?: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [user, subTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, listingsRes, resourcesRes] = await Promise.all([
        api.getSessions(),
        api.getListings({ teacherId: user?.user_id }),
        api.getResources(),
      ]);

      setSessions(sessionsRes.data);
      setMyListings(listingsRes.data);
      setResources(resourcesRes.data);
      if (listingsRes.data && listingsRes.data.length > 0) {
        setSelectedListingId(String(listingsRes.data[0].listing_id));
      } else {
        setSelectedListingId('');
      }

      if (subTab === 'incoming') {
        const inRes = await api.getUserRequests('incoming');
        setIncomingRequests(inRes.data);
      } else if (subTab === 'outgoing') {
        const outRes = await api.getUserRequests('outgoing');
        setOutgoingRequests(outRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load session data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transaction 3: Schedule learning session with optional room atomically
   */
  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    const fullStart = `${sessionDate}T${startTime}:00Z`;
    const fullEnd = `${sessionDate}T${endTime}:00Z`;

    try {
      const res = await api.scheduleSession({
        listingId: parseInt(selectedListingId, 10),
        startTime: fullStart,
        endTime: fullEnd,
        resourceId: selectedResourceId ? parseInt(selectedResourceId, 10) : null,
      });

      setAlert({
        type: 'success',
        title: 'Session Scheduled (Transaction 3 Passed)',
        message: res.message,
      });

      setIsScheduleModalOpen(false);
      loadData();
    } catch (err: any) {
      setAlert({
        type: err.dbmsRule ? 'dbms_conflict' : 'error',
        title: 'Transaction 3 Aborted',
        message: err.message || 'Failed to schedule session.',
        dbmsRule: err.dbmsRule,
        detail: err.detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Transaction 2: Accept learner into scheduled session with FOR UPDATE capacity lock
   */
  const handleEnrollLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToEnroll || !targetSessionId) return;

    setSubmitting(true);
    setAlert(null);

    try {
      const res = await api.enrollLearner(targetSessionId, requestToEnroll.request_id);

      setAlert({
        type: 'success',
        title: 'Learner Enrolled (Transaction 2 Passed)',
        message: res.message,
      });

      setIsEnrollModalOpen(false);
      setRequestToEnroll(null);
      loadData();
    } catch (err: any) {
      setAlert({
        type: err.dbmsRule ? 'dbms_conflict' : 'error',
        title: 'Transaction 2 Capacity Conflict',
        message: err.message || 'Failed to enroll learner.',
        dbmsRule: err.dbmsRule,
        detail: err.detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Transaction 4: Cancel learning session and cascade room reservation cancellation
   */
  const handleCancelSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled session? Its linked campus room reservation will also be cancelled atomically.')) return;
    try {
      const res = await api.cancelSession(sessionId);
      setAlert({
        type: 'info',
        title: 'Session & Room Cancelled (Transaction 4)',
        message: res.message,
      });
      loadData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to cancel session.',
      });
    }
  };

  const handleRespondDirect = async (requestId: number, action: 'accepted' | 'rejected') => {
    try {
      await api.respondToRequest(requestId, action);
      setAlert({
        type: 'success',
        message: `Request status updated to ${action}.`,
      });
      loadData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to respond to request.',
      });
    }
  };

  const handleViewParticipants = async (sessionId: number) => {
    try {
      const res = await api.getSessionParticipants(sessionId);
      setViewingParticipants({ sessionId, list: res.data });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontWeight: 600, fontSize: '0.85rem' }}>
            <Calendar size={16} /> MODULE B & A INTEGRATION
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginTop: 4 }}>Sessions & Requests</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Schedule peer workshops with optional campus room booking, manage incoming learner applications, and verify ACID cancellations.
          </p>
        </div>

        {myListings.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <PlusCircle size={18} /> Schedule a Session with Room
          </button>
        )}
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

      {/* Sub-Tabs Switcher */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 28,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12,
        }}
      >
        <button
          className={`btn ${subTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setSubTab('sessions')}
        >
          <Calendar size={15} /> Scheduled Sessions ({sessions.length})
        </button>
        <button
          className={`btn ${subTab === 'incoming' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setSubTab('incoming')}
        >
          <Inbox size={15} /> Incoming Requests (For My Listings)
        </button>
        <button
          className={`btn ${subTab === 'outgoing' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setSubTab('outgoing')}
        >
          <UserCheck size={15} /> My Sent Requests
        </button>
      </div>

      {/* TAB 1: Scheduled Sessions */}
      {subTab === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {sessions.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              No scheduled sessions currently. As a teacher, click "Schedule a Session" above.
            </div>
          ) : (
            sessions.map((s) => {
              const isTeacher = Number(s.teacher_id) === Number(user?.user_id);
              const capacityPercent = Math.min(100, Math.round((s.enrolled_learners / s.max_participants) * 100));

              return (
                <div
                  key={s.session_id}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>
                        {s.teaching_format === 'group' ? 'GROUP WORKSHOP' : '1-ON-1 SESSION'}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 8 }}>
                      {s.listing_title}
                    </h3>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      Teacher: <strong style={{ color: 'var(--text-main)' }}>{s.teacher_name}</strong> {isTeacher && '(You)'}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Clock size={15} />
                      <span>
                        {new Date(s.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                        ({new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <Building2 size={15} />
                      <span>{s.room_name ? `${s.room_name} (${s.room_location})` : 'Online / No room reserved'}</span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div style={{ background: 'var(--bg-input)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Enrolled Learners:</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {s.enrolled_learners} / {s.max_participants}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${capacityPercent}%`,
                            background: capacityPercent >= 100 ? '#f43f5e' : '#3b82f6',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleViewParticipants(s.session_id)}
                    >
                      <Users size={14} /> Participants ({s.enrolled_learners})
                    </button>

                    {isTeacher && s.status === 'scheduled' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleCancelSession(s.session_id)}
                        title="Cancels session and cascades room cancellation atomically"
                      >
                        <Trash2 size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Incoming Teacher Requests */}
      {subTab === 'incoming' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 16 }}>
            Requests from Students for Your Listings
          </h2>

          {incomingRequests.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              No pending requests for your teaching offers right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {incomingRequests.map((req) => (
                <div
                  key={req.request_id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div style={{ maxWidth: 650 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                        {req.learner_name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        ({req.learner_email})
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600, marginBottom: 4 }}>
                      Listing: {req.listing_title} ({req.teaching_format})
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: 6 }}>
                      "{req.message || 'No message provided'}"
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        onClick={() => {
                          setRequestToEnroll(req);
                          setIsEnrollModalOpen(true);
                        }}
                      >
                        <UserCheck size={14} /> Accept & Enroll into Session
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        onClick={() => handleRespondDirect(req.request_id, 'rejected')}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Outgoing Learner Requests */}
      {subTab === 'outgoing' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 16 }}>
            Your Outgoing Learning Applications
          </h2>

          {outgoingRequests.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              You haven't requested to join any peer learning listings yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {outgoingRequests.map((req) => (
                <div
                  key={req.request_id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                        {req.listing_title}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Teacher: <strong style={{ color: 'var(--text-main)' }}>{req.teacher_name}</strong> • Skill: {req.skill_name}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      Your message: "{req.message}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Session Modal (Transaction 3) */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Learning Session (Transaction 3)"
      >
        <form onSubmit={handleScheduleSession} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.82rem', color: 'var(--text-main)' }}>
            ACID Transaction: Schedules session and reserves campus room in one atomic transaction. If room is unavailable or in maintenance, the entire operation rolls back.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Select Your Published Listing
            </label>
            <select
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="input-field"
              required
            >
              {myListings.map((l) => (
                <option key={l.listing_id} value={l.listing_id}>
                  {l.title} ({l.teaching_format})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Optional Campus Room (Leave blank for online session)
            </label>
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="input-field"
            >
              <option value="">No Room (Online Session / Flexible)</option>
              {resources.map((r) => (
                <option key={r.resource_id} value={r.resource_id}>
                  {r.name} ({r.location}) — Capacity: {r.capacity}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Executing Atomic Transaction...' : 'Schedule & Lock Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Learner Modal (Transaction 2) */}
      {requestToEnroll && (
        <Modal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          title="Accept Learner & Enroll (Transaction 2)"
        >
          <form onSubmit={handleEnrollLearner} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div>Enrolling <strong>{requestToEnroll.learner_name}</strong></div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                For Listing: {requestToEnroll.listing_title}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Select Scheduled Session to Enroll into:
              </label>
              {(() => {
                const eligibleSessions = sessions.filter(
                  (s) => Number(s.listing_id) === Number(requestToEnroll.listing_id) && s.status === 'scheduled'
                );
                return eligibleSessions.length === 0 ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      color: '#fbbf24',
                    }}
                  >
                    ⚠️ No scheduled sessions found for this listing yet.<br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Close this modal and click <strong style={{ color: 'var(--text-main)' }}>"Schedule a Session with Room"</strong> at the top to create a session for <em>{requestToEnroll.listing_title}</em> first. Then come back here to enroll the learner.
                    </span>
                  </div>
                ) : (
                  <select
                    value={targetSessionId}
                    onChange={(e) => setTargetSessionId(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">-- Choose an upcoming scheduled session --</option>
                    {eligibleSessions.map((s) => (
                      <option key={s.session_id} value={s.session_id}>
                        Session #{s.session_id} on {new Date(s.start_time).toLocaleDateString()} — {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.enrolled_learners}/{s.max_participants} seats filled)
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Database Concurrency Note: The backend executes <code>SELECT ... FOR UPDATE</code> on the session and listing, recalculates registered participants, and rolls back if capacity is exceeded.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEnrollModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !targetSessionId || sessions.filter((s) => Number(s.listing_id) === Number(requestToEnroll.listing_id) && s.status === 'scheduled').length === 0}
              >
                {submitting ? 'Executing...' : 'Confirm Enrollment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Participants View Modal */}
      {viewingParticipants && (
        <Modal
          isOpen={!!viewingParticipants}
          onClose={() => setViewingParticipants(null)}
          title={`Enrolled Participants for Session #${viewingParticipants.sessionId}`}
        >
          {viewingParticipants.list.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              No learners enrolled in this session yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {viewingParticipants.list.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px 16px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.learner_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.learner_email}</div>
                  </div>
                  <StatusBadge status={p.attendance_status} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
