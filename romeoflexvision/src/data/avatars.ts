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
    <!-- Green line chart floating above -->
    <circle cx="21" cy="10" r="1.8" fill="#39ff14"/>
    <circle cx="29" cy="7" r="1.3" fill="#39ff14"/>
    <circle cx="37" cy="9" r="2.2" fill="#39ff14"/>
    <circle cx="45" cy="6" r="1.5" fill="#39ff14"/>
    <polyline points="21,10 29,7 37,9 45,6" stroke="#39ff14" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
    <!-- Ear tufts -->
    <polygon points="19,29 23,14 29,27" fill="#232b38"/>
    <polygon points="35,27 41,14 45,29" fill="#232b38"/>
    <!-- Owl head -->
    <circle cx="32" cy="39" r="20" fill="#364050"/>
    <!-- Feather scales -->
    <circle cx="22" cy="33" r="4" fill="#232b38" opacity="0.45"/>
    <circle cx="32" cy="29" r="4.5" fill="#232b38" opacity="0.4"/>
    <circle cx="42" cy="33" r="4" fill="#232b38" opacity="0.45"/>
    <circle cx="16" cy="42" r="4" fill="#232b38" opacity="0.4"/>
    <circle cx="48" cy="42" r="4" fill="#232b38" opacity="0.4"/>
    <!-- White facial disk -->
    <ellipse cx="22" cy="38" rx="9.5" ry="10.5" fill="#dde1e6" opacity="0.9"/>
    <ellipse cx="42" cy="38" rx="9.5" ry="10.5" fill="#dde1e6" opacity="0.9"/>
    <!-- Glasses left frame -->
    <rect x="10" y="30" width="21" height="14" rx="4" fill="#111827"/>
    <!-- Glasses right frame -->
    <rect x="33" y="30" width="21" height="14" rx="4" fill="#111827"/>
    <!-- Bridge -->
    <rect x="31" y="34" width="2" height="4" rx="1" fill="#111827"/>
    <!-- Temple arms -->
    <line x1="10" y1="37" x2="6" y2="36" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="54" y1="37" x2="58" y2="36" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Left lens -->
    <rect x="11.5" y="31.5" width="18" height="11" rx="2.8" fill="#011a00"/>
    <radialGradient id="ow1" cx="42%" cy="38%"><stop offset="0%" stop-color="#8fff55"/><stop offset="55%" stop-color="#33cc00"/><stop offset="100%" stop-color="#011a00"/></radialGradient>
    <rect x="11.5" y="31.5" width="18" height="11" rx="2.8" fill="url(#ow1)"/>
    <circle cx="16.5" cy="35.5" r="1.6" fill="white" opacity="0.85"/>
    <!-- Right lens -->
    <rect x="34.5" y="31.5" width="18" height="11" rx="2.8" fill="#011a00"/>
    <radialGradient id="ow2" cx="42%" cy="38%"><stop offset="0%" stop-color="#8fff55"/><stop offset="55%" stop-color="#33cc00"/><stop offset="100%" stop-color="#011a00"/></radialGradient>
    <rect x="34.5" y="31.5" width="18" height="11" rx="2.8" fill="url(#ow2)"/>
    <circle cx="39.5" cy="35.5" r="1.6" fill="white" opacity="0.85"/>
    <!-- Beak -->
    <polygon points="28.5,43 35.5,43 32,49" fill="#6b7a8d"/>
  </svg>`,

  'andrew-analytic': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <!-- Fox ears -->
    <polygon points="15,33 21,9 31,29" fill="#d96a10"/>
    <polygon points="33,29 43,9 49,33" fill="#d96a10"/>
    <polygon points="18,31 22,15 29,28" fill="#f0b878"/>
    <polygon points="35,28 42,15 46,31" fill="#f0b878"/>
    <!-- Head -->
    <ellipse cx="32" cy="37" rx="20" ry="18" fill="#e8780a"/>
    <!-- Muzzle -->
    <ellipse cx="32" cy="47" rx="12" ry="8" fill="#f5d5a0"/>
    <!-- Glasses left frame -->
    <rect x="10" y="30" width="18" height="12" rx="3.5" fill="#111827"/>
    <!-- Glasses right frame -->
    <rect x="36" y="30" width="18" height="12" rx="3.5" fill="#111827"/>
    <!-- Bridge -->
    <rect x="28" y="33.5" width="8" height="2.5" rx="1.2" fill="#111827"/>
    <!-- Temple arms -->
    <line x1="10" y1="35" x2="6" y2="34" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="54" y1="35" x2="58" y2="34" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Left lens -->
    <rect x="11.5" y="31.5" width="15" height="9" rx="2.5" fill="#011a00"/>
    <radialGradient id="lg1" cx="45%" cy="40%"><stop offset="0%" stop-color="#7fff50"/><stop offset="60%" stop-color="#39dd00"/><stop offset="100%" stop-color="#001a00"/></radialGradient>
    <rect x="11.5" y="31.5" width="15" height="9" rx="2.5" fill="url(#lg1)" opacity="0.9"/>
    <circle cx="16" cy="34" r="1.2" fill="white" opacity="0.8"/>
    <!-- Right lens -->
    <rect x="37.5" y="31.5" width="15" height="9" rx="2.5" fill="#011a00"/>
    <radialGradient id="lg2" cx="45%" cy="40%"><stop offset="0%" stop-color="#7fff50"/><stop offset="60%" stop-color="#39dd00"/><stop offset="100%" stop-color="#001a00"/></radialGradient>
    <rect x="37.5" y="31.5" width="15" height="9" rx="2.5" fill="url(#lg2)" opacity="0.9"/>
    <circle cx="42" cy="34" r="1.2" fill="white" opacity="0.8"/>
    <!-- Nose -->
    <ellipse cx="32" cy="48" rx="2.5" ry="2" fill="#1a1a1a"/>
    <!-- Smile -->
    <path d="M 27 52 Q 32 56 37 52" stroke="#a0784a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
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
    <!-- Cat ears -->
    <polygon points="17,31 22,13 29,28" fill="#e8e8f0"/>
    <polygon points="35,28 42,13 47,31" fill="#e8e8f0"/>
    <polygon points="19.5,29 23,17 27.5,27" fill="#c4c4d4"/>
    <polygon points="36.5,27 41,17 44.5,29" fill="#c4c4d4"/>
    <!-- Face -->
    <circle cx="32" cy="39" r="19" fill="#eceff4"/>
    <!-- Headphone band -->
    <path d="M 11 36 Q 32 12 53 36" stroke="#111827" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M 11 36 Q 32 12 53 36" stroke="#39ff14" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.9"/>
    <!-- Left cup -->
    <rect x="7" y="32" width="8" height="13" rx="4" fill="#111827"/>
    <rect x="8.5" y="33.5" width="5" height="10" rx="2.5" fill="#0a0f1a"/>
    <line x1="10" y1="36" x2="10" y2="42" stroke="#39ff14" stroke-width="1.3"/>
    <line x1="12.5" y1="36" x2="12.5" y2="42" stroke="#39ff14" stroke-width="1.3"/>
    <!-- Right cup -->
    <rect x="49" y="32" width="8" height="13" rx="4" fill="#111827"/>
    <rect x="50.5" y="33.5" width="5" height="10" rx="2.5" fill="#0a0f1a"/>
    <line x1="51.5" y1="36" x2="51.5" y2="42" stroke="#39ff14" stroke-width="1.3"/>
    <line x1="54" y1="36" x2="54" y2="42" stroke="#39ff14" stroke-width="1.3"/>
    <!-- Left eye glow -->
    <circle cx="22" cy="38" r="7.5" fill="#001500" opacity="0.95"/>
    <circle cx="22" cy="38" r="5.5" fill="#003300"/>
    <circle cx="22" cy="38" r="4" fill="#39ff14" opacity="0.9"/>
    <circle cx="22" cy="38" r="2.5" fill="#90ff60"/>
    <circle cx="20.5" cy="36.5" r="1.3" fill="white" opacity="0.9"/>
    <!-- Right eye glow -->
    <circle cx="42" cy="38" r="7.5" fill="#001500" opacity="0.95"/>
    <circle cx="42" cy="38" r="5.5" fill="#003300"/>
    <circle cx="42" cy="38" r="4" fill="#39ff14" opacity="0.9"/>
    <circle cx="42" cy="38" r="2.5" fill="#90ff60"/>
    <circle cx="40.5" cy="36.5" r="1.3" fill="white" opacity="0.9"/>
    <!-- Nose -->
    <ellipse cx="32" cy="47" rx="2.5" ry="1.8" fill="#6b7280"/>
    <!-- Mouth -->
    <path d="M 28 50 Q 32 54 36 50" stroke="#6b7280" stroke-width="1.5" fill="none" stroke-linecap="round"/>
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
