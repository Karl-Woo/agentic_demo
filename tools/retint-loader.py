"""Retint asset/loading.json to the demo's theme green.

The clip ships from the agent-assistant demo in a spring-green-to-teal that
belongs to that demo's palette, not this one. Every gradient in it is a
static two-stop, so the swap is a straight substitution of the stop colours;
nothing about the geometry, timing or opacity is touched.

Kept as a script rather than done by hand because the JSON is minified and a
hand-edited colour is unreviewable. Run it again and it is idempotent.
"""
import json, collections, sys

SRC = 'asset/loading.json'
# Verbatim from the offer card and the metric figures:
#   linear-gradient(-50deg, #165A00 14%, #208000 85%)
LIGHT = (0x20, 0x80, 0x00)   # #208000
DARK  = (0x16, 0x5A, 0x00)   # #165A00
norm = lambda c: [round(v / 255, 6) for v in c]

doc = json.load(open(SRC))
seen = collections.Counter()
count = 0


def retint(item):
    global count
    if item.get('ty') in ('gf', 'gs'):
        grad = item.get('g', {})
        holder = grad.get('k', {})
        stops = holder.get('k')
        # [pos, r, g, b, pos, r, g, b] -- two stops, no keyframes
        if isinstance(stops, list) and len(stops) == 8 and grad.get('p') == 2:
            hexof = lambda t: '#%02X%02X%02X' % tuple(round(v * 255) for v in t)
            seen['%s -> %s' % (hexof(stops[1:4]), hexof(stops[5:8]))] += 1
            holder['k'] = [stops[0]] + norm(LIGHT) + [stops[4]] + norm(DARK)
            count += 1
    for child in item.get('it', []) or []:
        retint(child)


for layer in doc['layers']:
    for shape in layer.get('shapes', []):
        retint(shape)

print('gradients retinted:', count)
for k, v in seen.items():
    print('  was %s  (x%d)' % (k, v))

json.dump(doc, open(SRC, 'w'), separators=(',', ':'))
