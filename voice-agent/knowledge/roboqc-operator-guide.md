# RoboQC operator guide — talking to Romeo

Upload target: collection `roboqc-operator-guide` (see `README.md`).
Keep in sync with `../playbook.md`. Written for the ear.

## What Romeo can tell you

Romeo answers from live line data. You can ask for the pass rate, fail rate,
defect counts, and throughput per hour for any line or for all lines
together. You can ask what alerts are active, and ask for a breakdown of
which defect types are most common right now. Name the line — "line one",
"line two" — or say "overall" for everything.

## What the numbers mean

- **Pass rate** is the share of inspected boards with no confirmed defect in
  the chosen time window. It is not first-pass yield: reworked boards that
  pass re-inspection count as passed.
- **Throughput per hour** is boards inspected per hour, not boards produced.
  If the line pauses, throughput falls even though nothing is failing.
- **Alert age** is how long ago the alert condition started, in minutes. An
  old critical alert that nobody cleared matters more than a new warning.

## Controlling the line

You can tell Romeo to start, pause, resume, or stop inspection on a line.
Romeo always repeats the action back — "Stopping inspection on line two,
confirm?" — and acts only after you clearly confirm. Say "confirm", "yes, do
it", or "go". If you stay silent or change the subject, nothing happens.
Stopping inspection does not stop the conveyor; it stops the camera checks.
A line stop for safety goes to your shift supervisor, not to Romeo.

## When to escalate, and to whom

- The model keeps flagging good boards, or misses obvious defects →
  **Romeo PhD** (calibration and retraining).
- You need to know why a defect trend started → **Andrew Analytic** review.
- Safety issue or a decision to stop the line → **shift supervisor**, immediately.
- Collecting training clips or setting up a pilot → **Bassito**.

Ask Romeo to route you: "get me calibration" or "I need root cause on this".

## Tips for noisy floors

Speak in short sentences and lead with the line number. Numbers are echoed
back in words — "ninety-two point one percent" — so you can confirm you were
heard. If Romeo mishears the line, just say the correction: "no, line nine".
You can interrupt Romeo at any time; it stops and listens.
