# Pomodoro PWA

A small, installable Pomodoro timer built with Vite and vanilla JavaScript. It
works offline, restores an active timer after a reload, and stays accurate when
the browser throttles background tabs.

## Features

- 25-minute focus, 5-minute short break, and 15-minute long break phases
- Long break after every fourth completed focus session
- Start, pause, resume, and reset controls
- Persisted timer and session count
- Responsive light and dark themes
- Offline app shell and installable PWA manifest

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

Service workers are deliberately registered only in production builds. To test
installation and offline behavior:

```bash
npm run build
npm run preview
```

Open `http://localhost:4173` and use the browser's Application panel to inspect
the manifest and service worker. Once it activates, the precached production
assets let the app reopen offline.

## Other commands

```bash
npm run icons   # regenerate PNG app icons from src/assets/icon.svg
npm run build   # create the production build in dist/
```

## How timing stays accurate

The running timer stores an absolute deadline instead of subtracting one second
on every interval. Each render calculates `deadline - Date.now()`, so returning
from a throttled background tab immediately shows the correct time.
