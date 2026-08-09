from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_start_script_expands_port():
    text = (ROOT / "start.sh").read_text(encoding="utf-8")
    assert '${PORT:-8000}' in text
    assert '--port "${PORT_VALUE}"' in text

def test_railway_has_no_literal_start_command():
    import json
    cfg = json.loads((ROOT / "railway.json").read_text(encoding="utf-8"))
    assert "startCommand" not in cfg["deploy"]
    assert cfg["deploy"]["healthcheckPath"] == "/api/health"
