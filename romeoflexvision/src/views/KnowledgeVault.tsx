import { useState, useRef, useCallback } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';
import { useI18n } from '../context/I18nContext';
import type { Agent } from '../types';

// ---- Types ----
type DocStatus = 'processing' | 'ready' | 'error';

interface KnowledgeDoc {
  id: string;
  name: string;
  size: string;
  type: string;
  status: DocStatus;
  chunks: number;
  uploadedAt: string;
}

// ---- localStorage helpers ----
const DOCS_KEY = 'rfv_vault_docs';
const AGENTS_KEY = 'rfv_vault_agents';

function loadDocs(): KnowledgeDoc[] {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) ?? 'null') ?? SEED_DOCS; }
  catch { return SEED_DOCS; }
}
function saveDocs(docs: KnowledgeDoc[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}
function loadConnectedAgents(): string[] {
  try { return JSON.parse(localStorage.getItem(AGENTS_KEY) ?? 'null') ?? DEFAULT_CONNECTED; }
  catch { return DEFAULT_CONNECTED; }
}
function saveConnectedAgents(ids: string[]) {
  localStorage.setItem(AGENTS_KEY, JSON.stringify(ids));
}

// ---- Demo seed data ----
const SEED_DOCS: KnowledgeDoc[] = [
  { id: 'd1', name: 'ISO_1302_Surface_Texture.pdf', size: '2.4 MB', type: 'PDF', status: 'ready', chunks: 84, uploadedAt: '14:20' },
  { id: 'd2', name: 'ГОСТ_2.307-2011_Dimensions.pdf', size: '1.1 MB', type: 'PDF', status: 'ready', chunks: 47, uploadedAt: '13:45' },
  { id: 'd3', name: 'maintenance_log_q1_2025.csv', size: '320 KB', type: 'CSV', status: 'ready', chunks: 212, uploadedAt: '11:08' },
];

const DEFAULT_CONNECTED = ['robo-qc', 'romeo-phd', 'andrew-analytic'];

// Demo search results keyed by query fragment
const DEMO_RESULTS: { docId: string; text: string; score: number }[] = [
  { docId: 'd1', text: '5.3 Surface roughness Ra shall not exceed 1.6 μm for class-B defects on category-I components. Measurement shall be performed with contact profilometer under standard illumination conditions (≥300 lx).', score: 0.94 },
  { docId: 'd1', text: '5.4 Visual inspection criteria: scratches longer than 2 mm or deeper than 0.1 mm on visible surfaces are classified as class B defects per ISO 1302 Section 5.', score: 0.87 },
  { docId: 'd2', text: 'Линейные размеры детали указываются в мм. Допуск на линейные размеры без указания — ±0.1 мм по ГОСТ 25347 для изделий 12 квалитета точности.', score: 0.72 },
];

function getResults(q: string, docs: KnowledgeDoc[]) {
  if (q.length < 3) return [];
  const ql = q.toLowerCase();
  // Filter by doc name match first
  const matchingDocIds = new Set(docs.filter(d => d.name.toLowerCase().includes(ql) && d.status === 'ready').map(d => d.id));
  // Show demo results that match query text or doc name
  return DEMO_RESULTS.filter(r =>
    r.text.toLowerCase().includes(ql.slice(0, 6)) || matchingDocIds.has(r.docId)
  );
}

// ---- File type icon ----
function FileIcon({ type }: { type: string }) {
  const colors: Record<string, string> = { PDF: '#f7768e', CSV: '#9ece6a', TXT: '#73daca', DOCX: '#7aa2f7' };
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0"
      style={{ backgroundColor: `${colors[type] ?? '#7aa2f7'}18`, color: colors[type] ?? '#7aa2f7' }}>
      {type}
    </div>
  );
}

