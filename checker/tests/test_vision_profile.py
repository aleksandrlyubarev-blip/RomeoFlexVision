"""Product profile and ROI inspection tests."""

from __future__ import annotations

import json

import cv2
import numpy as np
import pytest

from checker.vision.product_profile import ProductProfile, RoiSpec
from checker.vision.roi import inspect_rois, roi_to_pixels


def test_product_profile_loads_relative_reference(tmp_path) -> None:
    reference = tmp_path / "reference.jpg"
    cv2.imwrite(str(reference), np.full((100, 120, 3), 140, dtype=np.uint8))
    profile_path = tmp_path / "profile.json"
    profile_path.write_text(
        json.dumps(
            {
                "product_code": "DEMO-001",
                "name": "Demo assembly",
                "reference_image_path": "reference.jpg",
                "rois": [
                    {
                        "roi_id": "screw-a",
                        "label": "Top-left screw",
                        "kind": "screw",
                        "x": 0.1,
                        "y": 0.2,
                        "width": 0.25,
                        "height": 0.3,
                    }
                ],
            }
        )
    )

    profile = ProductProfile.load(profile_path)

    assert profile.reference_image_path == reference
    assert profile.roi_ids() == {"screw-a"}


def test_roi_rejects_out_of_bounds_rectangle() -> None:
    with pytest.raises(ValueError, match="ROI rectangle"):
        RoiSpec(roi_id="bad", label="Bad", x=0.8, y=0.1, width=0.3, height=0.2)


def test_inspect_rois_reports_metrics() -> None:
    frame = np.full((100, 200, 3), 80, dtype=np.uint8)
    cv2.rectangle(frame, (20, 20), (80, 80), (220, 220, 220), -1)
    roi = RoiSpec(roi_id="component-a", label="Component A", x=0.1, y=0.2, width=0.3, height=0.6)

    result = inspect_rois(frame, [roi])[0]

    assert roi_to_pixels(roi, 200, 100) == (20, 20, 60, 60)
    assert result.roi_id == "component-a"
    assert result.mean_luminance > 0.75
    assert result.sharpness >= 0.0
