# Chart Parameters

Design + parameter reference for the three charts in this playground (multi-line,
stylized single line, and bar). They share a common visual language (typography, dotted crosshair,
hugging tooltip card, top-left legend, clean hover marker, no context menu).
Differences are called out per chart.

All values below were verified in headless Chrome against **Highcharts v13**.

> **Source of truth:** the three charts are defined once in
> [`templates.js`](templates.js) (`window.ChartTemplates`). The playground
> default ([`config.js`](config.js)) and the **Templates** section on the
> Dashboard both render from it, so editing `templates.js` updates every surface
> on reload. This document mirrors those configs in prose — keep the two aligned.

---

## Shared design language

| Concern | Setting | Notes |
| --- | --- | --- |
| Font | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | System UI stack |
| Spacing | `chart.spacing: [16, 16, 16, 16]` | Even breathing room |
| Titles | `title.text: null`, `subtitle.text: null` | No in-chart titles |
| Credits | `credits.enabled: false` | Hide "Highcharts.com" |
| Context menu | `exporting.enabled: false` | Removes the hamburger menu |
| X axis chrome | `lineWidth: 0`, `tickWidth: 0`, `minPadding: 0`, `maxPadding: 0` | No axis line/ticks |
| X labels | `color: #727272`, `fontSize: 14px` | Gray |
| Crosshair | `width: 1`, `color: #727272`, `dashStyle: 'Dot'` | Dotted vertical guide (Figma `--color-gray-060`) |
| Legend position | `align: 'left'`, `verticalAlign: 'top'`, `margin: 30` | Annotation on top |
| Legend dot | `legendSymbol: 'rectangle'` + `symbolRadius: 6` + `symbolWidth/Height: 12` | 12px circular dot (spec: 12×12, radius 8px) |
| Legend text | `color: #5a5a5a`, `fontSize: 14px`, `fontWeight: normal`, `cursor: default` | |
| Legend click | `legend.events.itemClick` → `e.preventDefault()` | Disables hide-on-click (v13-correct spot) |
| Line style | `line` / `area` (straight segments) + `linecap: 'round'`, `linejoin: 'round'` | Straight point-to-point; rounded joins soften vertices |
| Hover marker | `marker.enabled: false`, hover `symbol: 'circle'`, `radius: 6`, `lineWidth: 1`, `lineColor: #FFF` | 12px dot: series-color fill + 1px white ring |
| Hover state | `hover.lineWidth: 2.5`, `halo: { size: 8, opacity: 0.12 }` | Constant width + soft halo |
| Tooltip shell | `useHTML: true`, `shared: true`, `backgroundColor: 'rgba(255,255,255,0.96)'`, `borderWidth: 0`, `borderRadius: 10`, `padding: 10`, `shadow: { rgba(0,0,0,0.12), offY 2, width 6 }` | Native Highcharts shell renders the surface + soft shadow (no hard edge) |
| Tooltip card | `display:flex`, `flex-direction:column`, `align-items:flex-start`, `gap:4px` | Flex layout only; the shell owns background/shadow |
| Tooltip rows | `display:flex`, `justify-content:space-between`, `align-self:stretch` | Label (dot + name) left, value right |
| Tooltip sizing | Card `min-width:144px; max-width:288px; overflow:hidden` | Min 144px, caps at 288px, truncates anything wider (same on both line charts) |
| Line chart spacing | `chart.spacing: [16, 0, 16, 0]` | No left/right spacing → full-width chart in tight space (both line charts) |
| Dot spec | `12×12`, `border-radius: 8px`, `border: 1px solid #FFF`, fill = series color | Applied to legend, tooltip, and hover-marker dots |
| Series palette | 1 `#228800` · 2 `#1495DB` · 3 `#A175DB` · 4 `#CF6B9F` · 5 `#D76A57` | Shared series colors (multi-line uses 1–4, bar uses 1–5) |

### Verified fixes (why these specific settings)

