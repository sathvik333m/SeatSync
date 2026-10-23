import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status ? status.toLowerCase() : 'unknown';
  let badgeClass = 'badge-pending';

  if (['confirmed', 'published', 'accepted', 'attended', 'active'].includes(normalized)) {
    badgeClass = 'badge-confirmed';
  } else if (['cancelled', 'rejected', 'absent', 'inactive'].includes(normalized)) {
    badgeClass = 'badge-cancelled';
  } else if (['completed'].includes(normalized)) {
    badgeClass = 'badge-completed';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
      {status}
    </span>
  );
};
