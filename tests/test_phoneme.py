"""音素级发音评测的对齐和打分（不需要模型：用假的发音词典和假的识别结果）"""

from engnest import phoneme

LEX = {
    "think": [[("θ", False), ("ɪ", False), ("ŋ", False), ("k", False)]],
    "water": [[("w", False), ("ɑ", False), ("t", False), ("ɝ", True)]],
    "the": [[("ð", False), ("ə", True)], [("ð", False), ("i", True)]],
    "book": [[("b", False), ("ʊ", False), ("k", False)]],
}


class Fake:
    def lookup(self, w):
        return LEX.get(w.lower(), [])


def test_perfect():
    r = phoneme.score(Fake(), "think", ["θ", "ɪ", "ŋ", "k"])
    assert r["score"] == 100 and r["issues"] == []


def test_th_read_as_s_is_reported():
    r = phoneme.score(Fake(), "Think!", ["s", "ɪ", "ŋ", "k"])
    w = r["words"][0]
    assert w["score"] == 75
    assert w["phones"][0] == {"p": "θ", "ok": False, "heard": "s", "weak": False, "del": False}
    assert r["issues"] == [{"p": "θ", "heard": "s", "words": ["Think"]}]


def test_american_flap_counts_as_t():
    assert phoneme.score(Fake(), "water", ["w", "ɑ", "ɾ", "ɝ"])["score"] == 100


def test_variant_choice_and_unknown_word():
    r = phoneme.score(Fake(), "the zorgle", ["ð", "i"])
    assert r["words"][0]["score"] == 100        # 挑了 /ði/ 这种读法
    assert r["words"][1]["known"] is False and r["words"][1]["score"] is None


def test_dropped_final_consonant_and_added_schwa():
    dropped = phoneme.score(Fake(), "book", ["b", "ʊ"])
    assert dropped["words"][0]["phones"][2]["del"] and dropped["issues"][0] == {"p": "k", "heard": "", "words": ["book"]}
    added = phoneme.score(Fake(), "book", ["b", "ʊ", "k", "ə"])
    assert added["words"][0]["inserted"] == ["ə"] and added["words"][0]["score"] < 100


def test_arpabet_mapping_covers_cmu_symbols():
    for s in ["AA", "AE", "AH", "AO", "AW", "AY", "B", "CH", "D", "DH", "EH", "ER", "EY", "F", "G", "HH", "IH", "IY", "JH", "K", "L",
              "M", "N", "NG", "OW", "OY", "P", "R", "S", "SH", "T", "TH", "UH", "UW", "V", "W", "Y", "Z", "ZH"]:
        assert s in phoneme.ARPA


def test_syllabic_consonant_schwa_can_be_dropped():
    LEX["people"] = [[("p", False), ("i", False), ("p", False), ("ə", True), ("l", False)]]
    assert phoneme.score(Fake(), "people", ["p", "i", "p", "l"])["score"] == 100
