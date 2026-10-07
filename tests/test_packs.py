import json

import pytest

from engnest.packs import js_literal_to_json, load_js_data


def test_js_literal_basics():
    src = """{
      // 注释
      no: 1, title: '简单\\'的\\' 结构', /* 块注释 */
      list: [1, 2, 'a',],
      nested: { ok: true, nothing: null, u: "\\u0041\\x42" },
    }"""
    assert json.loads(js_literal_to_json(src)) == {"no": 1, "title": "简单'的' 结构", "list": [1, 2, "a"],
                                                    "nested": {"ok": True, "nothing": None, "u": "AB"}}


def test_keys_inside_strings_untouched():
    assert json.loads(js_literal_to_json("{a: 'x: y, z', 'b c': 2}")) == {"a": "x: y, z", "b c": 2}


def test_load_js_data_forms():
    assert load_js_data("export default [{\"a\": 1}];") == [{"a": 1}]
    assert load_js_data("/** doc */\nconst v = {\"k\": [1]}\nexport default v\n") == {"k": [1]}
    assert load_js_data("const s = [\n {no: null, title: 'T'},\n];\nexport default s;") == [{"no": None, "title": "T"}]


def test_unknown_identifier_rejected():
    with pytest.raises(ValueError):
        js_literal_to_json("{a: someVariable}")
