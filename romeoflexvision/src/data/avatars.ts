// Inline SVG robot portraits for each agent.
// Each SVG is 64×64, dark background, uses the agent's color palette.
// Stored as raw SVG strings and converted to data URIs in AgentAvatar.

export const AGENT_AVATARS: Record<string, string> = {

  'robo-qc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <!-- Armor collar / shoulders -->
    <ellipse cx="16" cy="62" rx="16" ry="9" fill="#1a3a6a"/>
    <ellipse cx="48" cy="62" rx="16" ry="9" fill="#1a3a6a"/>
    <rect x="18" y="52" width="28" height="10" rx="2" fill="#c8d4e0"/>
    <rect x="22" y="54" width="20" height="6" rx="1" fill="#dce8f0"/>
    <!-- Dome interior - circuit board -->
    <circle cx="32" cy="27" r="22" fill="#080e18"/>
    <!-- PCB traces -->
    <line x1="20" y1="16" x2="44" y2="16" stroke="#7aa2f728" stroke-width="0.9"/>
    <line x1="20" y1="16" x2="20" y2="40" stroke="#7aa2f728" stroke-width="0.9"/>
    <line x1="44" y1="16" x2="44" y2="38" stroke="#7aa2f728" stroke-width="0.9"/>
    <line x1="20" y1="22" x2="28" y2="22" stroke="#7aa2f728" stroke-width="0.9"/>
    <line x1="36" y1="22" x2="44" y2="22" stroke="#7aa2f728" stroke-width="0.9"/>
    <line x1="28" y1="22" x2="28" y2="16" stroke="#7aa2f728" stroke-width="0.9"/>
    <line x1="36" y1="22" x2="36" y2="16" stroke="#7aa2f728" stroke-width="0.9"/>
    <rect x="23" y="10" width="9" height="6" rx="0.8" fill="#7aa2f718" stroke="#7aa2f740" stroke-width="0.6"/>
    <rect x="35" y="10" width="7" height="5" rx="0.8" fill="#7aa2f718" stroke="#7aa2f740" stroke-width="0.6"/>
    <rect x="20" y="41" width="10" height="5" rx="0.8" fill="#7aa2f718" stroke="#7aa2f740" stroke-width="0.6"/>
    <rect x="33" y="41" width="10" height="5" rx="0.8" fill="#7aa2f718" stroke="#7aa2f740" stroke-width="0.6"/>
    <circle cx="32" cy="11" r="1.5" fill="#ff6b3520" stroke="#ff6b35" stroke-width="0.6"/>
    <circle cx="36" cy="8" r="1" fill="#7aa2f740"/>
    <!-- Brass cylinder (mouth) -->
    <rect x="26" y="40" width="12" height="5" rx="2.5" fill="#b8952a"/>
    <rect x="27" y="41" width="10" height="3" rx="1.5" fill="#9a7d22"/>
    <line x1="30" y1="40" x2="30" y2="45" stroke="#c8a83a" stroke-width="0.6"/>
    <line x1="34" y1="40" x2="34" y2="45" stroke="#c8a83a" stroke-width="0.6"/>
    <!-- Left side camera -->
    <circle cx="12" cy="27" r="5.5" fill="#0d1f3a" stroke="#7aa2f7" stroke-width="1.5"/>
    <circle cx="12" cy="27" r="3.5" fill="#040c18"/>
    <circle cx="12" cy="27" r="2.2" fill="#1a4080"/>
    <circle cx="12" cy="27" r="1.2" fill="#7aa2f7" opacity="0.9"/>
    <circle cx="11.2" cy="26.2" r="0.5" fill="white" opacity="0.7"/>
    <!-- Left eye glow -->
    <circle cx="23" cy="29" r="7.5" fill="#040c18"/>
    <circle cx="23" cy="29" r="6" fill="#0a1e3a"/>
    <circle cx="23" cy="29" r="4.5" fill="#1040a0"/>
    <circle cx="23" cy="29" r="3" fill="#7aa2f7"/>
    <circle cx="23" cy="29" r="1.5" fill="white" opacity="0.95"/>
    <circle cx="21.8" cy="27.8" r="0.7" fill="white"/>
    <!-- Right eye glow -->
    <circle cx="41" cy="29" r="7.5" fill="#040c18"/>
    <circle cx="41" cy="29" r="6" fill="#0a1e3a"/>
    <circle cx="41" cy="29" r="4.5" fill="#1040a0"/>
    <circle cx="41" cy="29" r="3" fill="#7aa2f7"/>
    <circle cx="41" cy="29" r="1.5" fill="white" opacity="0.95"/>
    <circle cx="39.8" cy="27.8" r="0.7" fill="white"/>
    <!-- Light beam from right eye -->
    <path d="M 48 27 L 64 21" stroke="#7aa2f7" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    <path d="M 48 29 L 64 26" stroke="#7aa2f7" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
    <path d="M 48 31 L 64 31" stroke="#7aa2f7" stroke-width="0.6" stroke-linecap="round" opacity="0.2"/>
    <!-- Glass dome outline -->
    <circle cx="32" cy="27" r="22" fill="none" stroke="#7aa2f7" stroke-width="1" opacity="0.45"/>
    <!-- Glass reflection highlight -->
    <path d="M 17 14 Q 26 8 38 11" stroke="white" stroke-width="1.8" fill="none" opacity="0.18" stroke-linecap="round"/>
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
    <!-- Left ear -->
    <ellipse cx="11" cy="38" rx="9" ry="13" fill="#e8960a" transform="rotate(-10 11 38)"/>
    <ellipse cx="11" cy="38" rx="6" ry="10" fill="#ffb800" transform="rotate(-10 11 38)"/>
    <!-- Right ear -->
    <ellipse cx="53" cy="38" rx="9" ry="13" fill="#e8960a" transform="rotate(10 53 38)"/>
    <ellipse cx="53" cy="38" rx="6" ry="10" fill="#ffb800" transform="rotate(10 53 38)"/>
    <!-- Head -->
    <ellipse cx="32" cy="34" rx="22" ry="20" fill="#ffb800"/>
    <!-- Forehead highlight -->
    <ellipse cx="30" cy="22" rx="10" ry="7" fill="#ffd040" opacity="0.5"/>
    <!-- Cheeks -->
    <ellipse cx="32" cy="42" rx="16" ry="12" fill="#ffca30"/>
    <!-- Glasses frame left -->
    <rect x="11" y="27" width="17" height="11" rx="3" fill="#1a1a1a" stroke="#111" stroke-width="0.5"/>
    <!-- Glasses lens left (green) -->
    <rect x="12" y="28" width="15" height="9" rx="2.5" fill="#22c55e" opacity="0.8"/>
    <rect x="12" y="28" width="15" height="9" rx="2.5" fill="url(#gl)" opacity="0.5"/>
    <!-- Glasses frame right -->
    <rect x="36" y="27" width="17" height="11" rx="3" fill="#1a1a1a" stroke="#111" stroke-width="0.5"/>
    <!-- Glasses lens right (green) -->
    <rect x="37" y="28" width="15" height="9" rx="2.5" fill="#22c55e" opacity="0.8"/>
    <rect x="37" y="28" width="15" height="9" rx="2.5" fill="url(#gr)" opacity="0.5"/>
    <!-- Bridge -->
    <line x1="28" y1="32" x2="36" y2="32" stroke="#1a1a1a" stroke-width="1.8"/>
    <!-- Lens reflections -->
    <circle cx="15" cy="30" r="2" fill="white" opacity="0.55"/>
    <circle cx="40" cy="30" r="2" fill="white" opacity="0.55"/>
    <!-- Nose -->
    <ellipse cx="32" cy="44" rx="3.5" ry="2.5" fill="#1a1a1a"/>
    <ellipse cx="31" cy="43.2" rx="1" ry="0.6" fill="#3a3a3a" opacity="0.6"/>
    <!-- Smile -->
    <path d="M 26 50 Q 32 55 38 50" stroke="#a07010" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- Fur texture bottom -->
    <path d="M 12 50 Q 18 58 32 60 Q 46 58 52 50" fill="#e8960a" opacity="0.5"/>
    <defs>
      <radialGradient id="gl" cx="30%" cy="30%"><stop offset="0%" stop-color="white" stop-opacity="0.6"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient>
      <radialGradient id="gr" cx="30%" cy="30%"><stop offset="0%" stop-color="white" stop-opacity="0.6"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient>
    </defs>
  </svg>`,

  'chertejnik': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <!-- Ears -->
    <circle cx="13" cy="36" r="7" fill="#6b3a1f"/>
    <circle cx="51" cy="36" r="7" fill="#6b3a1f"/>
    <circle cx="13" cy="36" r="4.5" fill="#8b4e28"/>
    <circle cx="51" cy="36" r="4.5" fill="#8b4e28"/>
    <!-- Head -->
    <circle cx="32" cy="42" r="21" fill="#8b4e28"/>
    <!-- Forehead fur texture -->
    <circle cx="22" cy="34" r="5" fill="#7a4422" opacity="0.5"/>
    <circle cx="42" cy="34" r="5" fill="#7a4422" opacity="0.5"/>
    <!-- Muzzle -->
    <ellipse cx="32" cy="52" rx="13" ry="9" fill="#c8906a"/>
    <!-- Cheek fur -->
    <circle cx="15" cy="48" r="6" fill="#7a4422" opacity="0.4"/>
    <circle cx="49" cy="48" r="6" fill="#7a4422" opacity="0.4"/>
    <!-- Hard hat brim -->
    <rect x="8" y="24" width="48" height="5" rx="2.5" fill="#d4920a"/>
    <!-- Hard hat dome -->
    <ellipse cx="32" cy="18" rx="24" ry="17" fill="#f0b800"/>
    <!-- Hat shine -->
    <ellipse cx="26" cy="10" rx="7" ry="4" fill="white" opacity="0.3" transform="rotate(-20 26 10)"/>
    <ellipse cx="38" cy="8" rx="3" ry="2" fill="white" opacity="0.2" transform="rotate(-10 38 8)"/>
    <!-- Hat ridge lines -->
    <path d="M 32 3 Q 32 22 32 24" stroke="#c8a000" stroke-width="1" fill="none" opacity="0.6"/>
    <path d="M 22 6 Q 20 18 16 24" stroke="#c8a000" stroke-width="0.8" fill="none" opacity="0.4"/>
    <path d="M 42 6 Q 44 18 48 24" stroke="#c8a000" stroke-width="0.8" fill="none" opacity="0.4"/>
    <!-- Pencil tucked in hat (right side) -->
    <rect x="46" y="14" width="4" height="18" rx="1" fill="#f5e060" transform="rotate(15 48 23)"/>
    <rect x="46" y="14" width="4" height="3" rx="1" fill="#e8b870" transform="rotate(15 48 23)"/>
    <polygon points="48,32 46,35 50,35" fill="#e8c090" transform="rotate(15 48 23)"/>
    <!-- Glasses left frame -->
    <circle cx="22" cy="38" r="9" fill="#111827"/>
    <!-- Glasses right frame -->
    <circle cx="42" cy="38" r="9" fill="#111827"/>
    <!-- Bridge -->
    <rect x="31" y="36.5" width="0" height="0"/>
    <line x1="31" y1="38" x2="33" y2="38" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
    <!-- Temple arms -->
    <line x1="13" y1="38" x2="9" y2="37" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
    <line x1="51" y1="38" x2="55" y2="37" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
    <!-- Left lens golden ring -->
    <circle cx="22" cy="38" r="7.5" fill="#b8860b"/>
    <circle cx="22" cy="38" r="6.5" fill="#1a3000"/>
    <!-- Left lens green glow -->
    <radialGradient id="ch1" cx="40%" cy="38%"><stop offset="0%" stop-color="#90ff30"/><stop offset="50%" stop-color="#44cc00"/><stop offset="100%" stop-color="#0a2200"/></radialGradient>
    <circle cx="22" cy="38" r="6.5" fill="url(#ch1)"/>
    <circle cx="19.5" cy="35.5" r="2" fill="white" opacity="0.85"/>
    <circle cx="21" cy="34.5" r="1" fill="white" opacity="0.6"/>
    <!-- Right lens golden ring -->
    <circle cx="42" cy="38" r="7.5" fill="#b8860b"/>
    <circle cx="42" cy="38" r="6.5" fill="#1a3000"/>
    <!-- Right lens green glow -->
    <radialGradient id="ch2" cx="40%" cy="38%"><stop offset="0%" stop-color="#90ff30"/><stop offset="50%" stop-color="#44cc00"/><stop offset="100%" stop-color="#0a2200"/></radialGradient>
    <circle cx="42" cy="38" r="6.5" fill="url(#ch2)"/>
    <circle cx="39.5" cy="35.5" r="2" fill="white" opacity="0.85"/>
    <circle cx="41" cy="34.5" r="1" fill="white" opacity="0.6"/>
    <!-- Nose -->
    <ellipse cx="32" cy="50" rx="3.5" ry="2.8" fill="#2a1a0a"/>
    <!-- Smile -->
    <path d="M 24 55 Q 32 61 40 55" stroke="#2a1a0a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Whisker dots -->
    <circle cx="22" cy="53" r="0.8" fill="#5a3010" opacity="0.6"/>
    <circle cx="25" cy="54" r="0.8" fill="#5a3010" opacity="0.6"/>
    <circle cx="42" cy="53" r="0.8" fill="#5a3010" opacity="0.6"/>
    <circle cx="39" cy="54" r="0.8" fill="#5a3010" opacity="0.6"/>
  </svg>`,

  'perevodchik': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#0d1117"/>
    <!-- Parrot head base - green -->
    <circle cx="32" cy="38" r="23" fill="#28b030"/>
    <!-- Blue left feather patch -->
    <ellipse cx="17" cy="35" rx="13" ry="15" fill="#1a6ad0"/>
    <!-- Yellow/golden right cheek -->
    <ellipse cx="47" cy="40" rx="13" ry="12" fill="#d89010"/>
    <!-- Green top feathers overlay -->
    <ellipse cx="32" cy="27" rx="19" ry="15" fill="#38d040"/>
    <!-- Bright green highlight center -->
    <ellipse cx="32" cy="26" rx="12" ry="9" fill="#58f050" opacity="0.7"/>
    <!-- Headphone band -->
    <path d="M 9 34 Q 32 8 55 34" stroke="#252525" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <!-- Left cup -->
    <rect x="5" y="30" width="9" height="13" rx="4.5" fill="#2a2a2a"/>
    <rect x="6.5" y="31.5" width="6" height="10" rx="3" fill="#111"/>
    <!-- Right cup -->
    <rect x="50" y="30" width="9" height="13" rx="4.5" fill="#2a2a2a"/>
    <rect x="51.5" y="31.5" width="6" height="10" rx="3" fill="#111"/>
    <!-- Mic boom -->
    <path d="M 55 40 Q 54 50 46 52" stroke="#2a2a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="44.5" cy="52.5" rx="3" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
    <!-- Left eye -->
    <circle cx="21" cy="35" r="9" fill="#061206"/>
    <circle cx="21" cy="35" r="7.5" fill="#0a2200"/>
    <radialGradient id="pe1" cx="38%" cy="35%"><stop offset="0%" stop-color="#a0ff40"/><stop offset="45%" stop-color="#38d000"/><stop offset="100%" stop-color="#082000"/></radialGradient>
    <circle cx="21" cy="35" r="6" fill="url(#pe1)"/>
    <circle cx="18.5" cy="32.5" r="2.2" fill="white" opacity="0.9"/>
    <circle cx="20" cy="31.5" r="1" fill="white" opacity="0.65"/>
    <!-- Right eye -->
    <circle cx="43" cy="35" r="9" fill="#061206"/>
    <circle cx="43" cy="35" r="7.5" fill="#0a2200"/>
    <radialGradient id="pe2" cx="38%" cy="35%"><stop offset="0%" stop-color="#a0ff40"/><stop offset="45%" stop-color="#38d000"/><stop offset="100%" stop-color="#082000"/></radialGradient>
    <circle cx="43" cy="35" r="6" fill="url(#pe2)"/>
    <circle cx="40.5" cy="32.5" r="2.2" fill="white" opacity="0.9"/>
    <circle cx="42" cy="31.5" r="1" fill="white" opacity="0.65"/>
    <!-- Beak upper -->
    <path d="M 27 44 Q 32 39 37 44 L 34 50 Q 32 52 30 50 Z" fill="#d87010"/>
    <!-- Beak lower / open -->
    <path d="M 29 48 Q 32 54 35 48" fill="#1a0505"/>
    <!-- Beak highlight -->
    <path d="M 29 42 Q 32 40 35 42" stroke="#f09828" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.8"/>
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
