import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture(autouse=True)
def data_dir(tmp_path, monkeypatch):
    """每个测试用自己的临时数据目录，不碰真实的学习进度"""
    from engnest import paths

    monkeypatch.setenv("ENGNEST_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    monkeypatch.setattr(paths, "_data_dir", None)
    yield tmp_path / "data"
    monkeypatch.setattr(paths, "_data_dir", None)
