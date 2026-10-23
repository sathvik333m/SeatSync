const db = require('../config/db');

/**
 * Record an audit log entry.
 * Can execute within an active transaction client or using the general connection pool.
 *
 * @param {object} executor - db or client
 * @param {object} params
 * @param {number|null} params.actorId - user_id who initiated the action
 * @param {string} params.entityType - 'reservation' | 'listing' | 'request' | 'session' | 'maintenance' | 'resource'
 * @param {number} params.entityId - Primary key ID of the entity
 * @param {string} params.action - Action name (e.g. 'CREATED', 'CANCELLED', 'ACCEPTED')
 * @param {object} params.details - JSONB object with relevant event metadata
 */
async function logAudit(executor, { actorId, entityType, entityId, action, details = {} }) {
  try {
    const text = `
      INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, details, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING log_id;
    `;
    const values = [actorId || null, entityType, entityId, action, JSON.stringify(details)];
    const res = await executor.query(text, values);
    return res.rows[0]?.log_id;
  } catch (err) {
    console.error('[Audit Log Error]: Failed to write audit record:', err.message);
    // In transactional environments, letting this throw preserves strict consistency
    throw err;
  }
}

module.exports = { logAudit };
