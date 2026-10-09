import json
import time

from engnest import progress
from engnest.progress import Progress, merge_all, merge_value


def test_words_pick_newer_record():
    old = {"apple": {"box": 3, "seen": 5, "t": 100}, "pear": {"box": 1, "seen": 1, "t": 50}}
    new = {"apple": {"box": 1, "seen": 6, "t": 90}, "kiwi": {"box": 0, "seen": 1, "t": 200}}
    m = merge_value("words", old, new)
    assert m["apple"]["t"] == 100  # 已保存的更新，留下
    assert set(m) == {"apple", "pear", "kiwi"}  # 两边各自学的词都在


def test_records_without_time_use_seen():
    m = merge_value("words", {"a": {"seen": 9}}, {"a": {"seen": 2}})
    assert m["a"]["seen"] == 9


def test_counters_take_max():
    assert merge_value("xp", 120, 80) == 120
    assert merge_value("stats", {"chat": 3, "essay": 1}, {"chat": 1, "essay": 4}) == {"chat": 3, "essay": 4}
    days = merge_value("days", {"2026-10-01": {"xp": 30, "new": 5}}, {"2026-10-01": {"xp": 10, "new": 8}, "2026-10-02": {"xp": 1}})
    assert days == {"2026-10-01": {"xp": 30, "new": 8}, "2026-10-02": {"xp": 1}}


def test_notebook_union_and_tombstone():
    old = [{"w": "Apple", "t": 1}, {"w": "pear", "t": 1}]
    new = [{"w": "kiwi", "t": 5}, {"w": "apple", "t": 2}]
    m = merge_value("notebook", old, new)
    assert [x["w"] for x in m] == ["kiwi", "apple", "pear"]
    # pear 在另一台设备上删掉了：墓碑比记录新，合并后不会回来
    m = merge_value("notebook", old, new, {"notebook": {"pear": 10}})
    assert [x["w"] for x in m] == ["kiwi", "apple"]
    # 删掉后又重新收藏（记录比墓碑新）：留下
    m = merge_value("notebook", [{"w": "pear", "t": 20}], [], {"notebook": {"pear": 10}})
    assert [x["w"] for x in m] == ["pear"]


def test_dict_tombstone():
    m = merge_value("sent_srs", {"hi there": {"seen": 1, "t": 1}}, {}, {"sent_srs": {"hi there": 5}})
    assert m == {}


def test_save_patch_merges_and_reports_changes():
    p = Progress()
    r1 = p.save_patch({"words": {"a": {"seen": 1, "t": 1}}, "xp": 10})
    assert r1["changed"] == {} and r1["prev"] == 0
    # 另一台设备没见过 a，传来 b：合并后两个都在，并告诉它合并结果
    r2 = p.save_patch({"words": {"b": {"seen": 1, "t": 2}}, "xp": 5})
    assert set(r2["changed"]["words"]) == {"a", "b"}
    assert r2["changed"]["xp"] == 10
    assert r2["prev"] == r1["rev"]
    data = p.load()
    assert set(data["words"]) == {"a", "b"} and data["xp"] == 10


def test_drop_keys():
    p = Progress()
    p.save_patch({"line_notes": {"x": 1}, "xp": 1})
    p.save_patch({"__drop": ["line_notes"]})
    assert "line_notes" not in p.load()


def test_legacy_json_import(data_dir):
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "progress.json").write_text(json.dumps({"xp": 42, "words": {"go": {"box": 2}}, "updated": 1}), encoding="utf-8")
    p = Progress()
    d = p.load()
    assert d["xp"] == 42 and "updated" not in d
    assert (data_dir / "progress.json.migrated").exists()


def test_backup_rotation_and_restore(data_dir):
    p = Progress()
    p.save_patch({"xp": 1})
    bdir = p.backup_dir()
    for i in range(10):  # 造 10 天的旧备份
        (bdir / f"progress-2026-01-{i + 1:02d}.json").write_text(json.dumps({"app": "EngNest", "data": {"xp": i}}), encoding="utf-8")
    p.backup()
    daily = sorted(bdir.glob("progress-????-??-??.json"))
    assert len(daily) == progress.KEEP_BACKUPS
    assert p.restore(daily[0].name)
    assert p.load()["xp"] == int(json.loads(daily[0].read_text(encoding="utf-8"))["data"]["xp"])


def test_corrupt_db_restored_from_backup(data_dir):
    p = Progress()
    p.save_patch({"xp": 77})
    p.backup()
    p.close()
    (data_dir / "progress.db").write_bytes(b"this is not a sqlite database" * 100)
    for s in ("-wal", "-shm"):
        (data_dir / f"progress.db{s}").unlink(missing_ok=True)
    q = Progress()
    assert q.load()["xp"] == 77
    assert "恢复" in q.notice
    assert list(data_dir.glob("progress.db.broken-*"))


def test_merge_all_prunes_old_tombstones():
    old_ts = (time.time() - 400 * 86400) * 1000
    m = merge_all({"deleted": {"notebook": {"a": old_ts, "b": time.time() * 1000}}}, {"xp": 1})
    assert "a" not in m["deleted"]["notebook"] and "b" in m["deleted"]["notebook"]


def test_read_export_rejects_other_json(tmp_path):
    f = tmp_path / "x.json"
    f.write_text('{"hello": 1}', encoding="utf-8")
    try:
        progress.read_export(f)
    except ValueError:
        pass
    else:
        raise AssertionError("应该拒绝")


def test_bad_timestamp_does_not_break_save():
    """记录里的 t 应该是修改时间（数字）；旧版本把选择记录（列表）存成了 t，合并时不能报错"""
    old = {"day": 1, "cur": {"ep": "ep1", "t": [{"c": 1}], "n": 3}}
    new = {"day": 1, "cur": {"ep": "ep1", "tr": [{"c": 1}, {"c": 0}], "n": 5, "t": 1700000000000}}
    assert merge_value("sitcom", old, new)["cur"]["n"] == 5


def test_null_clears_nested_progress():
    """演到一半的进度清除时设成 null：按字段合并时不会被旧数据带回来（直接删掉字段的话会）"""
    old = {"day": 2, "cur": {"ep": "ep1", "tr": [], "n": 3, "t": 1}}
    assert merge_value("sitcom", old, {"day": 2, "cur": None})["cur"] is None
    assert merge_value("life", {"campus": {"done": ["c1"]}}, {"campus": None})["campus"] is None


def test_newer_progress_wins():
    a = {"ch": "c2", "tr": [{"c": 0}], "n": 9, "t": 100}
    b = {"ch": "c2", "tr": [], "n": 1, "t": 200}  # 点了「清除进度」以后重新演，n 变小但时间更新
    assert merge_value("x", {"cur": a}, {"cur": b})["cur"] == b
