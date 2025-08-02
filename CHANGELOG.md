# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 0.0.10 (2025-08-02)


### Features

* add Playwright tests for floating web notes functionality ([a35ce50](https://github.com/rudeayelo/floating-web-notes/commit/a35ce5072dd543f6d1113fbd5d8f2f7e66a3b139))
* **api:** implement API methods for messaging and state management ([6828e1e](https://github.com/rudeayelo/floating-web-notes/commit/6828e1edc86e3b433e693feba6f6ce81a470e944))
* **content:** implement notes to Markdown conversion script ([0545ebd](https://github.com/rudeayelo/floating-web-notes/commit/0545ebdd511039477273507a93f948606b1f9184))
* **store:** implement Zustand stores for notes and settings management ([cc12d85](https://github.com/rudeayelo/floating-web-notes/commit/cc12d85407e3293470e8a2a87f0e62bc877f38de))
* switch editor to @doist/typist and save markdown to the db ([318d024](https://github.com/rudeayelo/floating-web-notes/commit/318d024e6142e54c788e7c648b4e097f179e0d75))
* use hotkey mechanism from Chrome, set active locally only, refactor stuff ([9155358](https://github.com/rudeayelo/floating-web-notes/commit/91553582261d13b027481353d2ed06a5e819a36f))


### Bug Fixes

* add missing build:dev script to package.json ([32fa4f8](https://github.com/rudeayelo/floating-web-notes/commit/32fa4f87b742fdbabb2e2d10a0ed3e9e37c59029))
* correctly infer development and production modes ([c89c48b](https://github.com/rudeayelo/floating-web-notes/commit/c89c48b4cc338db7f93f21a02f87d82a75a13fcb))
* improve Hotkey component handling of keyboard combinations ([6ec925f](https://github.com/rudeayelo/floating-web-notes/commit/6ec925f1618f9195a93509f5d70215bd3d846b58))
* **playwright:** update testMatch pattern to include all test files and add initial content tests ([caf1a2d](https://github.com/rudeayelo/floating-web-notes/commit/caf1a2d5c1c73025065d7b21a2959c45ba371225))
* refactor message handling for first time notice and theme settings in AppContext ([335ecfb](https://github.com/rudeayelo/floating-web-notes/commit/335ecfb430df913bc4deaafcb200bc7c909b1400))
* remove the `scripting` permission request ([0bf7c4c](https://github.com/rudeayelo/floating-web-notes/commit/0bf7c4cdae5de3bc8d406530920eb37516be2570))
* revamp visibility handling ([78af40c](https://github.com/rudeayelo/floating-web-notes/commit/78af40c7e798f09d22c3f1bf91db2740e9befe8f))
* **ShadowDom:** change default position from 'afterend' to 'beforeend' ([d90a8a2](https://github.com/rudeayelo/floating-web-notes/commit/d90a8a2c2adaf623d68e936a0f0f8223e18f7395))
* synchronize memory state with storage and streamline active state handling in AppProvider ([59f0cde](https://github.com/rudeayelo/floating-web-notes/commit/59f0cde8bab0ae11ff5cd0d84a930d57a2600943))
* update author field format in manifest configuration ([bcce261](https://github.com/rudeayelo/floating-web-notes/commit/bcce26184785fde81fc49e3fb7b00b5b3fb618d9))
* update build:dev script and improve test command in package.json ([75f80ac](https://github.com/rudeayelo/floating-web-notes/commit/75f80ac1f9cfd8ea7e108b753db477194669ab47))
* update keyboard shortcut from Alt+N to Ctrl+N across the application ([8aa55e3](https://github.com/rudeayelo/floating-web-notes/commit/8aa55e36ac9c9a0aefece24da998b3d1998ae673))
* update schema version and refine file inclusion settings in biome configuration ([3c46364](https://github.com/rudeayelo/floating-web-notes/commit/3c463640d836d697d0a612e9ce6cf5801f42f3df))
* update X social media handle ([aa019fc](https://github.com/rudeayelo/floating-web-notes/commit/aa019fc079e9744949c545d4a3c0bb21a9b791ce))
* upgrade dependencies, swap ESlint with Biome ([af013da](https://github.com/rudeayelo/floating-web-notes/commit/af013da6eb51cffdc7b65f83ce3613758f44ebcd))

## 0.0.9 (2025-07-14)


### Features

* add Playwright tests for floating web notes functionality ([a35ce50](https://github.com/rudeayelo/floating-web-notes/commit/a35ce5072dd543f6d1113fbd5d8f2f7e66a3b139))
* use hotkey mechanism from Chrome, set active locally only, refactor stuff ([9155358](https://github.com/rudeayelo/floating-web-notes/commit/91553582261d13b027481353d2ed06a5e819a36f))


### Bug Fixes

* add missing build:dev script to package.json ([32fa4f8](https://github.com/rudeayelo/floating-web-notes/commit/32fa4f87b742fdbabb2e2d10a0ed3e9e37c59029))
* correctly infer development and production modes ([c89c48b](https://github.com/rudeayelo/floating-web-notes/commit/c89c48b4cc338db7f93f21a02f87d82a75a13fcb))
* improve Hotkey component handling of keyboard combinations ([6ec925f](https://github.com/rudeayelo/floating-web-notes/commit/6ec925f1618f9195a93509f5d70215bd3d846b58))
* refactor message handling for first time notice and theme settings in AppContext ([335ecfb](https://github.com/rudeayelo/floating-web-notes/commit/335ecfb430df913bc4deaafcb200bc7c909b1400))
* remove the `scripting` permission request ([0bf7c4c](https://github.com/rudeayelo/floating-web-notes/commit/0bf7c4cdae5de3bc8d406530920eb37516be2570))
* revamp visibility handling ([78af40c](https://github.com/rudeayelo/floating-web-notes/commit/78af40c7e798f09d22c3f1bf91db2740e9befe8f))
* synchronize memory state with storage and streamline active state handling in AppProvider ([59f0cde](https://github.com/rudeayelo/floating-web-notes/commit/59f0cde8bab0ae11ff5cd0d84a930d57a2600943))
* update author field format in manifest configuration ([bcce261](https://github.com/rudeayelo/floating-web-notes/commit/bcce26184785fde81fc49e3fb7b00b5b3fb618d9))
* update build:dev script and improve test command in package.json ([75f80ac](https://github.com/rudeayelo/floating-web-notes/commit/75f80ac1f9cfd8ea7e108b753db477194669ab47))
* update keyboard shortcut from Alt+N to Ctrl+N across the application ([8aa55e3](https://github.com/rudeayelo/floating-web-notes/commit/8aa55e36ac9c9a0aefece24da998b3d1998ae673))
* update schema version and refine file inclusion settings in biome configuration ([3c46364](https://github.com/rudeayelo/floating-web-notes/commit/3c463640d836d697d0a612e9ce6cf5801f42f3df))
* update X social media handle ([aa019fc](https://github.com/rudeayelo/floating-web-notes/commit/aa019fc079e9744949c545d4a3c0bb21a9b791ce))
* upgrade dependencies, swap ESlint with Biome ([af013da](https://github.com/rudeayelo/floating-web-notes/commit/af013da6eb51cffdc7b65f83ce3613758f44ebcd))

## [0.0.8](https://github.com/rudeayelo/floating-web-notes/compare/v0.0.7...v0.0.8) (2024-10-31)

## 0.0.7 (2024-10-31)


### Features

* use hotkey mechanism from Chrome, set active locally only, refactor stuff ([9155358](https://github.com/rudeayelo/floating-web-notes/commit/91553582261d13b027481353d2ed06a5e819a36f))


### Bug Fixes

* correctly infer development and production modes ([c89c48b](https://github.com/rudeayelo/floating-web-notes/commit/c89c48b4cc338db7f93f21a02f87d82a75a13fcb))
* improve Hotkey component handling of keyboard combinations ([6ec925f](https://github.com/rudeayelo/floating-web-notes/commit/6ec925f1618f9195a93509f5d70215bd3d846b58))
* remove the `scripting` permission request ([0bf7c4c](https://github.com/rudeayelo/floating-web-notes/commit/0bf7c4cdae5de3bc8d406530920eb37516be2570))
* revamp visibility handling ([78af40c](https://github.com/rudeayelo/floating-web-notes/commit/78af40c7e798f09d22c3f1bf91db2740e9befe8f))
* update X social media handle ([aa019fc](https://github.com/rudeayelo/floating-web-notes/commit/aa019fc079e9744949c545d4a3c0bb21a9b791ce))
* upgrade dependencies, swap ESlint with Biome ([af013da](https://github.com/rudeayelo/floating-web-notes/commit/af013da6eb51cffdc7b65f83ce3613758f44ebcd))

## 0.0.6 (2024-10-30)


### Features

* use hotkey mechanism from Chrome, set active locally only, refactor stuff ([9155358](https://github.com/rudeayelo/floating-web-notes/commit/91553582261d13b027481353d2ed06a5e819a36f))


### Bug Fixes

* improve Hotkey component handling of keyboard combinations ([6ec925f](https://github.com/rudeayelo/floating-web-notes/commit/6ec925f1618f9195a93509f5d70215bd3d846b58))
* remove the `scripting` permission request ([0bf7c4c](https://github.com/rudeayelo/floating-web-notes/commit/0bf7c4cdae5de3bc8d406530920eb37516be2570))
* revamp visibility handling ([78af40c](https://github.com/rudeayelo/floating-web-notes/commit/78af40c7e798f09d22c3f1bf91db2740e9befe8f))
* update X social media handle ([aa019fc](https://github.com/rudeayelo/floating-web-notes/commit/aa019fc079e9744949c545d4a3c0bb21a9b791ce))
* upgrade dependencies, swap ESlint with Biome ([af013da](https://github.com/rudeayelo/floating-web-notes/commit/af013da6eb51cffdc7b65f83ce3613758f44ebcd))

## [0.0.5](https://github.com/rudeayelo/floating-web-notes/compare/v0.0.4...v0.0.5) (2024-03-18)

## 0.0.4 (2024-03-18)


### Features

* use hotkey mechanism from Chrome, set active locally only, refactor stuff ([9155358](https://github.com/rudeayelo/floating-web-notes/commit/91553582261d13b027481353d2ed06a5e819a36f))


### Bug Fixes

* remove the `scripting` permission request ([0bf7c4c](https://github.com/rudeayelo/floating-web-notes/commit/0bf7c4cdae5de3bc8d406530920eb37516be2570))
* revamp visibility handling ([78af40c](https://github.com/rudeayelo/floating-web-notes/commit/78af40c7e798f09d22c3f1bf91db2740e9befe8f))
