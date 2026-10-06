# Chart reference

The canonical Highcharts design spec, vendored here so the prototype's charts
have a single source of truth to be checked against — and so the next chart
type can be built without re-deriving the design language from scratch.

## What's here

| File | What it is |
| --- | --- |
| `chart-templates.js` | Seven chart builders on `window.ChartTemplates`. **Verbatim copy** of the upstream `templates.js` — do not edit. |
| `CHART_PARAMETERS.md` | The same configs in prose: shared design language, per-chart parameters, and full copy-paste source. |
| `gallery.html` | Renders all seven live, offline, against this repo's vendored Highcharts. Start here. |

Open the gallery from a served repo root (it uses relative paths into
`../asset/`, so `file://` won't work):

```bash
python3 -m http.server 5184
# then http://localhost:5184/reference/gallery.html
```

Verified: all seven render against the vendored Highcharts **v13.0.0**, with
Graphik resolving and no console errors.

## The seven templates

| Builder | Use it for |
| --- | --- |
| `multiLine()` | Several series compared over time. Shared tooltip, top-left legend. |
| `stylizedLineNoAxis()` | A single trend as a sparkline — gradient area fill, no axes. |
| `stylizedLineAxis()` | Same, with a `$` y-axis capped at 5 ticks. **This is what the dashboard's sales chart is based on.** |
| `bar()` | Ranked horizontal pill bars, name above each bar, right-aligned value column. **This is what Vera's top-items chart is based on.** |
| `comboArea()` | Two units on one plot — columns on the left axis, a line on the right. |
| `varianceBarIcons()` | Signed variance from a baseline, categories labelled with weather glyphs. |
| `varianceBarNumbers()` | Same, with numeric labels instead of glyphs. |

Every series type used (line, area, column, bar) is in the Highcharts core, so
nothing here needs the extra CDN modules the upstream playground loads.

## Why it's vendored rather than linked

The upstream project lives outside this repo, loads Highcharts from a CDN, and
carries playground machinery (`index.html`, `dashboard.html`, `config.js`,
`storage.js`) that has nothing to do with the prototype. Those were left
behind. What's here is the spec and a way to see it, and it works offline.

Provenance, so drift is detectable:

```
templates.js         sha256 3b5b9e0faab8e4ec7007e9fccc70acfc35bb4768273349a2205208479ae6eab9
CHART_PARAMETERS.md  sha256 ad16b6a4761c4953c7bd62f699b8e439b8b1c112e8d8a710a6465eef53b7f220
```

If upstream changes, re-copy and update those hashes. Because
`chart-templates.js` is byte-identical to its source, `diff` against it tells
you exactly what moved.

**`chart-templates.js` is not loaded by `index.html`.** It's 61KB of demo data
(`Item 1`…`Item 5`, `Coffee`/`Pastries`) and the prototype has no use for it at
runtime. It's a reference to read and port from, not a dependency.

## Porting a template into the prototype

The templates are the design authority; the prototype is where they get
localised. Nine adjustments come up every time — the first four were all
needed for the bar chart, the fifth for the variance chart, the next two for
the financial-performance flow, and the last two for the restyle after it:

1. **Swap the demo data for real data**, and keep the *shape*. The bar chart's
   layout is derived from `band = BAR_H + GAP + LABEL_BLOCK`, and its height
   from `count * band + marginTop + spacing-bottom`. Change the row count and
   the height must be recomputed from the formula, not typed in.

2. **Zero the horizontal `spacing`** if the card already pads. The prototype's
   cards pad 16px, so the reference's own 16px inset would apply twice.
   **Leave `spacing[2]` alone** — the bar template's height formula budgets for
   it, and zeroing it stretched every band from 54px to 57.2px.

3. **Cap font weight at 600.** The reference uses `bold` (700); Dash 3.0 stops
   at Semibold. If a template pre-measures text to reserve space — `bar()`
   measures the widest `$value` on a canvas — measure at the *same* weight you
   render, or the reserved column comes out the wrong width.

4. **Add `whiteSpace: 'nowrap'` to category labels.** On an inverted chart
   Highcharts caps a label's width at the category band, which the reference
   never notices because its categories are `Item 1`…`Item 5`. Real product
   names are wider and wrap into their own bar.

5. **Re-derive `tooltip.positioner` for the panel width.** Never drop it — a
   column chart's default anchor puts the card *on* the point it describes.
   But don't copy it either: `varianceBar*()` parks the card beside the
   crosshair, which assumes a dashboard-width plot. Vera's panel gives the
   chart ~302px, and the card is ~165px, so "beside" only relocates the
   collision onto the neighbouring bars. Measured, every one of the six
   categories was covered. What works here is vertical: the columns occupy
   only the band between the highest and lowest value, so the card drops into
   the empty band under them, centred on the crosshair and clamped to the
   chart box. Note that a `useHTML` label paints a few px *above* the `y` it
   is handed — a nominal 6px gap rendered flush against the bar tip, so the
   constant is 14.

6. **Drop the legend, and pin the y-axis.** Two more panel-width
   localisations, both from the demo-2 charts:

   - The reference's top-left legend costs ~50px of a 208px chart — a
     quarter of the plot to name two series the sentence above the card has
     already named. The shared tooltip carries the name instead, which is
     where the reader is looking when they need it.
   - `tickAmount` snaps to round numbers. On a $4,820–$5,240 series that
     measured as an axis of **$0–$6,000**: a 420-dollar spread drawn across a
     sixth of the plot, with the line flattened to a straight edge. Any chart
     whose story is a *small* movement needs `min`/`max`/`tickInterval`
     stated outright. Related: Highcharts aligns tick *counts* across
     multiple axes, so a 3-tick right axis silently grows a 4th — declare the
     range you actually want drawn.

7. **Thin axis labels with a formatter, never by blanking categories.**
   `categories` feeds both the axis *and* the tooltip header, so blanking the
   middle entries to unclutter a 262px axis also produced headerless tooltip
   cards on 7 of 9 points. `comboArea()` shows the right way: full names in
   `categories`, and a `labels.formatter` that returns `''` for the ones that
   should not be drawn. Check label collisions by measurement — "This week"
   and "Next week" overlapped by 10px at a ~48px band before they became
   "Now" and "Next".

8. **Set the axis label gap explicitly, and derive each offset.** No template
   states one, so every axis inherits the Highcharts default — which measured
   **18px** under the x axis and **15px** beside the y axis. Two different
   numbers means no intent was expressed, and at panel size both read as the
   label being *part of* the plot. The prototype pins both to 16 (`--sp-4`),
   matching the gap the card already puts around the chart.

   The offsets are not interchangeable, because Highcharts measures each edge
   from a different origin. Calibrated by sweeping each one in the live page
   and reading the resulting gap:

   | axis | option | relation |
   |---|---|---|
   | x bottom | `labels.y` | `gap = y - 11` (positioned by text *baseline*) |
   | y left / right | `labels.x` | `gap = |x|` (positioned by box edge) |
   | x top (`useHTML`) | `labels.y` | `gap = 12 - y` (positioned by box *top*) |

   Do not reason about these from the docs. Sweep and measure — a first pass
   that assumed "default is tight, so 12 will loosen it" moved every label
   6px *closer*.

9. **A tooltip card has a maximum height, and the plot sets it.** The
   positioner in rule 5 only works while there is an empty band to drop the
   card into. Solve for it before designing the card: with a 302x159 plot and
   pills filling four fifths of a symmetric axis, the tallest card that still
   clears every column is **46px**. The system's stacked two-row card
   measured 72, and no axis range fixes that — reaching a 72px band needs
   either a chart ~380px tall or an axis ranged to ±17%, both worse than the
   problem. So the weather chart's card is a single row: glyph, day,
   projection, swing. The glyph replaces the colour dot, which had nothing
   left to distinguish on a single-series chart.

   Related: prefer a **non-shared** tooltip on a single-series chart. A shared
   one hands the positioner a synthesised anchor with no `y`, and
   `undefined >= 0` is `false` — which silently sent every card in the wrong
   direction. The shared `varianceCardPosition` now falls back to the
   anchor's `plotY` against the zero line, but not needing the fallback is
   better.

10. **Zero `chart.spacing[0]` and let the card own the top gap.** Rule 8 fixes
    the bottom and sides; the top is different because the card is already
    contributing `--sp-4` between the metric block and the chart. Any top
    spacing inside the chart is *added* to a gap that is already correct.
    Measured at `spacing[0] = 8`, a legend sat 24 under the metric block and
    only 9 above the first y label — a visible imbalance, and the exact
    complaint that produced this rule.

    | topmost ink | `spacing[0]` | gap-below knob | value |
    |---|---|---|---|
    | legend | 0 | `legend.margin` | 20 |
    | top axis glyph row | 0 | `xAxis[1].labels.y` | -8 |
    | first y axis label | 4 | — | — |

    The third row is the exception: with no legend the y label's own box
    overhangs the SVG top, so `spacing[0] = 0` leaves 11.6 rather than 16.

    Two traps. First, the gap *below* the ink cannot be derived, because
    changing it changes `plotHeight`, which re-ticks the y axis, which moves
    the top label — the knob and the gap are coupled through the data.
    Iterate. Second, an `.update()` sweep reads about 2px tight against a
    fresh render: the legend box is not re-laid-out identically. Sweep to
    find the neighbourhood, then reload and measure to pick the value.

Then verify by measuring, not by eye. The bar chart port was checked by
rendering the reference template in the same browser and diffing geometry —
`chartHeight`, `plotTop`, `plotHeight`, band height, bar pitch and label gaps
all matched exactly. Worth repeating for the next one; it caught bug #2 above.

## Things that bite

- **Builders, not shared objects.** Each is a function returning a *fresh*
  options object because Highcharts mutates what it's handed. Never hold one
  in a variable and render it twice.
- **Inverted charts don't reserve label space.** Highcharts only reliably
  reserves room on a *horizontal* axis, and a bar chart is inverted, so both
  x-axes are vertical. Any right-hand value column has to be hand-reserved
  (`marginRight`) or it lays out past the edge and gets clipped.
- **Right-aligned columns can't be axis labels.** Highcharts positions a label
  by its *left* edge. `bar()` draws values itself in `chart.events.render` as
  SVG text with `text-anchor: 'end'`, so every right edge agrees by
  construction. `render` fires on *every* reflow — destroy the previous batch
  or they silently accumulate.
- **`styleGridDashes()`** exists because the built-in `ShortDash` has a fixed
  dash/gap ratio. It stamps `stroke-dasharray` after render, and can exempt one
  gridline (a zero baseline) so nothing is drawn twice and no antialiasing seam
  appears.
- **Reflow needs an explicit call here.** The prototype's `ResizeObserver` on
  `.main` was measured firing *zero* times, so charts are reflowed directly.
  See the main README.