- **Legend hide-on-click** must be cancelled via `legend.events.itemClick`, not
  `plotOptions.series.events.legendItemClick` — the latter has no default action
  to cancel in v13.
- **Tooltip full-width** is avoided by `useHTML: true` + `width:max-content`,
  capped at `max-width:288px` with `overflow:hidden` so wider content truncates.
  Do **not** add `tooltip.outside: true` — it caused cut-left / overflow-right
  and fullscreen blow-up.
- **Disappearing legend dots** happen when the line default
  `legendSymbol: 'lineMarker'` combines with `marker.enabled: false` (nothing to
  draw). Fix: `legendSymbol: 'rectangle'` + explicit per-series `color`.
- **Straight lines, not spline**: we use `line`/`area` (not `spline`/`areaspline`)
  because the curved Bézier smoothing implied a bell/normal-distribution shape the
  data doesn't have. Straight segments read the data more honestly.

---

## 1. Multi-line chart (Coffee / Pastries / Cold Brew / Tea)

The default chart in the playground (`config.js` → `window.defaultChartOptions`).

- **Type:** `line` (multi-series, straight segments)
- **Background:** `transparent`
- **Y axis:** hidden labels, no gridlines (`title:null`, `labels.enabled:false`,
  `gridLineWidth:0`, `maxPadding:0.08`, `minPadding:0.05`) — tight padding so the
  series fill more of the vertical space
- **Tooltip:** `shared: true` → table with one row per series (dot + name + value)
- **Legend states:** `inactive.opacity: 0.35`

### Series

Each series follows a distinct trajectory (declining / rising / valley / hump)
so the lines cross a few times but mostly stay readable and spread out.

| Name | Color | Data (Sun→Sat) | Trend |
| --- | --- | --- | --- |
| Coffee | `#228800` | 9, 8.5, 7, 6, 4.5, 3, 1.5 | declining |
| Pastries | `#1495DB` | 1.5, 2.5, 4, 5, 6.5, 8, 9.5 | rising |
| Cold Brew | `#A175DB` | 7, 5, 3, 2, 3.5, 5.5, 7.5 | valley |
| Tea | `#CF6B9F` | 3, 5, 7.5, 9, 7, 4.5, 2.5 | hump |

### Tooltip (shared, flex-card layout)

```js
formatter: function () {
  const title = this.points[0].key;
  let rows = '';
  this.points.forEach(function (p) {
    // Each row flexes to both ends: label (dot + name) left, value right.
    rows +=
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
        '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
          '<span style="display:inline-block;width:12px;height:12px;border-radius:8px;border:1px solid #FFF;box-sizing:border-box;background:' + p.color + ';margin-right:6px;vertical-align:middle;"></span>' +
          '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
        '</span>' +
        '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">' + p.y + '</span>' +
      '</div>';
  });
  // Flex layout only; the native tooltip shell owns the surface + shadow.
  return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
    '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' + title + '</div>' +
    rows +
  '</div>';
}
```

---

## 2. Stylized single line chart (Net Sales)

A single line with a stylized linear-gradient fill (built on the Highcharts `area`
type), matching the shared design. Fill, hover line, and tooltip card sizing come
from Figma.

- **Type:** `area` (single line + gradient fill; straight segments, same line style as the multi-line chart)
- **Background:** `#FFFFFF`
- **Y axis:** `visible: false`, `max: 1000` (controls curve height)
- **Line:** `lineColor: '#2D8911'`, `lineWidth: 2.5`
- **On-graph text:** removed via `plotOptions.area.label.enabled: false`
- **Legend:** single "Net Sales" item shown as a top annotation (shared style)
- **Hover line (crosshair):** `width: 1`, `color: '#727272'` — Figma `--color-gray-060`
- **Tooltip card:** `min-width: 144px` (Figma card), `max-width: 288px` with `overflow:hidden` — truncates anything wider
- **Tooltip:** single point → title + row (dot + "Net Sales" + `$value`)

