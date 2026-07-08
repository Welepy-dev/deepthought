# Browser Support

Matches the subject's "Additional browsers" minor module: full support for two
browsers beyond the mandatory baseline (Chrome), plus documented,
best-effort coverage for Safari.

## Support matrix

| Browser | Engine | Status | Notes |
|---|---|---|---|
| Google Chrome (latest stable) | Blink | **Fully supported** | Mandatory baseline per the subject; primary development/testing target. |
| Mozilla Firefox (latest stable) | Gecko | **Fully supported** | Verified with the automated smoke suite below. Custom PNG cursors are capped at 32×32 in Firefox (see limitations). |
| Microsoft Edge (latest stable) | Blink (Chromium) | **Fully supported** | Same rendering engine as Chrome; no Edge-specific issues expected or observed. |
| Safari (macOS/iOS) | WebKit | **Best-effort** | Not automatically verified in this environment (see below) — expected to work based on standard CSS/JS feature usage, but not smoke-tested. |

## How it's verified

`frontend/e2e/smoke.spec.ts` is a [Playwright](https://playwright.dev/) suite that drives the same set of flows through Chromium, Firefox, and WebKit:

- sign-in page renders, "login with email" toggles the email form
- the email-login flow transitions past the email step (to either a password field or the OTP setup redirect)
- the OTP entry page renders
- the game canvas mounts for an authenticated session
- a global chat message can be sent and appears in the message list
- a resource file can be uploaded (progress bar + preview) and is cleaned up after the test

Run it against the local dev stack:

```bash
make certs && make up      # stack must be running — the suite mints a test JWT via the backend container
cd frontend
npx playwright install     # first run only
npm run test:e2e
```

**Current status in this repo's dev environment:** Chromium and Firefox pass all 12 tests. WebKit could not be exercised here — the sandboxed Linux dev environment is missing WebKit's system shared libraries (`libicu74`, `libavif16`, `libharfbuzz-icu0`, etc.) and installing them requires interactive `sudo`, which wasn't available. Run `sudo npx playwright install-deps` (or `npx playwright install-deps webkit`) on a machine where you have root, then `npx playwright test --project=webkit`, to extend verified coverage to WebKit/Safari.

## Known limitations

- **`dvh` viewport units** (`PhaserGame.tsx`, world canvas sizing) require **Safari ≥ 15.4** (dvh support landed in that version). Older Safari falls back to the browser's default `dvh`-unaware behavior, which can misjudge the mobile viewport when the address bar shows/hides.
- **Custom PNG cursors** (`src/index.css`, `cursor2.png` and `hyperlink_cursor-export.png`) are exactly 32×32px — **Firefox caps custom cursor images at 32×32**, so they render correctly there, but larger custom cursor art would silently fall back to the system cursor in Firefox specifically.
- **File downloads are same-origin**, avoiding a cross-origin `download`-attribute caveat: before the nginx HTTPS reverse proxy (see the root README's Infrastructure section), the frontend and the `/uploads` file host were on different origins/ports, and the HTML `download` attribute on `<a>` tags is ignored by browsers for cross-origin links (the browser just navigates instead of downloading). Routing everything through nginx on a single origin (`https://localhost:8443`) fixed this — resource file downloads across all supported browsers now correctly save the file rather than navigating to it.
