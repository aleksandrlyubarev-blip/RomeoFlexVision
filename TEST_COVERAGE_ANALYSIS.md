# Test Coverage Analysis — RomeoFlexVision

## Current State

**Coverage: 0%** — The project has no tests, no test framework, and no CI test step.

No test files (`.test.ts`, `.spec.tsx`, `__tests__/`) exist anywhere in the repository. The `package.json` has no test dependencies and no `test` script. GitHub Actions workflows only build and deploy; they never run tests.

---

## Recommended Test Framework Setup

For a React + TypeScript + Vite project, the recommended stack is:

- **[Vitest](https://vitest.dev/)** — test runner (integrates natively with Vite, no extra config)
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** — component testing
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro)** — realistic user interaction simulation
- **[jsdom](https://github.com/jsdom/jsdom)** — browser environment for Node.js

Install:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add to `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'html'], include: ['src/**'] },
  },
});
```

Add a `test` script to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Priority Areas for Test Coverage

### 1. `formatError` — `src/context/AuthContext.tsx` (HIGHEST PRIORITY)

**Why:** Pure function with 6 distinct branches that translate Supabase error messages into Russian UI strings. Each branch can be tested in isolation with no mocks.

**What to test:**
- Each known Supabase error string maps to the correct Russian translation
- Unknown errors are returned as-is
- Null/falsy input returns `'Неизвестная ошибка'`

```ts
// Example
import { formatError } from '../context/AuthContext'; // would need to export it

test('translates Invalid login credentials', () => {
  expect(formatError({ message: 'Invalid login credentials' })).toBe('Неверный email или пароль');
});
test('returns fallback for unknown error', () => {
  expect(formatError({ message: 'Some weird error' })).toBe('Some weird error');
});
test('returns fallback for null', () => {
  expect(formatError(null)).toBe('Неизвестная ошибка');
});
```

> **Action:** Export `formatError` from `AuthContext.tsx` so it can be unit-tested directly.

---

### 2. `AuthContext` — Demo Mode Logic — `src/context/AuthContext.tsx` (HIGH)

**Why:** The demo mode (when `isSupabaseConfigured` is false) has distinct, testable behaviour for `signIn`, `signUp`, and `signOut`. These paths run entirely client-side with no Supabase dependency, making them easy to test.

**What to test:**
- `signIn` with empty credentials returns `{ error: 'Введите email и пароль' }`
- `signIn` with non-empty credentials sets the user and returns `{ error: null }`
- `signUp` sets the demo user and returns `{ error: null }`
- `signOut` clears the user and session
- `signInWithGoogle` in demo mode returns `{ error: 'Supabase не настроен' }`
- `useAuth()` throws when used outside `AuthProvider`

```tsx
// Example setup
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
// Mock isSupabaseConfigured = false at module level

test('demo signIn with valid credentials succeeds', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  await act(() => result.current.signIn('user@test.com', 'pass123'));
  expect(result.current.user?.email).toBe('user@test.com');
});
```

---

### 3. `loadSceneOpsSnapshot` — `src/lib/sceneOps.ts` (HIGH)

**Why:** Contains branching fetch logic that is critical for populating the Dashboard. The fallback-to-mock path is easy to miss in manual testing.

**What to test:**
- Successful fetch returns parsed JSON with `source: 'api'`
- Non-OK HTTP response (`response.ok === false`) throws when `VITE_SCENE_OPS_URL` is set
- Network failure falls back to `MOCK_SCENE_OPS` when using the default URL
- Network failure re-throws when `VITE_SCENE_OPS_URL` is explicitly set (no silent fallback)

```ts
// Example using vi.stubGlobal('fetch', ...)
test('falls back to mock data when default URL fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
  // import.meta.env.VITE_SCENE_OPS_URL not set
  const result = await loadSceneOpsSnapshot();
  expect(result.source).toBe('mock');
});

test('throws when custom URL fetch fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
  // import.meta.env.VITE_SCENE_OPS_URL = 'https://custom.url'
  await expect(loadSceneOpsSnapshot()).rejects.toThrow();
});
```

---

### 4. `validateSnapshot` + `stripBom` — `scripts/sync-scene-ops.mjs` (HIGH)

**Why:** `validateSnapshot` enforces the contract between the CI sync script and the frontend. If it silently passes invalid data, the Dashboard renders broken. `stripBom` is a pure utility. Neither depends on I/O, so they are trivially testable with Node's built-in test runner or Vitest.

**What to test:**
- `stripBom` removes a leading BOM character (`\uFEFF`)
- `stripBom` is a no-op on strings without BOM
- `validateSnapshot` throws with a descriptive message for each missing top-level required key
- `validateSnapshot` throws for each missing `scene.*` required key
- `validateSnapshot` passes for a valid complete snapshot

```js
// Example (Node test runner or Vitest)
test('validateSnapshot throws for missing scene key', () => {
  const bad = { scene: { sceneId: 'x' }, clipScores: {}, andrew: {}, bassitoJobs: [], updatedAt: '' };
  expect(() => validateSnapshot(bad)).toThrow('missing required key: sceneGoal');
});
```

> **Action:** Extract `validateSnapshot` and `stripBom` into a separate module (`scripts/lib/validate.mjs`) so they can be imported by tests without triggering `main()`.

---

### 5. `AuthModal` — `src/components/AuthModal.tsx` (MEDIUM)

**Why:** Contains significant client-side form validation logic that is easy to break silently. The component switches between login and register tabs and enforces password rules.

**What to test:**
- Submitting with an empty email shows `'Введите email'`
- Submitting with empty password shows `'Введите пароль'`
- Register: password < 6 chars shows the length error
- Register: passwords not matching shows `'Пароли не совпадают'`
- Switching tabs clears error and password fields
- Successful login calls `onSuccess` and `onClose`
- Demo mode notice is visible when `isConfigured === false`
- Google sign-in button only renders when `isConfigured === true`

```tsx
test('shows error when passwords do not match', async () => {
  const user = userEvent.setup();
  render(<AuthModal initialTab="register" onClose={vi.fn()} />, { wrapper: AuthProviderWrapper });
  await user.type(screen.getByLabelText(/email/i), 'a@b.com');
  await user.type(screen.getByLabelText('Пароль'), 'abcdef');
  await user.type(screen.getByLabelText('Повторите пароль'), 'xxxxxx');
  await user.click(screen.getByRole('button', { name: /Создать аккаунт/i }));
  expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument();
});
```

---

### 6. `queueStateLabel` + `bassitoStatusLabel` — `src/components/SceneOpsPanel.tsx` (MEDIUM)

**Why:** Pure switch-based functions that determine visible labels and CSS classes in the Dashboard. Bugs here silently produce wrong UI state labels.

**What to test:**
- Each known `queueState` value maps to the correct label and CSS class string
- Unknown `queueState` falls through to `'Completed'`
- Each known Bassito job status maps to the correct label string
- Unknown status falls through to `'Stub done'`

> **Action:** Extract these two functions from `SceneOpsPanel.tsx` into `src/lib/sceneOpsLabels.ts` so they can be unit-tested without rendering the full component.

---

### 7. `SceneOpsPanel` Rendering — `src/components/SceneOpsPanel.tsx` (MEDIUM)

**What to test (component-level):**
- Renders scene ID, goal, and template from snapshot
- Timeline drift renders correctly for positive drift (`+Xs`) and negative drift (`-Xs`)
- Andrew confidence percentage is rounded correctly (`0.754 → 75%`)
- All Bassito jobs appear with correct status labels
- `usedClips` and `rejectedClips` are all rendered
- Source badge shows `'API'` vs `'Mock'` based on `snapshot.source`

---

### 8. CI Integration (MEDIUM)

**Why:** Tests that never run in CI provide no regression protection.

Add a test step to `.github/workflows/deploy-frontend.yml` before the build step:

```yaml
- name: Run tests
  run: npm test
  working-directory: romeoflexvision
```

This ensures every push to `main` and every PR is gated on tests passing.

---

## Summary Table

| Area | File | Type | Priority |
|---|---|---|---|
| `formatError` translation logic | `src/context/AuthContext.tsx` | Unit | **Highest** |
| `AuthContext` demo-mode auth | `src/context/AuthContext.tsx` | Hook integration | **High** |
| `loadSceneOpsSnapshot` fetch & fallback | `src/lib/sceneOps.ts` | Unit | **High** |
| `validateSnapshot` + `stripBom` | `scripts/sync-scene-ops.mjs` | Unit | **High** |
| `AuthModal` form validation | `src/components/AuthModal.tsx` | Component | **Medium** |
| `queueStateLabel` + `bassitoStatusLabel` | `src/components/SceneOpsPanel.tsx` | Unit | **Medium** |
| `SceneOpsPanel` rendering | `src/components/SceneOpsPanel.tsx` | Component | **Medium** |
| CI test gate | `.github/workflows/deploy-frontend.yml` | CI | **Medium** |

---

## Quick Start Order

1. Install Vitest + Testing Library (5 min)
2. Write pure-function unit tests for `formatError`, `validateSnapshot`, `stripBom`, `queueStateLabel` — these require zero mocking and give immediate coverage of critical logic
3. Add hook tests for `AuthContext` demo mode
4. Add component tests for `AuthModal` form validation
5. Add `npm test` step to CI