### Series

| Name | Color | Data (Sun→Sat) |
| --- | --- | --- |
| Net Sales | `#2D8911` | 650, 480, 220, 290, 823, 980, 550 |

### Linear-gradient fill (Figma `--Area-Graph-Fill`)

Figma: `linear-gradient(0deg, rgba(242, 252, 238, 0.00) -0.4%, #A7E1A3 100%)`.
`0deg` runs bottom→top, so the solid green (`#A7E1A3`) sits at the top near the
line and fades to transparent (`rgba(242, 252, 238, 0)`) toward the axis. In
Highcharts (`y1: 0` top → `y2: 1` bottom) that maps to:

```js
fillColor: {
  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
  stops: [
    [0, '#A7E1A3'],                 // solid green near the line (Figma 100%)
    [1, 'rgba(242, 252, 238, 0.0)'] // transparent fade toward the axis (Figma -0.4%)
  ]
}
```

### Tooltip (single series)

```js
formatter: function () {
  const p = this.points[0];
  // Flex layout only; the native tooltip shell owns the surface + shadow.
  return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
    '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' +
      p.key +
    '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
      '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
        '<span style="display:inline-block;width:12px;height:12px;border-radius:8px;border:1px solid #FFF;box-sizing:border-box;background:' + p.color + ';margin-right:6px;vertical-align:middle;"></span>' +
        '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
      '</span>' +
      '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">$' + p.y + '</span>' +
    '</div>' +
  '</div>';
}
```

---

## 3. Bar chart (Items 1–5, pill bars)

Horizontal bar chart with a lightweight, label-forward layout.

- **Type:** `bar` (horizontal), `colorByPoint: true`
- **Background:** `transparent`
- **Bars:** `pointWidth: 20` (fixed 20px height), `borderRadius: '50%'` → pill shape
- **Order:** `xAxis.reversed: true` → "Item 1" at the top
- **Category labels:** drawn **above** each bar via `xAxis.labels` `align:'left'`,
  `x:0`, `y:-16` (~4px gap above the 20px bar), color `#727272` / 14px
- **Value labels:** `$` + 2 decimals, bold `#333333` / 16px, drawn ourselves as
  **right-anchored SVG text** (`renderer.text(...).attr({'text-anchor':'end'})`)
  in a `chart.events.render` handler. Every label shares the same right edge
  (`rightX = chartWidth - spacing[1]`), so the column is perfectly aligned and
  **can never be clipped** — regardless of each label's own width or the intro
  animation. `marginRight` is pre-measured (canvas) from the widest label + right
  spacing + **24px**, keeping a 24px gap between the longest bar and the column.
- **Y axis:** `visible: false`, `max: <largest value>` (`endOnTick:false`,
  `maxPadding:0`) so the longest bar fills the plot and the 24px gap is exact
- **Animation:** default bar intro animation (`animation: true` — bars grow in)
- **Legend:** disabled
- **Tooltip:** disabled (paired with `enableMouseTracking: false`)

### Series

| Item | Color | Value |
| --- | --- | --- |
| Item 1 | `#228800` | $20.30 |
| Item 2 | `#1495DB` | $18.40 |
| Item 3 | `#A175DB` | $16.20 |
| Item 4 | `#CF6B9F` | $11.70 |
| Item 5 | `#D76A57` | $9.50 |

### Right-aligned value column with a 24px gap (the key trick)

Highcharts' own `dataLabels` are **disabled**. Instead, the value labels are
drawn as **right-anchored SVG text** in `chart.events.render`. Every label is
positioned at the same `rightX` with `text-anchor:'end'`, so their right edges
line up exactly and **can never be clipped** — unlike `useHTML` data labels,
which Highcharts offsets and which drifted/clipped on the right edge. The labels
are re-drawn on every `render` (destroying the previous batch), so they stay
aligned through the intro animation and any container resize. `marginRight`
(pre-measured widest label + right spacing + 24px) reserves the column and keeps
a 24px gap from the longest bar (which fills the plot via `yAxis.max`).

