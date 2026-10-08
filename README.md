# Gamification Exploration

Three demos of a possible future Clover **Insights** page, one per candidate
gamification widget, built for user testing. Each demo is the full page with
a single variant at the top; everything else on the page is identical, so a
session compares the widgets and nothing else. Static HTML/CSS/JS, no build
step.

```
index.html     the test wrapper: three demos + the A/B/C swap pill
insights.html  the Insights page; ?variant=a|b|c picks the widget
styles.css     its styles
asset/         fonts, icons, imagery
asset/vendor/  Highcharts v13.0.0, vendored so the demo runs offline
reference/     Highcharts design spec + gallery (not loaded by the page)
tools/         serve.py (no-cache dev server), retint-loader.py
```

## Running a session

```bash
python3 tools/serve.py
# → http://localhost:5184          wrapper, opens on variant A
# → http://localhost:5184/#b       open straight on B (or #c)
# → http://localhost:5184/insights.html?variant=c   one variant, no wrapper
```

| variant | card title | what it is |
| --- | --- | --- |
| A | Weekly health check | a grade for the week already spent (gauge, marks, badges, ask bar) |
| A low | Weekly health check | the same card for a bad week (`?variant=a&score=low`, wrapper `#a-low`) |
| B | Pace to goal | a running total against a target still in play (chart + drivers) |
| C | Your path to a $15k safety net (title follows the setup goal) | a what-if simulator: pick a question, drag the lever, apply |

**Swapping.** Move the cursor to the bottom centre of the screen and a
frosted pill appears with **A / A low / B / C**; it hides again when the cursor
leaves, so participants do not see it. Keyboard: **1 / 2 / 3 / 4** jump,
**← / →** step (arrows are left to the slider while it has focus). The URL
hash follows the current variant.

Each variant lives in its own iframe, so swapping away and back keeps its
state (slider position, chat thread, scroll). The first variant loads
immediately and the other two preload hidden; a hidden demo holds its
entrance animation until it is first shown — the wrapper posts
`{kind:'show'}` to it, and `insights.html` waits for that when framed.

`insights.html` removes the two non-selected cards from the DOM before
anything renders (`VARIANT` at the top of its script). Every renderer guards
against its element being absent.

### First-time setup (variants B and C)

Variants B and C open on an intro modal ("Vera helps you achieve your goals"), then
a three-step wizard — **1. Target, 2. Focus, 3. Motivation** — of selectable
cards (tap to select, then Next; Finish on step 3), then ~3.2s of "Calibrating your
Pace-to-Goal tracker…" (C: "…your What-If simulator…") before the dashboard
reveals. The main column shows a skeleton until then. C's intro preview shows
a what-if curve instead of the pace line.

| step | answers | B: the Pace card | C: the What-If card |
| --- | --- | --- | --- |
| Target | +15% · +5% · hold $21,000 · custom $ (stepper) | the dotted target line, the ahead/behind figure | Metric B when no motivation is set ("Closes 78% of the gap to your $23,100 monthly goal.") |
| Focus | foot traffic · order size · high-margin items · labor & slow hours | the setup's loading line only | which three what-ifs appear (`WI_SETS`) |
| Motivation | safety net · equipment/space · staff · fewer hours | the trace line and tooltip | Metric B, the motivation hook |

Skip and "Set this up later" keep the defaults (+10%). Aggressive growth puts
B's card $425 **behind** pace, which is intended. Add `?ftu=0` to open B or C
without the setup; reload to see it again.

**Layout and Vera's line.** The wizard uses one 640px column (`--ftu-col`) shared by the stepper, Vera's bubble, the question and the tiles.

- **Answer tiles.** They match option 3's what-if prompts: a borderless `#F4F5F5` tile with a 16px radius. The icon sits on a white 48px chip on the left, and a check sits on the right. A chosen tile turns `#D4EDCB` with green-ink text, icon and check. The custom-$ stepper is a grey panel in the same style.
- **Vera's line** (`ftuSay` / `ftuLine`). It's a chat bubble (avatar plus a white bubble with a hairline border) above each question. The words stream in, and each line responds to the previous answer:
  - Step 1: "$21,000 a month, weekly sales up 8%…".
  - Step 2: "$24,150 means about $105 more a day."
  - Step 3: repeats the chosen focus's finding from `PG_FOCUS`.
- **Entrance order.** Each step comes in as a sequence: Vera's bubble first, then her words stream in, then the question, then the four tiles in a 60ms stagger. `ftuSay` sets `--ftu-after` from the line's word count.
- **Stepper.** A segment fills left to right when its step starts, and drains right to left when you go Back. The current step's label is green, done steps are ink, and each done step reads its answer back ("1. Target · $22,050").
- **Loading.** The green ring is unchanged; under the progress bar, a four-line checklist (`#ftuLoadList`) spins and then ticks each item. Total time is ~3.2s.

### Variant A's card — everything asks Vera

- **Badges.** Hover or keyboard focus shows a tooltip (same `.pg-tip` as B):
  *Top 20% Locally*: "ranks 2nd of the 12 cafés your size within 2 miles";
  *3-Week Action Streak*: "acted on a Vera suggestion each of the last 3
  weeks; act on one by Wed Jun 17 to make it 4". Esc dismisses. Clicking asks
  Vera: rank → `peers`, streak → `hcStreak`.
- **Mark tiles** are buttons (`HC_MARKS[].ask`). Hover/focus: darker grey
  fill plus the assistant's cyan→green 1px ring. Click → `hcRevenue`
  (35/40: Tuesday 2pm closes), `hcOps` (28/30: Jun 9 lunch, +5.5 hrs,
  $148.50, chips into `email` / `recurring`) or `hcRetention` (29/30: 64%
  returning vs 61% last month, 6 lapsed regulars).
- **Ask box.** Focus/click expands the pill into a grey text well with a
  dark-green send button and three prompts (Tuesday closures → `hcTuesday`,
  revenue growth → `hcRevenue`, retention → `hcRetention`). Enter or send asks
  Vera; an empty box sends the placeholder (`hcItems`). Typed text is
  keyword-routed by `hcRoute()` to the nearest prepared answer and shown in
  the merchant's own words (`TURNS.hcFree`); no match falls back to
  `hcAnswer`, which breaks 92 into its three marks. Esc, clicking elsewhere
  or tabbing out folds it back (Esc here does not close Vera).

### Variant A, low score (`?score=low`)

Same card, for a bad week. Elements tagged `data-score-only="high|low"` are
removed from the other version at load (`HC_LOW`).

- **Ring:** muted amber (`#C98A1B` on `#F4E2B6`), never red. Both versions
  share one centre, **N/100 Health Index** (92 green, 82 amber). There is no
  letter grade in either version.
- **Read:** one sentence, like the high version: *"You have an estimated
  **$850** in untapped weekly potential, held back by **slower weekend table
  turns** and **Tuesday closures**."*
- **Pillars:** the same tiles as the high version: Revenue Growth 36/40,
  Operational Efficiency 18/30, Customer Retention 28/30 (36 + 18 + 28 = 82).
  Only Efficiency carries a status: an amber *Needs focus* tag
  (`.hc-status.is-focus`), right-aligned on the tile.
- **Recovery action:** the ask box is the same component as the high
  version, with no extra button. Its preset question (placeholder) becomes
  *"Draft a targeted recovery plan"*, so sending the empty box asks Vera
  (`hcLowPlan`). Vera returns an approvable plan card (weekend lunch busser +
  Tuesdays open until 8pm, about $850 a week). Once it is approved, the
  preset falls back to *"Why are my weekend tables turning slower?"*.
- **Badge:** *Top 20% Locally* in the same purple badge style as the high
  version (2nd of 12, peer median 74). It opens `hcLowPeers`; there is no
  streak badge. The prompts become the weekend tables question
  (`hcLowOps`), the table turnover fixes (`hcLowTables`) and the Tuesday
  closures (`hcLowTuesday`).
- **Numbers:** $850 = $520 (weekend lunch turns 58 min vs 46 last month,
  about 26 fewer covers at $20) + $330 (2–8pm on an open Tuesday). Turns:
  `hcLowPlan`, `hcLowOps`, `hcLowTables`, `hcLowTuesday`, `hcLowPotential`,
  `hcLowRevenue`, `hcLowRetention`, `hcLowPeers`, `hcLowAnswer`.

### Variant B's card

- **Headline + trace.** "You are having a strong week!" (or "You're ahead of
  pace" / "Five days left to catch up"), then what the pace buys: with a
  motivation picked, *"At this pace, you will fully fund your 3-month cash
  safety net by October 15th."*; without one, how June finishes against the
  goal. The date is June's projected surplus over the usual $21,000 ($2,640 a
  month) paying down what is left of the bigger goal (`PG_GOALS`).
- **Pacing badge** in the panel: *Excellent* (ahead, and the last 7 days
  averaged above the daily target), *On track* (ahead, last 7 days under), or
  *Behind* (red). Hover or keyboard focus shows a tooltip with the reasoning,
  e.g. *"You are currently averaging $100 above your daily sales target. This
  $450 surplus creates a healthy buffer, keeping your October 15th safety net
  goal on track even if you experience a slow day."* Esc dismisses it. The
  headline follows the level.
- **Pace drivers ask Vera.** Each row carries `data-ask`; clicking opens the
  chat panel (if closed) and sends that driver's question, flying from the
  row. Turns `paceEvent` (Saturdays vs last June, +$300), `paceMargin` (items
  over forecast, +$250, bar chart) and `paceTuesday` (two 2pm closes, −$100)
  live in `TURNS`, and their chips lead between the three. A click while
  Vera is mid-answer is queued and sent next.
- **Edit goal** (page head) reopens the three steps with current answers
  picked; finishing re-tells the whole card and redraws the target line.

### Variant C's card — a personal financial simulator

