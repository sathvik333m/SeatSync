import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  User, 
  Users, 
  Award, 
  Send, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

export const PeerLearningPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [selectedListingForRequest, setSelectedListingForRequest] = useState<any | null>(null);
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Listing Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSkillId, setNewSkillId] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newFormat, setNewFormat] = useState<string>('group');
  const [newDifficulty, setNewDifficulty] = useState<string>('intermediate');
  const [newMaxParticipants, setNewMaxParticipants] = useState<number>(4);

  // Alerts
  const [alert, setAlert] = useState<{
    type: 'error' | 'success' | 'dbms_conflict' | 'info';
    title?: string;
    message: string;
    dbmsRule?: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    loadListingsAndSkills();
  }, [searchTerm, formatFilter, difficultyFilter, user]);

  const loadListingsAndSkills = async () => {
    setLoading(true);
    try {
      const [listingsRes, skillsRes] = await Promise.all([
        api.getListings({
          search: searchTerm || undefined,
          format: formatFilter || undefined,
          difficulty: difficultyFilter || undefined,
        }),
        api.getSkills(),
      ]);
      setListings(listingsRes.data);
      setSkills(skillsRes.data);
      if (skillsRes.data.length > 0 && !newSkillId) {
        setNewSkillId(String(skillsRes.data[0].skill_id));
      }
    } catch (err: any) {
      console.error('Failed to load listings/skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    try {
      await api.createListing({
        skillId: parseInt(newSkillId, 10),
        title: newTitle,
        description: newDescription,
        teachingFormat: newFormat,
        difficulty: newDifficulty,
        maxParticipants: newFormat === 'individual' ? 1 : newMaxParticipants,
      });

      setAlert({
        type: 'success',
        title: 'Skill Listing Published',
        message: `Your learning offer "${newTitle}" is now live and students can submit learning requests.`,
      });

      setIsPublishModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      loadListingsAndSkills();
    } catch (err: any) {
      setAlert({
        type: err.dbmsRule ? 'dbms_conflict' : 'error',
        title: 'Failed to Publish Listing',
        message: err.message || 'Error occurred.',
        dbmsRule: err.dbmsRule,
        detail: err.detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForRequest) return;

    setSubmitting(true);
    setAlert(null);

    try {
      await api.submitRequest({
        listingId: selectedListingForRequest.listing_id,
        message: requestMessage,
      });

      setAlert({
        type: 'success',
        title: 'Learning Request Sent',
        message: `Your request was delivered to ${selectedListingForRequest.teacher_name}. When accepted, you will be enrolled in the session.`,
      });

      setSelectedListingForRequest(null);
      setRequestMessage('');
      loadListingsAndSkills();
    } catch (err: any) {
      setAlert({
        type: err.dbmsRule ? 'dbms_conflict' : 'error',
        title: 'Request Failed',
        message: err.message || 'Could not send request.',
        dbmsRule: err.dbmsRule,
        detail: err.detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem' }}>
            <GraduationCap size={16} /> MODULE B: PEER LEARNING MARKETPLACE
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginTop: 4 }}>Skill Exchange & Workshops</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Learn from campus peers or teach what you love. Individual 1-on-1 coaching and group workshops with serialized capacity.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #3b82f6 100%)' }}
          onClick={() => setIsPublishModalOpen(true)}
        >
          <PlusCircle size={18} /> Publish a Skill to Teach
        </button>
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

      {/* Filter and Search Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills, topics, or keywords..."
            className="input-field"
            style={{ padding: '8px 12px' }}
          />
        </div>

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All Formats</option>
          <option value="group">Group Workshops</option>
          <option value="individual">1-on-1 Tutoring</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All Difficulty Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          {listings.length} offers found
        </div>
      </div>

      {/* Listings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {listings.map((item) => {
          const isOwnListing = Number(item.teacher_id) === Number(user?.user_id);

          return (
            <div
              key={item.listing_id}
              className="glass-panel"
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                position: 'relative',
              }}
            >
              <div>
                {/* Badges row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#60a5fa',
                        borderRadius: 6,
                        fontWeight: 700,
                      }}
                    >
                      {item.skill_category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#60a5fa',
                        borderRadius: 6,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.difficulty}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: item.teaching_format === 'group' ? '#34d399' : '#38bdf8',
                    }}
                  >
                    {item.teaching_format === 'group' ? <Users size={14} /> : <User size={14} />}
                    {item.teaching_format === 'group' ? `Workshop (Max ${item.max_participants})` : '1-on-1'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.22rem', color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.3 }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                  {item.description}
                </p>

                {/* Teacher Profile Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {item.teacher_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.teacher_name}
                      {isOwnListing && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Skill: {item.skill_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isOwnListing ? (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', padding: 6 }}>
                  Your listing ({item.pending_requests_count} pending request{item.pending_requests_count === 1 ? '' : 's'})
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setSelectedListingForRequest(item);
                    setRequestMessage(`Hi ${item.teacher_name}, I would love to learn ${item.skill_name} from your listing!`);
                  }}
                >
                  <Send size={15} /> Request to Learn
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Publish Skill Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish a Teaching Offer"
      >
        <form onSubmit={handlePublishListing} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Select Core Skill
            </label>
            <select
              value={newSkillId}
              onChange={(e) => setNewSkillId(e.target.value)}
              className="input-field"
              required
            >
              {skills.map((s) => (
                <option key={s.skill_id} value={s.skill_id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Offer Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Hands-on React 19 State Architecture"
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Format
              </label>
              <select
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value)}
                className="input-field"
              >
                <option value="group">Group Workshop</option>
                <option value="individual">1-on-1 Individual</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Difficulty Level
              </label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
                className="input-field"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {newFormat === 'group' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Maximum Learners Capacity (CHECK constraint: ≥ 2)
              </label>
              <input
                type="number"
                min="2"
                max="25"
                value={newMaxParticipants}
                onChange={(e) => setNewMaxParticipants(parseInt(e.target.value, 10))}
                className="input-field"
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Description & Prerequisites
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Explain what topics you will cover, prerequisites, and what learners will gain..."
              className="input-field"
              rows={4}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPublishModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Send Request Modal */}
      {selectedListingForRequest && (
        <Modal
          isOpen={!!selectedListingForRequest}
          onClose={() => setSelectedListingForRequest(null)}
          title={`Request to Learn with ${selectedListingForRequest.teacher_name}`}
        >
          <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 14, borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedListingForRequest.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Skill: {selectedListingForRequest.skill_name} • Format: {selectedListingForRequest.teaching_format}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Note to Teacher (Your background, goals, or schedule preference)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="input-field"
                rows={3}
                required
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Submitting creates a row in <code>learning_requests</code> with status <code>pending</code>.
              Duplicate active requests are prevented by UNIQUE constraint <code>(listing_id, learner_id)</code>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedListingForRequest(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
