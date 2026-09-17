# FlexVision Checker — product canon

Human-maintained authority for documentation. Preserve these boundaries; cite code for implementation claims.
If code and intent differ, document the gap instead of inventing implementation.

## Product thesis
We do not build a humanoid body. We put an evidence-backed inspection brain (SOP + visual agents + CAD bridge) onto a purchased mobile/manipulator platform for EMS / SMT incoming QC.

## Container contract
Repository: aleksandrlyubarev-blip/RomeoFlexVision
System role: camera capture, frame-quality checks and assisted human review.
Actor: operator capturing inspection frames and reviewing demo results.
Input: camera frames and capture/quality settings.
Output: selected images, frame-quality results, session records and assisted inspection reports.
Implemented: checker/checker/camera/ contains UVC capture and camera workers.
Implemented: checker/checker/inference/quality_validator.py scores sharpness, exposure and framing.
Implemented: checker/checker/ui/main_window.py connects capture, quality and inference workers.
Implemented: checker/checker/session/session_manager.py and pdf_export.py persist/export demo sessions.
The repository README calls this NeutronVision Checker; FlexVision Checker is its role name in this system.
Do not confuse this capture container with the five-agent Neuron Vision repository.
Fail-closed system requirement: unusable frames require retake/review; a frame-quality PASS is not a product-quality PASS.
Current demo labels include pass, fail, retake and unknown; system verdict normalization is not implemented here.
rhaef_v2/ contains separate orchestration/robot-command experiments; a command schema is not a robot driver.
Not demonstrated: validated Unitree/manipulator drivers, industrial safety controller or live factory deployment.

## System flow
Camera (External) -> FlexVision Checker capture/frame QA -> Romeo task routing -> Neuron Vision observations -> Inspection Copilot SOP/evidence policy -> human review/disposition -> PASS | REWORK | HOLD | HUMAN REVIEW; Buxter optionally proposes validated CAD/rework geometry.
Romeo owns orchestration and HITL; Neuron Vision owns five visual roles; Copilot owns the deterministic SOP gate.
Buxter defaults to FreeCAD, with optional Fusion and explicit validate/printability checks.
This flow is the target integration; the five repositories do not yet prove one connected deployment.
Target: verdict plus SHA-256 evidence pack including provenance and human disposition.

## External boundary
Purchased mobile base + manipulator + camera: External hardware, not our IP.
Flex line, Technion lab and Israel Physical AI testbed: External target environments, not asserted deployments.
Robot platform drivers and the unified hardware integration are not implemented by this documentation scaffold.

## Source snapshot
Initial audit: ef7d0e30ef1ee397c1b725dd5ccd75553a7d2fbd (2026-09-17).
Regeneration must cite the checkout being analyzed and distinguish new code from this initial audit.
Only public source code and synthetic examples may enter documentation generation.
