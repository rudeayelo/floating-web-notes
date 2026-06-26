# Copilot instructions for floating-web-notes

Use `ARCHITECTURE.md` as the canonical guide for architecture, file responsibilities, and implementation patterns.

Keep these core rules in mind:

- Call `chrome.*` only from `src/background.ts` and go through `Api` from frontend code.
- Keep `src/api.ts` as a thin typed messaging layer with no business logic.
- Keep frontend state and persistence flows in the stores under `src/store/*`.
- Update Playwright coverage in `src/content.test.ts` when changing user flows or stable selectors.
