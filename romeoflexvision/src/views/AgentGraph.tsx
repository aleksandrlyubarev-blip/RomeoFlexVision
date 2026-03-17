import { useState, useEffect } from 'react';
import { AGENTS } from '../data/agents';
import { useI18n } from '../context/I18nContext';
import type { Agent, TraceStep } from '../types';

// ---- SVG layout constants ----
const VW = 830;
const VH = 480;
const ORCH_X = VW / 2;
const ORCH_Y = 78;
const ORCH_R = 34;
const NODE_Y = 355;
const NODE_R = 26;

const AGENT_IDS = [
  'robo-qc', 'romeo-phd', 'andrew-analytic',
  'bassito-animator', 'chertejnik', 'perevodchik', 'pino-cut',
];

// Spread agents evenly
const MARGIN_X = 62;
const STEP_X = (VW - MARGIN_X * 2) / (AGENT_IDS.length - 1);
const AGENT_X: Record<string, number> = {};
AGENT_IDS.forEach((id, i) => { AGENT_X[id] = MARGIN_X + i * STEP_X; });

// ---- Demo trace ----
const MOCK_TRACE: TraceStep[] = [
  {
    id: 't1', step: 1, type: 'prompt', label: 'User Prompt',
    content: 'Проанализировать производственный дефект на линии A3, создать отчёт и подготовить анимацию для обучения',
    latencyMs: 12, tokens: { input: 87, output: 0, cached: 0 }, status: 'ok', timestamp: '14:32:01.012',
  },
  {
    id: 't2', step: 2, type: 'tool_call', label: 'Orchestrator → Robo QC',
    content: 'route_task({ agent: "robo-qc", task: "defect_analysis", data: { line: "A3" } })',
    latencyMs: 8, status: 'ok', timestamp: '14:32:01.024',
  },
  {
    id: 't3', step: 3, type: 'tool_response', label: 'Robo QC → Result',
    content: '{ defects: 3, type: "surface_scratch", confidence: 0.942 }',
    latencyMs: 2340, tokens: { input: 312, output: 89, cached: 180 }, status: 'ok', timestamp: '14:32:03.364',
  },
  {
    id: 't4', step: 4, type: 'tool_call', label: 'Orchestrator → Romeo PhD',
    content: 'route_task({ agent: "romeo-phd", task: "generate_report", context: prev_results })',
    latencyMs: 11, status: 'ok', timestamp: '14:32:03.375',
  },
  {
    id: 't5', step: 5, type: 'llm_response', label: 'Romeo PhD → Report Draft',
    content: '## Отчёт о дефекте\n\nОбнаружены царапины класса B по ISO 1302...',
    latencyMs: 4120, tokens: { input: 445, output: 634, cached: 312 }, status: 'ok', timestamp: '14:32:07.495',
  },
  {
    id: 't6', step: 6, type: 'tool_call', label: 'Human-in-the-loop',
    content: 'AWAIT_APPROVAL: Неопределённость классификации >40%.',
    latencyMs: 0, status: 'ok', timestamp: '14:32:07.500',
  },
];

// Map each trace step to which edge is active
const STEP_EDGE: (null | { agentId: string; dir: 'out' | 'in' })[] = [
  null,                                    // t1: prompt
  { agentId: 'robo-qc',    dir: 'out' },   // t2: call robo-qc
  { agentId: 'robo-qc',    dir: 'in'  },   // t3: robo-qc responds
  { agentId: 'romeo-phd',  dir: 'out' },   // t4: call romeo-phd
  { agentId: 'romeo-phd',  dir: 'in'  },   // t5: romeo-phd responds
  null,                                    // t6: human-in-loop
];

// Aggregate token weight per edge (from trace data)
const EDGE_TOKENS: Record<string, number> = {
  'robo-qc':   312 + 89 + 180,   // 581
  'romeo-phd': 445 + 634 + 312,  // 1391
};
const MAX_TOKENS = Math.max(...Object.values(EDGE_TOKENS));

