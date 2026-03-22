interface BassitoDogIconProps {
  size?: number;
}

export default function BassitoDogIcon({ size = 28 }: BassitoDogIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bdHead" cx="38%" cy="28%" r="66%">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="55%" stopColor="#ffaa00" />
          <stop offset="100%" stopColor="#cc7700" />
        </radialGradient>
        <radialGradient id="bdEar" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffcc33" />
          <stop offset="100%" stopColor="#aa6600" />
        </radialGradient>
        <radialGradient id="bdEyeG" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#aaff55" />
          <stop offset="40%" stopColor="#33bb00" />
          <stop offset="100%" stopColor="#115500" />
        </radialGradient>
      </defs>

      {/* Left ear */}
      <path
        d="M21 30 Q8 42 10 65 Q12 78 25 76 Q37 73 39 56 Q41 43 34 32"
        fill="url(#bdEar)"
        stroke="#995500"
        strokeWidth="1.5"
      />
      {/* Right ear */}
      <path
        d="M79 30 Q92 42 90 65 Q88 78 75 76 Q63 73 61 56 Q59 43 66 32"
        fill="url(#bdEar)"
        stroke="#995500"
        strokeWidth="1.5"
      />

      {/* Fur tufts at bottom */}
      <path
        d="M22 80 Q18 90 28 95 Q38 99 50 99 Q62 99 72 95 Q82 90 78 80 Q65 85 50 85 Q35 85 22 80"
        fill="url(#bdEar)"
        stroke="#995500"
        strokeWidth="1"
      />

      {/* Head main */}
      <path
        d="M50 5 Q73 7 85 28 Q91 44 87 64 Q80 84 50 90 Q20 84 13 64 Q9 44 15 28 Q27 7 50 5"
        fill="url(#bdHead)"
        stroke="#cc7700"
        strokeWidth="1.5"
      />

      {/* Forehead shine */}
      <ellipse
        cx="39"
        cy="17"
        rx="10"
        ry="6"
        fill="white"
        opacity="0.18"
        transform="rotate(-15 39 17)"
      />

      {/* Cheek blush */}
      <ellipse cx="31" cy="64" rx="9" ry="7" fill="#ffe599" opacity="0.35" />
      <ellipse cx="69" cy="64" rx="9" ry="7" fill="#ffe599" opacity="0.35" />

      {/* Glasses left lens */}
      <rect
        x="15"
        y="35"
        width="31"
        height="19"
        rx="3"
        ry="3"
        fill="#112200"
        stroke="#0d0d0d"
        strokeWidth="2.5"
      />
      <rect
        x="16.5"
        y="36.2"
        width="28"
        height="16.2"
        rx="2"
        ry="2"
        fill="none"
        stroke="#44ff22"
        strokeWidth="0.7"
        strokeOpacity="0.5"
      />

      {/* Glasses right lens */}
      <rect
        x="54"
        y="35"
        width="31"
        height="19"
        rx="3"
        ry="3"
        fill="#112200"
        stroke="#0d0d0d"
        strokeWidth="2.5"
      />
      <rect
        x="55.5"
        y="36.2"
        width="28"
        height="16.2"
        rx="2"
        ry="2"
        fill="none"
        stroke="#44ff22"
        strokeWidth="0.7"
        strokeOpacity="0.5"
      />

      {/* Bridge */}
      <line x1="46" y1="44" x2="54" y2="44" stroke="#0d0d0d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left temple */}
      <line x1="15" y1="42" x2="8" y2="40" stroke="#0d0d0d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right temple */}
      <line x1="85" y1="42" x2="92" y2="40" stroke="#0d0d0d" strokeWidth="2.5" strokeLinecap="round" />

      {/* Left eye */}
      <circle cx="30.5" cy="44.5" r="7.5" fill="url(#bdEyeG)" />
      <circle cx="31.5" cy="45.5" r="3.5" fill="#0a4d00" />
      <circle cx="27.5" cy="41.5" r="2.8" fill="white" opacity="0.88" />
      <circle cx="30" cy="44" r="1.2" fill="white" opacity="0.6" />

      {/* Right eye */}
      <circle cx="69.5" cy="44.5" r="7.5" fill="url(#bdEyeG)" />
      <circle cx="70.5" cy="45.5" r="3.5" fill="#0a4d00" />
      <circle cx="66.5" cy="41.5" r="2.8" fill="white" opacity="0.88" />
      <circle cx="69" cy="44" r="1.2" fill="white" opacity="0.6" />

      {/* Nose */}
      <ellipse cx="50" cy="63" rx="5" ry="4.2" fill="#1a1a1a" />
      <path d="M46 65 Q50 69 54 65" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />

      {/* Smile */}
      <path
        d="M40 71 Q50 79 60 71"
        stroke="#1a1a1a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Freckles */}
      <circle cx="34" cy="67" r="1.3" fill="#aa7700" opacity="0.65" />
      <circle cx="37.5" cy="69" r="1.3" fill="#aa7700" opacity="0.65" />
      <circle cx="41" cy="68" r="1.3" fill="#aa7700" opacity="0.65" />
      <circle cx="59" cy="68" r="1.3" fill="#aa7700" opacity="0.65" />
      <circle cx="62.5" cy="69" r="1.3" fill="#aa7700" opacity="0.65" />
      <circle cx="66" cy="67" r="1.3" fill="#aa7700" opacity="0.65" />
    </svg>
  );
}