**Title and summary follow the setup goal** (`renderWiHead`). Safety net:
*"Your path to a $15k safety net"* / *"High-margin weekend sales are
accelerating your progress, but Tuesday closures are delaying your $15k buffer
by an estimated two weeks."* The delay is computed: Tuesday closures cost about
$100 a week; the $6,700 left at the usual $609/week surplus takes 11.0 weeks,
or 9.5 with Tuesday back. The other goals become *"Your path to a new espresso
machine / a fall hire / Mondays off"* with their own delay (about a week each).
With setup skipped, the title is *"Pacing toward your $23,100 June goal"* and
the drag is stated as about $430 a month.

1. **Hypothesis.** Three what-ifs across the top, **chosen by setup step 2**
   (`WI_SETS`). The first one is open, and it is the same idea B's setup line
   names for that focus, so the card visibly acts on the answer:

   | focus | what-ifs (first is open) |
   | --- | --- |
   | Foot traffic | Tuesday happy hour · stay open later on Tuesdays · Sunday dinner hours |
   | Order size | pastry pairing with weekend lattes · top-item prices · Saturday features |
   | High-margin items | Saturday features · top-item prices · pastry pairing |
   | Labor & slow hours | trim Thursday lunch staffing · later Tuesdays · Tuesday happy hour |
   | (skipped) | Sunday hours · Tuesday happy hour · top-item prices |

   **Layout (Figma).** The card has one level of containment. There is no
   grey well and no white inner panel. Every section sits on the card's white,
   and only two surfaces are tinted: the what-if cards
   (`#F4F5F5`, selected `#D4EDCB` in 500 green-ink) and the result panel
   (`#F7F8F9`). The lede is body 16px in ink.

   **The lede is the handoff.** There is no separate Vera note and no
   *What if…* header: both cost vertical space and repeated the goal the
   title already names. The lede states the pain point and hands straight
   to the cards: *"High-margin weekend sales are accelerating your
   progress, but Tuesday closures are costing you ~$430/month. To close
   this gap, what if…"* With a goal from setup the middle reads
   *"…delaying your fall hire by an estimated one week."* Each card
   finishes the sentence in the merchant's own voice (*I add a Tuesday
   happy hour?*), which keeps the simulator a sandbox the merchant drives
   rather than a list of prescriptions from Vera.

   New levers, all peaking inside their range so *Optimal* means something:
   later Tuesdays (2–8 PM, peak 5 PM +$105, about the $100/wk the closures
   cost), pastry pairing ($2–$5, peak $3 +$145), Saturday features (0–6
   items, peak 2 = ice latte and avocado toast +$130), Thursday lunch (0–5
   shifts dropped, peak 3 +$210, matching B's "saves about $210").
2. **Mechanism.** The net-sales curve over a notched lever (6/7/8/9 PM;
   None/10/20/30% off; No change/+5%/+10%). Dragging updates everything
   below instantly. **The y scale is fitted per curve** (`wiYScale`): the
   tightest grid of 2–5 intervals on a round step ($25, $40, $50, $75, $100…)
   that holds the curve and $0. So every lever's rise, peak and fall fills
   the 144px panel ($0–$150 for the happy hour, $0–$400 for Sunday hours,
   −$300–$150 for prices). The scales differ between levers on purpose: the
   hero figure carries the comparison, and the curve carries the shape. The
   peak is marked on the curve: a thin, 60% opacity
   short-dash drop from the best stop to $0 and a small 11px green
   *Optimal* caption above it. There is no dot, so the slider's knob stays the
   only circle (`wiOptimalSeries`, at `wiBest()`: 7:30 PM, 15%
   off, +5%). Moving past it on the happy hour visibly walks down the far
   side of the curve.

   **The ruler labels only its two ends**, flush with the track ends and
   saying what each end means (`sc.ends`): *Close at 6 PM / Close at 9 PM*,
   *No discount / 30% off*, *As staffed today / 5 fewer shifts*. There are
   no ticks. The dotted marker on the chart shows where the thumb is. The
   thumb is 22px (`WI_THUMB`), and the track is 12px.
3. **Result panel.** One grey rounded panel (`.wi-out`):
   - The top row is one trigger: *Projected weekly net sales (?)*, with no
     dashed underline. Its single tooltip gives the definition ("The extra
     sales this change brings in each week, after what it costs to run…"),
     then, under a hairline, a full sentence naming the figure and what it
     rests on (`wiFrom`), e.g. *"The +$380 a week is based on about 15% more
     foot traffic after 6 PM at your $32 average evening ticket, less the
     cost of staffing the extra hours."* Hover or keyboard focus shows it. A click pins it
     open for touch, and a click elsewhere or Esc closes it. It anchors to
     the trigger's left edge, so it never hangs off the card.
   - The body has the figure (40px) with Metric B as a 14px muted caption
     beneath it on the left. The CTA (48px dark-green pill) sits on the
     right, top-aligned so it lines up with the 48px figure.
   - **Narrow (main column ≤ 664px):** the panel stacks instead of
     wrapping. Label + *(?)* on top, then the figure and caption, then the
     CTA full width at the bottom.
   - *Metric B*, the motivation hook (`wiHook`), from setup step 3. It is in
     **weeks**, the same unit as the weekly figure, and leads with the
     lede's pain point. One short sentence, so it stays within two lines on
     a narrow panel:

     | case | hook |
     | --- | --- |
     | makes up the Tuesday gap | Recovers your Tuesday deficit, hitting your $15k buffer 2 weeks faster. |
     | falls short of it | Recovers part of your Tuesday deficit, hitting your … N faster. |
     | loses money | Delays your … by N, on top of your Tuesday deficit. |
     | setup skipped | Closes 78% of the gap to your $23,100 monthly goal. |

     A full recovery is judged on the displayed figures, so it is never
     claimed on a shortfall. Each goal has its own phrase (`WI_HEAD[].hit`):
     hitting your $15k buffer, getting your espresso machine, making your
     fall hire, reaching Mondays off. Vera's draft quotes the same text. The hook turns red when a
     setting loses money (prices at +10%).
4. **Soft CTA.** "Draft new hours with Vera" (or the happy hour / new prices).
   The old note under it ("You'll review it first…") is no longer drawn. It is
   now the button's `title` and its `aria-describedby`. It sends the drafted
   change to Vera, who replies with
   a draft card; approving it there locks the scenario on the card ("Applied
   from Sun Jun 15"). Disabled while the lever is on a setting that adds
   nothing.

The notes below were written while the three widgets sat on one page as a
comparison and refer to them as options 1, 2 and 3 — read those as variants
A, B and C.

## Three gamification options

One card per option, on a flex stack with a 16px gap.

The first pass did the opposite — all three inside a single card divided by
hairlines, on the theory that a rule between two regions of one surface reads
as **or**. It didn't survive contact with the geometry. Each option wants 24px
of padding of its own, so inside a shared card every specimen was pressed up
against its neighbours' margins; and an edge-to-edge rule is the same mark
this page already uses to separate rows *within* a widget (`.focus-row`,
`.gam-row`), so the card read as one widget with three sections rather than as
three candidates. Separate cards say "three alternatives" in the page's own
vocabulary, and give each specimen the geometry it would really have in
production — which is the whole point of a comparison of specimens.

The gap lives on `.gam-stack`, not as margins on the cards: the three are a
set, and the set should own the rhythm between them. 16px rather than the 32px
between page sections, because these are alternatives to each other, not
separate topics.

| | widget | what it is | the merchant's next move |
| --- | --- | --- | --- |
| 1 | Health Check Report Card | a grade for the week already spent | ask Vera |
| 2 | Pace-to-Goal Tracker | a running total against a target still in play | read the drivers |
| 3 | What-If Action Simulator | a price on a decision not yet made | drag, then commit |
The real axis of the comparison is **distance from the next decision**.
Option 1 is the furthest — it can tell you Tuesday closures cost you and can
do nothing about it before the week closes, which is why the only route off
it is an ask bar. Option 3 is the closest, and is the only one of the three
that is not a report of any kind.

Option 1 grades a **week**, not a month. The window is Jun 4–Jun 10, which
contains exactly one weekend and exactly one Tuesday, so its finding can say
"weekend volume" and "Tuesday closures" and mean two specific days that
option 2's chart plots. A month would mean four Tuesdays averaged into a
claim nothing else on the page could show.

### Layout decisions

**Option 1 stacks. Option 2 is chart-left. Option 3 is rail-left.** All three
shared one shape for several passes — hero on the left, a 272px rail of rows
on the right — on the argument that two widgets which also disagree about
where their columns go are comparing two layouts rather than two ideas. That
argument is right about the principle and it was being applied past the point
where it helped: holding three different claims to one grid made two of them
argue something false about their own content.

**Option 1's breakdown is not a rail** because option 2's rail held
*contributions to a single total* — +$300, +$250, −$100 sum to the hero and
are therefore subordinate to it — while option 1's three marks are three
separate scores of similar size that happen to be added up. The question a
reader brings to those is *"which of these is weakest"*, which is a
comparison **across** them. Tiles at equal width answer that; a vertical list
with the figures ragged down the right edge does not.

**Option 2's chart is not a sidekick.** It spent those same passes at roughly
half the card, beside the number it was supposed to prove. A pacing claim is
a *trajectory*, and a trajectory needs width — at ~330px the line had no room
to have a shape, so it read as decoration next to the hero rather than as the
evidence for it. The chart now takes the wide column and the figure moved
into a tinted panel on the right.

So the three run:

```
option 1   .card-head                    title + Option 1 + the week graded
           .hc        dial | say         gauge, finding, badges
           .hc-marks  3 x 1fr            the three marks as peers
           .hc-ask                       full-width ask bar

option 2   .card-head                    title + Option 2 + the window elapsed
           .gam-main  chart + key   |  .pg-panel   figure + first clause
           .gam-group-head               "Pace drivers"
           .gam-rows                     three full-width driver rows

option 3   .wi-lede                      the premise, spanning the card
           .wi-ask    the questions |  .wi-play    the answer
```

Option 3 runs its two columns **the other way round** from option 2, and the
reversal is
the argument. Options 1 and 2 lead with a conclusion and put the workings in
the right-hand rail: read the verdict, then check it. Option 3 has no verdict
to lead with — it has a *question*, and the entire right-hand side is that
question being answered. So the rail holds the **input** (`.wi-ask`, the three
suggested what-ifs) and the wide column holds the **output** (`.wi-play`).
Reading order follows causation rather than habit. Its rail keeps the same
272px as option 2's, so the two cards that have rails agree about the spine.

Inside `.wi-play` the order is **answer, shape, control, commit**, under a
full-width premise that spans both columns:

```
.wi-lede     the situation, spanning the card   <- premise
  .wi-ask                    |  .wi-play
  .wi-prompts-head           |  .wi-hero    Projected Impact, at option 2's hero size
  .wi-prompts  three what-ifs|  .wi-note    why this lever bends the way it does
                             |  .wi-curve   the shape of the whole range
                             |  .wi-slider  the lever, aligned to the curve above it
                             |  .wi-foot    Lock In & Apply, right-aligned and alone
```

The result **leads the column**. It spent a pass as a tinted tile sharing a
footer row with the button under `space-between`, which spent the full width
of the column separating the two things looked at last, and put the one figure
this widget exists to produce *below its own controls* at caption-plus-figure
size, level with a green button competing for the same glance. It is now built
as option 2's hero, down to sharing `.pg-dot` — because all three options are
being compared and the other two already open with their headline. A simulator
whose result hid in the basement would have read as "this widget has a quieter
finding" rather than "this one was laid out differently". The CSS note above
`.pg-hero` already required the two figures to be set at one size; they now
are, and the [verification](#verifying-the-comparison) asserts it.

### Option 2's figure panel

The `$450` used to read `🟢 $450 Ahead of Pace` — one line, one size, a dot
and a tail — and this file defended the tail at hero size on the grounds that
"$450 Ahead of Pace" was a sentence, and shrinking half a sentence turns a
metric into a metric-with-a-caption.

That held while the figure had no label. It now has one, which makes the
panel the page's ordinary **label / figure / unit** stack:

```
Net sales          --body-bold, --ink
$450               --heading-01
ahead of pace      --body, --muted
High-margin items are driving strong weekend volume.
```

In that stack the third line is a unit, not a truncated sentence, and it
belongs under the number at body size. The panel takes `--soft`, the tint
this page gives a read-only surface, so the one figure the card exists to
produce sits in a container rather than floating on the same white as the
chart.

**The green dot is gone from the figure.** The chart above now spends a green
dot on "Net sales" in its key, and a second green dot beside `$450` in the
same card would be read as another key entry rather than as a state. Ahead /
behind survives as the number turning red when it is negative — the same move
`.gam-row-val.is-down` already makes in the rows below, and "ahead" needs no
decoration because the whole card is the good news. `.pg-dot` itself stays
defined: option 3's `.wi-hero` is built from it, which is the point of the
two heroes being the same object.

The sentence in the panel is **the first clause** of the finding options 1
and 3 carry whole. This card is about being ahead, so the panel takes the
half that explains the lead and the half that explains the drag is the third
driver row, at −$100. Same finding, split along the card's own seam rather
than restated — see [the shared
sentence](#the-numbers). It is set at body rather than the Heading 4 those
two ledes use: they open their cards and carry the finding whole, where this
annotates a figure inside a 240px panel and at Heading 4 would out-set the
"Net sales" label it belongs to.

The button is deliberately last: you cannot reach it without passing the
lever.

Its **card** also carries a deeper shadow than the other two, because that is
precisely its claim: this is a surface you *act on* and the other two are
surfaces you *read*. The elevation is on the card, not on a box inside it — an
earlier pass nested a shadowed panel in a shadowed card and produced two
frames, which reads as a widget that failed to fill its container rather than
as emphasis.

Spacing is the page's, not the comparison's: 24px card padding, 24px from the
head to the body, a 24px column gutter, a 272px side rail, and 16px between
the three cards on `.gam-stack`.

The three cards are **not** the same height, and an earlier draft of this file
claimed options 1 and 2 landed at exactly the same one. They did, when both
were a hero beside a rail. Option 1 now carries two badges and a full-width
ask bar; option 2 carries a taller chart and three full-width driver rows. At
the default panel width the stack measures roughly **496 / 586 / 557**. That
is content, and padding one card to match another would be inventing empty
space to defend a sentence in a README. What does have to match is the thing
actually being compared — the hero figures are set at one size, and the
[verification](#verifying-the-comparison) asserts it.

Three departures from the reference mocks, all for the same reason — the
design system outranks any single card:

- **Option 2's `$450` stays at Heading 1 (32/40)**, not the ~50px the
  reference sets it at, and not the Display 40/52 it had for a while. At 40 it
  was larger than "Insights" at the top of the page, so the card out-ranked
  the screen it sits on. The mock is drawn as one card with no page title
  above it and can afford what this page cannot. 32 also keeps it identical to
  option 3's projected impact, which matters more than either number alone.
- **The driver rows keep the page's row height**, not the ~30px-taller ones in
  the mock. Row height is a page-wide constant here, and a card whose rows are
  the only tall ones reads as a card from a different product long before it
  reads as generous.
- **No emoji.** Graphik has no emoji coverage, so a 🟢 would fall through to
  the system emoji font and arrive at a different size, baseline and colour on
  every OS. Where a status dot is wanted it is a drawn `<span>`.

### The badges, and why option 1 needed them

Option 1 is in a **gamification** comparison, and for several passes it was
the weakest candidate in it for a reason that had nothing to do with layout:
nothing on the card was playable. A grade is a report. A rank and a streak
are a game.

So it carries two, and they are the two mechanics that actually change
behaviour — one **social** ("Top 20% Locally": how am I doing against
comparable businesses) and one **habitual** ("3-Week Action Streak": do not
break the chain). Between them they turn a verdict on a week into a position
worth defending, which is the only version of this card that competes with
option 2's live target or option 3's lever.

They take `--badge-tint` / `--badge-ink`, a violet pair added for them, rather
than the green every other positive on this page uses. Green here means
**money** — ahead of pace, projected impact, a positive driver. A rank and a
streak are **status**: neither is denominated in dollars, and painting them
green would have them read as two more takings figures at a glance.

They are now **buttons**: hover explains how each badge is earned, and a
press asks Vera about it (see "Variant A's card" above). That keeps the
"affordance is a promise" rule: what they promise when pressed, an answer in
the chat, actually exists.

### The trend line over the lever

A slider on its own can only answer *"what does this setting pay?"*. The
merchant's actual question is *"how far should I go?"*, and without the shape
the only way to find out is to drag to one end and back. `#wiCurve` draws the
whole range before anything is touched, which turns that search into a glance
— and it is what makes the three scenarios' different shapes legible at all.
A flat line would mean the lever did not matter.

Three rules make the curve tell the truth, and each of them is a bug that was
caught in review:

1. **The plot area is inset exactly 16px on each side** (`marginLeft: 16`,
   `marginRight: 16`), because the slider's thumb is 32px and its centre only
   ever travels between 16px and `track - 16px`. Matching the inset is what
   puts a point on the line directly above the stop that produces it. Miss it
   and the two disagree by up to 16px — on a 4-hour lever that is a quarter
   of an hour of drift, and the marked peak points at the wrong stop.
2. **The line is sampled at the slider's own stops, not finer.** An earlier
   pass sampled four times finer and drew a prettier curve that lied: the
   happy-hour model dips below zero between 0% and about 3%, but that lever
   moves in fives, so the red stretch was a loss the merchant could never
   select and could never reproduce by dragging. Every point on the line is
   now somewhere the thumb can actually stop.
3. **The y values are rounded to $5, the same as the tile.** The line and the
   readout are two views of one number and should never disagree about it.

The curve turns **red below zero** (`zoneAxis: 'y'`), which is the same red
the impact tile takes — so the pricing scenario shows its losing stretch
*before* the merchant drags into it. The zero line only appears on scenarios
that can actually lose money; on the other two it would be a baseline the
curve never approaches, which is furniture. The best stop is marked with a
dashed drop, a dot on the peak and an *Optimal* label; a dotted grey
`plotLine` follows the current setting.

`wiBest()` compares the **rounded** figures and keeps the **earliest** stop
that achieves the maximum, so the marker always points at the cheapest way
to get the best shown result. The three markers land at 1.5 hrs (7:30 PM,
+$380), 15% off (+$135) and +5% (+$140).

The chart is built lazily when the card reveals, like the other two, so
`.wi-curve` states its 132px height in CSS as well — otherwise the lever
jumps 132px down the page the moment the curve arrives.

### Speaking the page's vocabulary

The first build of these three cards invented its own components, and next to
the rest of the dashboard they looked like they came from a different product.
Every one of them now maps onto something the page already had:

| the comparison | the page's own | was |
| --- | --- | --- |
| option head | `.card-head` + `.card-title` + `.card-sub` + `.card-note` | "OPTION 1" / name / note on one baseline at three sizes |
| `Option N` marker | `.card-note`, right side, like Inventory's "5 items running low" | uppercase, letterspaced, `--faint` |
| `.gam-row` | `.list-row` — 12/4 inset, `--line-soft` hairline, `#FBFCFC` hover | 12/0, chevron-hover only |
| row chevron | `.chev`, the page's own 24px asset at 0.55 | a 7px rotated pair of borders |
| option 1's three marks | `.hc-mark` tiles on `--soft`, the tint the page gives a read-only panel | rows in a 296px rail |
| option 1's ask bar | `.hc-ask` — full-width, the `ai-search` asset, gradient border | a white 999px outlined pill |
| option 2's figure | `.pg-panel` on `--soft`, label / figure / unit | a bare hero line with a dot and a tail |
| option 2's driver icons | `.gam-row-ico` at `--icon` (24), matching the chevron at the row's other end | *(no icons)* |
| option 2's chart key | `.pg-key`, HTML, `--caption` muted with 8px drawn dots | Highcharts' own legend, at its own sizes |
| option 3's three prompts | `.askchip` — `.chip` geometry (8/12, radius 24, `#F1F3F4`) in `.link` green — as two-line tiles stacked down the left rail at equal heights, with a green-tint pressed state | a white 999px outlined pill / *(the tiles did not exist)* |
| "Projected Impact" | labelled-figure tile: `--green-tint`, radius 8, 12/16 inset | a bare number with a 12px green `drop-shadow` glow |
| column gutter | 24, the gutter every other card uses | 32 |
| side rail | 272, the width this page gives a rail beside a chart | 296 |
| section labels | sentence case `--caption-bold` muted | `text-transform: uppercase` + `0.08em` |

Three things drove most of it:

**Nothing may out-rank the page title.** Option 2's hero was `--display`
(40/52), larger than "Insights" itself. Both heroes are now `--heading-01`
(32/40) — and, more importantly, they are now the *same* size as each other.
Two figures being compared have to be set identically or the comparison is
partly about type. The health gauge's grade was an untokenised 44px; it is 40,
the Display size, which is defensible for two glyphs centred in an arc.

**Nothing on this dashboard glows.** The brief asked for a glowing projected
impact, and `drop-shadow(0 0 12px rgba(30,142,62,0.38))` delivered it — as the
only glowing object in the product. The tinted tile says "this is the good
outcome" using a shape the page already has three of.

**Option 3's lift was at modal strength.** `0 12px 28px / 0.10` is the wizard
card's register; on a card in the document flow it read as torn out of the
page rather than raised within it. Now `0 4px 16px / 0.07` — one clear step
above `--shadow-card` and no more.

The one thing deliberately *not* aligned: the comparison cards take
`.card-title` at Heading 2 where the Today's-focus cards take
`.card-title--sm` at Heading 4. That is the page's existing distinction
between a full-width feature card and a half-width one, which is what the
business snapshot used to demonstrate.

### The numbers

Authored specimens, not derived from a shared engine. These are candidates
being compared: each has to be judged at the numbers it was specified with,
and a common model would have quietly moved two of them off-brief to agree
with the third.

What they *do* share is internal consistency, because a comparison conducted
on figures that do not add up is a comparison of nothing.

```
option 1   35 + 28 + 29   = 92 / 100  ->  "A-"
option 2   +300 +250 -100 = +$450 ahead of pace
option 3   three curves, none of them ramps — see below
```

Option 1's total is **derived, not typed**. `HC_MARKS` holds the three marks
as `{got, outOf}` and `HC_SCORE` / `HC_TOTAL` are summed from them, so the
gauge, the centre text and the three tiles cannot disagree — they are one
number rendered three times.

That is a direct response to a bug in the reference design this card was
built from, which showed "35/42 pts", "28/30" and "29/30" above a gauge
reading **92/100**. 42 + 30 + 30 is 102. Taking 40 fixes this instance;
deriving the total is what stops the next one being invisible — change a
`outOf` now and the card says "92/102" out loud rather than quietly lying.

**Option 2's chart** is cumulative, not daily: "ahead of pace" is a statement
about a running total, and plotted as daily takings the two lines would cross
each other repeatedly and the figure would have nothing to point at. Only the
last takings point carries a marker, because that is where the $450 is.

**It shows 25 days of a 30-day month, and the target runs all 30.** That
asymmetry is the best argument this option has. A ten-day window put both
series' last point at the same x, which made the chart a record of what had
happened and nothing more — but the card's entire claim is that the month is
*still in play*, and the only way to draw that is to let the dotted target
keep going five days past where the takings stop. The gap on the right is the
ground left to cover. Option 1 grades a week already spent and literally
cannot draw this.

The takings series carries `null` for Jun 26–30 so the fill ends in a clean
vertical edge at today. `connectNulls` stays off: bridging the gap would draw
revenue that has not happened.

The *dailies* behind the running total carry a restaurant's week, and this is
the third attempt. An early set ran `780, 1560, 2390, …` — between $770 and
$870 taken every single day, which no hospitality business has ever done —
under a comment insisting the line had to "wobble and still end where the
hero says it does". It did not wobble. It just ended in the right place.

June 2026 opens on a Monday, so `index % 7` gives the weekday and the four
weeks line up in columns:

```
          W1     W2     W3     W4
Mon      520    565    605    605
Tue      440    460    520    530   <- the floor of every week
Wed      605    650    690    700
Thu      720    780    835    815   <- Jun 25, today
Fri     1030   1115   1160
Sat     1125   1215   1300         <- the peak of every week
Sun      840    900    975
       -----  -----  -----  -----
        5280   5685   6085   2650   = 19,700
```

The weekday names are **derived from the index**, not typed out thirty times,
so the two days the finding rests on cannot drift out of step with the
figures above them.

Saturday takes about 2.5× Tuesday every week, and the weekend total climbs
`1965 → 2115 → 2275` — which is the summer event in the first driver row
actually happening rather than being asserted beside a smooth line. Against
$770/day the running total reads:

```
behind all through weeks 1 and 2, worst at  -$795  Thu Jun 4
first crosses ahead                          +$55  Sat Jun 13
peaks after the third weekend                +$880 Sun Jun 21
four slow weekdays give half back            +$450 Thu Jun 25
```

So the line **crosses its target three times**, which is what a real one
does, and all three driver rows are visible in it: the weekends lift it, the
Tuesdays are the notch at the bottom of every week, and the lead is what
survives. The weekday is in the category string so the tooltip reads "Sat Jun
6" — a date alone does not explain why one point is two and a half times
another.

The driver rows moved out of the 272px rail and under both columns, and that
is what let them stop being labels. "Weekend Volume" is a category; "Summer
event lifted weekend volume" is a finding, and it is the second one that
earns a chevron — there is somewhere to go because something is being
claimed. At 272px the longer wording wrapped to three lines and had to be cut
back, so the rail was quietly setting the copy.

The target line is the one figure in the whole comparison that is **not**
fixed. Default: `$21,000 × 1.10 = $23,100` over 30 days = `$770/day`, so day
25 wants `$19,250` and `$19,700` taken is `$450` ahead — the brief's number,
arrived at rather than typed. The growth target is `GOAL_GROWTH` in the
script.

**Option 3 offers three suggested what-ifs**, phrased as questions and
carrying the sparkle, because they are Vera's suggestions rather than
settings. One hard-coded action made the widget a demo of a single
recommendation; three make it a place you arrive at with a question, which is
the actual proposition being tested.

Each one **names the figure it came from**, and those figures are not invented
for this card — they are verbatim option 2's three pacing drivers:

| option 2 reports | option 3 asks | lever | peak | at the far end |
| --- | --- | --- | ---: | ---: |
| Summer event lifted weekend volume **+$300** | What if I extend Sunday hours? | 0–4 hrs, half-hour steps | **+$350** at +2–2.5 | +$265 |
| Tuesday closures held back sales potential **−$100** | What if I add a Tuesday happy hour? | 0–30% off, in fives | **+$135** at 15% | +$45 |
| High-margin items sold above forecast **+$250** | What if I raise top-item prices? | 0–10%, in ones | **+$140** at +5% | **−$250** |

That mapping is the whole reason the evidence line exists. Without it these
are three generic questions any restaurant could be asked, and the merchant
has no reason to believe the assistant looked at anything; with it, each
what-if acts on exactly one driver the dashboard just reported, and the
simulator stops being a sandbox bolted to the page — it is the third card
doing something about what the second card found. **If you change a driver in
option 2, change its evidence line here.**

The card opens on a `.wi-lede` that states the situation those questions
answer:

> High-margin items are driving strong weekend volume, but Tuesday closures
> are slightly dragging down your potential. · *Last 30 days*

Without it the card opened straight onto three questions, and each chip
justified *itself* while nothing justified the **set**. The sentence names all
three drivers, which is what makes the options follow rather than merely
appear — but it deliberately does **not** enumerate them in prompt order.
Bending a finding to match a column turns it into a list, and the per-chip
evidence lines already carry the mapping.

It is **the same sentence as option 1's finding**, word for word, and the two
cards attribute it to two different windows — "Jun 4–Jun 10" there, "Last 30
days" here. An earlier pass had them nearly-but-not-quite identical, option 1
ending on *your score* and option 3 on *your potential*, and defended the
difference as each card's job showing through the tail. That was the wrong
trade: the three cards are competing presentations of **one business**, and a
reader flicking between them reading two almost-identical sentences has to
stop and work out whether the difference means anything. It does not. Sharing
it exactly makes the comparison about the presentations, which is the only
thing it is supposed to be about.

The two windows are also deliberate. A **day-of-week effect** is precisely the
class of claim that survives both — option 2's dailies run four Tuesdays, and
every one of them is the floor of its week, against four Saturdays that are
every one the peak. A month of that averages to the same story one week
tells. A finding like *"last Thursday was unusually slow"* could not be
shared across two windows, and should not be. **If you reword one, reword the
other.**

Option 2 carries **the first clause only** — *"High-margin items are driving
strong weekend volume."* — in its figure panel. Not a third variant: the
second clause is that card's third driver row, *"Tuesday closures held back
sales potential, −$100"*. A pace tracker's job is to decompose a lead into
what helped and what hurt, so the finding splits along the card's own seam
rather than being restated under it.

The provenance sits on the lede rather than on the prompts group, where it
used to claim the suggestions came from 30 days of data. They did not — they
came from this finding, which came from the data. Now the chain runs in one
direction: *30 days → the finding → three questions → each with its figure.*

Type carries the hierarchy, because the card now holds two sentences. The
lede is Heading 4 at full ink; `.wi-note` — the active scenario's mechanism —
stays body at secondary ink. Set the same, they would read as two sibling
captions with no way to tell which was which. Both still sit below the
projected-impact figure: **the answer, then the premise, then the mechanism.**

The evidence figures stay **muted**, not option 2's red and green. There they
are a verdict on the month; here they are the reason a question is being
asked, and ink is how that difference shows.

All three projections are weekly figures — one Sunday, one Tuesday and one
week are the same period here — so they can be read against each other.

Every one of them **bends, and each for a different reason.** A lever that
only goes up teaches nothing:

```
hours   gross saturates while labour stays linear
        gross(h) = 980 x (1 - e^(-0.55 h))
        net(h)   = gross(h) - 110h  labour
                              - 42h  trade that just walks in later

happy   the discount reaches the regulars as well as the newcomers
        earned(d) = 46 x (1 - e^(-0.09 d)) x 9.50 x (1 - d/100)
        given(d)  = 70 x 9.50 x d/100
        net(d)    = earned - given - 40   promoting it

price   margin per cover rises while covers fall away, faster each step
        keep(p) = 1 - 0.00814p + 0.00064p² - 0.0000927p³
        net(p)  = 620 x keep x 28 x (1 + p/100) x 0.68  -  620 x 28 x 0.68
```

**The pricing scenario can project a loss**, and that is the strongest
argument this widget has for existing. It peaks at +5% (the figure the
prompt asks about, so the Optimal line sits mid-track), crosses zero between
+8% and +9%, and reaches −$250 at +10%. The impact tile has three states for
exactly this: green tint for a gain, `--down-tint` red for a loss, grey for
no change. A tile that stayed green while its number read −$250 would be the
interface contradicting its own arithmetic.

Each scenario keeps **its own slider position and its own locked state**, so
applying the Sunday hours and then asking about pricing does not silently
un-apply the first, and coming back to it still shows what was committed.
"Lock In & Apply" is what makes this a simulator rather than a calculator: one
that ends at "here is what it would be worth" has not asked you for anything.

Everything that differs between the three — range, ruler, end labels, how a
value reads back in English and what applying it commits to
— lives in the `WI_SCENARIOS` table. `renderWhatIf` knows none of it.

### Reading weight

Every widget here was first written as prose, and every one was wrong. A
dashboard is scanned, not read: a card that explains itself in three
paragraphs before the merchant reaches the control has already lost the
merchant who was going to use the control.

What survives as a sentence is the **one finding per widget** — in option 1's
case *"High-margin items are driving strong weekend volume, but Tuesday
closures are slightly dragging down your potential."* Everything else is a
figure, a label, or a row. The rule that got applied everywhere: *if it is
being recognised rather than learned, it is not a sentence.*

## Charts

Three, all belonging to the comparison, all built lazily by `afterReveal` so
their series animation plays with their option's arrival rather than somewhere
below the fold:

- **Option 1's health gauge** is a two-slice pie opened at the bottom —
  `startAngle: -150`, `endAngle: 150`, a 300° sweep with a 60° gap — with the
  legend and tooltip off, `borderRadius: '50%'` for the rounded caps, and
  `innerSize: '80%'` putting the band at about a tenth of the diameter. It
  replaced a closed hairline ring at `innerSize: '92%'`. Two reasons: a closed
  ring has no beginning, so nothing says which end of it is "none" and which
  is "all", where an opening plants a start and a finish; and a hairline made
  the arc an ornament on the grade when the arc is the only thing on the card
  carrying *how far from full* 92 is.

  Both slices are green — `--green-dk` earned, `#2D8911` available. The
  remainder is 8 points **still available**, not damage, and colouring it red
  or grey would make an A− look like a warning. It states **no `height`**: the
  chart reads `.hc-dial`, which is 224px stepping to 176px in the 760px
  container query, so one CSS number drives it. The `A-` and `92/100` are
  drawn in the `render` event from `series.center`, for the same reason
  `drawGapDonut`'s total is: a floating title centres on the plot area, the
  pie centres on whatever the layout leaves it, and those are the same point
  only by accident.
- **Option 2's pacing chart** is two series — a `Dot`-dashed grey target over
  a gradient-filled green actual — sharing one crosshair and one tooltip. The
  x-axis keeps all thirty dated categories (so the tooltip header still reads
  "Sat Jun 6") and draws a label every fifth day plus the month end: `Jun 1,
  5, 10, 15, 20, 25, 30`. The y-axis runs in thousands at `$7k` steps, capped
  at the month's `$23,100` with `endOnTick: false` so the top gridline is
  `$21k` rather than an empty `$28k`.

  Three settings on that x-axis are each a bug that was caught in review:
  `tickmarkPlacement: 'on'`, because the category default of `between` puts
  ticks in the gaps and adds one past the last category — which drew an
  eighth label reading "Jun 31"; `labels.overflow: 'allow'` with 28px of
  right spacing, because the default `justify` caps the last label to the
  room between its tick and the chart edge, and the final category sits *on*
  that edge, so "Jun 30" rendered as "Jun…"; and the probe reads label text
  from `childNodes` rather than `textContent`, because Highcharts hides the
  untruncated string in a `<title>` child and `textContent` therefore reports
  an ellipsised label as passing.
- **Option 3's what-if curve** is a gradient area anchored at zero, drawn over
  the lever that produces it. See [the trend line over the lever](#the-trend-line-over-the-lever).

### The gradient, and where it came from

Both comparison lines are `area` series carrying `AREA_GRADIENT` — the same
`rgba(167,225,163,0.55)`-to-transparent wash every stylized line in the Vera
panel already used. The comparison was the odd one out, drawing bare strokes
while the charts in the chat beside it were filled. The fill is not decoration
in either place: it gives a series **volume**, so option 2's weekend reads as
a mass rather than a kink, and the stretch where the wash sits under the
dotted target reads as ground still to make up.

Two consequences worth knowing, both of which bit during the change:

- **The target line moved on top** (`zIndex: 3`, from `1`). The old order
  existed so the green crossed *over* the grey; once the green carries a fill,
  that same order buries the reference under the wash for every day the
  business is ahead — and the target is the thing the card is measured
  against. A dotted line over a solid one still reads as annotation.
- **Shared styling moved from `plotOptions.line` to `plotOptions.series`.**
  Keyed to `line`, the house 2.5px round-capped stroke silently stopped
  applying to the actual the moment it became an area, leaving the *finding*
  at Highcharts' 2px square-capped default while the reference line beside it
  kept the good one.

Option 3's curve fills to `threshold: 0` rather than to the axis floor, and
its zones carry `fillColor` as well as `color` — so the losing stretch of the
pricing lever is a red mass hanging *below* the zero line while the winning
stretch is a green one sitting above it. `AREA_GRADIENT_DOWN` is the same wash
with its stops reversed, because a loss area hangs downward and the dense end
has to be next to the curve. On a chart with no y labels — the hero above is
the readout — that mass is the only sense of scale there is.

> **`.chart` used to be a trap.** It carried
> `flex: 1 1 auto; min-height: 248px` — a box sized for the business
> snapshot's chart column — and it is declared *after* every widget that uses
> the class, so at equal specificity it won on source order and stretched any
> new chart box that forgot to scope past it. Highcharts pins the SVG either
> way, so the symptom was dead space under option 1's chart rather than a broken
> chart, which is why it got fixed twice. With the snapshot gone, `.chart`
> keeps only the hygiene that is true of every Highcharts container —
> `overflow: visible` so tooltips and the centre label can escape the plot
> box, and a stroke reset — and each chart states its own size.

### Verifying the comparison

The comparison is geometry as much as content — a curve that has to register
with a slider, two heroes that have to match, a lever whose every stop has to
be reachable — and none of that survives being eyeballed. It is checked by
rendering the page in headless Chrome and reading the result out of the live
DOM rather than from the source.

The harness lives outside the repo (`/tmp/probe/`): a builder injects a probe
script into a copy of `insights.html`, writes `_probe.html` beside it, and a
runner dumps the DOM and extracts `<pre id="PROBE">`. **Delete `_probe.html`
afterwards** — it is a build artefact, not a file.

```bash
node /tmp/probe/mk12.js 360 && node /tmp/probe/run2.js   # options 2 + 3, cross-card
node /tmp/probe/mk13.js 360 && node /tmp/probe/run2.js   # option 1
node /tmp/probe/mk14.js 360 && node /tmp/probe/run2.js   # option 2
```

What it asserts, and why each one is there:

| assertion | the bug it would have caught |
| --- | --- |
| `plotLeft` and the right inset are both `16` | the curve disagreeing with the thumb it sits over |
| every stop appears as a plotted point | a finer sample drawing a loss you cannot select |
| the position dot's `y` equals the line's `y` at that `x` | the dot floating off its own curve |
| `#wiImpact` and `#pgHeroNum` compute to the same `font-size` | two hero figures being compared at different sizes |
| hero → curve → slider → foot, top to bottom | the result sliding back under the controls |
| both charts report `type: 'area'` with a `url(...)` fill | a gradient silently not applying |
| the target series outlasts the takings series | both lines ending together, which is the card's whole claim gone |
| Tuesday is the floor and Saturday the peak of **every** week | dailies that stopped carrying the finding they are cited for |
| the running total crosses its target more than once | a line smoothed until it is an assertion |
| the driver rows sum to the figure in the panel | a breakdown that no longer adds up to its total |
| no x-axis label contains an ellipsis | "Jun 30" silently rendering as "Jun…" |
| the key's dots equal `LINE_GREEN` / `LINE_GREY` exactly | a legend one shade off the lines it labels |
| the three marks sum to the gauge's centre text | a total typed out of step with its parts |
| the gauge's arc thickness stays ~10% of its diameter | a band that thickens as the card narrows |
| `.hc-read` and `.wi-lede` compute to the same `font-size` | the shared finding set two ways |

Two things about running it are not obvious:

- **The reveal observer will not fire.** Charts are built when their card
  scrolls into view, and headless Chrome does not re-evaluate an
  `IntersectionObserver` after a programmatic scroll — so option 3 stays
  unbuilt and every measurement comes back `NO`. The probe deletes
  `window.IntersectionObserver` before the page script runs, which makes
  `observeReveals()` take its own documented fallback path and build
  everything. That exercises real page code rather than faking it.
- **Freeze animation and give it time.** The probe injects
  `animation: none !important`, and the runner needs a virtual-time budget
  around 20s — the default 6s expires mid-reveal and reports a half-built
  page as a broken one.
- **Set the panel width before the charts build, not after.** The page
  reflows its charts from `setVeraWidth()`, which only the drag handler
  calls, so a probe that pokes `--vera-w` on `load` resizes `.hc-dial`'s box
  and leaves Highcharts rendered at its old size. That reads back as a 189px
  arc inside a 172px box — a page bug that is not in the page. The builders
  set the variable up front, where the lazily-built charts are born at the
  right size.
- **Inject with a replacer function, never a replacement string.**
  `html.replace('</body>', probe + '</body>')` looks harmless and is not:
  `String.prototype.replace` treats `$&`, `` $` ``, `$'` and `$$` in a
  literal replacement as patterns, and a probe full of `'$' + n`
  concatenations contains `$'` — which expands to *the rest of the document*
  and corrupts the injected script into a syntax error. The symptom is
  `NO PROBE OUTPUT` with nothing in the console, because a script that does
  not parse never registers its `load` handler. All three builders now pass
  a function, which is taken verbatim.
- **A probe that cannot find its subject must say so loudly.** When option 2
  was rebuilt, mk12's pacing block looked its series up by `name === 'Actual'`
  and printed `pg.series = MISSING` — one line in sixty, easy to read past,
  and every assertion under it silently skipped. Those checks moved to mk14
  rather than being left half-working.

## Chart reference

`reference/` holds the canonical Highcharts design spec — seven chart
templates, the parameter documentation, and a gallery that renders them all
live and offline. **Start any new chart there.**

```bash
python3 tools/serve.py
# → http://localhost:5184/reference/gallery.html
```

The two charts in this prototype are ports of `stylizedLine(true)` and
`bar()`. The other five — multi-line, combo (columns + line on two axes), and
two variance-bar variants — are there for whatever gets built next.
[reference/README.md](reference/README.md) covers the four localisations every
port needs, and the traps that cost time on the first two.

The templates are a reference to read and port from, not a runtime
dependency: `chart-templates.js` is 61KB of demo data and is deliberately not
loaded by `insights.html`.

## Local preview

```bash
python3 tools/serve.py
# → http://localhost:5184
```

**Use `tools/serve.py`, not `python3 -m http.server`.** The stock module sends
`Last-Modified` and no `Cache-Control`, and a response with no stated
freshness lets the browser invent one — Chrome uses 10% of the file's age at
fetch time. A `styles.css` that happened to be a month old when you first
loaded the page therefore earns a ~3-day window in which Chrome reuses it
**without revalidating**: no request, no 304, nothing in the server log.

Since `insights.html` is usually edited more recently than `styles.css`, the two
files get very different windows, and the failure mode is the nastiest one
available to a prototype — *today's markup rendered against last week's CSS*.
It presents as a broken layout, and no amount of reading the layout code will
find it. `serve.py` sends `Cache-Control: no-store` and the question never
comes up.

The `?v=` on the stylesheet link in `insights.html` is the belt to that braces:
changing the token changes the URL, which is the only way to evict a cache
entry that is already poisoned. Bump it if you ever see stale styles.

## How the layout works

One layout, no view switcher. The tablet bezel (`asset/Bezel.png`) is kept
purely for context; inside it `.screen-inner` is a fixed **1280 x 834** canvas
(the iPad's landscape screen) that JS scales uniformly to whatever size the
bezel renders at, so text, icons, and padding all shrink and grow together.

`.viewport` is the single scroll container (1280 x 810 after the status bar).
The main column is 832px; the Vera chat panel defaults to 360px — Figma's own
panel width (109:15599) — `position: sticky` under the top nav and sized to the
remaining viewport height (738px) so it is always fully visible and never
clipped.

> The 360 default lives in **three** places that have to agree: `--vera-w` in
> `styles.css`, `veraW` in the resize script, and the resizer's
> `aria-valuenow`. It is also wide enough to keep the longest suggestion bubble
> on one line — see [Suggestion bubbles](#suggestion-bubbles).

The horizontal frame comes from Figma `schematic` (109:15594): a 32px left
margin and a 32px gutter to the panel. The Figma host (109:15598) wraps the
panel in `py-8`, so the gaps above and below it are 8.

> **One deliberate departure.** Figma leaves just 8px between the panel and the
> canvas edge. That works on its 1440 frame but not here: this canvas renders
> at roughly 0.75 scale inside the bezel, so 8px lands at ~6 device px and the
> panel reads as clipped against the screen edge rather than inset. The right
> margin is 24 instead. It is the only spacing value on the page that does not
> match Figma.

> The trailing page space lives on `.main`, not on `.page` or `.layout`
> padding — a sticky element is constrained by its containing block's
> *content* box, so the main column has to be the thing that grows.

### Resizable chat panel

The panel's left edge is a drag handle (`.vera-resizer`). Its hit area straddles
the border line — the 1px line plus **12px of slop on each side** (25px total,
offset `-12px` so it centres on the line). The outer half reaches 12px into
`.layout`'s 32px gutter, comfortably short of it, so it never covers
main-column content.
Hovering it reveals a 4×40 grip that sits **on** the line, with a 1px white
ring (a `box-shadow`, so it doesn't eat the grip's 4px fill) separating the two.

`.vera` is `overflow: visible` for this reason; the greeting wash that used to
rely on it is now contained by `.vera-body`.

Drag to size the panel from **300px to 600px**. Arrow keys work too — Shift for
a bigger step, Home/End for the extremes.

`.vera` carries `min-width: 0`, and it is load-bearing. A flex item's
automatic minimum size is its min-content width, and Highcharts writes an
explicit pixel width onto its own container — so once a chart is in the panel,
that baked-in number becomes the panel's floor and `flex-basis` is quietly
overridden. The result is a **ratchet**: dragging outwards works and raises the
floor, dragging back does nothing. The handle looks dead in one direction
only, which is a confusing way for it to fail.

Width lives in `--vera-w`. `.main` is `flex: 1 1 0`, so it takes whatever the
panel leaves and the 32px gap never changes. `.main` is also a **container**,
so the left column reflows on its own width rather than the viewport's: the
comparison's two-column options stack, and the two-up grids go single column,
as the panel grows. Highcharts is told to `reflow()` on each step.

### Collapsing the panel

The AI button in the top nav toggles the panel; the X in the panel's own
header only closes it. Escape closes it too. The nav button carries the state
— `is-active` plus `aria-expanded` — so it reads as a toggle rather than a
one-way trip.

Collapsing adds `.is-collapsed`, which sets `flex-basis: 0` **and**
`min-width: 0` — flex-basis alone isn't enough, since a flex item's automatic
minimum size would hold it open at its content width. A `-32px` left margin
cancels `.layout`'s gap, which otherwise survives the collapse and leaves the
main column a gutter short of the edge — so it has to stay in step with that
gap. Reopening restores whatever width you last dragged to.

Two details that aren't obvious from the CSS:

- `.vera` is `overflow: visible` so the grip can straddle its edge, but that
  has to be clipped **for the duration of the transition in both
  directions**, or the chat spills across the main column while the panel is
  narrow. Hence `body.vera-animating`, added for `VERA_ANIM` ms.
- The entrance animation is filled `both`, and an animation outranks every
  normal declaration — so its keyframe `opacity: 1` would beat the collapsed
  `opacity: 0` forever. `.is-entered` drops the animation once it has played
  (or as soon as you interact, whichever comes first).

The panel gets the `inert` attribute while collapsed, and focus is moved back
to the nav button first, so nothing is left focused inside a hidden subtree.

### The conversation

Both wired suggestions are **data**. A *turn* is one exchange, and `TURNS` in
`insights.html` holds them all; `runTurn()` appends one to the thread:

1. **The chip is sent.** It does not fade in as a new message — it *travels*
   from where the chip was standing to its place in the thread (see below).
   The greeting and the other suggestions go away, and `.vera-body` stops being
   a centred splash and becomes the thread's scroll container.
2. **Working** — the stream of thought, one row swapped through the turn's
   steps.
3. **The answer** — the thought row is removed rather than kept, then the copy,
   at most one card, and the feedback row fade up 260ms apart. **Every** answer
   carries thumbs up/down; it is not a property a turn opts into.

   The thread's gap is a flat 16, which would sit that row equally between the
   answer it rates and whatever comes next — reading as its own item rather
   than as part of the response. `.vera-feedback` pulls 8 off the top and adds
   8 to the bottom, binding it to the answer above (8) and opening the break to
   the next turn (24), without the thread needing per-child spacing rules.
4. **Follow-ups** — the turn's chips, held back until the thread has been read
   to the end. A chip with a `to` runs the next turn; one without is a dead end
   on purpose, the same as the unwired suggestions on the opener.

Step 4 listens for `scroll` **and** polls `atBottom()` every 200ms. Scroll
events are delivered on the rendering step, which this page has already been
bitten by being throttled away in an embedded webview — measured at zero
events — and unreachable follow-ups would be a dead end. If the answer already
fits without scrolling, that counts as being at the bottom.

#### Starting over

The panel header's back arrow returns the thread to its opening state —
`resetVera()`, the same thing the **Start a new chat** chip does at the end of
the briefing flow. The difference is that it is reachable from *anywhere*: three
turns into a flow, when the room asks to see the beginning again, the
alternative is reloading the page in front of them.

There is no history behind the panel — a thread is one demo, not a stack of
screens — so "back" can only mean this. It closes nothing; dismissing the panel
is the X's job on the other side of the header, and two controls in one header
doing the same thing would make the pair unreadable.

It stays live at the opening state rather than disabling there. The header is
two controls and a title, so dimming one of them on the screen the demo opens
on is the first thing anyone sees, and it reads as something being broken
rather than as nothing being available. Pressing it there resets a thread that
is already reset.

#### One chip rail, not two

The opening suggestions and every set of follow-ups render into the **same**
element, `#veraSuggestions`, at the foot of the panel. That is what makes them
behave alike — same slot, same `pop` entrance, same 90ms stagger. Follow-ups
used to be appended inline at the end of the thread, so they surfaced wherever
the last answer happened to end rather than where the first suggestions did.

`margin-top: auto` pins the rail: with room to spare the free space collects
above it and it sits at the bottom; once the thread overflows there is no free
space and it simply follows the conversation. Because the rail is authored
markup, `resetVera()` restores the opening chips from a copy taken at startup.

#### Sending the chip

The sent bubble is Figma's **Recommendation bubble, sent state** (130:25347),
and it is not the suggestion chip re-used: sent, it pads 12/16 rather than
8/12, sets Body rather than Caption, and squares off the bottom-right corner so
the bubble points back at the sender.

It travels rather than appears — a FLIP. The chip's rect is measured *before*
anything moves, the bubble is appended in its final place, then offset back to
that rect and released. Two details matter: it is transform-only, because
laying the thread out twice would reflow it; and opacity is left alone, because
the chip is already on screen and fading it in would break the illusion that it
is the same object. The bubble therefore skips `.step` — that class's `rise`
animation would fight the FLIP over `transform`, and an animation outranks the
inline style the FLIP sets.

**The turn waits for it.** `flyFrom()` returns the travel time and `runTurn()`
holds the thought stream back by that much, so Vera starts thinking once the
message has landed rather than racing it up the thread. `FLY_MS` has to stay in
step with `.msg--sent.is-flying`'s transition in `styles.css` — it is the one
duration that lives in both files.

#### Stream of thought

Step 2 is Figma's **Stream of thought** component (44441:21916) — a 24px glyph
and Body copy in `text/secondary`, on a 24px row. It ships seven states, and a
turn names the ones it needs:

| State | Icon | Used by |
| --- | --- | --- |
| Search | `search.svg` | briefing, variance, top items |
| Think | `think.svg` | briefing, variance, cost, top items |
| Plan | `plan.svg` | briefing, cost |
| Read | `notes.svg` | variance, email |
| Web | `web.svg` | weather promotion |
| Edit | `edit.svg` | email |
| Remove | `eraser.svg` | — |

A turn's `think` is a list of `[icon, copy, ms]` steps — `ms` optional, and the
beat lasts `THOUGHT_MS` per step otherwise, so a three-step answer visibly
takes more work than a one-step one.

**A "Think for 2s" line has to last two seconds.** Written by hand the label
and the dwell drifted apart, and one claimed 4s while its row was on screen for
under one. `thinkFor(n)` now derives both from the same number, so they cannot
disagree:

```js
function thinkFor(seconds) {
  return ['think', 'Think for ' + seconds + 's…', seconds * 1000];
}
```

That is the whole reason it is worth doing: a fixed spinner says "loading", but
*Read yesterday's schedule → Search clock-in records → Think for 3s* says what
was actually consulted, which is the part a merchant is being asked to trust.

**One row, swapped in place** — not a row appended per thought. A growing
stack would push the thread around while it is still being read, and the Figma
component is a single line. The row carries the working pulse; the inner
`.vera-status-line` re-fades on each swap, so the two animations never contend
for the same element. Restarting that fade needs the class removed, a style
recompute (`void offsetWidth`), then re-added — dropping the class alone does
not retrigger a CSS animation.

The six new icons were exported from Figma as their inner frames (20×20, or
17.9 and 20.2 for Plan and Remove) and wrapped to the project's 24×24 box at
the inset Figma gives each one. They arrive with 1.5px strokes in `#5A5A5A`,
which is already this repo's icon language, so nothing was redrawn.

#### Chart cards

Every figure-led answer sits in Figma's **AI Chart Card** (44441:22281). The
set ships four variants and the panel uses one of them:

| Variant | Shape |
| --- | --- |
| Basic | chart plus essential labels only |
| Title + subtitle | card title, dataset/timestamp subtitle, chart |
| **Key Metric** | **label, hero figure, delta, chart** |
| Full | title, subtitle, metric block, chart, footer |

**Key Metric** is the right one here because every answer Vera gives leads with
a number, and the sentence above the card already does the job the title
variant's title and subtitle would — repeating it inside the card would say the
same thing twice in 328px. Figma's card is 336 wide and the panel gives this
one 328, so the spec transfers as authored rather than being rescaled: radius
16, padding 12 top and sides against 16 at the bottom, 16 between blocks, and
4 inside the metric block.

One thing worth flagging, because it looks like an error and is not: Figma
types the hero figure as **Display**, but `font-size/090` resolves to 32/40 on
this component rather than the 40/52 it carries on the page. That is our
`--heading-01`. The resolved value wins over the style name.

The plot is deliberately generic. Which chart goes in is the turn's choice,
and the `CHARTS` registry is keyed by the **reference template names** so the
mapping back to the spec is literal:

```js
var CHARTS = {
  bar:                drawTopItems,   // reference bar()
  varianceBarNumbers: drawVariance    // reference varianceBar(false)
};
```

Adding another of the seven is one entry there plus a builder — the card does
not change.

**A card without a chart is not one of the four.** All four variants contain a
plot, so an answer that has only a figure does not get a card at all — the
number carries in the copy. The cost-impact answer works that way: it used to
render a chart card with the plot dropped, which looked like a variant and was
not one. A second chart there would only have restated the variance in dollars.

#### Why it is built from templates

The thread starts empty and is cloned out of the `<template>`s below the panel.
The previous version was a single hard-coded answer that **removed its own
nodes as it ran**, so it could only play once per page load — fine for one
suggestion, useless for a demo you want to run twice in front of someone.
`resetVera()` now empties the thread, destroys any charts in it, and cancels
every pending timer, so a half-finished turn cannot land in the next thread.

#### The daily-briefing flow

The five-turn flow, entered from **Create my daily briefing**:

```
briefing ─┬─ todaySales ─┐
          └──────────────┴─ variance ─┬─ cost ─┐
                                      └────────┴─ email ─(Send)─ sent ─ reset
```

Both branches converge, so whichever chip is clicked live the demo still
reaches the email — no dead ends mid-presentation. It ends on the feedback row
plus **Start a new chat**, which resets the panel for the next demo. That is a
chip and not a timer on purpose: nothing should reset itself mid-sentence while
someone is presenting.

**The briefing is today against yesterday, deliberately.** The page behind the
panel is already a week view — $5,240 at +4.2%, the Saturday peak — so a weekly
briefing would only read it back. Today-so-far against the same point yesterday
is the one cut the dashboard cannot show, and it is what a morning briefing is
for. What it flags then carries the rest of the flow: today's sales, and
yesterday's lunch labor.

**A third row was removed.** The briefing used to flag a $112 deposit
difference, answered by a batch closing after the bank's cut-off. The
arithmetic was sound; the posture was not. "The bank recorded $1,226" asserts
something happening inside a system Clover does not own, and "it should clear
on its own; nothing for you to do" then tells the merchant to stop looking.
Money that appears to be missing is the one subject a demo cannot afford to
wave through, and in a room it invited the question the prototype could not
answer: *and if it doesn't clear?* Two rows, both answerable, beat three where
one is a liability.

**Weekdays are never named.** The status bar says *Mon Jun 10* and the Calendar
card highlights *Wed 14*, so any specific day would contradict one of them.
"Yesterday" contradicts neither, and it is what a briefing would say anyway.
Vera reading numbers that fight the card she is sitting on top of is the
fastest way to lose a demo.

**The send is simulated and cannot be otherwise** — this is a static prototype
with no backend and no recipient. The button spends `SEND_MS` in flight, then
latches to a disabled *Sent*. It is deliberately not a `mailto:`, which would
throw a real mail client over the demo.

The draft card is Figma's "Content block" (44435:20910). Its Send lives on the
card rather than in a follow-up chip, which is what saves the merchant the
extra "send it" round trip. The one element left off is the header's copy
icon: `asset/ui/` has no copy glyph, and a copy button that does not copy is a
dead affordance in a demo.

The bar chart is Highcharts too, not hand-built `div`s, and it is a port of
the `bar()` template in `reference/chart-templates.js` — the same constants,
the same mechanism, verified against it rather than re-invented.

Its layout is driven by one derived number. Each category gets an equal band,
and because the name sits **above** its own bar the band has to include the
label as well as the bar:

```
band   = BAR_H(20) + GAP(12) + LABEL_BLOCK(22)  = 54
height = 5 * band + marginTop(30) + spacing-bottom(16) = 316
```

The height is therefore fixed, not fluid. That is the whole point: pinning it
makes every band exactly 54px, which is what produces the even 12px gap
between a label and the bar above it. Changing `height` without re-deriving it
from `band` silently stretches the bands and the rhythm drifts — zeroing
`spacing[2]` alone moved them from 54px to 57.2px.

The money column is the other half. Highcharts positions an axis label by its
**left** edge, so a right-aligned column can't come from axis labels; instead
`chart.events.render` draws the values itself as SVG text with
`text-anchor: 'end'`, all pinned to the same x. Every right edge then agrees
by construction, whatever each number's width, and stays put during the intro
animation. `render` fires on every reflow, so the previous batch is destroyed
each time — otherwise they stack up invisibly on each resize.

The gutter that column lives in is measured, not guessed: the widest `$value`
is measured on a 2D canvas at the label's own font before the chart is built,
and `marginRight` is that width plus a 24px gap from the longest bar. Doing it
up front avoids a measure-then-reflow loop. This matters because Highcharts
only reliably reserves label space on a **horizontal** axis, and a bar chart
is inverted, so both x-axes are vertical — hand-reserving is the only thing
keeping the values from being laid out past the right edge and clipped.
Measured at 0px overhang from 300px to 600px, with the right edges identical.

Three deliberate departures from the reference, all commented at the code:

- `spacing` left/right are `0`, because the card already pads 16px and the
  reference's inset would otherwise be applied twice. **`spacing[2]` stays
  16** — the height formula budgets for it.
- the value labels are `600`, not the reference's `bold`; Dash 3.0 tops out
  at 600. The pre-measure uses the same 600 or the gutter would be reserved
  for the wrong width.
- the name labels carry `whiteSpace: nowrap`. On an inverted chart Highcharts
  caps a label's width at the category band (54px), which the reference never
  notices because its categories are `Item 1`…`Item 5`. Real product names
  are wider, so they wrapped to a second line and collided with their own bar.

**On reflowing the chart:** a `ResizeObserver` on `.main` is the obvious hook
and it does not work here. Observer callbacks are delivered on the same
rendering step as animation frames, which embedded webviews throttle to
nothing while the document is offscreen — measured at *zero* callbacks, the
same failure that made the reveal choreography need a timer fallback. So
reflow is called explicitly: on each drag step, and on a 40ms ticker for the
length of the collapse slide plus one final call on the settled width.

Hovering the panel lights a 1px gradient ring
(`#5B5DDE → #4BE2F3 → #2BAD00`, 50deg). It is a masked overlay rather than a
border-color, so the panel never re-lays-out when the pointer enters it.

> This ring is the build's own affordance — Figma gives the panel a plain
> `border/subtle` stroke and no ring. Its stops are also not the file's
> `ai/gradient` tokens (`#503066 → #2a71b1 → #228800`), so if the two are ever
> meant to be the same gradient, this is where they diverge.

### The greeting wash

Figma draws the wash behind the greeting as an **ellipse**, not a top-down
ramp: `109:15613` clips a 609 × 283 ellipse to a 360 × 144 frame, and the
ellipse's centre sits *above* that frame at (187.5, −51.5). So what actually
shows is its lower arc — strongest at ~52% across and falling off sideways as
well as downwards.

The old `linear-gradient(180deg, …)` could only reproduce the vertical half of
that, which is why it read as a flat green band running edge to edge. It is now
a `radial-gradient` with that geometry. The horizontal radius is a percentage
so the glow tracks the panel as it is dragged; the vertical radius stays at
Figma's 141.5px.

The peak colour is checked, not eyeballed: at the top of the frame the gradient
is 51.5/141.5 = 36% of the way out, so a `#B2F4BF` centre resolves to
`#CEF8D6` over white — which is exactly what the Figma render measures there.

### Suggestion bubbles

From Figma's `RecommendationBubble` (44439:21904): `padding: 8px 12px`, radius
24, Caption, and `whitespace-nowrap`. The stack's `align-items: flex-end` is
what right-aligns them; the bubble itself is `width: fit-content`, so it hugs
its own text, and the text inside stays left-aligned.

The 12px inset is load-bearing. At 16 the longest suggestion no longer fits the
panel on one line, and a bubble that wraps stops looking hugged — CSS sizes a
shrink-to-fit box to the *available* width once the text can no longer fit on
one line, not to the longest rendered line, so the short last line leaves a
visible gap. There is no pure-CSS fix for that; the answer is to keep the
bubbles on one line. At the 360px default there is 328px of room and the
longest bubble needs 271. Dragging the panel to its 300px minimum leaves 268
and it will wrap.

## Spacing

Everything sits on an **8px grid**, declared as `--sp-*` tokens in `:root` and
applied as `padding: var(--sp-4)`:

`4 · 8 · 12 · 16 · 24 · 32 · 40 · 56 · 64`

4px is the half-step and the smallest value allowed. Icon and control boxes
step by 4 so they can centre on the grid (a 20px glyph in a 32px button leaves
6px a side, keeping the button's own box on-grid).

Documented exceptions: hairline borders, the iPad status bar (Apple's own glyph
metrics), the 1280×834 canvas, and optical negative margins — each is commented
where it appears.

## Icons

One glyph size, one hit size, declared as tokens and used everywhere:

| Token | Size | Used by |
| --- | --- | --- |
| `--icon` | 24px | every UI glyph |
| `--hit` | 40px | every icon button / leading tile |
| `--icon-lg` | 56px | the two Supercharge tiles, plus the Vera greeting mark |

A 24px glyph centred in a 40px box leaves exactly 8px a side, so both the
glyph and its box sit on the grid.

The assets back this up: everything in `asset/ui/` is authored on a 24×24
viewBox with 1.5px strokes, and the 56px set uses 2px strokes. The review
card's two actions (`message.svg`, `link.svg`) were the last holdouts — they
first arrived as 24px glyphs padded into a 48×48 box, and now ship as native
24px files. The `.toolbtn--lg` modifier that existed to work around the
padding is gone.

Which is not a filing preference — mixing the two sets is visible. A 56px
asset in a 24px slot renders its 2px strokes at 0.86px and reads as a faded
row beside the 24px icons either side of it. So a 56px file in a `--icon` slot is a
bug, not a shortcut, and `object-fit` will hide the geometry but not the
weight.

## Typography

All product type comes from the **Dash 3.0 desktop scale**, declared once as
`font` shorthand tokens in `:root` and applied as `font: var(--caption)` —
size, line-height, and weight always travel together:

| Token | Size / line-height | Weight |
| --- | --- | --- |
| `--display` | 40 / 52 | 600 |
| `--heading-01` | 32 / 40 | 600 |
| `--heading-02` | 24 / 32 | 600 |
| `--heading-03` | 20 / 28 | 500 |
| `--heading-04` | 18 / 28 | 500 |
| `--body` | 16 / 24 | 400 |
| `--body-bold` | 16 / 24 | 500 |
| `--label` | 16 / 24 | 500 |
| `--caption` | 14 / 20 | 400 |
| `--caption-bold` | 14 / 20 | 500 |

The system has **no 700**. Graphik Bold is deliberately left unregistered in
`@font-face`, and `strong`/`b` are reset to 500 so the UA default can't
reintroduce it. The iPad status bar is the one exception — it is device
chrome, not product UI.

These ten map 1:1 onto the `web-lib-sprout` tokens the Figma file uses, so the
only thing that can drift is *which* token a given element gets. Every text
element on the page has been checked against Figma and the assignments that
were wrong are now fixed:

| Element | Was | Is | Why |
| --- | --- | --- | --- |
| card title | `--heading-03` | `--heading-02` | 0:95 is a 32px line box; 20/28 would measure 28 |
| kiosk hero title | `--heading-01` | `--display` | 0:552 is 104px over two lines — 52 each |
| review quote | `--caption` | `--body` | 0:357 is 72px over three lines |
| Supercharge card body | `--caption` | `--body` | 0:567 is 96px over four lines |
| staffing state (`Understaffed`) | `--caption` | `--body` | 0:486 is a 24px line box |
| pager (`1 of 3`) | `--caption` | `--body` | 0:387 is a 24px line box |
| green actions (`.link`, `Read more`) | `--caption-bold` | `--label` | they match the row title beside them, not the caption below |
| `Chat with Vera` | `--heading-04` | `--label` | Figma types it `web-lib-sprout/Label`, not a heading |

`--heading-03` is used by nothing ported from Figma — that frame's token set
has no Heading 3 at all. It survives in a chat-panel stat, and
it stays declared because it is part of the Dash scale. The comparison cards
briefly used it for their titles and no longer do; see "Speaking the page's
vocabulary".

Line-height is what identifies a token from Figma geometry: 20 / 24 / 28 / 32 /
40 / 52 are unique to Caption / Body / Heading 4 / Heading 2 / Heading 1 /
Display. Weight only has to be read off the render for the 16/24 and 14/20
pairs, where regular and medium share a size. Note `--label` and `--body-bold`
are the same declaration (500 16/24), so they are indistinguishable in computed
style — pick by intent.

## Cards

Card radius is `--radius: 24px`, from Figma's `border/radius/24`. It covers
`.card` (every comparison, focus, and Supercharge card), `.boost-hero`, and
the Vera panel, which Figma gives `rounded-[24px]` explicitly.

Option 3's card is the one exception to the shared elevation: it keeps
`--shadow-card` and adds `0 12px 28px rgba(16,24,40,0.10)` over it. See
"Layout decisions" for why the lift is an argument rather than a flourish.

## Animation

Driven by `.reveal` plus an `IntersectionObserver` rooted on the scroll
container:

- top nav drops in, Vera panel slides in from the right
- greeting blooms, suggestion chips pop in staggered
- cards fade up as they enter the viewport
- the comparison's gauge and pacing line play their Highcharts series
  animation once their option scrolls in

The comparison's **figures do not animate**. The snapshot's stat tiles used to
count up; that was right for a single card reporting a period, and wrong here.
Three widgets are being read against each other, and a number that is still
climbing is a number you cannot yet compare.

Honors `prefers-reduced-motion`. The page also accepts the combined-demo
wrapper handshake (`postMessage {kind:'show'}`) and autostarts when run
standalone.

## Status

Action tiles are **intentionally unlinked** for now — focus rows, reorder
links, staffing actions, review tools, and the supercharge tiles are marked
`[data-unlinked]` and have no click handlers. That is where the next round of
interaction wiring goes.

Wired so far: the chat panel's drag-resize, its collapse/expand via the nav AI
button, the panel's close button, its back arrow (start over — see [Starting
over](#starting-over)), and Escape — plus two conversations, the
five-turn **Create my daily briefing** flow and the single-turn **Show me my
top-selling items**. Both replay, and both return the panel to its opening
state. The third opening suggestion and the top-items follow-ups are still
`[data-unlinked]`.

Adding a turn is a `TURNS` entry and a chip pointing at it; adding a card means
a `<template>` and a branch in `buildAnswer()`. Neither touches the
choreography.
