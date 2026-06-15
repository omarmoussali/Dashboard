# Personal Dashboard

A set of small, self-contained HTML apps that share a top bar.

## Deploy your own copy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRowanThistlebrooke%2FYTdashh1)

One click → Vercel signs you in, copies the repo to your GitHub, and deploys it. ~30 seconds to a live URL.

## How to use

Open any `.html` file directly in your browser — no build step, no install.

| File | What it is |
|---|---|
| [index.html](index.html) | **Home — "Hoy"**: runway, top 3, weekly quotas + section nav. Live date. The page the topbar's Inicio button returns to. |
| [main.html](main.html) | Peak Today — goals tracker (Day Ring, Goal Ticker, To Do list) |
| [hub.html](hub.html) | Classic bento hub (backup of the old index — unlinked except a small footer link) |
| [today.html](today.html) | Redirect → index.html (kept so old links/bookmarks still work) |
| [health.html](health.html) | Supplement / daily stack tracker |
| [po-water.html](po-water.html) | Water intake tracker |
| [finance.html](finance.html) | Finances |
| [gym.html](gym.html) | Progressive overload gym tracker |
| [caffeine.html](caffeine.html) | Caffeine intake & timing |
| [topbar.js](topbar.js) | Shared top bar — auto-injected into pages that `<script src="topbar.js">` |
| [lock.js](lock.js) | Passcode gate (convenience privacy, not real security) |

Each app stores its own state in browser `localStorage`. No accounts, no server.

## Building from scratch

[BUILD_DASHBOARD.md](BUILD_DASHBOARD.md) is the prompt I gave Claude to generate `index.html` — paste it into Claude if you want to rebuild that page yourself.
