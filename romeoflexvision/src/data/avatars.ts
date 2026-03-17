// Inline SVG robot portraits for each agent.
// Each SVG is 64×64, dark background, uses the agent's color palette.
// Stored as raw SVG strings and converted to data URIs in AgentAvatar.

export const AGENT_AVATARS: Record<string, string> = {

  'robo-qc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="12" width="44" height="40" rx="10" fill="#7aa2f710" stroke="#7aa2f740" stroke-width="1.5"/>
    <circle cx="26" cy="28" r="9" fill="#0d1117" stroke="#7aa2f7" stroke-width="1.5"/>
    <circle cx="26" cy="28" r="6" fill="#7aa2f720"/>
    <circle cx="26" cy="28" r="4" fill="#7aa2f760"/>
    <circle cx="26" cy="28" r="2" fill="#7aa2f7"/>
    <circle cx="24" cy="26" r="0.8" fill="white" opacity="0.6"/>
    <rect x="37" y="22" width="12" height="12" rx="2" fill="#0d1117" stroke="#7aa2f7" stroke-width="1"/>
    <line x1="40.5" y1="22" x2="40.5" y2="34" stroke="#7aa2f7" stroke-width="0.6"/>
    <line x1="44.5" y1="22" x2="44.5" y2="34" stroke="#7aa2f7" stroke-width="0.6"/>
    <line x1="37" y1="26" x2="49" y2="26" stroke="#7aa2f7" stroke-width="0.6"/>
    <line x1="37" y1="30" x2="49" y2="30" stroke="#7aa2f7" stroke-width="0.6"/>
    <rect x="14" y="41" width="36" height="5" rx="2.5" fill="#7aa2f715"/>
    <rect x="16" y="42.5" width="5" height="2" rx="1" fill="#7aa2f7"/>
    <rect x="23" y="42.5" width="5" height="2" rx="1" fill="#7aa2f7"/>
    <rect x="30" y="42.5" width="5" height="2" rx="1" fill="#7aa2f7"/>
    <rect x="37" y="42.5" width="5" height="2" rx="1" fill="#7aa2f7"/>
    <line x1="32" y1="12" x2="32" y2="6" stroke="#7aa2f7" stroke-width="1.5"/>
    <circle cx="32" cy="5" r="2.5" fill="#7aa2f7"/>
    <line x1="10" y1="24" x2="14" y2="24" stroke="#7aa2f780" stroke-width="1"/>
    <line x1="50" y1="24" x2="54" y2="24" stroke="#7aa2f780" stroke-width="1"/>
  </svg>`,

  'romeo-phd': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="13" width="44" height="40" rx="12" fill="#9d7cd810" stroke="#9d7cd840" stroke-width="1.5"/>
    <circle cx="22" cy="28" r="7.5" fill="#0d1117" stroke="#9d7cd8" stroke-width="1.5"/>
    <circle cx="22" cy="28" r="4.5" fill="#9d7cd820"/>
    <circle cx="22" cy="28" r="2.5" fill="#9d7cd8"/>
    <circle cx="20.5" cy="26.5" r="0.8" fill="white" opacity="0.5"/>
    <circle cx="42" cy="28" r="7.5" fill="#0d1117" stroke="#9d7cd8" stroke-width="1.5"/>
    <circle cx="42" cy="28" r="4.5" fill="#9d7cd820"/>
    <circle cx="42" cy="28" r="2.5" fill="#9d7cd8"/>
    <circle cx="40.5" cy="26.5" r="0.8" fill="white" opacity="0.5"/>
    <line x1="29.5" y1="28" x2="34.5" y2="28" stroke="#9d7cd8" stroke-width="1.5"/>
    <line x1="10" y1="25" x2="14.5" y2="27" stroke="#9d7cd8" stroke-width="1"/>
    <line x1="54" y1="25" x2="49.5" y2="27" stroke="#9d7cd8" stroke-width="1"/>
    <path d="M 20 40 Q 32 48 44 40" stroke="#9d7cd8" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <line x1="32" y1="13" x2="32" y2="6" stroke="#9d7cd8" stroke-width="1.5"/>
    <rect x="25" y="2" width="14" height="4" rx="0.5" fill="#9d7cd8"/>
    <rect x="28" y="5.5" width="8" height="3" rx="0.5" fill="#9d7cd870"/>
    <circle cx="25" cy="4" r="1" fill="#0d1117"/>
  </svg>`,

  'andrew-analytic': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="12" width="44" height="40" rx="8" fill="#73daca10" stroke="#73daca40" stroke-width="1.5"/>
    <rect x="12" y="19" width="20" height="18" rx="3" fill="#0d1117" stroke="#73daca" stroke-width="1"/>
    <rect x="15" y="30" width="3.5" height="5" rx="0.5" fill="#73daca"/>
    <rect x="20" y="26" width="3.5" height="9" rx="0.5" fill="#73daca"/>
    <rect x="25" y="22" width="3.5" height="13" rx="0.5" fill="#73daca"/>
    <circle cx="43" cy="28" r="9" fill="#0d1117" stroke="#73daca" stroke-width="1.5"/>
    <circle cx="43" cy="28" r="5.5" fill="#73daca20"/>
    <circle cx="43" cy="28" r="3" fill="#73daca"/>
    <circle cx="41.5" cy="26.5" r="0.8" fill="white" opacity="0.5"/>
    <path d="M 12 43 Q 20 40 28 43 Q 36 46 44 43 Q 48 41 52 43" stroke="#73daca" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <line x1="28" y1="12" x2="28" y2="6" stroke="#73daca" stroke-width="1.5"/>
    <polyline points="24,8 26.5,5 28,7.5 30,4 32,6.5" stroke="#73daca" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'bassito-animator': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="12" width="44" height="40" rx="16" fill="#ff9e6410" stroke="#ff9e6440" stroke-width="1.5"/>
    <circle cx="24" cy="28" r="9" fill="#0d1117" stroke="#ff9e64" stroke-width="1.5"/>
    <polygon points="24,20.5 25.8,26.2 31.5,28 25.8,29.8 24,35.5 22.2,29.8 16.5,28 22.2,26.2" fill="#ff9e6490"/>
    <circle cx="24" cy="28" r="2.5" fill="#ff9e64"/>
    <circle cx="42" cy="28" r="9" fill="#0d1117" stroke="#ff9e64" stroke-width="1.5"/>
    <circle cx="42" cy="28" r="5.5" fill="#ff9e6425"/>
    <circle cx="42" cy="28" r="3" fill="#ff9e64"/>
    <circle cx="40" cy="26.5" r="1" fill="white" opacity="0.6"/>
    <path d="M 18 40 Q 32 50 46 40" stroke="#ff9e64" stroke-width="2" fill="none" stroke-linecap="round"/>
    <line x1="32" y1="12" x2="36" y2="5" stroke="#ff9e64" stroke-width="1.5"/>
    <ellipse cx="38.5" cy="3.5" rx="3.5" ry="2" fill="#ff9e64" transform="rotate(-25 38.5 3.5)"/>
    <line x1="26" y1="20" x2="28" y2="18" stroke="#ff9e6460" stroke-width="1"/>
    <line x1="42" y1="18" x2="44" y2="16" stroke="#ff9e6460" stroke-width="1"/>
  </svg>`,

  'chertejnik': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="12" width="44" height="40" rx="4" fill="#e0af6810" stroke="#e0af6840" stroke-width="1.5"/>
    <circle cx="24" cy="27" r="9" fill="#0d1117" stroke="#e0af68" stroke-width="1.5"/>
    <line x1="24" y1="18.5" x2="24" y2="35.5" stroke="#e0af68" stroke-width="0.8"/>
    <line x1="15.5" y1="27" x2="32.5" y2="27" stroke="#e0af68" stroke-width="0.8"/>
    <circle cx="24" cy="27" r="4" fill="#e0af6820"/>
    <circle cx="24" cy="27" r="2" fill="#e0af68"/>
    <rect x="35" y="19" width="16" height="16" rx="2" fill="#0d1117" stroke="#e0af68" stroke-width="1.5"/>
    <rect x="38" y="22" width="10" height="10" rx="1" fill="#e0af6815"/>
    <circle cx="43" cy="27" r="3" fill="#e0af68"/>
    <line x1="40" y1="24" x2="46" y2="30" stroke="#e0af6870" stroke-width="0.8"/>
    <rect x="12" y="41" width="40" height="5" rx="2.5" fill="#e0af6815"/>
    <line x1="16" y1="41" x2="16" y2="46" stroke="#e0af68" stroke-width="1"/>
    <line x1="22" y1="41" x2="22" y2="46" stroke="#e0af68" stroke-width="1"/>
    <line x1="28" y1="41" x2="28" y2="46" stroke="#e0af68" stroke-width="1"/>
    <line x1="34" y1="41" x2="34" y2="46" stroke="#e0af68" stroke-width="1"/>
    <line x1="40" y1="41" x2="40" y2="46" stroke="#e0af68" stroke-width="1"/>
    <line x1="46" y1="41" x2="46" y2="46" stroke="#e0af68" stroke-width="1"/>
    <line x1="30" y1="12" x2="28" y2="5" stroke="#e0af68" stroke-width="1.5"/>
    <line x1="34" y1="12" x2="36" y2="5" stroke="#e0af68" stroke-width="1.5"/>
    <line x1="26" y1="6" x2="38" y2="6" stroke="#e0af68" stroke-width="0.8"/>
  </svg>`,

  'perevodchik': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="12" width="44" height="40" rx="14" fill="#b4f9f810" stroke="#b4f9f840" stroke-width="1.5"/>
    <rect x="13" y="19" width="18" height="14" rx="4" fill="#0d1117" stroke="#b4f9f8" stroke-width="1.5"/>
    <line x1="19" y1="33" x2="16" y2="38" stroke="#b4f9f8" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="19.5" cy="26" r="2.5" fill="#b4f9f8"/>
    <circle cx="26.5" cy="26" r="2.5" fill="#b4f9f8"/>
    <circle cx="42" cy="26" r="9" fill="#0d1117" stroke="#b4f9f8" stroke-width="1.5"/>
    <circle cx="42" cy="26" r="5.5" fill="#b4f9f820"/>
    <circle cx="42" cy="26" r="3" fill="#b4f9f8"/>
    <circle cx="40.5" cy="24.5" r="0.8" fill="white" opacity="0.5"/>
    <circle cx="20" cy="42" r="2.5" fill="#b4f9f8"/>
    <circle cx="32" cy="42" r="2.5" fill="#b4f9f8"/>
    <circle cx="44" cy="42" r="2.5" fill="#b4f9f8"/>
    <line x1="32" y1="12" x2="32" y2="5" stroke="#b4f9f8" stroke-width="1.5"/>
    <path d="M 26 4 Q 32 1 38 4" stroke="#b4f9f8" stroke-width="1.2" fill="none"/>
    <path d="M 23 6.5 Q 32 2.5 41 6.5" stroke="#b4f9f8" stroke-width="0.7" fill="none" opacity="0.5"/>
  </svg>`,

  'pino-cut': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <rect x="10" y="12" width="44" height="40" rx="8" fill="#f7768e10" stroke="#f7768e40" stroke-width="1.5"/>
    <circle cx="24" cy="27" r="9.5" fill="#0d1117" stroke="#f7768e" stroke-width="1.5"/>
    <circle cx="24" cy="27" r="6.5" fill="#f7768e15"/>
    <circle cx="24" cy="27" r="2.5" fill="#0d1117" stroke="#f7768e" stroke-width="1"/>
    <circle cx="24" cy="18.5" r="1.8" fill="#f7768e"/>
    <circle cx="31.5" cy="22" r="1.8" fill="#f7768e"/>
    <circle cx="31.5" cy="32" r="1.8" fill="#f7768e"/>
    <circle cx="24" cy="35.5" r="1.8" fill="#f7768e"/>
    <circle cx="16.5" cy="32" r="1.8" fill="#f7768e"/>
    <circle cx="16.5" cy="22" r="1.8" fill="#f7768e"/>
    <rect x="35" y="20" width="16" height="13" rx="3" fill="#0d1117" stroke="#f7768e" stroke-width="1.5"/>
    <polygon points="40,23 40,30.5 47,26.5" fill="#f7768e"/>
    <rect x="14" y="41" width="36" height="5" rx="1.5" fill="#f7768e20"/>
    <rect x="14" y="41" width="36" height="2.5" rx="1" fill="#f7768e50"/>
    <line x1="19" y1="41" x2="17" y2="43.5" stroke="#0d1117" stroke-width="1.5"/>
    <line x1="25" y1="41" x2="23" y2="43.5" stroke="#0d1117" stroke-width="1.5"/>
    <line x1="31" y1="41" x2="29" y2="43.5" stroke="#0d1117" stroke-width="1.5"/>
    <line x1="37" y1="41" x2="35" y2="43.5" stroke="#0d1117" stroke-width="1.5"/>
    <line x1="43" y1="41" x2="41" y2="43.5" stroke="#0d1117" stroke-width="1.5"/>
    <rect x="29" y="3" width="6" height="9" rx="0.5" fill="#f7768e" stroke="#0d1117" stroke-width="0.8"/>
    <rect x="29" y="3" width="6" height="2" fill="#0d1117" opacity="0.5"/>
    <rect x="29" y="6" width="6" height="2" fill="#0d1117" opacity="0.5"/>
    <rect x="29" y="9" width="6" height="2" fill="#0d1117" opacity="0.5"/>
  </svg>`,

  'orchestrator': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <polygon points="32,8 52,20 52,44 32,56 12,44 12,20" fill="#7aa2f708" stroke="#7aa2f740" stroke-width="1.5"/>
    <line x1="32" y1="23" x2="32" y2="14" stroke="#7aa2f750" stroke-width="1"/>
    <circle cx="32" cy="13" r="2.5" fill="#7aa2f7"/>
    <line x1="40.5" y1="27" x2="48" y2="22" stroke="#7aa2f750" stroke-width="1"/>
    <circle cx="49" cy="21" r="2.5" fill="#7aa2f7"/>
    <line x1="40.5" y1="37" x2="48" y2="42" stroke="#7aa2f750" stroke-width="1"/>
    <circle cx="49" cy="43" r="2.5" fill="#7aa2f7"/>
    <line x1="32" y1="41" x2="32" y2="50" stroke="#7aa2f750" stroke-width="1"/>
    <circle cx="32" cy="51" r="2.5" fill="#7aa2f7"/>
    <line x1="23.5" y1="37" x2="16" y2="42" stroke="#7aa2f750" stroke-width="1"/>
    <circle cx="15" cy="43" r="2.5" fill="#7aa2f7"/>
    <line x1="23.5" y1="27" x2="16" y2="22" stroke="#7aa2f750" stroke-width="1"/>
    <circle cx="15" cy="21" r="2.5" fill="#7aa2f7"/>
    <circle cx="32" cy="32" r="10" fill="#0d1117" stroke="#7aa2f7" stroke-width="2"/>
    <circle cx="32" cy="32" r="6" fill="#7aa2f730"/>
    <circle cx="32" cy="32" r="3.5" fill="#7aa2f7"/>
    <circle cx="30.5" cy="30.5" r="1" fill="white" opacity="0.5"/>
  </svg>`,
};

export function avatarDataUri(agentId: string): string | null {
  const svg = AGENT_AVATARS[agentId];
  if (!svg) return null;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}
