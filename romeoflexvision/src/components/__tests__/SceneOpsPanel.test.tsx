import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SceneOpsPanel from '../SceneOpsPanel';
import { MOCK_SCENE_OPS } from '../../data/sceneOps';
import type { SceneOpsSnapshot } from '../../types';

describe('SceneOpsPanel rendering', () => {
  it('renders scene ID and goal', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    expect(screen.getByText(MOCK_SCENE_OPS.scene.sceneId)).toBeInTheDocument();
    expect(screen.getByText(MOCK_SCENE_OPS.scene.sceneGoal)).toBeInTheDocument();
  });

  it('renders source badge as Mock when source=mock', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    expect(screen.getByText('Mock')).toBeInTheDocument();
  });

  it('renders source badge as API when source=api', () => {
    const snapshot: SceneOpsSnapshot = { ...MOCK_SCENE_OPS, source: 'api' };
    render(<SceneOpsPanel snapshot={snapshot} />);
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('renders correct queue state label for waiting_bassito', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    expect(screen.getByText('Waiting Bassito')).toBeInTheDocument();
  });

  it('renders Andrew confidence as a rounded percentage', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    // 0.74 * 100 = 74
    expect(screen.getByText('74%')).toBeInTheDocument();
  });

  it('renders timeline with positive drift', () => {
    // 35 - 32.8 = 2.2
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    expect(screen.getByText('Drift +2.2s')).toBeInTheDocument();
  });

  it('renders timeline with negative drift', () => {
    const snapshot: SceneOpsSnapshot = {
      ...MOCK_SCENE_OPS,
      scene: { ...MOCK_SCENE_OPS.scene, actualDurationSec: 37 },
    };
    // 35 - 37 = -2.0
    render(<SceneOpsPanel snapshot={snapshot} />);
    expect(screen.getByText('Drift -2.0s')).toBeInTheDocument();
  });

  it('renders all used clip IDs', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    for (const clipId of MOCK_SCENE_OPS.scene.usedClips) {
      expect(screen.getByText(clipId)).toBeInTheDocument();
    }
  });

  it('renders all rejected clip IDs', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    for (const clipId of MOCK_SCENE_OPS.scene.rejectedClips) {
      expect(screen.getByText(clipId)).toBeInTheDocument();
    }
  });

  it('renders all Bassito job IDs', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    for (const job of MOCK_SCENE_OPS.bassitoJobs) {
      expect(screen.getByText(job.jobId)).toBeInTheDocument();
    }
  });

  it('renders Bassito job statuses correctly', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    // Two queued, one completed_stub
    const queuedElements = screen.getAllByText('Queued');
    expect(queuedElements).toHaveLength(2);
    expect(screen.getByText('Stub done')).toBeInTheDocument();
  });

  it('renders Andrew HITL decision', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    expect(screen.getByText(`HITL: ${MOCK_SCENE_OPS.andrew.hitlDecision}`)).toBeInTheDocument();
  });

  it('renders Andrew warnings', () => {
    render(<SceneOpsPanel snapshot={MOCK_SCENE_OPS} />);
    for (const warning of MOCK_SCENE_OPS.andrew.warnings) {
      expect(screen.getByText(`• ${warning}`)).toBeInTheDocument();
    }
  });
});
