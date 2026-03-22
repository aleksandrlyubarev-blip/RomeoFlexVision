interface BuxterDrafterIconProps {
  size?: number;
}

export default function BuxterDrafterIcon({ size = 28 }: BuxterDrafterIconProps) {
  return (
    <svg
      viewBox="0 0 100 108"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bxGlow" cx="50%" cy="70%" r="50%">
          <stop offset="0%" stopColor="#ffffaa" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffff44" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bxFace" cx="36%" cy="30%" r="66%">
          <stop offset="0%" stopColor="#c47040" />
          <stop offset="55%" stopColor="#8b4513" />
          <stop offset="100%" stopColor="#5c2a08" />
        </radialGradient>
        <radialGradient id="bxMuzzle" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#eebb88" />
          <stop offset="100%" stopColor="#cc8855" />
        </radialGradient>
        <radialGradient id="bxHelmet" cx="33%" cy="22%" r="66%">
          <stop offset="0%" stopColor="#ffe844" />
          <stop offset="55%" stopColor="#f0b800" />
          <stop offset="100%" stopColor="#bb8800" />
        </radialGradient>
        <radialGradient id="bxEye" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#aaff55" />
          <stop offset="40%" stopColor="#33bb00" />
          <stop offset="100%" stopColor="#115500" />
        </radialGradient>
      </defs>

      {/* Glow */}
      <ellipse cx="50" cy="74" rx="44" ry="28" fill="url(#bxGlow)" />

      {/* Head/face */}
      <ellipse
        cx="50"
        cy="68"
        rx="38"
        ry="36"
        fill="url(#bxFace)"
        stroke="#3d1a05"
        strokeWidth="1.5"
      />

      {/* Lighter muzzle */}
      <ellipse cx="50" cy="79" rx="20" ry="15" fill="url(#bxMuzzle)" />

      {/* Pencil tucked behind right ear */}
      <g transform="rotate(14 76 46)">
        <rect x="73" y="22" width="5" height="26" rx="1" fill="#f5d038" stroke="#cc9900" strokeWidth="1" />
        {/* Pencil tip (wood) */}
        <polygon points="73,22 78,22 75.5,16" fill="#e8b870" stroke="#cc9900" strokeWidth="0.8" />
        {/* Pencil tip (graphite) */}
        <polygon points="74,18 77,18 75.5,15" fill="#444" />
        {/* Eraser */}
        <rect x="73" y="47" width="5" height="4" rx="1" fill="#ff8888" stroke="#cc5555" strokeWidth="0.5" />
      </g>

      {/* Hard hat brim */}
      <path
        d="M17 46 Q50 41 83 46 Q83 51 50 51 Q17 51 17 46"
        fill="url(#bxHelmet)"
        stroke="#aa7700"
        strokeWidth="1.5"
      />
      {/* Hard hat dome */}
      <ellipse cx="50" cy="33" rx="31" ry="23" fill="url(#bxHelmet)" stroke="#aa7700" strokeWidth="1.5" />
      {/* Hat seam lines */}
      <path d="M50 12 Q43 23 40 36" fill="none" stroke="#cc9900" strokeWidth="1" strokeOpacity="0.55" />
      <path d="M50 12 Q57 23 60 36" fill="none" stroke="#cc9900" strokeWidth="1" strokeOpacity="0.55" />
      {/* Hat shine */}
      <ellipse
        cx="39"
        cy="21"
        rx="9"
        ry="5.5"
        fill="white"
        opacity="0.38"
        transform="rotate(-20 39 21)"
      />

      {/* Glasses left lens (round) */}
      <circle cx="35" cy="59" r="13.5" fill="#112200" stroke="#0d0d0d" strokeWidth="3" />
      <circle cx="35" cy="59" r="10.5" fill="url(#bxEye)" />
      <circle cx="36" cy="60" r="4.5" fill="#0a4400" />
      <circle cx="31" cy="55.5" r="3.5" fill="white" opacity="0.9" />
      <circle cx="33.5" cy="58" r="1.5" fill="white" opacity="0.65" />

      {/* Glasses right lens (round) */}
      <circle cx="65" cy="59" r="13.5" fill="#112200" stroke="#0d0d0d" strokeWidth="3" />
      <circle cx="65" cy="59" r="10.5" fill="url(#bxEye)" />
      <circle cx="66" cy="60" r="4.5" fill="#0a4400" />
      <circle cx="61" cy="55.5" r="3.5" fill="white" opacity="0.9" />
      <circle cx="63.5" cy="58" r="1.5" fill="white" opacity="0.65" />

      {/* Glasses bridge */}
      <line x1="48.5" y1="58" x2="51.5" y2="58" stroke="#0d0d0d" strokeWidth="3" strokeLinecap="round" />
      {/* Left temple */}
      <line x1="21.5" y1="57" x2="14" y2="55" stroke="#0d0d0d" strokeWidth="3" strokeLinecap="round" />
      {/* Right temple */}
      <line x1="78.5" y1="57" x2="86" y2="55" stroke="#0d0d0d" strokeWidth="3" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx="50" cy="72" rx="4.5" ry="3.8" fill="#1a0800" />
      <path d="M46.5 74 Q50 78 53.5 74" stroke="#1a0800" strokeWidth="1.5" fill="none" />

      {/* Smile */}
      <path
        d="M40 81 Q50 91 60 81"
        stroke="#1a0800"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Whisker marks */}
      <path d="M35 74 Q41 72 46 73" stroke="#3d1a05" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M35 77 Q41 76 46 75.5" stroke="#3d1a05" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M65 74 Q59 72 54 73" stroke="#3d1a05" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M65 77 Q59 76 54 75.5" stroke="#3d1a05" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}
