"""带发音的 Anki 卡片包：notes.txt 引用 media 里的 mp3，同一句只合成一次，合成失败的卡片照样导出（没有声音）"""

import base64
import zipfile

from engnest.api import write_anki_zip


def fake_synth(text, voice, rate):
    if text == "boom":
        raise OSError("offline")
    return "data:audio/mpeg;base64," + base64.b64encode(f"mp3:{text}".encode()).decode()


def test_zip_has_notes_media_and_readme(tmp_path):
    p = tmp_path / "cards.zip"
    rows = [
        {"front": "{audio} 听一听", "back": "<b>Hello there.</b><br>你好。", "audio": "Hello there.", "tag": "EngNest 句子"},
        {"front": "again {audio}", "back": "x\ty", "audio": "Hello there."},
        {"front": "no sound {audio}", "back": "b", "audio": "boom"},
        {"front": "plain", "back": "c"},
    ]
    job = write_anki_zip(p, rows, synth=fake_synth)
    assert job["i"] == 4 and job["failed"] == 1
    with zipfile.ZipFile(p) as z:
        names = z.namelist()
        media = [n for n in names if n.startswith("media/")]
        assert len(media) == 1  # 同一句只合成一次
        notes = z.read("notes.txt").decode("utf-8").splitlines()
        assert "怎么导入.txt" in names
    assert notes[:3] == ["#separator:tab", "#html:true", "#tags column:3"]
    fn = media[0].split("/")[1]
    assert notes[3] == f"[sound:{fn}] 听一听\t<b>Hello there.</b><br>你好。\tEngNest 句子"
    assert notes[4].split("\t")[:2] == [f"again [sound:{fn}]", "x y"]  # 制表符不能出现在字段里
    assert notes[5].startswith("no sound \t")
    assert notes[6] == "plain\tc\tEngNest"
