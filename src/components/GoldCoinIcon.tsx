import React from 'react';

interface GoldCoinIconProps {
  className?: string;
}

export default function GoldCoinIcon({ className = "w-5 h-5" }: GoldCoinIconProps) {
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className} select-none transition-transform hover:scale-110 active:scale-95 duration-200`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-full h-full drop-shadow-[0_1.5px_2px_rgba(217,119,6,0.5)] animate-pulse"
      >
        {/* Outer 3D gold border */}
        <circle cx="12" cy="12" r="10" fill="url(#goldRimGrad)" stroke="#78350F" strokeWidth="1.2" />
        
        {/* Inner face */}
        <circle cx="12" cy="12" r="8" fill="url(#goldFaceGrad)" stroke="#B45309" strokeWidth="0.8" />
        
        {/* Beveled edge border */}
        <circle cx="12" cy="12" r="6.2" fill="none" stroke="#FDE047" strokeWidth="0.6" strokeDasharray="1.5 1" />
        
        {/* Star in center of the coin (representing Lucky/Sorte) */}
        <path 
          d="M12 6.5 L13.4 9.4 L16.5 9.8 L14.2 12 L14.8 15.1 L12 13.6 L9.2 15.1 L9.8 12 L7.5 9.8 L10.6 9.4 Z" 
          fill="#78350F" 
          stroke="#F59E0B" 
          strokeWidth="0.3" 
          strokeLinejoin="round" 
        />
        
        <defs>
          <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="goldFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
