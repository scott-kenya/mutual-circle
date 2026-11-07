import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'surface' | 'tile' | 'pine';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'surface' }) => {
  const variants = {
    surface: "bg-surface border border-tile shadow-soft",
    tile: "bg-tile",
    pine: "bg-pine text-white"
  };
  return (
    <div className={`rounded-[22px] p-5 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};