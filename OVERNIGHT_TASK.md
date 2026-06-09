# Overnight task — video → labelable frame set

A self-contained runbook for an unattended ("overnight") pass that turns a
tree of handheld inspection videos into a reviewable set of still frames plus
a provenance map, ready for human labeling or a downstream classifier.

> **Data / IP boundary.** This is a public research repo (see root `README.md`).
> Run the tooling against **your own** capture trees locally. Do **not** commit
> captured frames, source videos, customer/employer footage, or proprietary
> defect records back into this repository. Only the *tooling* is public; the
> *data* stays out.

## Why frames, not the source clips

Handheld clips of a *lit* panel surface defects that flat boxed-panel photos
miss — thin vertical lines, scan-line ripple, flicker — because they only show
up on an energized screen across several frames. Sampling those clips into
stills makes each candidate defect a discrete, labelable image while keeping a
link back to the exact video and timestamp it came from.

## What runs

The sampler lives in the existing FFmpeg pipeline package and reuses its
`probe` / `ffmpeg_runner` plumbing (so colour handling and error reporting
match the rest of the stack):

```bash
# from the scripts/ directory (or with scripts/ on PYTHONPATH)
python -m rfv_pipeline.sample_frames <captures_dir> \
    --out <frames_out> \
    --every 1.0 \           # one frame/sec; or use --fps 2 for sub-second
    --max-width 1280        # downscale wide sources; omit to keep native res
```

Outputs:

- `<frames_out>/frames/v{NN}_{NNNNNN}.png` — lossless stills (PNG by default so
  fine defect detail isn't smeared by JPEG; `--format jpg` when size matters).
- `<frames_out>/frames_map.csv` — one row per frame:
  `frame, source_video, source_folder, approx_time_s, src_width, src_height,
  src_fps, src_duration_s`.

The **`source_folder`** column is a *weak label*: if the capture tree is
organized by station / fixture / pass-fail, the folder name is a free
first-pass annotation to seed the labeling UI.

### Triage step

Sampling oversamples on purpose. `triage_frames` drops the throwaways before
review (numpy + pillow only):

```bash
python -m rfv_pipeline.triage_frames <frames_out>/frames \
    --map <frames_out>/frames_map.csv \
    --copy-kept <frames_out>/kept
```

It writes `triage.csv` with a `keep` flag + `reason` per frame:

- **blurry** — low Laplacian variance (soft/motion-blurred). Defects are
  high-frequency, so this gate keeps the frames most likely to carry one.
- **too_dark / too_bright / clipped** — no usable detail.
- **duplicate** — within `--dup-hamming` dHash bits of the last kept frame
  *of the same source video*; `dup_of` back-references the survivor.

`--copy-kept` mirrors the survivors into a directory ready for labeling.

## Overnight checklist

1. **Stage inputs.** Point `--every`/`--fps` at the desired density. Start at
   1 fps; drop to `--fps 2`+ for fast flicker that one-per-second misses.
2. **Run the sampler** over the capture tree → frames + `frames_map.csv`.
3. **Triage** the frames → `triage.csv` (+ optional `kept/`). Eyeball the
   kept/dropped counts and tune `--blur-min` / `--dup-hamming` on a sample
   before committing to the whole tree.
4. **Sanity-check** the frame count vs. total video duration in the CSV; spot
   that downscaled widths match `--max-width`.
5. **Hand off to review.** Feed `kept/` (or the `keep=1` rows of `triage.csv`)
   into the labeling step; pre-group by `source_folder` to use the weak labels.
6. **Keep data local.** Do not push frames/videos to the public repo.

## Verification (already done on this branch)

- `tests/test_sample_frames.py` — config/filter/discovery unit tests plus two
  ffmpeg integration tests (synthetic `testsrc`/`smptebars` clips → frames +
  CSV, including the weak-label folder column and `--max-width` downscale).
- `tests/test_triage_frames.py` — metric unit tests (Laplacian variance,
  exposure, dHash/Hamming) plus end-to-end tests covering each drop reason,
  map-based grouping, `--copy-kept`, and disabling dedup.
- `ruff check scripts tests` is clean.
- End-to-end CLI run verified against synthetic clips (sample → triage:
  16 sampled frames triaged down to 2 kept exemplars, one per source video).

To reproduce locally you need `ffmpeg` + `ffprobe` on `PATH` (`apt install
ffmpeg`, or `pip install static-ffmpeg && python -c "import static_ffmpeg,sys;
static_ffmpeg.add_paths()"`).

## Possible next steps (not in this pass)

- Optional per-frame assist (a VLM pass) to pre-rank "likely defect" frames —
  kept out here since it needs credentials/models not assumed available.
- A small contact-sheet/montage of kept frames per source video for fast
  visual scan before opening a full labeling UI.
- Tighten the dedup beyond dHash (e.g. require a minimum scene change) if
  slow pans still leave too many near-duplicates after triage.
