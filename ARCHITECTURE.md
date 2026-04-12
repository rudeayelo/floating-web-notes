# Architecture Guide

These notes describe the extension's architecture, file responsibilities, and the coding patterns to preserve when changing the project.

## Key Entry Points

- `src/content.tsx` is the entry point for the extension frontend (content script). It is tested via Playwright in `src/content.test.ts`.
- `src/background.ts` owns extension data logic and is where most `chrome.*` APIs should be called.
- `src/api.ts` is a thin messaging layer between the frontend and `background.ts`. It should only send structured messages and avoid business logic.
- Frontend state lives in the stores under `src/store/` (`NotesStore.ts`, `SettingsStore.ts`, `UIStore.ts`).
- Dev-only: `src/utils/debugSubscriptions.ts` logs store changes in development. Keep it lightweight and guarded by `import.meta.env.DEV`.

## Rules For New Code

### Frontend

- Do not call `chrome.*` APIs directly. Always go through `Api` from `src/api.ts`.
- UI state should live in the stores under `src/store/*`. Components should read and write via store actions and selectors, and stores persist via `Api`.
- Keep components presentational where possible. Move side effects and persistence into stores or small utilities.
- If a feature needs persistence or browser data, add a message type handled in `background.ts` and expose it via `Api`.
- For debug-only logging of store changes, prefer `setupDebugSubscriptions` from `src/utils/debugSubscriptions.ts` instead of adding ad hoc `console.log` calls.

### Background

- `src/background.ts` is the central place for `chrome.*` usage: storage, tabs, commands, action clicks, runtime messaging, and related browser APIs.
- Implement message handlers in `chrome.runtime.onMessage` for every `Api` call. Return `true` when the response is asynchronous.
- Use `chrome.storage.local` for persistent data and `chrome.storage.session` for tab-scoped or ephemeral UI state, matching the existing patterns.
- Keep background logic cohesive and as stateless as practical, delegating state to Chrome storage.

### API Layer

- Keep `src/api.ts` minimal and typed. Each method should:
  - Build a `{ type: string, ...payload }` message.
  - Call `chrome.runtime.sendMessage`.
  - Return the typed result.
- Do not put business rules or transformations in `src/api.ts`. That belongs in `background.ts` or the stores.
- Group methods by intent (`get`, `set`, `remove`, `do`) and mirror the message types handled in `background.ts`.

### Stores

- Stores are the single source of truth for frontend state such as notes, settings, and UI state.
- Interact with persistence only via `Api`. Encapsulate debouncing and save lifecycles in the store.
- Derive view state in stores so components can subscribe and render.

## Testing

- End-to-end UI behavior is validated by Playwright in `src/content.test.ts`.
- Keep DOM hooks stable (`.NewWholeWebsiteNote`, `.Note`, `.URLPatternButtonText`, and similar selectors already used by tests).
- When changing flows such as note creation, pattern changes, or visibility rules, extend or update the Playwright specs accordingly.

## Feature Checklist

1. Define or extend a message type and its handler in `src/background.ts` under `chrome.runtime.onMessage`.
2. Expose a typed wrapper in `src/api.ts` that sends that message.
3. Consume the `Api` from the appropriate store in `src/store/*`, and wire store actions and selectors to components.
4. Add or adjust Playwright tests in `src/content.test.ts` to cover the behavior.

## Anti-Patterns To Avoid

- Calling `chrome.*` from React components or stores directly instead of going through `Api`.
- Adding business logic or stateful behavior inside `src/api.ts`.
- Duplicating persistence code across components instead of centralizing it in stores.
- Coupling tests to unstable DOM structure when stable selectors already exist.
