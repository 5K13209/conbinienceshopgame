"""game フォルダのゲームを、HTMLファイル1つにまとめる。

使い方（D:\\OneShotGame で）:
    python tools/build_single.py

できあがり: dist/コンビニ激戦区.html （このファイル1つを渡せば遊べる）
ゲームを直したら、もう一度このスクリプトを実行すれば作り直せる。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / 'game'
OUT_DIR = ROOT / 'dist'
OUT = OUT_DIR / 'コンビニ激戦区.html'


def read(rel):
    return (GAME / rel).read_text(encoding='utf-8')


def main():
    html = read('index.html')

    # CSS を埋め込む
    def css_repl(m):
        return '<style>\n' + read(m.group(1)) + '\n</style>'
    html, n_css = re.subn(r'<link rel="stylesheet" href="([^"]+)">', css_repl, html)

    # JS を埋め込む（読み込み順はそのまま）
    def js_repl(m):
        code = read(m.group(1))
        if '</script' in code.lower():
            raise SystemExit(f'{m.group(1)} の中に </script があるので埋め込めません')
        return f'<script>\n/* ---- {m.group(1)} ---- */\n{code}\n</script>'
    html, n_js = re.subn(r'<script src="([^"]+)"></script>', js_repl, html)

    OUT_DIR.mkdir(exist_ok=True)
    OUT.write_text(html, encoding='utf-8')
    print(f'CSS {n_css}個・JS {n_js}個を埋め込みました → {OUT} ({OUT.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
