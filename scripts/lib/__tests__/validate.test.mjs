import { describe, it, expect } from 'vitest';
import { stripBom, validateSnapshot } from '../validate.mjs';

const VALID_SNAPSHOT = {
  scene: {
    sceneId: 'scene_01',
    sceneGoal: 'test goal',
    editingTemplate: 'cinematic',
    targetDurationSec: 30,
    actualDurationSec: 28,
    usedClips: ['c01'],
    rejectedClips: [],
    queueState: 'ready',
  },
  clipScores: {},
  andrew: {},
  bassitoJobs: [],
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('stripBom', () => {
  it('removes a leading BOM character', () => {
    const withBom = '\uFEFF{"key":"value"}';
    expect(stripBom(withBom)).toBe('{"key":"value"}');
  });

  it('is a no-op when no BOM is present', () => {
    const plain = '{"key":"value"}';
    expect(stripBom(plain)).toBe(plain);
  });

  it('only removes the first character when it is a BOM', () => {
    const withBom = '\uFEFFhello';
    expect(stripBom(withBom)).toBe('hello');
  });
});

describe('validateSnapshot — top-level keys', () => {
  for (const key of ['scene', 'clipScores', 'andrew', 'bassitoJobs', 'updatedAt']) {
    it(`throws when top-level key "${key}" is missing`, () => {
      const bad = { ...VALID_SNAPSHOT };
      delete bad[key];
      expect(() => validateSnapshot(bad)).toThrow(`missing required key: ${key}`);
    });
  }

  it('does not throw for a fully valid snapshot', () => {
    expect(() => validateSnapshot(VALID_SNAPSHOT)).not.toThrow();
  });
});

describe('validateSnapshot — scene keys', () => {
  const sceneKeys = [
    'sceneId',
    'sceneGoal',
    'editingTemplate',
    'targetDurationSec',
    'actualDurationSec',
    'usedClips',
    'rejectedClips',
    'queueState',
  ];

  for (const key of sceneKeys) {
    it(`throws when scene key "${key}" is missing`, () => {
      const bad = {
        ...VALID_SNAPSHOT,
        scene: { ...VALID_SNAPSHOT.scene },
      };
      delete bad.scene[key];
      expect(() => validateSnapshot(bad)).toThrow(`missing required key: ${key}`);
    });
  }
});
