# Chrome Web Store Listing — Floating Web Notes

> Last Updated: 2026-07-12

## Store Listing

**Extension Name**

Floating Web Notes

**Short Description**

Attach searchable, local notes to any web page and control where each note appears.

**Detailed Description**

Attach personal notes to web pages and have the relevant notes appear when you return.

FEATURES
• Create notes for one exact page, a whole website, or a custom URL pattern
• Search and browse all saved notes
• Move the notes panel and remember its position for each page
• Refresh matching notes and panel position when a website changes pages without reloading
• Choose when the panel opens and switch between light, dark, and system themes
• Export notes to a backup file and import them by merging or replacing existing notes
• Open or hide the panel from the toolbar or a configurable keyboard shortcut

HOW TO USE
1. Open a web page and click the Floating Web Notes toolbar icon or use its keyboard shortcut.
2. Create a note for the current page or website.
3. Edit the URL pattern when a note should appear on additional pages.
4. Use the menu to search notes, adjust preferences, or create and restore backups.

PRIVACY
Your notes, associated page addresses, panel positions, and preferences stay on your device. Floating Web Notes does not use analytics, send your data to a server, or share it with third parties.

PERMISSIONS
Access to websites you visit lets the extension display the notes panel and determine which locally saved notes belong on the current page. Local storage keeps your notes and preferences available between browsing sessions.

SUPPORT
Report bugs or request features at https://github.com/rudeayelo/floating-web-notes/issues or email info@rudeworks.com.

**Category**

Productivity

**Single Purpose**

Attach and retrieve locally stored notes for web pages.

**Primary Language**

English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------:|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `public/icon128.png` |
| Screenshot 1 | 1280×800 | 🟡 Needs review | `releases/floating-web-notes-0.3.1/assets/screenshot-1.jpg` |
| Screenshot 2 | 1280×800 | 🟡 Needs review | `releases/floating-web-notes-0.3.1/assets/screenshot-2.jpg` |
| Screenshot 3 | 1280×800 | 🟡 Needs review | `releases/floating-web-notes-0.3.1/assets/screenshot-3.jpg` |
| Screenshot 4 | 1280×800 | 🟡 Needs review | `releases/floating-web-notes-0.3.1/assets/screenshot-4.jpg` |
| Screenshot 5 | 1280×800 | 🟡 Needs review | `releases/floating-web-notes-0.3.1/assets/screenshot-5.jpg` |
| Small Promo Tile | 440×280 | 🟡 Needs review | `releases/floating-web-notes-0.3.1/assets/small-promo.png` |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | — |

### Screenshot Notes

Before the next submission, compare the version 0.3.1 screenshots with the current UI and replace any that no longer match. At least one current screenshot is required; three to five screenshots covering note creation, URL matching, search, themes, and backup/restore are recommended.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Saves user-authored notes, URL patterns, panel positions, and preferences locally so they remain available between browsing sessions. |
| `unlimitedStorage` | permissions | Allows users to keep large local note collections without saves failing at Chrome's default 10 MB local-storage quota. The extension stores text and preferences only on the user's device and provides export and import controls. |
| `http://*/*`, `https://*/*` | host permissions through `content_scripts.matches` | Displays the notes panel on ordinary web pages and compares the current page address with locally saved note patterns. The extension does not copy page content or transmit browsing activity. |

`activeTab` is intentionally not requested because the extension already runs its content script on supported web pages and does not need temporary extra access after a toolbar click.

## Privacy & Data Use

### Data Collection

**Does the extension transmit or collect user data off-device?** No.

The extension handles the following data locally for its single purpose:

| Data Type | Handled Locally? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|------------------|-------------------------|---------|----------------------------|
| User-authored notes | Yes | No | Display notes selected by the user's URL patterns | No |
| Page addresses and URL patterns | Yes | No | Associate notes and panel positions with pages | No |
| Extension preferences | Yes | No | Remember theme, opening behavior, discovery prompts, and panel positions | No |
| Website page content | No | No | Not read or stored | No |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

Users can export their notes from the extension menu. They can delete individual notes or remove all extension data by uninstalling the extension. No analytics, telemetry, advertising, remote APIs, or third-party data services are used.

## Privacy Policy

**Privacy Policy URL**: [REQUIRED — publish a policy at a stable public URL and add it here]

The hosted policy should state that notes, page addresses, panel positions, and preferences are stored only on the user's device; nothing is transmitted or shared; users can export or delete their data; and privacy questions can be sent to info@rudeworks.com.

## Distribution

**Visibility**: [REQUIRED — confirm Public, Unlisted, or Private]

**Regions**: [REQUIRED — confirm All regions or list excluded regions]

## Developer Info

**Publisher Name**: [REQUIRED — confirm the publisher name shown in the developer dashboard]

**Contact Email**: info@rudeworks.com

**Support URL**: https://github.com/rudeayelo/floating-web-notes/issues

**Homepage URL**: https://github.com/rudeayelo/floating-web-notes

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| Next release | 2026-07-12 | Refreshes matching notes, visibility, and saved panel position when a website changes pathname without reloading, while continuing to ignore query strings and fragments. | Draft |
| 0.3.5 | 2026-07-12 | Defers loading the notes interface on pages where the panel remains hidden, reducing browsing overhead without changing when notes appear. | Draft |
| 0.3.4 | 2026-07-12 | Prevents concurrent tabs from losing note and position updates, surfaces persistence errors reliably, removes a completed legacy migration, corrects icon dimensions, removes an unused permission, and declares Chrome 102 as the minimum supported version. | Draft |
| 0.3.3 | 2026-07-03 | Current packaged release. | Confirm in dashboard |

## Review Notes

### Known Issues / Limitations

- The extension does not run on browser-internal pages such as `chrome://` URLs because Chrome does not permit content scripts there.
- Notes and settings are local to one Chrome profile and do not sync between devices.
- The broad website access is fundamental to the single purpose: users can attach notes to arbitrary HTTP and HTTPS pages.
- `unlimitedStorage` is retained to prevent local note saves from failing when a collection exceeds Chrome's default 10 MB quota.

### Submission Checklist

- [ ] Bump the manifest/package version above the version currently published in the dashboard.
- [ ] Confirm the publisher name.
- [ ] Publish the privacy policy and verify its URL without being signed in.
- [ ] Confirm the dashboard data-use answers match the local-only disclosures above.
- [ ] Review the existing screenshots against the current UI and upload at least one current 1280×800 screenshot.
- [ ] Upload `public/icon128.png` as the store icon.
- [ ] Build the release ZIP and verify it contains only files from `dist/`.
- [ ] Copy the permission justifications above into the dashboard.

### Rejection History

None documented.
