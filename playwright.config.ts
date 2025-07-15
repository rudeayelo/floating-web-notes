import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, "dist");

export default defineConfig({
  testDir: "src",
  testMatch: /.*\.test\.ts$/,
  webServer: {
    command: "bunx http-server screenshots-set --port 6006 --silent",
    url: "http://localhost:6006",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    headless: true,
    viewport: { width: 1000, height: 800 },
    launchOptions: {
      devtools: true,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    },
  },
});
