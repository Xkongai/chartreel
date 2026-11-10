import json
import re

from conftest import ROOT

LANGS = [("README.md", "English"), ("README.zh-CN.md", "简体中文"), ("README.ja.md", "日本語"),
         ("README.es.md", "Español"), ("README.pt-BR.md", "Português (Brasil)"), ("README.fr.md", "Français"),
         ("README.de.md", "Deutsch"), ("README.ko.md", "한국어"), ("README.ru.md", "Русский")]


def code_blocks(text):
    return re.findall(r"```.*?```", text, flags=re.S)


def test_every_readme_has_the_nine_language_switcher():
    english = (ROOT / "README.md").read_text(encoding="utf-8")
    for name, label in LANGS:
        text = (ROOT / name).read_text(encoding="utf-8")
        line = next(l for l in text.splitlines() if "日本語" in l and "Русский" in l)
        assert f"<b>{label}</b>" in line, name
        for other, other_label in LANGS:
            if other != name:
                assert f'<a href="{other}">{other_label}</a>' in line, (name, other)
        # commands and outputs are never translated
        assert code_blocks(text) == code_blocks(english), name
        for ref in re.findall(r'(?:src|href)="((?:docs|examples|skills)/[^"#]+)"', text) + \
                re.findall(r"\]\(((?:docs|examples|skills)/[^)#]+)\)", text):
            assert (ROOT / ref).exists(), (name, ref)


def test_skill_frontmatter():
    text = (ROOT / "skills/chartreel/SKILL.md").read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, flags=re.S)
    assert m
    meta = dict(line.split(": ", 1) for line in m.group(1).splitlines())
    assert meta["name"] == "chartreel"
    assert 50 < len(meta["description"]) <= 1024


def test_marketplace_points_at_the_skill():
    mk = json.loads((ROOT / ".claude-plugin/marketplace.json").read_text(encoding="utf-8"))
    skills = mk["plugins"][0]["skills"]
    assert all((ROOT / s / "SKILL.md").exists() for s in skills)
