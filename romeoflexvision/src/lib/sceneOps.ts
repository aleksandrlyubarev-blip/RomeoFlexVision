import { MOCK_SCENE_OPS } from '../data/sceneOps';
import type { SceneOpsSnapshot } from '../types';

const SCENE_OPS_URL = import.meta.env.VITE_SCENE_OPS_URL;

export async function loadSceneOpsSnapshot(): Promise<SceneOpsSnapshot> {
  if (!SCENE_OPS_URL) {
    return MOCK_SCENE_OPS;
  }

  const response = await fetch(SCENE_OPS_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SceneOps request failed: ${response.status}`);
  }

  const payload = (await response.json()) as SceneOpsSnapshot;
  return {
    ...payload,
    source: 'api',
  };
}
