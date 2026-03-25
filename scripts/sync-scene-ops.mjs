import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('romeoflexvision/public/scene-ops.json');

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function validateSnapshot(snapshot) {
  const requiredTopLevel = ['scene', 'clipScores', 'andrew', 'bassitoJobs', 'updatedAt'];
  for (const key of requiredTopLevel) {
    if (!(key in snapshot)) {
      throw new Error(`SceneOps snapshot missing required key: ${key}`);
    }
  }

  const requiredSceneKeys = [
    'sceneId',
    'sceneGoal',
    'editingTemplate',
    'targetDurationSec',
    'actualDurationSec',
    'usedClips',
    'rejectedClips',
    'queueState',
  ];
  for (const key of requiredSceneKeys) {
    if (!(key in snapshot.scene)) {
      throw new Error(`SceneOps scene missing required key: ${key}`);
    }
  }
}

async function resolveSnapshotPayload() {
  const inlineJson = process.env.SCENE_OPS_INLINE_JSON?.trim();
  if (inlineJson) {
    return JSON.parse(stripBom(inlineJson));
  }

  const sourceUrl = process.env.SCENE_OPS_SOURCE_URL?.trim();
  if (!sourceUrl) {
    throw new Error('SCENE_OPS_SOURCE_URL or SCENE_OPS_INLINE_JSON is required');
  }

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'roboqc-sceneops-sync',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch SceneOps snapshot: ${response.status} ${response.statusText}`);
  }
  const raw = stripBom(await response.text());
  return JSON.parse(raw);
}

async function main() {
  const snapshot = await resolveSnapshotPayload();
  validateSnapshot(snapshot);

  if (!snapshot.source) {
    snapshot.source = 'api';
  }

  const nextJson = `${JSON.stringify(snapshot, null, 2)}\n`;
  let currentJson = '';
  try {
    currentJson = await readFile(OUTPUT_PATH, 'utf8');
  } catch {
    currentJson = '';
  }

  const changed = currentJson !== nextJson;
  await writeFile(OUTPUT_PATH, nextJson, 'utf8');

  console.log(`SceneOps snapshot written to ${OUTPUT_PATH}`);
  console.log(`changed=${changed}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