// ---- Status badge ----
function StatusBadge({ status, t }: { status: DocStatus; t: { processing: string; ready: string; error: string } }) {
  if (status === 'processing') return (
    <span className="flex items-center gap-1 text-xs text-accent-blue">
      <span className="w-3 h-3 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      {t.processing}
    </span>
  );
  if (status === 'ready') return (
    <span className="flex items-center gap-1 text-xs text-accent-cyan">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />{t.ready}
    </span>
  );
  return <span className="text-xs text-signal-alert">{t.error}</span>;
}

// ---- Relevance bar ----
function RelevanceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-bg-card rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-accent-blue transition-all" style={{ width: `${score * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-accent-blue">{Math.round(score * 100)}%</span>
    </div>
  );
}

// ---- All agents (built-in + custom) ----
function getAllAgents(): Agent[] {
  try {
    const custom: Agent[] = JSON.parse(localStorage.getItem('rfv_custom_agents') ?? '[]');
    return [...AGENTS, ...custom.filter(ca => !AGENTS.some(a => a.id === ca.id))];
  } catch { return AGENTS; }
}

// ---- Main component ----
export default function KnowledgeVault() {
  const { t } = useI18n();
  const [docs, setDocsState] = useState<KnowledgeDoc[]>(loadDocs);
  const [connectedAgentIds, setConnectedState] = useState<string[]>(loadConnectedAgents);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof getResults> | null>(null);
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allAgents = getAllAgents();

  const setDocs = (fn: (prev: KnowledgeDoc[]) => KnowledgeDoc[]) => {
    setDocsState(prev => {
      const next = fn(prev);
      saveDocs(next.filter(d => d.status !== 'processing')); // don't persist in-progress
      return next;
    });
  };

  const toggleAgent = (id: string) => {
    setConnectedState(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveConnectedAgents(next);
      return next;
    });
  };

  const totalChunks = docs.reduce((s, d) => s + d.chunks, 0);
  const readyDocs = docs.filter(d => d.status === 'ready');

  const simulateUpload = useCallback((file: File) => {
    const id = `d${Date.now()}`;
    const type = file.name.endsWith('.pdf') ? 'PDF'
      : file.name.endsWith('.csv') ? 'CSV'
      : file.name.endsWith('.docx') ? 'DOCX' : 'TXT';
    const newDoc: KnowledgeDoc = {
      id,
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      type,
      status: 'processing',
      chunks: 0,
      uploadedAt: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    };
    setDocsState(d => [newDoc, ...d]);
    const chunkCount = Math.floor(file.size / 800) + 10;
    setTimeout(() => {
      setDocsState(prev => {
        const next = prev.map(doc =>
          doc.id === id ? { ...doc, status: 'ready' as DocStatus, chunks: chunkCount } : doc
        );
        saveDocs(next.filter(d => d.status !== 'processing'));
        return next;
      });
    }, 2000 + Math.random() * 1500);
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(simulateUpload);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    await new Promise(r => setTimeout(r, 900));
    setSearchResults(getResults(query, docs));
    setSearching(false);
  };

  const deleteDoc = (id: string) => {
    setDocs(d => d.filter(doc => doc.id !== id));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: document library + search */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{t.vault.title}</h1>
              <p className="text-sm text-text-muted mt-0.5">{t.vault.subtitle}</p>
            </div>
            <div className="sm:ml-auto flex gap-3 text-xs text-text-muted">
              <span><span className="text-text-primary font-mono font-semibold">{docs.length}</span> {t.vault.totalDocs}</span>
              <span><span className="text-accent-blue font-mono font-semibold">{totalChunks.toLocaleString()}</span> {t.vault.totalChunks}</span>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-accent-blue bg-accent-blue bg-opacity-5 scale-[1.01]'
                : 'border-border-subtle hover:border-border-DEFAULT hover:bg-bg-card'
            }`}
          >
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.csv,.docx"
              className="hidden" onChange={e => handleFiles(e.target.files)} />
            <div className="text-3xl mb-2 opacity-40">↑</div>
            <div className="text-sm text-text-secondary">
              {t.vault.dropHint}{' '}
              <span className="text-accent-blue underline underline-offset-2">{t.vault.upload}</span>
            </div>
            <div className="text-xs text-text-muted mt-1">PDF · TXT · CSV · DOCX</div>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t.vault.search}
              className="flex-1 bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
            />
            <button onClick={handleSearch} disabled={!query.trim() || searching}
              className="btn-primary px-5 flex items-center gap-2 disabled:opacity-60">
              {searching && <span className="w-3 h-3 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
              {searching ? t.vault.searching : t.vault.searchBtn}
            </button>
          </div>

          {/* Search results */}
          {searchResults !== null && (
            <div className="glass-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-muted">
                {searchResults.length > 0
                  ? <>{t.vault.resultsFor} "<span className="text-text-primary">{query}</span>" — {searchResults.length} результата</>
                  : t.vault.noResults
                }
              </div>
              {searchResults.map((r, i) => {
                const doc = docs.find(d => d.id === r.docId);
                return (
                  <div key={i} className={`px-4 py-4 ${i < searchResults.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2 text-xs text-text-muted min-w-0">
                        <span className="font-mono">{t.vault.source}:</span>
                        <span className="text-text-secondary truncate">{doc?.name ?? r.docId}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-text-muted">{t.vault.relevance}</span>
                        <RelevanceBar score={r.score} />
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed bg-bg-card rounded-lg p-3 font-mono text-xs">
                      {r.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Document list */}
          {docs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl opacity-20 mb-3">◫</div>
              <div className="text-sm font-medium text-text-secondary">{t.vault.emptyTitle}</div>
              <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">{t.vault.emptyDesc}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="glass-panel px-4 py-3.5 flex items-center gap-4">
                  <FileIcon type={doc.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary font-medium truncate">{doc.name}</div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                      <span>{doc.size}</span>
                      {doc.status === 'ready' && <span>{doc.chunks} {t.vault.chunks}</span>}
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} t={t.vault} />
                  <button onClick={() => deleteDoc(doc.id)}
                    className="text-xs text-text-muted hover:text-signal-alert transition-colors px-2 py-1 rounded hover:bg-signal-alert hover:bg-opacity-10">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: agents panel */}
      <div className="w-64 border-l border-border-subtle flex flex-col overflow-hidden shrink-0 bg-bg-secondary">
        <div className="px-4 py-4 border-b border-border-subtle">
          <div className="text-xs uppercase tracking-widest text-text-muted">{t.vault.agentsUsing}</div>
          <div className="text-xs text-text-muted mt-1">Нажмите, чтобы включить/отключить</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {allAgents.map(agent => {
            const connected = connectedAgentIds.includes(agent.id);
            const docCount = connected ? readyDocs.length : 0;
            return (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                  connected
                    ? 'bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-30'
                    : 'bg-bg-card border border-transparent hover:border-border-subtle'
                }`}
              >
                <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={false} agentId={agent.id} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text-primary truncate">{agent.name}</div>
                  <div className="text-xs text-text-muted">{connected ? `${docCount} docs` : 'отключён'}</div>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${connected ? 'bg-accent-cyan' : 'bg-border-subtle'}`} />
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-border-subtle space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">{t.vault.totalDocs}</span>
            <span className="font-mono text-text-primary">{docs.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">{t.vault.totalChunks}</span>
            <span className="font-mono text-accent-blue">{totalChunks.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Подключено агентов</span>
            <span className="font-mono text-accent-cyan">{connectedAgentIds.length}/{allAgents.length}</span>
          </div>
          {/* Embed model badge */}
          <div className="mt-1 px-2 py-1.5 rounded-lg bg-bg-card border border-border-subtle text-xs text-text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse shrink-0" />
            text-embedding-3-small
          </div>
        </div>
      </div>
    </div>
  );
}
