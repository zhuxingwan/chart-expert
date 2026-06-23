"""
Inject the `templates` section into each locale JSON file.

Maps:
- en.json           -> en
- zh.json           -> zh
- zh-CN.json        -> zh (same simplified Chinese)
- zh-TW.json        -> zh-TW
- ja.json           -> ja
- ko.json           -> ko
- es.json           -> es
- fr.json           -> fr
- de.json           -> de
- pt.json           -> pt
- pt-PT.json        -> pt
- pt-BR.json        -> pt
- ru.json           -> ru
- ar.json           -> en (fallback)
- hi.json           -> en (fallback)
- vi.json           -> en (fallback)
"""

import json
import os
import sys

LOCALES_DIR = os.path.join(
    os.path.dirname(__file__),
    "..", "src", "lib", "i18n", "locales",
)
LOCALES_DIR = os.path.abspath(LOCALES_DIR)

# (filename, python module name in .i18n-templates/)
LOCALE_MAP = [
    ("en.json", "en"),
    ("zh.json", "zh"),
    ("zh-CN.json", "zh"),
    ("zh-TW.json", "zh-TW"),
    ("ja.json", "ja"),
    ("ko.json", "ko"),
    ("es.json", "es"),
    ("fr.json", "fr"),
    ("de.json", "de"),
    ("pt.json", "pt"),
    ("pt-PT.json", "pt"),
    ("pt-BR.json", "pt"),
    ("ru.json", "ru"),
    ("ar.json", "en"),
    ("hi.json", "en"),
    ("vi.json", "en"),
]

sys.path.insert(0, os.path.dirname(__file__))


def load_templates_module(name: str):
    return __import__(name)


def main():
    for filename, module_name in LOCALE_MAP:
        path = os.path.join(LOCALES_DIR, filename)
        if not os.path.exists(path):
            print(f"SKIP (missing): {filename}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        mod = load_templates_module(module_name)
        templates = mod.build()

        data["templates"] = templates

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")  # trailing newline to match editor defaults

        # Quick sanity check: count keys
        n_ec = len(templates["echarts"]) - 1  # subtract categories
        n_ec_cat = len(templates["echarts"]["categories"])
        n_mer = len(templates["mermaid"])
        n_inf = len(templates["infographic"]) - 1
        n_inf_cat = len(templates["infographic"]["categories"])
        print(
            f"OK: {filename}  echarts={n_ec}+{n_ec_cat}cat  "
            f"mermaid={n_mer}  infographic={n_inf}+{n_inf_cat}cat"
        )

    print("\nAll locale files updated.")


if __name__ == "__main__":
    main()