// ---- Geometry helpers ----
function edgePath(agentX: number, fromOrch: boolean): string {
  const ox = ORCH_X, oy = ORCH_Y + ORCH_R;
  const ax = agentX, ay = NODE_Y - NODE_R;
  const cy1 = oy + 110, cy2 = ay - 90;
  return fromOrch
    ? `M ${ox} ${oy} C ${ox} ${cy1} ${ax} ${cy2} ${ax} ${ay}`
    : `M ${ax} ${ay} C ${ax} ${cy2} ${ox} ${cy1} ${ox} ${oy}`;
}

function edgeStrokeWidth(agentId: string): number {
  const t = EDGE_TOKENS[agentId] ?? 0;
  return 1.2 + (t / MAX_TOKENS) * 2.2;
}

// ---- Status colour lookup (same mapping as AgentAvatar) ----
const STATUS_DOT: Record<string, string> = {
  idle:      '#6c7086',
  computing: '#7aa2f7',
  error:     '#f7768e',
  ready:     '#9ece6a',
  dev:       '#e0af68',
};

const TYPE_COLORS: Record<string, string> = {
  prompt:        '#7aa2f7',
  tool_call:     '#9d7cd8',
  tool_response: '#73daca',
  llm_response:  '#c0caf5',
};

// ---- Summary stats ----
const TOTAL_TOKENS  = MOCK_TRACE.reduce((s, st) => s + (st.tokens ? st.tokens.input + st.tokens.output + st.tokens.cached : 0), 0);
const CACHE_TOKENS  = MOCK_TRACE.reduce((s, st) => s + (st.tokens?.cached ?? 0), 0);
const TOTAL_LATENCY = MOCK_TRACE.reduce((s, st) => s + st.latencyMs, 0);
const AGENT_CALLS   = MOCK_TRACE.filter(st => st.type === 'tool_call' && !st.label.includes('Human')).length;

// ---- Mini detail panel ----
interface DetailPanelProps {
  agent: Agent;
  activeStep: TraceStep | null;
  onClose: () => void;
}

