interface AndrewFoxIconProps {
  size?: number;
}

export default function AndrewFoxIcon({ size = 28 }: AndrewFoxIconProps) {
  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="afGlow" cx="50%" cy="68%" r="48%">
          <stop offset="0%" stopColor="#ccffcc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#88ff88" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="afFace" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffaa33" />
          <stop offset="55%" stopColor="#e07010" />
          <stop offset="100%" stopColor="#a04800" />
        </radialGradient>
        <radialGradient id="afMuzzle" cx="42%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#fdefd0" />
          <stop offset="100%" stopColor="#e8ccaa" />
        </radialGradient>
        <radialGradient id="afEar" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffaa33" />
          <stop offset="100%" stopColor="#b05800" />
        </radialGradient>
        <radialGradient id="afEarInner" cx="38%" cy="32%" r="64%">
          <stop offset="0%" stopColor="#fff0d8" />
          <stop offset="100%" stopColor="#f0d0a0" />
        </radialGradient>
        <radialGradient id="afEye" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#ccff55" />
          <stop offset="30%" stopColor="#44dd00" />
          <stop offset="70%" stopColor="#118800" />
          <stop offset="100%" stopColor="#004400" />
        </radialGradient>
        <filter id="afEyeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow behind */}
      <ellipse cx="50" cy="78" rx="42" ry="26" fill="url(#afGlow)" />

      {/* Left ear (back layer) */}
      <path
        d="M18 52 L22 18 L40 44"
        fill="url(#afEar)"
        stroke="#7a3200"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 46 L25 24 L38 42"
        fill="url(#afEarInner)"
      />

      {/* Right ear (back layer) */}
      <path
        d="M82 52 L78 18 L60 44"
        fill="url(#afEar)"
        stroke="#7a3200"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M78 46 L75 24 L62 42"
        fill="url(#afEarInner)"
      />

      {/* Head — broad fox face, slightly pointed toward chin */}
      <path
        d="M14 62 Q12 44 26 34 Q38 24 50 24 Q62 24 74 34 Q88 44 86 62 Q84 78 70 86 Q60 93 50 93 Q40 93 30 86 Q16 78 14 62"
        fill="url(#afFace)"
        stroke="#7a3200"
        strokeWidth="1.8"
      />

      {/* Cream muzzle / snout area */}
      <path
        d="M34 68 Q38 60 50 59 Q62 60 66 68 Q66 84 50 89 Q34 84 34 68"
        fill="url(#afMuzzle)"
      />

      {/* Glasses frame — thick black, rectangular-rounded, like in image */}
      {/* Left lens frame */}
      <rect x="17" y="52" width="29" height="22" rx="5" fill="#111" />
      {/* Right lens frame */}
      <rect x="54" y="52" width="29" height="22" rx="5" fill="#111" />
      {/* Bridge */}
      <rect x="46" y="58" width="8" height="4" rx="2" fill="#111" />
      {/* Left temple */}
      <rect x="10" y="56" width="8" height="3.5" rx="1.5" fill="#111" />
      {/* Right temple */}
      <rect x="82" y="56" width="8" height="3.5" rx="1.5" fill="#111" />
      {/* Green-yellow rim inside each frame */}
      <rect x="19" y="54" width="25" height="18" rx="4" fill="#44bb00" />
      <rect x="56" y="54" width="25" height="18" rx="4" fill="#44bb00" />

      {/* Left eye */}
      <ellipse cx="31.5" cy="63" rx="11" ry="8" fill="url(#afEye)" filter="url(#afEyeGlow)" />
      <ellipse cx="31.5" cy="63" rx="6" ry="5" fill="#005500" />
      <circle cx="27" cy="59.5" r="4" fill="white" opacity="0.95" />
      <circle cx="30" cy="62" r="2" fill="white" opacity="0.7" />
      {/* Sparkle dots in left eye */}
      <circle cx="34" cy="65" r="1.2" fill="#88ff44" opacity="0.7" />
      <circle cx="29" cy="67" r="0.9" fill="#44ff00" opacity="0.5" />

      {/* Right eye */}
      <ellipse cx="68.5" cy="63" rx="11" ry="8" fill="url(#afEye)" filter="url(#afEyeGlow)" />
      <ellipse cx="68.5" cy="63" rx="6" ry="5" fill="#005500" />
      <circle cx="64" cy="59.5" r="4" fill="white" opacity="0.95" />
      <circle cx="67" cy="62" r="2" fill="white" opacity="0.7" />
      {/* Sparkle dots in right eye */}
      <circle cx="71" cy="65" r="1.2" fill="#88ff44" opacity="0.7" />
      <circle cx="66" cy="67" r="0.9" fill="#44ff00" opacity="0.5" />

      {/* Nose */}
      <ellipse cx="50" cy="74" rx="4" ry="3.5" fill="#1a0a00" />

      {/* Smirk (slightly asymmetric, right side higher) */}
      <path
        d="M44 80 Q50 86 58 80"
        stroke="#1a0a00"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left cheek highlight */}
      <ellipse cx="26" cy="75" rx="7" ry="4" fill="#ffbb44" opacity="0.25" />
      {/* Right cheek highlight */}
      <ellipse cx="74" cy="75" rx="7" ry="4" fill="#ffbb44" opacity="0.25" />
    </svg>
  );
}
