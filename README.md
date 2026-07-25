# Settle Up

A simple, installable PWA for tracking poker home games with friends — no server, everything runs client-side and persists to `localStorage`.

## What it does

- **Players** — add friends, log their initial buy-in and any rebuys.
- **Loans** — log chip loans between players when someone runs out mid-game (kept as a reference ledger; it's already reflected once you enter final chip counts).
- **Settle** — enter each player's final chip value (cash-out) and get the minimal set of payments needed to settle everyone up.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

The production build is a fully installable PWA (add to home screen on iOS/Android) with offline support via a generated service worker.
