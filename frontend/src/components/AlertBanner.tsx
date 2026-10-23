import React from 'react';
import { AlertCircle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface AlertBannerProps {
  type: 'error' | 'success' | 'info' | 'dbms_conflict';
  title?: string;
  message: string;
  dbmsRule?: string;
  detail?: string;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  dbmsRule,
  detail,
  onClose,
}) => {
  const isConflict = type === 'dbms_conflict' || type === 'error';
  const isSuccess = type === 'success';

  const bgColor = isSuccess
    ? 'rgba(16, 185, 129, 0.12)'
    : isConflict
    ? 'rgba(244, 63, 94, 0.12)'
    : 'rgba(99, 102, 241, 0.12)';

  const borderColor = isSuccess
    ? 'rgba(16, 185, 129, 0.3)'
    : isConflict
    ? 'rgba(244, 63, 94, 0.3)'
    : 'rgba(99, 102, 241, 0.3)';

  const textColor = isSuccess
    ? 'var(--alert-success-text)'
    : isConflict
    ? 'var(--alert-error-text)'
    : 'var(--alert-info-text)';

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isSuccess ? (
          <CheckCircle size={20} color={isSuccess ? '#10b981' : '#34d399'} />
        ) : isConflict ? (
          <ShieldAlert size={20} color="#f43f5e" />
        ) : (
          <Info size={20} color="#6366f1" />
        )}
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: textColor }}>
          {title || (isConflict ? 'Database Transaction Notice' : isSuccess ? 'Success' : 'Information')}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.1rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
        {message}
      </div>

      {dbmsRule && (
        <div
          style={{
            marginTop: 4,
            padding: '8px 12px',
            background: 'var(--bg-input)',
            borderRadius: 6,
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderLeft: `3px solid ${borderColor}`,
          }}
        >
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>PostgreSQL Constraint: </span>
          {dbmsRule}
        </div>
      )}

      {detail && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          Detail: {detail}
        </div>
      )}
    </div>
  );
};
