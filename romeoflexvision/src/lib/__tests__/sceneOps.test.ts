import { describe, it, expect, vi, afterEach } from 'vitest';
import { MOCK_SCENE_OPS } from '../../data/sceneOps';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('loadSceneOpsSnapshot', () => {
  it('returns parsed JSON with source=api on successful fetch', async () => {
    const payload = { ...MOCK_SCENE_OPS, source: undefined };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    }));

    const { loadSceneOpsSnapshot } = await import('../sceneOps');
    const result = await loadSceneOpsSnapshot();

    expect(result.source).toBe('api');
    expect(result.scene.sceneId).toBe(MOCK_SCENE_OPS.scene.sceneId);
  });

  it('falls back to MOCK_SCENE_OPS when fetch throws and no custom URL is set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    // VITE_SCENE_OPS_URL is not set in test env, so SCENE_OPS_URL is falsy
    const { loadSceneOpsSnapshot } = await import('../sceneOps');
    const result = await loadSceneOpsSnapshot();

    expect(result.source).toBe('mock');
    expect(result).toEqual(MOCK_SCENE_OPS);
  });

  it('falls back to MOCK_SCENE_OPS when response is not ok and no custom URL is set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const { loadSceneOpsSnapshot } = await import('../sceneOps');
    const result = await loadSceneOpsSnapshot();

    expect(result.source).toBe('mock');
  });

  it('re-throws when fetch fails and a custom VITE_SCENE_OPS_URL is set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    vi.resetModules();
    vi.stubEnv('VITE_SCENE_OPS_URL', 'https://custom.example.com/scene-ops.json');

    const { loadSceneOpsSnapshot } = await import('../sceneOps');
    await expect(loadSceneOpsSnapshot()).rejects.toThrow('Network error');
  });
});
