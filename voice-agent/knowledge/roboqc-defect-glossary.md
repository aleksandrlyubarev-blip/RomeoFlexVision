# RoboQC defect glossary

Upload target: collection `roboqc-defect-glossary` (see `README.md`).
General AOI / IPC-A-610-level knowledge only — no customer defect records.
Written for the ear: retrieved chunks are spoken aloud by the voice agent.

## Solder bridge

A solder bridge is an unwanted connection of solder between two pads or pins
that should be electrically separate. It usually shorts the circuit. Typical
causes are excess solder paste, stencil misalignment, or fine-pitch components
placed slightly off pad. Severity: critical — a bridged board fails
electrical test and can be damaged at power-on. A cluster of bridges on the
same component within minutes almost always means a paste or stencil problem,
not a random defect; escalate to calibration review.

## Missing component

A missing component means a part that should be on the board is absent at its
location. Typical causes are an empty or jammed feeder, a nozzle pick-up
failure, or a part lost in transit before reflow. Severity: critical for
active parts, warning for redundant passives pending engineering review.
Repeated misses at one location point to the feeder for that part — check it
before suspecting the vision system.

## Misaligned component

A misaligned component is placed rotated or shifted from its pads beyond the
allowed tolerance. Small offsets often self-correct during reflow; large ones
cause open joints or tombstoning. Typical causes are placement-head
calibration drift, board warpage, or wrong package data. Severity: warning
below the tolerance limit, critical when a lead leaves its pad entirely.

## Insufficient solder

Insufficient solder means a joint has too little solder to form a reliable
connection — the fillet looks starved or the pad shows through. Typical
causes are a clogged stencil aperture, low paste volume, or paste past its
floor life. Severity: warning; it often passes initial electrical test and
fails later in the field, which is why it is tracked even at low counts.

## Tombstoning

Tombstoning is when a small two-terminal part, like a chip resistor or
capacitor, lifts on one end and stands up like a tombstone during reflow. It
is caused by uneven heating or unequal solder volume on the two pads.
Severity: critical — the joint is open. Tombstoning that starts suddenly on a
line that was stable usually follows a reflow-profile or paste change.

## Cold joint

A cold solder joint did not reach full reflow temperature, leaving a dull,
grainy, weak connection. Typical causes are a reflow-oven zone running low or
a board passing through too fast. Severity: warning to critical depending on
the net. A wave of cold joints across the whole board width points to the
oven, not the components.

## False call

A false call is an inspection flag on a board that is actually good. Some
false-call rate is normal for optical inspection. A rising false-call trend
on one defect class means the model or lighting needs recalibration — route
to Romeo PhD rather than tightening operator review.
