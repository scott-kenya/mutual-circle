import React from 'react';

interface StatusChipProps {
  status: 'Reserved' | 'Ready' | 'Collected' | 'Under Review' | 'Fulfilled';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const styles = {
    'Reserved': "bg-tile text-muted",
    'Ready': "bg-lime text-pine-deep",
    'Collected': "bg-green-ramp-pale/30 text-green-ramp",
    'Under Review': "bg-canvas text-ink border border-tile",
    'Fulfilled': "bg-pine text-white"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
};