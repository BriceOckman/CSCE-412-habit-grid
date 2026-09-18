# Habit Grid

A tiny, dependency-free habit tracker. Rows are habits, columns are days (Mon–Sun);
click a cell to check off a habit for that day.

## Features

- **Add / delete habits** — text input to add; an × button on each row to delete
  (with a confirmation, and the habit's history is removed too).
- **Current-week grid** — rows = habits, columns = Mon–Sun; click a cell to toggle
  completion for that day.
- **Persistent** — everything is stored in `localStorage` under the key
  `habitGrid.v1`, keyed by habit id with a map of `YYYY-MM-DD → true`.
- **Streaks** — each habit shows its consecutive-day streak, counting back from
  today (a habit not done today has a 0-day streak).
- **Week navigation** — ← / → move between weeks; the **Today** button jumps back
  to the current week (disabled when you're already there). Weeks with no data
  simply show empty cells; if there are no habits at all, a friendly hint is shown
  instead of a broken grid.
- **Weekly stats** — per-habit completion for the displayed week, e.g. `4/7 · 57%`.
- **No cheating the future** — days after today can't be toggled.
- **Responsive** — the grid scrolls horizontally on small screens; habit names
  truncate with ellipsis.

## Run locally

Any static file server works. From this directory:

```sh
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000` (or the port `npx serve` reports).

No build step, no frameworks, no CDN — just `index.html`, `styles.css`, `app.js`,
all linked with relative paths, so it also works from a subdirectory like
`https://briceockman.github.io/habit-grid/`.
