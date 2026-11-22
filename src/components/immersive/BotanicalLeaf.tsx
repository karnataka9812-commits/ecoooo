export function BotanicalLeaf({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 220"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="leaf-blade-grad" x1="25" y1="20" x2="145" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94A882" />
          <stop offset="48%" stopColor="#5C704E" />
          <stop offset="85%" stopColor="#2F4435" />
          <stop offset="100%" stopColor="#1B2A21" />
        </linearGradient>
        <linearGradient id="leaf-rim-copper" x1="120" y1="25" x2="70" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D3A36C" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#788B68" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#18271F" stopOpacity="0.2" />
        </linearGradient>
        <filter id="leaf-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="#070E0B" floodOpacity="0.55" />
        </filter>
      </defs>

      <g filter="url(#leaf-soft-shadow)">
        {/* Petiole stem */}
        <path
          d="M90 172 C91 189, 86 203, 78 214"
          stroke="#6A7858"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Organic serrated botanical blade */}
        <path
          d="M90 14
             C106 32, 126 52, 134 74
             C139 87, 141 104, 136 121
             C131 139, 118 156, 102 168
             C96 172, 92 174, 90 174
             C88 174, 83 171, 77 166
             C61 153, 48 136, 44 117
             C40 99, 43 81, 51 64
             C61 45, 76 28, 90 14 Z"
          fill="url(#leaf-blade-grad)"
          stroke="url(#leaf-rim-copper)"
          strokeWidth="1.4"
        />

        {/* Subtle sunlit right-half shading */}
        <path
          d="M90 16 C106 34, 125 53, 132 74 C138 92, 137 116, 127 136 C117 154, 102 166, 90 172 Z"
          fill="#D5D9C6"
          fillOpacity="0.1"
        />

        {/* Primary central midrib */}
        <path
          d="M90 17 C91 66, 90 120, 90 172"
          stroke="#D5D9C6"
          strokeOpacity="0.48"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Lateral venation */}
        <path d="M90 48 C103 44, 113 48, 121 55" stroke="#D5D9C6" strokeOpacity="0.28" strokeWidth="1" strokeLinecap="round" />
        <path d="M90 72 C106 67, 119 72, 129 82" stroke="#D5D9C6" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />
        <path d="M90 98 C108 93, 122 99, 131 110" stroke="#D5D9C6" strokeOpacity="0.28" strokeWidth="1" strokeLinecap="round" />
        <path d="M90 126 C105 122, 117 127, 123 136" stroke="#D5D9C6" strokeOpacity="0.24" strokeWidth="1" strokeLinecap="round" />

        <path d="M90 54 C76 50, 66 54, 58 62" stroke="#D5D9C6" strokeOpacity="0.24" strokeWidth="1" strokeLinecap="round" />
        <path d="M90 80 C74 75, 60 80, 50 91" stroke="#D5D9C6" strokeOpacity="0.26" strokeWidth="1" strokeLinecap="round" />
        <path d="M90 107 C73 102, 59 107, 50 118" stroke="#D5D9C6" strokeOpacity="0.24" strokeWidth="1" strokeLinecap="round" />
        <path d="M90 134 C76 130, 64 134, 58 143" stroke="#D5D9C6" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}
