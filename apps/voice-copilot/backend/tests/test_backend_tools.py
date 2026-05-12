import importlib.util
from pathlib import Path

from fastapi.testclient import TestClient

module_path = Path(__file__).resolve().parents[1] / 'main.py'
spec = importlib.util.spec_from_file_location('voice_copilot_main', module_path)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)
app = module.app

client = TestClient(app)


def test_search_sop_endpoint():
    resp = client.get('/api/sop/search', params={'query': 'torque'})
    assert resp.status_code == 200
    assert resp.json()['count'] >= 1


def test_create_defect_draft_endpoint():
    payload = {
        'station': 'LINE-B2',
        'defect_type': 'torque_out_of_spec',
        'description': 'Torque exceeded upper limit',
        'severity': 'medium',
    }
    resp = client.post('/api/defects/draft', json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body['status'] == 'draft_pending_human_approval'


def test_submit_for_human_approval_endpoint():
    resp = client.post('/api/defects/submit', json={'draft_id': 'draft_123'})
    assert resp.status_code == 200
    assert resp.json()['status'] == 'draft_pending_human_approval'
