# Agent Instructions

## Creating a Release

The user will ask to create a patch, minor, or major release.

### Workflow

1. **Run tests to ensure everything works**
   ```bash
   pnpm test
   ```

2. **Run the appropriate version command**
   - Patch release: `pnpm version`
   - Minor release: `pnpm version:minor`
   - Major release: `pnpm version:major`

   This bumps the version, updates CHANGELOG.md, creates a commit, tags it, and builds.

3. **Create the release artifact**
   ```bash
   pnpm release
   ```
   This creates a zip file in `releases/floating-web-notes-{version}/` and amends the version commit.

4. **Push to remote with tags**
   ```bash
   git push && git push --tags
   ```

5. **Manual step**: Upload the generated zip to the Chrome Web Store (done by the user).

---

## Upgrading Dependencies

Use `npm-check-updates` (ncu) to manage dependency upgrades.

### Workflow

1. **Check for updates**
   ```bash
   ncu
   ```

2. **Decide upgrade strategy based on results:**
   - If there are **no major updates**: upgrade all at once
     ```bash
     ncu -u
     ```
   - If there are **major updates**: only upgrade minor and patch versions
     ```bash
     ncu -u --target minor
     ```

3. **Install updated dependencies**
   ```bash
   pnpm install
   ```

4. **Run tests to verify nothing broke**
   ```bash
   pnpm test
   ```

5. **Commit all changes in a single commit**
   ```
   chore(deps): bump <list main packages updated> and refresh lockfile
   ```
   Or for general updates:
   ```
   chore: update dependencies to latest versions
   ```
