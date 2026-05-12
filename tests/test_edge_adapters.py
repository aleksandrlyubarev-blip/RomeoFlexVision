from rhaef_v2.tools.edge_adapters import JetsonNanoCaptureAdapter, JetsonOrinInferenceAdapter


def test_jetson_nano_capture_adapter():
    adapter = JetsonNanoCaptureAdapter()
    result = adapter.capture_frame("cam-01")
    assert result["status"] == "captured"
    assert result["camera_id"] == "cam-01"


def test_jetson_orin_inference_adapter():
    adapter = JetsonOrinInferenceAdapter()
    result = adapter.run_inference("nano://cam-01/123", "roboqc-v1")
    assert result["status"] == "inference_complete"
    assert result["decision"] == "draft_pending_human_approval"
