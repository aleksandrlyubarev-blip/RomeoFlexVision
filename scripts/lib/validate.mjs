export function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

export function validateSnapshot(snapshot) {
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
