interface PolingoParrotIconProps {
  size?: number;
}

export default function PolingoParrotIcon({ size = 28 }: PolingoParrotIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="plGlow" cx="50%" cy="65%" r="50%">
          <stop offset="0%" stopColor="#ddff44" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#aacc00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="plGreen" cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#66ee44" />
          <stop offset="55%" stopColor="#22aa00" />
          <stop offset="100%" stopColor="#0a5500" />
        </radialGradient>
        <radialGradient id="plEye" cx="33%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#99ff44" />
          <stop offset="40%" stopColor="#33cc00" />
          <stop offset="100%" stopColor="#0a5500" />
        </radialGradient>
        <clipPath id="plClip">
          <circle cx="50" cy="48" r="40" />
        </clipPath>
      </defs>

      {/* Glow */}
      <ellipse cx="50" cy="66" rx="42" ry="28" fill="url(#plGlow)" />

      {/* Head base – green */}
      <circle cx="50" cy="48" r="40" fill="url(#plGreen)" stroke="#147700" strokeWidth="1.5" />

      {/* Blue left-side feathers (clipped to head) */}
      <ellipse
        cx="17"
        cy="46"
        rx="24"
        ry="32"
        fill="#2255cc"
        clipPath="url(#plClip)"
      />

      {/* Yellow right-side feathers (clipped to head) */}
      <ellipse
        cx="83"
        cy="46"
        rx="24"
        ry="32"
        fill="#ffcc22"
        clipPath="url(#plClip)"
      />

      {/* Soft face-center highlight */}
      <ellipse cx="50" cy="58" rx="20" ry="17" fill="#ffee99" opacity="0.28" />

      {/* Headset band arc */}
      <path
        d="M13 48 Q14 6 50 6 Q86 6 87 48"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Left ear cup */}
      <ellipse cx="13" cy="49" rx="7.5" ry="9" fill="#3a3a3a" stroke="#1a1a1a" strokeWidth="1" />
      <ellipse cx="13" cy="49" rx="4.5" ry="6" fill="#555" />

      {/* Right ear cup */}
      <ellipse cx="87" cy="49" rx="7.5" ry="9" fill="#3a3a3a" stroke="#1a1a1a" strokeWidth="1" />
      <ellipse cx="87" cy="49" rx="4.5" ry="6" fill="#555" />

      {/* Microphone arm */}
      <path
        d="M83 56 Q79 65 70 68 Q66 70 64 68"
        stroke="#2a2a2a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Mic capsule */}
      <ellipse cx="63" cy="68" rx="4" ry="3" fill="#2a2a2a" stroke="#1a1a1a" strokeWidth="1" />

      {/* Left eye outer dark */}
      <circle cx="34" cy="46" r="13" fill="#09144a" />
      {/* Left eye green */}
      <circle cx="34" cy="46" r="11.5" fill="url(#plEye)" />
      {/* Left pupil */}
      <circle cx="35" cy="47" r="5" fill="#0a4400" />
      {/* Left highlights */}
      <circle cx="30" cy="42" r="4" fill="white" opacity="0.88" />
      <circle cx="32.5" cy="44.5" r="1.8" fill="white" opacity="0.6" />

      {/* Right eye outer dark */}
      <circle cx="66" cy="46" r="13" fill="#09144a" />
      {/* Right eye green */}
      <circle cx="66" cy="46" r="11.5" fill="url(#plEye)" />
      {/* Right pupil */}
      <circle cx="67" cy="47" r="5" fill="#0a4400" />
      {/* Right highlights */}
      <circle cx="62" cy="42" r="4" fill="white" opacity="0.88" />
      <circle cx="64.5" cy="44.5" r="1.8" fill="white" opacity="0.6" />

      {/* Beak upper */}
      <path
        d="M42 61 Q50 55 58 61 Q55 70 50 74 Q45 70 42 61"
        fill="#ff8800"
        stroke="#cc5500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Beak lower / open jaw */}
      <path
        d="M44 65 Q50 62 56 65 Q53 72 50 75 Q47 72 44 65"
        fill="#cc5500"
      />
      {/* Open mouth interior */}
      <path
        d="M45 67 Q50 65 55 67 Q52 72 50 74 Q48 72 45 67"
        fill="#1a0800"
      />
    </svg>
  );
}
