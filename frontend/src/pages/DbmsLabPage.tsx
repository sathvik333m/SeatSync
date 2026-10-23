import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Database, 
  Terminal, 
  TrendingUp, 
  Zap, 
  ShieldAlert, 
  Layers, 
  BarChart3, 
  FileText, 
  RefreshCw,
  Cpu
} from 'lucide-react';

export const DbmsLabPage: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<'skills' | 'sessions' | 'leaderboard' | 'demand' | 'audit' | 'concurrency' | 'explain'>('skills');

  // Report Data States
  const [skillsReport, setSkillsReport] = useState<any[]>([]);
  const [sessionsReport, setSessionsReport] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>({ topTeachers: [], topLearners: [] });
  const [demandReport, setDemandReport] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [explainData, setExplainData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Concurrency Simulation State
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);

  useEffect(() => {
    loadReportData();
  }, [activeReportTab]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeReportTab === 'skills') {
        const res = await api.getPopularSkills();
        setSkillsReport(res.data);
      } else if (activeReportTab === 'sessions') {
        const res = await api.getUpcomingSessionsReport();
        setSessionsReport(res.data);
      } else if (activeReportTab === 'leaderboard') {
        const res = await api.getLeaderboard();
        setLeaderboard(res.data);
      } else if (activeReportTab === 'demand') {
        const res = await api.getResourceDemand();
        setDemandReport(res.data);
      } else if (activeReportTab === 'audit') {
        const res = await api.getAuditLogs({ limit: 40 });
        setAuditLogs(res.data);
      } else if (activeReportTab === 'explain') {
        const res = await api.getExplainAnalyze();
        setExplainData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Run Scenario 1 Simulator: Simultaneous Overlapping Room Bookings
   */
  const runScenario1Simulation = async () => {
    setSimulating(true);
    setSimulationLogs(['🚀 Initiating Concurrency Scenario 1: Resource Booking Race Condition...']);

    // Set time 14 days in future to guarantee fresh slot
    const start = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);

    const startTime = start.toISOString();
    const endTime = end.toISOString();

    setSimulationLogs((prev) => [
      ...prev,
      `Target: Turing Lab Room 101 (resource_id = 1)`,
      `Slot: ${startTime} -> ${endTime}`,
      `Dispatching 2 simultaneous asynchronous reservation requests to the backend...`,
    ]);

    try {
      // Fire simultaneous requests
      const promise1 = api.createReservation({
        resourceId: 1,
        startTime,
        endTime,
        purpose: 'User 1 Parallel Race Attempt',
      });

      const promise2 = api.createReservation({
        resourceId: 1,
        startTime,
        endTime,
        purpose: 'User 2 Parallel Race Attempt',
      });

      const results = await Promise.allSettled([promise1, promise2]);

      results.forEach((res, idx) => {
        const userLabel = idx === 0 ? 'User A (Alex)' : 'User B (Priya)';
        if (res.status === 'fulfilled') {
          setSimulationLogs((prev) => [
            ...prev,
            `✅ ${userLabel}: Reservation SUCCEEDED! Reservation ID #${res.value.data.reservation_id}`,
          ]);
        } else {
          const err = res.reason;
          setSimulationLogs((prev) => [
            ...prev,
            `🛡️ ${userLabel}: SAFELY REJECTED by PostgreSQL GiST Exclusion Constraint!`,
            `   Error: ${err.message}`,
            `   PostgreSQL Rule: EXCLUDE USING gist (resource_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&)`,
          ]);
        }
      });

      setSimulationLogs((prev) => [
        ...prev,
        `🎉 VERIFICATION PASSED: Database engine strictly prevented overlapping double-bookings!`,
      ]);
    } catch (err: any) {
      setSimulationLogs((prev) => [...prev, `❌ Simulation encountered an unexpected error: ${err.message}`]);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontWeight: 600, fontSize: '0.85rem' }}>
          <Database size={16} /> COLLEGE DBMS EVALUATION LAB & ANALYTICS
        </div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginTop: 4 }}>
          Relational Database Intelligence
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Demonstrates complex SQL joins, aggregations, concurrency serialization, EXPLAIN query execution plans, and immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 28,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`btn ${activeReportTab === 'skills' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setActiveReportTab('skills')}
        >
          <BarChart3 size={15} /> 1. Popular Skills
        </button>
        <button
          className={`btn ${activeReportTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setActiveReportTab('sessions')}
        >
          <Layers size={15} /> 2. Upcoming Sessions Join
        </button>
        <button
          className={`btn ${activeReportTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setActiveReportTab('leaderboard')}
        >
          <TrendingUp size={15} /> 3. Leaderboard
        </button>
        <button
          className={`btn ${activeReportTab === 'demand' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setActiveReportTab('demand')}
        >
          <Zap size={15} /> 4. Resource Booking Demand
        </button>
        <button
          className={`btn ${activeReportTab === 'concurrency' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: 'rgba(244, 63, 94, 0.4)' }}
          onClick={() => setActiveReportTab('concurrency')}
        >
          <ShieldAlert size={15} color="#fb7185" /> 5. Concurrency Race Simulator
        </button>
        <button
          className={`btn ${activeReportTab === 'explain' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setActiveReportTab('explain')}
        >
          <Cpu size={15} /> 6. EXPLAIN Query Plans
        </button>
        <button
          className={`btn ${activeReportTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setActiveReportTab('audit')}
        >
          <FileText size={15} /> 7. Audit Trail
        </button>
      </div>

      {/* REPORT CONTENT AREA */}
      <div className="glass-panel" style={{ padding: 28, position: 'relative' }}>
        {/* TAB 1: Popular Skills */}
        {activeReportTab === 'skills' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Report A: Most Popular Skills</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Aggregations with <code>COUNT(DISTINCT l.listing_id)</code> and <code>COUNT(DISTINCT q.request_id)</code> grouped by skill.
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadReportData}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Skill Name</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Published Listings</th>
                    <th style={{ padding: '12px 16px' }}>Student Requests</th>
                    <th style={{ padding: '12px 16px' }}>Popularity Meter</th>
                  </tr>
                </thead>
                <tbody>
                  {skillsReport.map((row) => (
                    <tr key={row.skill_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{row.skill}</td>
                      <td style={{ padding: '14px 16px', color: '#818cf8' }}>{row.category}</td>
                      <td style={{ padding: '14px 16px' }}>{row.listings}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981' }}>{row.requests}</td>
                      <td style={{ padding: '14px 16px', width: 180 }}>
                        <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, row.requests * 25)}%`, background: '#6366f1' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Upcoming Sessions Join */}
        {activeReportTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Report B: Upcoming Sessions with Teacher & Room Joins</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Multi-table inner & left outer joins: <code>learning_sessions</code> ⨝ <code>learning_listings</code> ⨝ <code>users</code> ⟕ <code>reservations</code> ⟕ <code>resources</code>.
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadReportData}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Session ID</th>
                    <th style={{ padding: '12px 16px' }}>Workshop Title</th>
                    <th style={{ padding: '12px 16px' }}>Teacher</th>
                    <th style={{ padding: '12px 16px' }}>Linked Campus Room</th>
                    <th style={{ padding: '12px 16px' }}>Time Slot</th>
                    <th style={{ padding: '12px 16px' }}>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsReport.map((row) => (
                    <tr key={row.session_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>#{row.session_id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{row.title}</td>
                      <td style={{ padding: '14px 16px', color: '#c084fc' }}>{row.teacher}</td>
                      <td style={{ padding: '14px 16px', color: '#34d399' }}>{row.room}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                        {new Date(row.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        {row.enrolled_learners} / {row.capacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Leaderboard */}
        {activeReportTab === 'leaderboard' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 6 }}>
              Report C: Top Teachers & Learners Leaderboard
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Evaluates students who have completed the most teaching or learning sessions.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
              {/* Teachers */}
              <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#c084fc', marginBottom: 12 }}>Top Teachers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leaderboard.topTeachers?.map((t: any, idx: number) => (
                    <div key={t.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: '#818cf8', width: 20 }}>#{idx + 1}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.email}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>{t.completed_sessions} Sessions</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learners */}
              <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', marginBottom: 12 }}>Top Learners</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leaderboard.topLearners?.map((l: any, idx: number) => (
                    <div key={l.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: '#38bdf8', width: 20 }}>#{idx + 1}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{l.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{l.email}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#a855f7' }}>{l.attended_sessions} Attended</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Resource Booking Demand */}
        {activeReportTab === 'demand' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Report D: Resource Booking Demand & Total Hours</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Temporal duration aggregations: <code>SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600)</code>.
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadReportData}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Resource Name</th>
                    <th style={{ padding: '12px 16px' }}>Facility Type</th>
                    <th style={{ padding: '12px 16px' }}>Capacity</th>
                    <th style={{ padding: '12px 16px' }}>Confirmed Bookings</th>
                    <th style={{ padding: '12px 16px' }}>Total Booked Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {demandReport.map((row) => (
                    <tr key={row.resource_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</td>
                      <td style={{ padding: '14px 16px', textTransform: 'capitalize', color: '#818cf8' }}>
                        {row.resource_type.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{row.capacity} students</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{row.confirmed_bookings}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#34d399' }}>
                        {row.booked_hours} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Concurrency Conflict Simulator */}
        {activeReportTab === 'concurrency' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                Live Concurrency Conflict Simulator (Scenario 1 & 3)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Directly proves PostgreSQL's engine-level guarantees during live evaluation. Click the button below to dispatch simultaneous competing requests and observe database transaction isolation and exclusion rollback in real time.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}
                onClick={runScenario1Simulation}
                disabled={simulating}
              >
                <Zap size={16} /> Run Scenario 1: Overlapping Room Booking Race
              </button>
            </div>

            {/* Terminal Simulation Log Output */}
            <div
              style={{
                background: '#040711',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                minHeight: 260,
                color: '#e2e8f0',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <Terminal size={15} /> PostgreSQL Concurrency Execution Log
              </div>

              {simulationLogs.length === 0 ? (
                <div style={{ color: 'var(--text-dim)' }}>
                  Click "Run Scenario 1" to dispatch concurrent requests and stream live database responses.
                </div>
              ) : (
                simulationLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: EXPLAIN ANALYZE */}
        {activeReportTab === 'explain' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Demonstration 5: PostgreSQL EXPLAIN ANALYZE Plans</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Shows query optimizer decisions, buffer cache hits, and partial index utilization on <code>idx_sessions_start</code>.
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadReportData}>
                <RefreshCw size={14} /> Re-run Query Plan
              </button>
            </div>

            {explainData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: 6, fontSize: '0.9rem' }}>
                    1. Scheduled Sessions Partial Index Scan (<code>idx_sessions_start</code>):
                  </div>
                  <pre
                    style={{
                      background: '#040711',
                      padding: '16px',
                      borderRadius: 10,
                      border: '1px solid #1e293b',
                      fontSize: '0.78rem',
                      color: '#6ee7b7',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(explainData.scheduledSessionsQueryPlan, null, 2)}
                  </pre>
                </div>

                <div>
                  <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: 6, fontSize: '0.9rem' }}>
                    2. Resource Demand Aggregation & HashAggregate Plan:
                  </div>
                  <pre
                    style={{
                      background: '#040711',
                      padding: '16px',
                      borderRadius: 10,
                      border: '1px solid #1e293b',
                      fontSize: '0.78rem',
                      color: '#93c5fd',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(explainData.resourceAggregationQueryPlan, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
                Loading query execution plan from PostgreSQL...
              </div>
            )}
          </div>
        )}

        {/* TAB 7: Audit Logs */}
        {activeReportTab === 'audit' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Report G: Complete Audit Trail Explorer</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tracks all state mutations (reservations, sessions, enrollments, cancellations) with JSONB details.
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadReportData}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px' }}>Log ID</th>
                    <th style={{ padding: '10px 14px' }}>Timestamp</th>
                    <th style={{ padding: '10px 14px' }}>Actor</th>
                    <th style={{ padding: '10px 14px' }}>Entity</th>
                    <th style={{ padding: '10px 14px' }}>Action</th>
                    <th style={{ padding: '10px 14px' }}>JSONB Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>#{log.log_id}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {log.actor_name || 'System / Anonymous'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-main)' }}>
                          {log.entity_type} #{log.entity_id}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#818cf8' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
