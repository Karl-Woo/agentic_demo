# Agentic demo — Clover "Ask me" assistant mode

A clickable prototype of an assistant mode for the Clover merchant dashboard.
An assistant called **Vera** works through a merchant's day, bringing decisions
to one place and opening the relevant Clover page beside the conversation.

It's a single static page with no build step and no dependencies.

## Run it

```sh
python3 tools/serve.py          # http://localhost:5184
python3 tools/serve.py 8080     # or another port
```

Any static server works. `tools/serve.py` sends `Cache-Control: no-store` so
edits to `index.html` and `styles.css` are always picked up on reload.

## The three states

| State | Shape | Opens from |
| --- | --- | --- |
| 1 · Today | one centred column (max 720): Yesterday, outlook, Needs you, Running, Done today | the **Ask me** pill in the top bar |
| 2 · Chat | one centred column (max 720): the day's thread with Vera | a Today row, or typing in the input |
| 3 · Chat + page | chat 38% on the left, the real Clover page on the right | a card, a row with a page, or "Open in Reports" |

The Clover top bar stays in every state; only the left nav collapses. Below
1024px wide, the bezel drops away and the page opens as a sheet.

## The story

Five moments from the vision deck. The device clock reads a few minutes after
each one:

| Clock | Moment | What happens |
| --- | --- | --- |
| 7:05 am | Morning brief | Yesterday's sales and the day's outlook, nothing needs you |
| 10:05 am | Oat milk reorder | Inventory agent drafts a purchase order; approve, edit, or dismiss |
| 2:05 pm | Saturday shift swap | Labor agent proposes cover for a sick shift; edit hours on the schedule |
| 4:05 pm | Chargeback response | Filed automatically, as set for Disputes; evidence on the Disputes page |
| 9:05 pm | "Am I profitable this month?" | Vera answers from Clover, QuickBooks and Gusto; opens Profit and loss |

## Presenter controls

- **D**, or the *Demo* pill bottom-right: toggle the stepper with talking points
- **1–5**: jump to a moment · **0**: reset
- URL parameters: `?moment=1..5` starts at a moment, `?mode=1` opens Ask me
  (e.g. `/?moment=4&mode=1`)

## Files

```
index.html        the whole demo: markup, assistant-mode styles (am-*), data and logic
styles.css        Clover shell: tokens, Dash 3.0 type scale, iPad bezel, top nav, rail
asset/            bezel, Clover mark, UI icons, Graphik (Regular, Medium, Semibold)
tools/serve.py    no-cache static server
```

All demo content (cards, the story's moments, pages, dates) lives in the
`data` object near the top of the script in `index.html`. Every date label
derives from `data.today`.
