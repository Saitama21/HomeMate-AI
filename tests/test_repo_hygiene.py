from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def test_single_changelog_only():
    assert (ROOT / "CHANGELOG.md").exists()
    assert list(ROOT.glob("CHANGELOG-v*.md")) == []

def test_ui_version_synced():
    html = (ROOT / "app/static/index.html").read_text(encoding="utf-8")
    assert "v0.2.2" in html

def test_backend_version_synced():
    py = (ROOT / "app/main.py").read_text(encoding="utf-8")
    assert 'version="0.2.2"' in py
    assert '"version":"0.2.2"' in py
