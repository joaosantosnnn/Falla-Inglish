import React from 'react';

interface ChestProps {
  className?: string;
}

export function ClosedChest({ className = "w-36 h-36" }: ChestProps) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className} select-none group`}>
      {/* Dynamic pulse background glow */}
      <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full scale-95 group-hover:scale-110 group-hover:bg-amber-400/20 transition-all duration-500" />
      
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] group-hover:scale-105 active:scale-95 transition-transform duration-300"
      >
        <defs>
          <radialGradient id="chestGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="goldBand" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="metalSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        
        {/* Ambient background aura */}
        <circle cx="50" cy="50" r="45" fill="url(#chestGlow)" />

        {/* Main Wood Box Body */}
        <rect x="20" y="45" width="60" height="35" rx="8" fill="url(#woodGrad)" stroke="#271105" strokeWidth="2.5" />
        
        {/* Wooden arched lid */}
        <path d="M20 45 C20 18, 80 18, 80 45 Z" fill="url(#woodGrad)" stroke="#271105" strokeWidth="2.5" />
        
        {/* Left Gold Band */}
        <rect x="28" y="25.5" width="6" height="54.5" fill="url(#goldBand)" rx="1.5" stroke="#78350F" strokeWidth="0.5" />
        <circle cx="31" cy="33" r="1" fill="#78350F" />
        <circle cx="31" cy="41" r="1" fill="#78350F" />
        <circle cx="31" cy="53" r="1" fill="#78350F" />
        <circle cx="31" cy="65" r="1" fill="#78350F" />
        <circle cx="31" cy="74" r="1" fill="#78350F" />

        {/* Right Gold Band */}
        <rect x="66" y="25.5" width="6" height="54.5" fill="url(#goldBand)" rx="1.5" stroke="#78350F" strokeWidth="0.5" />
        <circle cx="69" cy="33" r="1" fill="#78350F" />
        <circle cx="69" cy="41" r="1" fill="#78350F" />
        <circle cx="69" cy="53" r="1" fill="#78350F" />
        <circle cx="69" cy="65" r="1" fill="#78350F" />
        <circle cx="69" cy="74" r="1" fill="#78350F" />

        {/* Lid border horizontal gold strip */}
        <path d="M20 45 L80 45" stroke="url(#goldBand)" strokeWidth="3.5" strokeLinecap="round" />

        {/* Side handles (Gold/bronze rings) */}
        <path d="M15 52 A5 5 0 0 0 15 62" stroke="url(#goldBand)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M85 52 A5 5 0 0 1 85 62" stroke="url(#goldBand)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Golden Lock Plate */}
        <rect x="41" y="38" width="18" height="18" rx="4" fill="url(#goldBand)" stroke="#92400E" strokeWidth="1.2" />
        <circle cx="50" cy="45" r="2.8" fill="#1E293B" />
        <path d="M50 47.8 L50 53" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
        
        {/* Rivets on the lock plate */}
        <circle cx="44" cy="41" r="0.6" fill="#78350F" />
        <circle cx="56" cy="41" r="0.6" fill="#78350F" />
        <circle cx="44" cy="53" r="0.6" fill="#78350F" />
        <circle cx="56" cy="53" r="0.6" fill="#78350F" />

        {/* Beveled corner protectors */}
        <path d="M20 71 L29 80 L20 80 Z" fill="url(#goldBand)" stroke="#78350F" strokeWidth="0.5" />
        <path d="M80 71 L71 80 L80 80 Z" fill="url(#goldBand)" stroke="#78350F" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

export function OpenedChest({ className = "w-36 h-36" }: ChestProps) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className} select-none`}>
      {/* Super glowing magical backdrop aura */}
      <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full scale-110 animate-pulse" />
      <div className="absolute inset-4 bg-emerald-400/20 blur-2xl rounded-full scale-100" />
      
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        className="w-full h-full drop-shadow-[0_10px_20px_rgba(217,119,6,0.3)]"
      >
        <defs>
          <radialGradient id="openGlow" cx="50%" cy="40%" r="45%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="woodGradOpen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="goldBandOpen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="gemEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gemSapphire" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="gemRuby" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Overflowing warm gold light glow */}
        <circle cx="50" cy="40" r="38" fill="url(#openGlow)" />

        {/* Open Tilted Lid (Floating dynamically behind/above) */}
        <g transform="translate(4, -13) rotate(-18 50 25)" className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
          <path d="M20 40 C20 14, 80 14, 80 40 Z" fill="url(#woodGradOpen)" stroke="#271105" strokeWidth="2" />
          <rect x="28" y="21" width="5" height="19.5" fill="url(#goldBandOpen)" rx="0.5" stroke="#78350F" strokeWidth="0.4" />
          <rect x="66" y="21" width="5" height="19.5" fill="url(#goldBandOpen)" rx="0.5" stroke="#78350F" strokeWidth="0.4" />
          <path d="M20 40 L80 40" stroke="url(#goldBandOpen)" strokeWidth="2.5" />
        </g>

        {/* Magical sparkle stars popping out of the chest */}
        <path d="M50 15 L50 4" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" className="animate-ping" />
        <path d="M23 25 L14 16" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
        <path d="M77 25 L86 16" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
        <path d="M35 12 L39 16" stroke="#FEF08A" strokeWidth="1" strokeLinecap="round" />
        <path d="M65 12 L61 16" stroke="#FEF08A" strokeWidth="1" strokeLinecap="round" />

        {/* Main Wood Box Body */}
        <rect x="20" y="45" width="60" height="35" rx="8" fill="url(#woodGradOpen)" stroke="#271105" strokeWidth="2.5" />

        {/* Sparkles / Diamonds on the border */}
        <polygon points="50,11 53,16 50,21 47,16" fill="#FFFFFF" className="animate-pulse" />
        
        {/* Overflowing Mountains of Gold Coins & Glowing Gems */}
        <ellipse cx="50" cy="45" rx="27" ry="9" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
        
        {/* Individual beautifully rendered shiny gold coins */}
        <circle cx="36" cy="44" r="4" fill="#FDE047" stroke="#D97706" strokeWidth="0.8" />
        <circle cx="42" cy="42" r="4.5" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
        <circle cx="49" cy="44" r="4" fill="#FDE047" stroke="#D97706" strokeWidth="0.8" />
        <circle cx="56" cy="41" r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
        <circle cx="62" cy="43" r="4.2" fill="#FDE047" stroke="#D97706" strokeWidth="0.8" />
        <circle cx="31" cy="46" r="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="0.7" />
        <circle cx="68" cy="45" r="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="0.7" />

        {/* Sparkly magical rubies and sapphires nested in gold */}
        <polygon points="46,36 51,33 49,39 43,38" fill="url(#gemEmerald)" stroke="#047857" strokeWidth="0.8" />
        <polygon points="55,37 59,33 62,38 57,39" fill="url(#gemSapphire)" stroke="#1D4ED8" strokeWidth="0.8" />
        <polygon points="31,41 35,38 37,42 32,44" fill="url(#gemRuby)" stroke="#991B1B" strokeWidth="0.8" />

        {/* Left Gold Band */}
        <rect x="28" y="45" width="6" height="35" fill="url(#goldBandOpen)" stroke="#78350F" strokeWidth="0.5" />
        <circle cx="31" cy="53" r="1" fill="#78350F" />
        <circle cx="31" cy="65" r="1" fill="#78350F" />
        <circle cx="31" cy="74" r="1" fill="#78350F" />

        {/* Right Gold Band */}
        <rect x="66" y="45" width="6" height="35" fill="url(#goldBandOpen)" stroke="#78350F" strokeWidth="0.5" />
        <circle cx="69" cy="53" r="1" fill="#78350F" />
        <circle cx="69" cy="65" r="1" fill="#78350F" />
        <circle cx="69" cy="74" r="1" fill="#78350F" />

        {/* Side handles (Gold/bronze rings) */}
        <path d="M15 52 A5 5 0 0 0 15 62" stroke="url(#goldBandOpen)" strokeWidth="2.5" />
        <path d="M85 52 A5 5 0 0 1 85 62" stroke="url(#goldBandOpen)" strokeWidth="2.5" />

        {/* Beveled corner protectors */}
        <path d="M20 71 L29 80 L20 80 Z" fill="url(#goldBandOpen)" stroke="#78350F" strokeWidth="0.5" />
        <path d="M80 71 L71 80 L80 80 Z" fill="url(#goldBandOpen)" stroke="#78350F" strokeWidth="0.5" />
        
        {/* Lock Plate hanging open/unhinged */}
        <g transform="translate(0, 7)">
          <rect x="44" y="38" width="12" height="13" rx="2.5" fill="url(#goldBandOpen)" stroke="#92400E" strokeWidth="1" />
          <circle cx="50" cy="44" r="2.2" fill="#1E293B" />
        </g>
      </svg>
    </div>
  );
}
