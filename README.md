# Goalkeeper Timer

A minimalist PWA for timing goalkeeper rotations during football practice or matches. Runs entirely in the browser, works offline once installed, and optionally syncs the timer across multiple devices in real time.

**Live app:** [dmindabrowski.github.io/goalkeeper-timer](https://dmindabrowski.github.io/goalkeeper-timer/)

---

## Features

- **Countdown timer** with progress ring and large digits
- **Configurable duration** (`0:15`, `2:00`, `3:00`, `5:00`, `6:00` presets or custom)
- **End-of-rotation warning** — sample-based sound (Alarm / Whistle / Siren) starts 1–30 s before zero
- **Auto-restart** the next rotation after each finish
- **Rotation counter** for the session
- **Wake Lock** — screen stays on during the countdown (iOS 16.4+)
- **Vibration** on Android (iOS Safari does not expose the Vibration API)
- **Game mode** — fullscreen, oversized timer for players on the field
- **Bilingual UI** — Polish and English (`localStorage` persisted)
- **PWA** — installable on iOS, Android, and desktop; works offline

### Three modes

| Mode | Description |
| --- | --- |
| **Local** | Timer runs only on this device. No network required. |
| **Host** | Broadcasts timer state to all connected clients (password `dd`). Shows a QR invite and a live client counter. |
| **Client** | Read-only fullscreen mirror of a Host's timer. All sound and visual cues fire locally. |

Host ↔ Client sync uses [Firebase Realtime Database](https://firebase.google.com/docs/database). Clients can join by scanning the QR code shown on the host screen (opens `?mode=client` in Safari and auto-enters Client mode).

---

## Repository structure

```
goalkeeper-timer/
├── index.html              UI markup, PWA meta tags, SDK loading
├── styles.css              Layout, theming, responsive rules
├── app.js                  Timer logic, i18n, Firebase sync, QR
├── sw.js                   Service Worker — offline cache
├── manifest.webmanifest    PWA manifest (name, icons, colors)
├── firebase-config.js      Firebase project config (public API key)
├── icon.svg                Source icon (edit and re-render)
├── generate-icons.py       Regenerate PNG icons from icon.svg
├── icons/
│   ├── apple-touch-icon.png    180×180 — iOS home screen
│   ├── icon-192.png            192×192 — PWA
│   ├── icon-512.png            512×512 — PWA
│   └── icon-maskable-512.png   512×512 — Android maskable
└── sounds/
    ├── alarm.m4a           End-of-rotation sample (Alarm)
    ├── gwizdek.m4a         End-of-rotation sample (Whistle)
    └── syrena.m4a          End-of-rotation sample (Siren)
```

---

## Development

Any static file server works. From the project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Service Worker and WebAudio both work on `http://localhost` without HTTPS.

### Regenerating icons

Edit `icon.svg` and run:

```bash
pip3 install --user pillow
python3 generate-icons.py
```

The script draws the icon programmatically with Pillow and writes all four PNG sizes into `icons/`.

---

## Deployment

The project is deployed via **GitHub Pages** from the `main` branch (root folder). Any commit to `main` triggers an automatic rebuild in under a minute.

To use your own hosting instead, upload the folder contents to any static host that serves HTTPS. HTTPS is required for Service Worker registration and Clipboard API.

### Firebase configuration

Host/Client sync requires a Firebase Realtime Database project. Update `firebase-config.js` with your own config object if forking. The database rules used by this app:

```json
{
  "rules": {
    "session": {
      ".read": true,
      ".write": true
    }
  }
}
```

The Web API key in the config file is safe to publish — access control is enforced by these rules.

---

## Technical notes

- **iOS PWA install** — open the live app in Safari, tap **Share → Add to Home Screen**. Once added, launching from the home-screen icon runs the app fullscreen and works offline (Service Worker caches HTML, CSS, JS, sounds, and icons).
- **Audio** requires a user gesture to unlock the WebAudio context — a single Start / Play sound press is enough for the whole session.
- **Firebase SDK** is loaded from `gstatic.com` and skipped by the Service Worker's cache (cross-origin passthrough), so Host/Client modes require internet while Local mode remains fully offline.
- **Client presence** is tracked with Firebase `onDisconnect().remove()`, giving the host a live count without extra plumbing.
- **URL query `?mode=client`** auto-enters Client mode on load; `?mode=host` is intentionally not supported (host always prompts for password).

---

## License

MIT © Damian Dąbrowski