```js
// Reserve the value column: widest label (canvas-measured) + spacing + 24px gap.
const MARGIN_R = Math.ceil(widestLabel) + SPACING_R + VALUE_GAP;

chart: {
  marginRight: MARGIN_R,
  events: {
    render: function () {
      const chart = this;
      const s = chart.series[0];
      if (!s || !s.points) return;
      (chart.__valueLabels || []).forEach(function (el) { el.destroy(); });
      chart.__valueLabels = [];
      const n = s.points.length;
      const rightX = chart.chartWidth - chart.spacing[1];  // shared right edge
      const bandH = chart.plotHeight / n;
      s.points.forEach(function (p, i) {
        const cy = chart.plotTop + (i + 0.5) * bandH + 5.5; // baseline ≈ center
        chart.__valueLabels.push(
          chart.renderer.text('$' + p.y.toFixed(2), rightX, cy)
            .attr({ 'text-anchor': 'end', zIndex: 6 })
            .css({ color: '#333333', fontSize: '16px', fontWeight: 'bold', fontFamily: FONT })
            .add()
        );
      });
    }
  }
}

// plotOptions.bar.dataLabels: { enabled: false }  ← replaced by the SVG labels above
```

---

## Difference summary

| Aspect | Multi-line | Stylized single line | Bar |
| --- | --- | --- | --- |
| Series type | `line` | `area` | `bar` |
| Series count | 4 | 1 | 1 (colorByPoint, 5 points) |
| Background | `transparent` | `#FFFFFF` | `transparent` |
| Fill | none | linear gradient | solid per-point |
| Y axis | hidden labels, capped padding | fully hidden, `max: 1000` | hidden, `max: <largest value>` |
| Tooltip | flex card (multi-row) | flex card (single row + `$`) | disabled |
| Legend | 4 dots | 1 dot ("Net Sales") | disabled |
| Data labels | none | none | `$` value, right-aligned column |

---

## Source code

### 1. Multi-line chart (full source)

