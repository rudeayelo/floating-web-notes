import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";
const { version } = packageJson;

const [major, minor, patch, label = "0"] = version
  .replace(/[^\d.-]+/g, "")
  .split(/[.-]/);

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name:
    env.mode === "staging" ? "[Dev] Floating Web Notes" : "Floating Web Notes",
  description: "Attach text notes to web pages",
  author: "info@rudeworks.com",
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  icons: {
    16: "icon16.png",
    32: "icon32.png",
    48: "icon48.png",
    128: "icon128.png",
  },
  action: {
    default_title: "Click to show Floating Web Notes",
    default_icon: {
      16: "icon16.png",
      32: "icon32.png",
      48: "icon48.png",
      128: "icon128.png",
    },
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "http://*:*/*", "https://*:*/*"],
      js: ["src/content.tsx"],
    },
  ],
  background: {
    service_worker: "src/background.ts",
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Alt + N",
      },
      description: "Toggle the Floating Web Notes window",
    },
  },
  web_accessible_resources: [
    {
      matches: ["http://*/*", "https://*/*", "http://*:*/*", "https://*:*/*"],
      resources: ["src/assets/*"],
    },
  ],
  permissions: ["storage", "unlimitedStorage", "activeTab"],
}));