function DetailPanel({ agent, activeStep, onClose }: DetailPanelProps) {
  const relevantSteps = MOCK_TRACE.filter(
    s => s.label.toLowerCase().includes(agent.name.toLowerCase()) ||
         (agent.id === 'orchestrator' && s.type === 'prompt')
  );
  return (
    <div className="w-72 border-l border-border-subtle flex flex-col shrink-0 bg-bg-secondary overflow-y-auto">
      <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${agent.color}18`, border: `1px solid ${agent.color}60` }}>
          <span style={{ color: agent.color }}>{agent.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">{agent.name}</div>
          <div className="text-xs text-text-muted">{agent.nameRu}</div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">✕</button>
      </div>

      {/* Current active step */}
      {activeStep && (activeStep.label.toLowerCase().includes(agent.name.toLowerCase()) || agent.id === 'orchestrator') && (
        <div className="mx-3 mt-3 p-3 rounded-lg border" style={{ borderColor: `${TYPE_COLORS[activeStep.type]}40`, backgroundColor: `${TYPE_COLORS[activeStep.type]}08` }}>
          <div className="text-xs font-mono font-medium mb-1" style={{ color: TYPE_COLORS[activeStep.type] }}>
            {activeStep.type.toUpperCase().replace('_', ' ')} · {activeStep.timestamp}
          </div>
          <div className="text-xs text-text-secondary font-medium mb-1">{activeStep.label}</div>
          <div className="text-xs font-mono text-text-muted bg-bg-panel rounded p-2 leading-relaxed break-all">
            {activeStep.content.slice(0, 140)}{activeStep.content.length > 140 ? '...' : ''}
          </div>
          {activeStep.tokens && (
            <div className="flex gap-3 mt-2 text-xs font-mono">
              <span className="text-text-muted">in:<span className="text-text-secondary ml-1">{activeStep.tokens.input}</span></span>
              <span className="text-text-muted">out:<span className="text-text-secondary ml-1">{activeStep.tokens.output}</span></span>
              <span className="text-text-muted">cache:<span className="text-accent-cyan ml-1">{activeStep.tokens.cached}</span></span>
              <span className="text-text-muted ml-auto">{activeStep.latencyMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div className="p-3">
        <p className="text-xs text-text-secondary leading-relaxed">{agent.description}</p>
      </div>

      {/* Related trace steps */}
      {relevantSteps.length > 0 && (
        <div className="px-3 pb-3">
          <div className="text-xs uppercase tracking-widest text-text-muted mb-2">Трейс</div>
          <div className="space-y-1.5">
            {relevantSteps.map(s => (
              <div key={s.id} className="flex items-start gap-2 p-2 rounded bg-bg-card text-xs">
                <span className="font-mono font-medium shrink-0 mt-0.5" style={{ color: TYPE_COLORS[s.type] }}>
                  {s.step}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-text-secondary truncate">{s.label}</div>
                  {s.latencyMs > 0 && <div className="text-text-muted">{s.latencyMs}ms</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main component ----
export default function AgentGraph() {
  const { t } = useI18n();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Auto-advance steps
  useEffect(() => {
    if (!playing) return;
    if (step >= MOCK_TRACE.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(s => s + 1), 1700);
    return () => clearTimeout(timer);
  }, [playing, step]);

  const handlePlay = () => {
    if (step >= MOCK_TRACE.length - 1) setStep(0);
    else if (step < 0) setStep(0);
    setPlaying(true);
  };

  const handleReset = () => { setStep(-1); setPlaying(false); };

  const activeEdge = step >= 0 ? STEP_EDGE[step] : null;
  const activeStep = step >= 0 ? MOCK_TRACE[step] : null;
  const isHumanLoop = activeStep?.label.includes('Human');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-text-primary">{t.graph.title}</h1>
          <p className="text-xs text-text-muted">{t.graph.subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {step >= 0 && !playing && step < MOCK_TRACE.length - 1 && (
            <button onClick={() => setStep(s => s + 1)}
              className="btn-ghost text-xs border border-border-subtle px-3 py-1.5">
              {t.graph.step} →
            </button>
          )}
          <button
            onClick={playing ? () => setPlaying(false) : handlePlay}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            {playing
              ? <><span className="w-2 h-2 bg-white rounded-sm inline-block" />{t.graph.pause}</>
              : <><span>▶</span> {t.graph.replay}</>
            }
          </button>
          {step >= 0 && (
            <button onClick={handleReset}
              className="btn-ghost text-xs border border-border-subtle px-3 py-1.5">
              {t.graph.reset}
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* SVG Graph */}
        <div className="flex-1 relative overflow-hidden bg-bg-primary">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-md" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Dot grid */}
              <pattern id="dot-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="18" cy="18" r="0.8" fill="rgba(163,174,208,0.07)" />
              </pattern>
            </defs>

            {/* Background grid */}
            <rect width={VW} height={VH} fill="url(#dot-grid)" />

            {/* Category separator & labels */}
            <line
              x1={(AGENT_X['andrew-analytic'] + AGENT_X['bassito-animator']) / 2}
              y1={NODE_Y - NODE_R - 20}
              x2={(AGENT_X['andrew-analytic'] + AGENT_X['bassito-animator']) / 2}
              y2={NODE_Y + NODE_R + 36}
              stroke="rgba(163,174,208,0.08)" strokeWidth="1" strokeDasharray="3 5"
            />
            <text x={MARGIN_X} y={NODE_Y + NODE_R + 32}
              fontSize="8.5" fill="rgba(122,162,247,0.3)" letterSpacing="3" fontFamily="monospace">
              ANALYTIC
            </text>
            <text x={AGENT_X['bassito-animator']} y={NODE_Y + NODE_R + 32}
              fontSize="8.5" fill="rgba(255,158,100,0.3)" letterSpacing="3" fontFamily="monospace">
              CREATIVE
            </text>

            {/* ---- Edges ---- */}
            {AGENT_IDS.map(agentId => {
              const agent = AGENTS.find(a => a.id === agentId)!;
              const ax = AGENT_X[agentId];
              const isActiveOut = activeEdge?.agentId === agentId && activeEdge.dir === 'out';
              const isActiveIn  = activeEdge?.agentId === agentId && activeEdge.dir === 'in';
              const sw = edgeStrokeWidth(agentId);
              const pOut = edgePath(ax, true);
              const pIn  = edgePath(ax, false);

              return (
                <g key={`edge-${agentId}`}>
                  {/* OUT edge (orch → agent) */}
                  <path
                    d={pOut}
                    stroke={agent.color}
                    strokeWidth={isActiveOut ? sw + 1.2 : sw}
                    strokeOpacity={isActiveOut ? 0.92 : EDGE_TOKENS[agentId] ? 0.22 : 0.1}
                    fill="none"
                    strokeDasharray={isActiveOut ? undefined : '4 7'}
                    style={isActiveOut ? { filter: `drop-shadow(0 0 4px ${agent.color})` } : undefined}
                  />
                  {/* IN edge (agent → orch) */}
                  <path
                    d={pIn}
                    stroke={agent.color}
                    strokeWidth={isActiveIn ? sw + 1.2 : 1}
                    strokeOpacity={isActiveIn ? 0.92 : 0}
                    fill="none"
                    style={isActiveIn ? { filter: `drop-shadow(0 0 4px ${agent.color})` } : undefined}
                  />

                  {/* Token label near midpoint (idle state) */}
                  {EDGE_TOKENS[agentId] && step < 0 && (() => {
                    const ox2 = ORCH_X, oy2 = ORCH_Y + ORCH_R + 110;
                    const ay2 = NODE_Y - NODE_R - 90;
                    const mx = (ox2 + ax) / 2;
                    const my = (oy2 + ay2) / 2;
                    return (
                      <text x={mx} y={my} fontSize="8.5" fill={agent.color} fillOpacity={0.45}
                        textAnchor="middle" fontFamily="monospace">
                        {EDGE_TOKENS[agentId]}t
                      </text>
                    );
                  })()}

                  {/* Traveling pulse dot */}
                  {(isActiveOut || isActiveIn) && (
                    <circle
                      key={`pulse-${agentId}-${step}`}
                      r={5}
                      fill={agent.color}
                      style={{ filter: `drop-shadow(0 0 7px ${agent.color})` }}
                    >
                      <animateMotion
                        dur="1.3s"
                        repeatCount="indefinite"
                        path={isActiveOut ? pOut : pIn}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* ---- Orchestrator node ---- */}
            {(() => {
              const isActive = step >= 0;
              const orchColor = isHumanLoop ? '#e0af68' : '#7aa2f7';
              const isSelected = selectedAgent?.id === 'orchestrator';
              return (
                <g
                  onClick={() => setSelectedAgent(
                    isSelected ? null : AGENTS.find(a => a.id === 'orchestrator')!
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hit area */}
                  <circle cx={ORCH_X} cy={ORCH_Y} r={ORCH_R + 14} fill="transparent" />
                  {/* Outer ring (active) */}
                  {isActive && (
                    <circle cx={ORCH_X} cy={ORCH_Y} r={ORCH_R + 12}
                      fill="none" stroke={orchColor} strokeWidth="1"
                      strokeOpacity="0.35" filter="url(#glow-sm)" />
                  )}
                  {/* Main circle */}
                  <circle cx={ORCH_X} cy={ORCH_Y} r={ORCH_R}
                    fill="rgba(122,162,247,0.10)"
                    stroke={isSelected ? orchColor : orchColor}
                    strokeWidth={isActive || isSelected ? 2.2 : 1.5}
                    strokeOpacity={isActive || isSelected ? 1 : 0.45}
                    filter={isActive ? 'url(#glow-sm)' : undefined}
                  />
                  {/* Icon */}
                  <text x={ORCH_X} y={ORCH_Y + 9} textAnchor="middle" fontSize="22"
                    fill={orchColor} filter={isActive ? 'url(#glow-sm)' : undefined}>
                    ⬢
                  </text>
                  {/* Name */}
                  <text x={ORCH_X} y={ORCH_Y + ORCH_R + 16} textAnchor="middle"
                    fontSize="10" fill="rgba(192,202,245,0.8)" fontFamily="system-ui,sans-serif" fontWeight="500">
                    OrchestratorCore
                  </text>
                  {/* Human-in-loop indicator */}
                  {isHumanLoop && (
                    <text x={ORCH_X} y={ORCH_Y + ORCH_R + 30} textAnchor="middle"
                      fontSize="9" fill="#e0af68" fontFamily="system-ui,sans-serif">
                      ⚠ awaiting operator
                    </text>
                  )}
                </g>
              );
            })()}

            {/* ---- Agent nodes ---- */}
            {AGENT_IDS.map(agentId => {
              const agent = AGENTS.find(a => a.id === agentId)!;
              const ax = AGENT_X[agentId];
              const ay = NODE_Y;
              const isActive   = activeEdge?.agentId === agentId;
              const isSelected = selectedAgent?.id === agentId;

              return (
                <g key={`node-${agentId}`}
                  onClick={() => setSelectedAgent(isSelected ? null : agent)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hit area */}
                  <circle cx={ax} cy={ay} r={NODE_R + 14} fill="transparent" />
                  {/* Glow ring */}
                  {(isActive || isSelected) && (
                    <circle cx={ax} cy={ay} r={NODE_R + 10}
                      fill="none" stroke={agent.color} strokeWidth="1"
                      strokeOpacity="0.4" filter="url(#glow-sm)" />
                  )}
                  {/* Main circle */}
                  <circle cx={ax} cy={ay} r={NODE_R}
                    fill={`${agent.color}14`}
                    stroke={agent.color}
                    strokeWidth={isActive || isSelected ? 2 : 1}
                    strokeOpacity={isActive || isSelected ? 1 : 0.32}
                    filter={isActive ? 'url(#glow-sm)' : undefined}
                  />
                  {/* Icon */}
                  <text x={ax} y={ay + 8} textAnchor="middle" fontSize="17"
                    fill={agent.color}
                    fillOpacity={isActive || isSelected ? 1 : 0.68}
                    filter={isActive ? 'url(#glow-sm)' : undefined}>
                    {agent.icon}
                  </text>
                  {/* Name */}
                  <text x={ax} y={ay + NODE_R + 15} textAnchor="middle"
                    fontSize="9.5" fill="rgba(192,202,245,0.78)"
                    fontFamily="system-ui,sans-serif">
                    {agent.name}
                  </text>
                  {/* Status dot */}
                  <circle
                    cx={ax + NODE_R - 5} cy={ay - NODE_R + 5}
                    r={4} fill={STATUS_DOT[agent.status] ?? '#6c7086'}
                    stroke="#0d0d1a" strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* ---- Active step label bar ---- */}
            {activeStep ? (
              <g>
                <rect x={VW / 2 - 185} y={VH - 44} width={370} height={26} rx={6}
                  fill="rgba(13,13,26,0.88)" stroke="rgba(122,162,247,0.18)" strokeWidth="1" />
                <text x={VW / 2} y={VH - 27} textAnchor="middle" fontSize="10.5"
                  fill="rgba(192,202,245,0.88)" fontFamily="monospace">
                  {t.graph.stepLabel} {step + 1}/{MOCK_TRACE.length} · {activeStep.label}
                </text>
              </g>
            ) : (
              <text x={VW / 2} y={VH - 28} textAnchor="middle" fontSize="10.5"
                fill="rgba(163,174,208,0.3)" fontFamily="monospace">
                {t.graph.noActivity}
              </text>
            )}
          </svg>
        </div>

        {/* Right: detail panel */}
        {selectedAgent && (
          <DetailPanel
            agent={selectedAgent}
            activeStep={activeStep}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </div>

      {/* Bottom stats bar */}
      <div className="border-t border-border-subtle px-6 py-3 flex items-center gap-6 shrink-0 bg-bg-secondary">
        {[
          { label: t.graph.totalTokens, value: TOTAL_TOKENS.toLocaleString(), accent: 'text-text-primary' },
          { label: t.graph.cacheTokens, value: `${CACHE_TOKENS} (${Math.round(CACHE_TOKENS / TOTAL_TOKENS * 100)}%)`, accent: 'text-accent-cyan' },
          { label: t.graph.totalLatency, value: `${(TOTAL_LATENCY / 1000).toFixed(2)}s`, accent: 'text-text-primary' },
          { label: t.graph.agentCalls, value: String(AGENT_CALLS), accent: 'text-accent-blue' },
        ].map(m => (
          <div key={m.label} className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-text-muted uppercase tracking-widest">{m.label}</span>
            <span className={`text-sm font-mono font-semibold ${m.accent}`}>{m.value}</span>
          </div>
        ))}

        {/* Step progress */}
        {step >= 0 && (
          <div className="ml-auto flex items-center gap-2">
            {MOCK_TRACE.map((_, i) => (
              <button key={i} onClick={() => { setPlaying(false); setStep(i); }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i <= step ? 'bg-accent-blue' : 'bg-border-subtle'
                }`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
