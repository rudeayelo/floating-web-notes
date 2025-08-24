# Copilot instructions for floating-web-notes

These instructions guide code suggestions to follow this extension’s architecture and file responsibilities.

## Key entry points and responsibilities

- `src/content.tsx` is the entry point for the extension frontend (content script). It’s tested via Playwright in `src/content.test.ts`.
- `src/background.ts` owns all logic that deals with extension data and is where most `chrome.*` APIs must be called.
- `src/api.ts` is a thin messaging layer between the frontend and `background.ts`. It should only send structured messages and avoid business logic.
- Frontend state is handled in the stores under `src/store/` (`NotesStore.ts`, `SettingsStore.ts`, `UIStore.ts`).
- Dev-only: `src/utils/debugSubscriptions.ts` logs store changes (settings, UI, notes) in development. Keep it lightweight and guarded by `import.meta.env.DEV`.

## Rules for new code

### Frontend (content script and React UI)
- Do not call `chrome.*` APIs directly. Always go through `Api` from `src/api.ts`.
- UI state should live in the stores (`src/store/*`). Components should read/write via store actions/selectors, and stores persist via `Api`.
- Keep components presentational where possible; move side effects and persistence into stores or small utilities.
- If a feature needs persistence or browser data, add a message type handled in `background.ts` and expose it via `Api`.
- For debug-only logging of store changes, prefer `setupDebugSubscriptions` from `src/utils/debugSubscriptions.ts` instead of sprinkling `console.log` calls.

### Background (service worker)
- Central place for `chrome.*` usage: storage, tabs, commands, action clicks, runtime messaging, etc.
- Implement message handlers in `chrome.runtime.onMessage` for every `Api` call. Ensure responses are returned with `return true` when async.
- Use `chrome.storage.local` for persistent data and `chrome.storage.session` for tab-scoped/ephemeral UI state, matching existing patterns.
- Keep background logic cohesive and stateless where possible, delegating state to Chrome storage.

### API layer (`src/api.ts`)
- Keep it minimal and typed. Each method should:
  - Build a `{ type: string, ...payload }` message
  - Call `chrome.runtime.sendMessage`
  - Return the typed result
- No business rules or transformations here; that belongs in `background.ts` or the stores.
- Group methods by intent (`get`, `set`, `remove`, `do`) and mirror the message types handled in `background.ts`.

### Stores (`src/store/*`)
- Single source of truth for frontend state (notes, settings, UI).
- Interact with persistence only via `Api`. Encapsulate debouncing and save lifecycles in the store.
- Derive view state (selectors/computed) in stores; components subscribe and render.

## Testing
- End-to-end UI behavior is validated by Playwright in `src/content.test.ts`.
- Keep DOM hooks stable (classes like `.NewWholeWebsiteNote`, `.Note`, `.URLPatternButtonText`, etc.). Update tests if selectors change.
- When altering flows (creating notes, changing patterns, visibility rules), extend or update Playwright specs accordingly.

## When adding a new feature (checklist)
1. Define/extend a message type and its handler in `src/background.ts` under `chrome.runtime.onMessage`.
2. Expose a typed wrapper in `src/api.ts` that sends that message.
3. Consume the `Api` from the appropriate store in `src/store/*`, and wire store actions/selectors to components.
4. Add/adjust Playwright tests in `src/content.test.ts` to cover the behavior.

## Anti-patterns to avoid
- Calling `chrome.*` from React components or stores directly (bypass `Api`).
- Adding business logic or stateful behavior inside `src/api.ts`.
- Duplicating persistence code across components; keep it centralized in stores.
- Coupling tests to unstable DOM structure; prefer stable roles/ids/classes already used in tests.
