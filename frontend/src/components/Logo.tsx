import React from 'react';
import { Shield } from 'lucide-react';

interface LogoProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ onClick, className = '', size = 'md', showText = true }: LogoProps) {
  const sizeConfig = {
    sm: {
      container: 'w-8 h-8',
      icon: 'h-5 w-5',
      text: 'text-base font-bold'
    },
    md: {
      container: 'w-10 h-10',
      icon: 'h-6 w-6',
      text: 'text-xl font-bold'
    },
    lg: {
      container: 'w-12 h-12',
      icon: 'h-7 w-7',
      text: 'text-2xl font-bold'
    }
  };

  const config = sizeConfig[size];

  const logoContent = (
    <>
      <div className={`${config.container} bg-primary rounded-lg flex items-center justify-center`}>
        <Shield className={`${config.icon} text-primary-foreground`} />
      </div>
      {showText && (
        <span className={config.text}>DRIVEGUARD AI</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={`flex items-center space-x-3 hover:opacity-80 transition-opacity ${className}`}
      >
        {logoContent}
      </button>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {logoContent}
    </div>
  );
}