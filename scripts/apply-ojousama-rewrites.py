#!/usr/bin/env python3
"""
お嬢様台詞書き換え適用スクリプト（強気107件 + ノーマル14件 = 121件）

使い方:
    python3 scripts/apply-ojousama-rewrites.py

前提:
    - リポジトリルートで実行
    - src/data.js が存在
    - dialogue-rewrites-ojousama.json がルートに存在

動作:
    - data.js 内の bold.ojousama / normal.ojousama の該当要素を書き換える
    - 置換のみなので行数は不変
    - 1件でも位置特定に失敗した場合は例外を投げてファイルを書かない
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / 'src' / 'data.js'
REWRITES = ROOT / 'dialogue-rewrites-ojousama.json'


def find_const_ranges(src: str) -> dict[str, tuple[int, int]]:
    """トップレベル const 定義の [開始, 終了] オフセットを収集する。"""
    result = {}
    for m in re.finditer(r'^const ([A-Z_][A-Z0-9_]*)\s*=\s*\{', src, re.MULTILINE):
        i = m.end() - 1  # '{' の位置
        depth = 0
        while i < len(src):
            c = src[i]
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    result[m.group(1)] = (m.start(), i + 1)
                    break
            elif c in ("'", '"', '`'):
                q = c
                i += 1
                while i < len(src) and src[i] != q:
                    i += 2 if src[i] == '\\' else 1
            i += 1
    return result


def find_ojousama_array(slice_text: str, offset: int, personality: str,
                        subcategory: list[str]) -> list[tuple[int, int]]:
    """ojousama: [...] の配列範囲のうち、親チェーンが一致するものを返す。"""
    results = []
    for m in re.finditer(r'\bojousama\s*:\s*\[', slice_text):
        # 配列終端
        i = m.end() - 1  # '['
        depth = 0
        end = -1
        while i < len(slice_text):
            c = slice_text[i]
            if c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
            elif c in ("'", '"', '`'):
                q = c
                i += 1
                while i < len(slice_text) and slice_text[i] != q:
                    i += 2 if slice_text[i] == '\\' else 1
            i += 1
        if end < 0:
            continue

        arr_start = m.start()
        # 親チェーン（内側→外側）を取得
        parents: list[str] = []
        j = arr_start - 1
        brace_depth = 0
        while j >= 0:
            c = slice_text[j]
            if c == '}':
                brace_depth += 1
            elif c == '{':
                if brace_depth == 0:
                    # 直前のキー名を読み取る
                    k = j - 1
                    while k >= 0 and slice_text[k] in ' \t\n\r':
                        k -= 1
                    if k >= 0 and slice_text[k] == ':':
                        kk = k - 1
                        while kk >= 0 and slice_text[kk] in ' \t\n\r':
                            kk -= 1
                        key_end = kk + 1
                        while kk >= 0 and (slice_text[kk].isalnum() or slice_text[kk] in '_$'):
                            kk -= 1
                        key = slice_text[kk + 1:key_end]
                        if key:
                            parents.append(key)
                        else:
                            break
                    else:
                        break
                else:
                    brace_depth -= 1
            j -= 1

        # 一致判定: parents[0] は必ず personality
        if not parents or parents[0] != personality:
            continue
        if subcategory:
            sub_reversed = list(reversed(subcategory))
            if parents[1:1 + len(sub_reversed)] != sub_reversed:
                continue
        else:
            # subcategory 無しなら bold/normal の親は const 直下（=親チェーン長1）
            if len(parents) != 1:
                continue

        results.append((offset + arr_start, offset + end))
    return results


def find_nth_string(text: str, array_start: int, array_end: int,
                    n: int) -> tuple[int, int, str] | None:
    """配列リテラル内 n 番目（0-based）の文字列の (start, end, quote_char) を返す。
    start/end はクォート記号を含まない中身の範囲。"""
    i = text.index('[', array_start) + 1
    count = 0
    while i < array_end:
        while i < array_end and text[i] in ' \t\n\r,':
            i += 1
        if i >= array_end or text[i] == ']':
            break
        q = text[i]
        if q not in ("'", '"', '`'):
            # 文字列以外の要素はスキップ
            while i < array_end and text[i] != ',':
                i += 1
            continue
        i += 1
        s = i
        while i < array_end:
            if text[i] == '\\':
                i += 2
                continue
            if text[i] == q:
                break
            i += 1
        if count == n:
            return (s, i, q)
        count += 1
        i += 1
    return None


def escape_for_quote(s: str, q: str) -> str:
    out = []
    for ch in s:
        if ch == '\\':
            out.append('\\\\')
        elif ch == q:
            out.append('\\' + q)
        elif ch == '\n':
            out.append('\\n')
        else:
            out.append(ch)
    return ''.join(out)


def main() -> int:
    src = DATA_JS.read_text(encoding='utf-8')
    data = json.loads(REWRITES.read_text(encoding='utf-8'))
    entries = data['entries']

    const_map = find_const_ranges(src)

    # 事前検証: 全件の位置特定ができることを確認
    edits = []
    for e in entries:
        source = e['source']
        if source not in const_map:
            raise RuntimeError(f'const not found: {source}')
        cs, ce = const_map[source]
        hits = find_ojousama_array(src[cs:ce], cs, e['personality'], e['subcategory'])
        if len(hits) != 1:
            raise RuntimeError(
                f'array match failure: {source} pers={e["personality"]} '
                f'sub={e["subcategory"]} hits={len(hits)}'
            )
        arr_s, arr_e = hits[0]
        loc = find_nth_string(src, arr_s, arr_e, e['index'])
        if loc is None:
            raise RuntimeError(f'index out of range: {source} idx={e["index"]}')
        ss, se, q = loc
        edits.append((ss, se, escape_for_quote(e['new'], q), e))

    # 後方から適用（オフセットずれ防止）
    edits.sort(key=lambda x: -x[0])
    out = src
    for ss, se, rep, _ in edits:
        out = out[:ss] + rep + out[se:]

    DATA_JS.write_text(out, encoding='utf-8')
    print(f'Applied {len(edits)} edits to {DATA_JS.relative_to(ROOT)}')
    print(f'Lines: {src.count(chr(10)) + 1} -> {out.count(chr(10)) + 1}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