```js
Highcharts.chart('container', {
    chart: {
        type: 'line',
        backgroundColor: 'transparent',
        style: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        },
        spacing: [16, 0, 16, 0]
    },

    title: { text: null },
    subtitle: { text: null },
    credits: { enabled: false },

    // Remove the hamburger / context menu
    exporting: { enabled: false },

    xAxis: {
        categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        lineWidth: 0,
        tickWidth: 0,
        minPadding: 0,
        maxPadding: 0,
        labels: { style: { color: '#727272', fontSize: '14px' } },
        crosshair: { width: 1, color: '#727272', dashStyle: 'Dot' }
    },

    yAxis: {
        title: { text: null },
        labels: { enabled: false },
        gridLineWidth: 0,
        minorGridLineWidth: 0,
        maxPadding: 0.08,
        minPadding: 0.05
    },

    legend: {
        align: 'left',
        verticalAlign: 'top',
        symbolWidth: 12,
        symbolHeight: 12,
        symbolRadius: 6,       // 12px box + radius 6 → circular dot
        squareSymbol: true,
        itemDistance: 12,
        margin: 30,
        itemStyle: { fontWeight: 'normal', color: '#5a5a5a', fontSize: '14px', cursor: 'default' },
        itemHoverStyle: { color: '#5a5a5a' },
        // Verified fix: cancel hide-on-click at the source (v13)
        events: {
            itemClick: function (e) {
                e.preventDefault();
            }
        }
    },

    tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: 'rgba(255, 255, 255, 0.96)', // native shell renders the shadow cleanly
        borderWidth: 0,
        borderRadius: 10,
        padding: 10,
        shadow: { color: 'rgba(0, 0, 0, 0.12)', offsetX: 0, offsetY: 2, width: 6 },
        style: { color: '#5a5a5a' },
        formatter: function () {
            const title = this.points[0].key;
            let rows = '';
            this.points.forEach(function (p) {
                // Each row flexes to both ends: label (dot + name) left, value right.
                rows +=
                    '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                        '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
                            '<span style="display:inline-block;width:12px;height:12px;border-radius:8px;border:1px solid #FFF;box-sizing:border-box;background:' + p.color + ';margin-right:6px;vertical-align:middle;"></span>' +
                            '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
                        '</span>' +
                        '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">' + p.y + '</span>' +
                    '</div>';
            });
            // Flex layout only; the shell owns the surface + shadow.
            // min 144px, caps at 288px, overflow:hidden truncates wider.
            return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
                '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' + title + '</div>' +
                rows +
            '</div>';
        }
    },

    plotOptions: {
        series: {
            label: { enabled: false },
            legendSymbol: 'rectangle',   // with symbolRadius:6 → circular dot
            lineWidth: 2.5,
            states: {
                hover: { lineWidth: 2.5, halo: { size: 8, opacity: 0.12 } },
                inactive: { opacity: 0.35 }
            },
            marker: {
                enabled: false,
                symbol: 'circle',
                states: { hover: { enabled: true, radius: 6, lineWidth: 1, lineColor: '#FFF' } }
            },
            linecap: 'round',
            linejoin: 'round'
        }
    },

    series: [
        { name: 'Coffee', color: '#228800', data: [9, 8.5, 7, 6, 4.5, 3, 1.5] },
        { name: 'Pastries', color: '#1495DB', data: [1.5, 2.5, 4, 5, 6.5, 8, 9.5] },
        { name: 'Cold Brew', color: '#A175DB', data: [7, 5, 3, 2, 3.5, 5.5, 7.5] },
        { name: 'Tea', color: '#CF6B9F', data: [3, 5, 7.5, 9, 7, 4.5, 2.5] }
    ]
});
```

### 2. Stylized single line chart (full source)

```js
Highcharts.chart('container', {
    chart: {
        type: 'area',                  // single line + gradient fill, straight segments
        backgroundColor: '#FFFFFF',
        spacing: [16, 0, 16, 0],
        style: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }
    },

    title: { text: null },
    subtitle: { text: null },
    credits: { enabled: false },
    exporting: { enabled: false },

    xAxis: {
        categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        lineWidth: 0,
        tickWidth: 0,
        minPadding: 0,
        maxPadding: 0,
        labels: { style: { color: '#727272', fontSize: '14px' } },
        // Figma hover line: --color-gray-060 (#727272), 1px
        crosshair: { width: 1, color: '#727272', dashStyle: 'Dot' }
    },

    yAxis: {
        visible: false,
        max: 1000
    },

    // Annotation on top — same legend style as the line chart
    legend: {
        enabled: true,
        align: 'left',
        verticalAlign: 'top',
        symbolWidth: 12,
        symbolHeight: 12,
        symbolRadius: 6,             // 12px box + radius 6 → circular dot
        squareSymbol: true,
        itemDistance: 12,
        margin: 30,
        itemStyle: { fontWeight: 'normal', color: '#5a5a5a', fontSize: '14px', cursor: 'default' },
        itemHoverStyle: { color: '#5a5a5a' },
        events: {
            itemClick: function (e) { e.preventDefault(); }   // no hide-on-click
        }
    },

    tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: 'rgba(255, 255, 255, 0.96)', // native shell renders the shadow cleanly
        borderWidth: 0,
        borderRadius: 10,
        padding: 10,
        shadow: { color: 'rgba(0, 0, 0, 0.12)', offsetX: 0, offsetY: 2, width: 6 },
        style: { color: '#5a5a5a' },
        formatter: function () {
            const p = this.points[0];
            // Flex layout only; the shell owns the surface + shadow.
            return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
                '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' +
                    p.key +
                '</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                    '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
                        '<span style="display:inline-block;width:12px;height:12px;border-radius:8px;border:1px solid #FFF;box-sizing:border-box;background:' + p.color + ';margin-right:6px;vertical-align:middle;"></span>' +
                        '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
                    '</span>' +
                    '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">$' + p.y + '</span>' +
                '</div>' +
            '</div>';
        }
    },

    plotOptions: {
        area: {
            lineColor: '#2D8911',
            lineWidth: 2.5,
            legendSymbol: 'rectangle',   // circular dot in the legend
            label: { enabled: false },   // remove the text drawn on the graph
            // Figma --Area-Graph-Fill: linear-gradient(0deg, rgba(242,252,238,0) -0.4%, #A7E1A3 100%)
            fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#A7E1A3'],                 // solid green near the line (Figma 100%)
                    [1, 'rgba(242, 252, 238, 0.0)'] // transparent fade toward the axis (Figma -0.4%)
                ]
            },
            linecap: 'round',
            linejoin: 'round',
            marker: {
                enabled: false,
                symbol: 'circle',
                states: {
                    hover: {
                        enabled: true,
                        radius: 6,
                        lineWidth: 1,
                        lineColor: '#FFF'
                    }
                }
            },
            states: {
                hover: {
                    lineWidth: 2.5,
                    halo: { size: 8, opacity: 0.12 }
                }
            }
        }
    },

    series: [{
        name: 'Net Sales',
        color: '#2D8911',
        data: [650, 480, 220, 290, 823, 980, 550]
    }]
});
```

