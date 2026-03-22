interface RomeoPhdIconProps {
  size?: number;
}

export default function RomeoPhdIcon({ size = 28 }: RomeoPhdIconProps) {
  return (
    <svg
      viewBox="0 0 100 105"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="rpGlow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#d4ff44" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#aaee22" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#88cc00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rpHead" cx="33%" cy="22%" r="68%">
          <stop offset="0%" stopColor="#5599ee" />
          <stop offset="50%" stopColor="#2a5cc4" />
          <stop offset="100%" stopColor="#0f1f77" />
        </radialGradient>
        <radialGradient id="rpEye" cx="33%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#aaff55" />
          <stop offset="40%" stopColor="#44cc11" />
          <stop offset="100%" stopColor="#0d5500" />
        </radialGradient>
      </defs>

      {/* Glow background */}
      <ellipse cx="50" cy="70" rx="44" ry="30" fill="url(#rpGlow)" />

      {/* Upper-left tentacle */}
      <path
        d="M28 57 C18 53 11 49 9 42 C7 36 11 33 15 36 C18 39 17 44 22 48 C25 51 27 54 30 57"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Lower-left tentacle */}
      <path
        d="M30 66 C19 67 13 63 10 57 C8 51 11 47 15 50 C18 52 19 57 24 61 C27 63 29 64 32 66"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Upper-right tentacle */}
      <path
        d="M72 57 C82 53 89 49 91 42 C93 36 89 33 85 36 C82 39 83 44 78 48 C75 51 73 54 70 57"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Lower-right tentacle */}
      <path
        d="M70 66 C81 67 87 63 90 57 C92 51 89 47 85 50 C82 52 81 57 76 61 C73 63 71 64 68 66"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Bottom-left tendril */}
      <path
        d="M42 73 C38 81 34 85 31 89 C29 93 31 97 35 96 C38 95 38 91 41 88 C43 85 45 81 46 75"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Bottom-center tendril */}
      <path
        d="M50 75 C50 83 48 88 46 92 C44 96 46 100 50 100 C54 100 56 96 54 92 C52 88 50 83 50 75"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Bottom-right tendril */}
      <path
        d="M58 73 C62 81 66 85 69 89 C71 93 69 97 65 96 C62 95 62 91 59 88 C57 85 55 81 54 75"
        fill="#1a2e82"
        stroke="#09144a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Head main shape */}
      <ellipse
        cx="50"
        cy="40"
        rx="28"
        ry="31"
        fill="url(#rpHead)"
        stroke="#09144a"
        strokeWidth="2.5"
      />

      {/* Left eye outer (dark ring) */}
      <circle cx="34" cy="51" r="12" fill="#09144a" />
      {/* Left eye green */}
      <circle cx="34" cy="51" r="10.5" fill="url(#rpEye)" />
      {/* Left pupil */}
      <circle cx="35" cy="52" r="5" fill="#0a4400" />
      {/* Left eye highlights */}
      <circle cx="30" cy="47" r="3.5" fill="white" opacity="0.88" />
      <circle cx="33" cy="50" r="1.8" fill="white" opacity="0.6" />

      {/* Right eye outer (dark ring) */}
      <circle cx="66" cy="51" r="12" fill="#09144a" />
      {/* Right eye green */}
      <circle cx="66" cy="51" r="10.5" fill="url(#rpEye)" />
      {/* Right pupil */}
      <circle cx="67" cy="52" r="5" fill="#0a4400" />
      {/* Right eye highlights */}
      <circle cx="62" cy="47" r="3.5" fill="white" opacity="0.88" />
      <circle cx="65" cy="50" r="1.8" fill="white" opacity="0.6" />

      {/* Head gloss highlight */}
      <ellipse
        cx="41"
        cy="24"
        rx="10"
        ry="7"
        fill="white"
        opacity="0.18"
        transform="rotate(-20 41 24)"
      />
    </svg>
  );
}
