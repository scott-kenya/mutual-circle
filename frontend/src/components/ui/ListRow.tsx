import React from 'react';
import { StatusChip } from './StatusChip';

interface ListRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status?: 'Reserved' | 'Ready' | 'Collected' | 'Under Review' | 'Fulfilled';
}

export const ListRow: React.FC<ListRowProps> = ({ icon, title, subtitle, status }) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-tile last:border-0">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center text-pine shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink truncate">{title}</p>
          <p className="text-[12px] text-muted truncate">{subtitle}</p>
        </div>
      </div>
      {status && <StatusChip status={status} />}
    </div>
  );
};