### 3. Bar chart (full source)

Notes on the bar behaviour (all verified in headless Chrome, v13):

- **Both ends rounded** via `borderRadius: { radius: '50%', where: 'all' }`
  (plain `'50%'` only rounds the bar's end).
- **No hover state** via `enableMouseTracking: false` + `tooltip.enabled: false`
  (bars never brighten, dim, or show a halo).
- **Default intro animation** via `animation: true` — bars grow in on load. The
  value labels are re-drawn as right-anchored SVG text on every `render`, so
  their right edges stay aligned throughout the animation (no per-frame drift).
- **Exact 12px gap between a label and the bar above it**: a horizontal bar has
  no direct "gap" option — each category gets an equal-height band with the bar
  centred in it, and the category label sits above its own bar. The label must
  clear the *previous* bar, so the band height has to include the label:
  `band = BAR_H + GAP + LABEL_BLOCK`, then
  `chart.height = catCount * band + marginTop + bottom`. With `BAR_H = 20`,
  `GAP = 12`, `LABEL_BLOCK = 22` (14px label text + a few px so it sits just above
  its own bar) → band = 54px. **Verified in headless Chrome:** label→previous-bar
  gap = 12px on every row, label→own-bar = 3px. (Using `BAR_H + GAP` alone — no
  label allowance — is what made the label overlap the bar above.) Requires a
  fixed height (Highcharts otherwise stretches bands to fill the container).

```js
(function () {
    const CATS = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
    const VALUES = [20.30, 18.40, 16.20, 11.70, 9.50];
    const maxVal = Math.max.apply(null, VALUES);
    const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const BAR_H = 20;        // bar thickness
    const GAP = 12;          // gap between a label and the bar ABOVE it
    const LABEL_BLOCK = 22;  // 14px label text + a few px so it sits above its own bar
    const TOP = 30;          // marginTop (room for the first label)
    const BOTTOM = 16;       // spacing below the plot
    const VALUE_GAP = 24;    // min px between the longest bar and the value text
    const SPACING_R = 16;    // right spacing (matches chart.spacing[1])
    const band = BAR_H + GAP + LABEL_BLOCK;   // 54px → verified 12px label↔prev-bar

    // Pre-measure the widest "$value" label (canvas) → reserve exactly enough
    // room for the value column + a 24px gap from the longest bar (no reflow loop).
    function measureTextWidth(text, cssFont) {
        const c = measureTextWidth._c || (measureTextWidth._c = document.createElement('canvas'));
        const ctx = c.getContext('2d');
        ctx.font = cssFont;
        return ctx.measureText(text).width;
    }
    const widestLabel = Math.max.apply(null, VALUES.map(function (v) {
        return measureTextWidth('$' + v.toFixed(2), 'bold 16px ' + FONT);
    }));
    const widestLabel = Math.max.apply(null, VALUES.map(function (v) {
        return measureTextWidth('$' + v.toFixed(2), 'bold 16px ' + FONT);
    }));
    const MARGIN_R = Math.ceil(widestLabel) + SPACING_R + VALUE_GAP;   // + 24px gap from the bars

    Highcharts.chart('container', {
        chart: {
            type: 'bar',
            backgroundColor: 'transparent',
            spacing: [16, 16, 16, 16],
            marginTop: TOP,
            marginRight: MARGIN_R,   // value column: widest label + 24px gap from bars
            // Fixed height so each category row = `band` → exact 12px label gaps.
            height: CATS.length * band + TOP + BOTTOM,
            style: {
                fontFamily: FONT
            },
            events: {
                // Draw value labels ourselves as right-anchored SVG text.
                // text-anchor:'end' pins every right edge to the same x → the
                // column is perfectly aligned and can never be clipped (stable
                // during the intro animation). Re-drawn on every render.
                render: function () {
                    const chart = this;
                    const s = chart.series[0];
                    if (!s || !s.points) return;
                    (chart.__valueLabels || []).forEach(function (el) { el.destroy(); });
                    chart.__valueLabels = [];
                    const n = s.points.length;
                    const rightX = chart.chartWidth - chart.spacing[1];   // shared right edge
                    const bandH = chart.plotHeight / n;
                    s.points.forEach(function (p, i) {
                        const cy = chart.plotTop + (i + 0.5) * bandH + 5.5;   // baseline ≈ center
                        chart.__valueLabels.push(
                            chart.renderer
                                .text('$' + p.y.toFixed(2), rightX, cy)
                                .attr({ 'text-anchor': 'end', zIndex: 6 })
                                .css({ color: '#333333', fontSize: '16px', fontWeight: 'bold', fontFamily: FONT })
                                .add()
                        );
                    });
                }
            }
        },

        title: { text: null },
        subtitle: { text: null },
        credits: { enabled: false },
        exporting: { enabled: false },

        xAxis: {
            categories: CATS,
            reversed: true,    // 'Item 1' at the top
            lineWidth: 0,
            tickWidth: 0,
            labels: {
                align: 'left',
                x: 0,
                y: -16,        // sit the label above the 20px bar
                style: { color: '#727272', fontSize: '14px' }
            }
        },

        yAxis: {
            visible: false,
            max: maxVal,           // longest bar fills the plot
            endOnTick: false,
            startOnTick: false,
            maxPadding: 0
        },

        legend: { enabled: false },
        tooltip: { enabled: false },   // no tooltip (paired with no mouse tracking)

        plotOptions: {
            bar: {
                pointWidth: BAR_H,                              // fixed 20px bar height
                borderRadius: { radius: '50%', where: 'all' },  // BOTH ends rounded
                borderWidth: 0,
                colorByPoint: true,
                animation: true,           // default intro animation (bars grow in)
                enableMouseTracking: false, // no hover state at all
                states: {
                    hover: { enabled: false },
                    inactive: { enabled: false }
                },
                // Value labels are drawn in chart.events.render (right-anchored
                // SVG text) so they align exactly and never clip.
                dataLabels: { enabled: false }
            }
        },

        colors: [
            '#228800', // Item 1: Green
            '#1495DB', // Item 2: Blue
            '#A175DB', // Item 3: Purple
            '#CF6B9F', // Item 4: Pink
            '#D76A57'  // Item 5: Red
        ],

        series: [{
            name: 'Values',
            data: VALUES
        }]
    });
})();
```