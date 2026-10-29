# Agentic demo — Vera, the Clover assistant mode

A clickable prototype of an assistant mode for the Clover merchant dashboard.
One merchant (Fernwood Coffee), one day, five agents: an assistant called
**Vera** brings decisions to one place and opens the relevant Clover page
beside the conversation.

It's a single static page with no build step and no dependencies.

## Run it

```sh
python3 tools/serve.py          # http://localhost:5184
python3 tools/serve.py 8080     # or another port
```

Any static server works. `tools/serve.py` sends `Cache-Control: no-store` so
edits to `index.html` and `styles.css` are always picked up on reload.

## Where it starts: Clover Home

The demo opens on the Clover Home dashboard. On top, Vera's morning brief:
yesterday's sales, today's outlook, what needs you, and the one filled button,
**Open Vera**, which enters the assistant mode on Today. The rest is Clover's
Home (business snapshot, notifications, open batch, Capital, sales insights,
product updates, activity summary, item sales, finances). "Ask Vera" chips
under the snapshot, item sales and finances open the mode's chat with the
question already asked. The Vera pill in the top bar toggles the mode too.

## The three states

| State | Shape | Opens from |
| --- | --- | --- |
| 1 · Today | one centred column (max 720): Yesterday, Outlook, Needs you, Running, Done today | "Open Vera" on Home, the Vera pill, and stops 2–5 |
| 2 · Chat | one centred column (max 720): the day's thread with Vera | the brief row, the stop 5 chip, typing, or an "Ask Vera" chip on Home |
| 3 · Chat + page | chat 38% on the left, the real Clover page on the right | a Needs you or Done today row, or "Open in Reports" |

The Clover top bar stays in every state; only the left nav collapses. Below
1024px wide, the bezel drops away and the page opens as a sheet.

## The flow: five stops, in order (slide 10)

The stepper sets the world at each stop (clock, Home, Today, thread, Vera
badge). Stop 1 lands on Clover Home; stops 2–5 land on Today. The presenter
performs every human action; nothing opens by itself. Each stop returns to
Today through "Back to Today".
State is cumulative: an approval at stop 2 is in Done today at stops 3–5; a
skipped one stays in Needs you.

| Stop | Clock | What the presenter does |
| --- | --- | --- |
| 1 · Daily brief | 7:02 am | Reads Vera's brief on Home → Open Vera → Today. Nothing needs you yet. |
| 2 · Stockout avoided | 10:04 am | Tap "Oat milk reorder" → Place order → (autonomy question, once) → Back to Today |
| 3 · Schedule fixed | 2:03 pm | Tap "Saturday shift swap" → set Priya's end to 3 pm on the page (28 → 33 hrs) → Publish swap → Back to Today |
| 4 · Dispute won | 4:05 pm | Tap "Chargeback response filed" in Done today → point at the filing and "Ask me first next time" → Back to Today |
| 5 · Vera answers | 9:02 pm | Tap the chip "Am I profitable this month?" → answer with Clover, QuickBooks and Gusto chips. The closing frame. |

Before any agent message that follows a tap, a working line ("Vera · …")
shows for 800 ms (1,000 ms at stop 5).

## Presenter controls

- The **1 / 5** pill in the screen's bottom-right corner (prev / next). It
  hides after 3 s without pointer movement and returns when the pointer moves.
- **ArrowLeft / ArrowRight** walk the stops; **1–5** jump (and re-run that stop).
- URL: `?stop=1..5` starts at a stop (e.g. `/?stop=4`).

## Files

```
index.html        the whole demo: markup, assistant-mode styles (am-*), data and logic
styles.css        Clover shell: tokens, Dash 3.0 type scale, iPad bezel, top nav, rail
asset/            bezel, Clover mark, UI icons, Graphik (Regular, Medium, Semibold)
tools/serve.py    no-cache static server
```

All demo content (stops, cards, pages, dates) lives in the `data` object near
the top of the script in `index.html`. Every date label derives from
`data.today`. One `render(state)` writes the clock, the Vera badge, the
Needs you count, the waiting cards, Today's lists and the input placeholder.
