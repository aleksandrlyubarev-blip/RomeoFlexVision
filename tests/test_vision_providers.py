from rhaef_v2.tools.vision_providers import LocalVisionProvider, RoboflowMCPProvider


def test_local_provider_actions_are_draft_safe():
    provider = LocalVisionProvider()
    project = provider.create_project("ls")
    upload = provider.upload_dataset(project["project_id"], "s3://bucket/ds")
    train = provider.request_training(project["project_id"], "yolov8s")
    assert project["status"] == "created"
    assert upload["status"] == "draft_pending_human_approval"
    assert train["status"] == "draft_pending_human_approval"


def test_roboflow_provider_actions_are_draft_safe():
    provider = RoboflowMCPProvider()
    project = provider.create_project("ls")
    assert project["provider"] == "roboflow_mcp"
    assert project["status"] == "draft_pending_human_approval"
