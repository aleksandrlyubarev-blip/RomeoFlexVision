import { MOCK_SCENE_OPS } from '../data/sceneOps';
import type { SceneOpsSnapshot } from '../types';

const SCENE_OPS_URL = import.meta.env.VITE_SCENE_OPS_URL;
const DEFAULT_SCENE_OPS_URL = `${import.meta.env.BASE_URL}scene-ops.json`;

export async function loadSceneOpsSnapshot(): Promise<SceneOpsSnapshot> {
  const resolvedUrl = SCENE_OPS_URL || DEFAULT_SCENE_OPS_URL;

  try {
    const response = await fetch(resolvedUrl, {
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
  } catch (error) {
    if (SCENE_OPS_URL) {
      throw error;
    }
    return MOCK_SCENE_OPS;
  }
}
