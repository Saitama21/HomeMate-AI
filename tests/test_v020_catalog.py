import sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def test_catalog_counts():
    c=sqlite3.connect(ROOT/"app/data/homemate.db")
    assert c.execute("select count(*) from plants").fetchone()[0] == 80
    assert c.execute("select count(*) from plant_problems").fetchone()[0] == 22
    assert c.execute("select count(*) from ingredients").fetchone()[0] == 62
    assert c.execute("select count(*) from recipes").fetchone()[0] == 58
def test_icons_exist():
    assert (ROOT/"app/static/icon-192.png").exists()
    assert (ROOT/"app/static/icon-512.png").exists()
    assert (ROOT/"app/static/manifest.webmanifest").exists()
