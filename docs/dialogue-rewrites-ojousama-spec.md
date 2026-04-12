# お嬢様台詞書き換え 実装仕様

## 概要

`src/data.js` 内の **強気×お嬢様 107件** と **ノーマル×お嬢様 14件** の合計 **121件** の台詞を一括書き換えする。

- 対象キャラ: 大河内紗代子（強気）、富岡加奈子・岩小路志摩子(ノーマル)
- 対象ファイル: **`src/data.js` のみ**
- 対象キー: 各セリフプールの `bold.ojousama` / `normal.ojousama` 配列の一部要素
- 非対象: 他性格・他属性・他ファイル(完全に触らない)

## ブランチ

```
feature/dialogue-rewrite-ojousama
```

既存の `feature/draft-negotiation` とは無関係なので、`main` から切ること。

## 成果物ファイル

| ファイル | 配置 | 説明 |
|---|---|---|
| `dialogue-rewrites-ojousama.json` | リポジトリルート | 121件の書き換えデータ |
| `scripts/apply-ojousama-rewrites.py` | リポジトリ内 | 適用スクリプト(Python 3.10+) |

## JSON データ仕様

```json
{
  "description": "...",
  "target_file": "src/data.js",
  "total": 121,
  "entries": [
    {
      "source": "BREAKTHROUGH_LINES",
      "personality": "bold",
      "subcategory": [],
      "index": 0,
      "old": "当然ですわ。まだまだこんなものではありませんの",
      "new": "当然ね。まだまだこんなものでは無くてよ"
    }
  ]
}
```

| フィールド | 意味 |
|---|---|
| `source` | data.js のトップレベル const 名 |
| `personality` | `"bold"`(強気) または `"normal"`(ノーマル) |
| `subcategory` | ネストキー配列。直下なら `[]`、例: `["hallOfFame"]`, `["raise_open"]`, `["N5_warning"]` |
| `index` | 配列の **0-based** インデックス |
| `old` | 現行セリフ(data.js との一致を事前検証済み) |
| `new` | 書き換え後のセリフ |

## 位置解決ロジック

data.js のツリー構造:

```
CONST_NAME = {
  [subcategory?]: {      // 省略されることあり
    bold / normal: {     // personality
      ojousama: [        // attribute (今回は常に ojousama)
        "...",           // index で特定
        "..."
      ]
    }
  }
}
```

- `subcategory === []` → `CONST.bold.ojousama[index]` または `CONST.normal.ojousama[index]`
- `subcategory === ["hallOfFame"]` → `CONST.hallOfFame.bold.ojousama[index]`

スクリプトは `ojousama:` の出現箇所から親チェーンを後方走査して一意に特定する。

## 実行手順

```bash
# 1. ブランチ作成
git checkout main
git pull
git checkout -b feature/dialogue-rewrite-ojousama

# 2. 成果物を配置
#    - dialogue-rewrites-ojousama.json  → リポジトリルート
#    - apply-ojousama-rewrites.py       → scripts/ 配下
mkdir -p scripts
# (ファイルをコピー配置)

# 3. 実行
python3 scripts/apply-ojousama-rewrites.py

# 期待される出力:
#   Applied 121 edits to src/data.js
#   Lines: 21117 -> 21117

# 4. 構文チェック
node --check src/data.js

# 5. 差分確認
git diff --stat src/data.js
git diff src/data.js | head -80
```

## 事前検証済み事項(重要)

このスクリプトはこちら側で実試走済みで、以下が確認済み:

- 121件すべて `src/data.js` 上の現行文字列と完全一致(old フィールド一致検証)
- 親チェーン(personality + subcategory)で一意に配列特定可能
- 全件置換後も `node --check src/data.js` がパス
- 行数変化なし(21117行 → 21117行)

つまりスクリプト実行が成功した時点で構文崩壊・位置ミスは発生しない前提で良い。

## 検証

実装後の確認項目:

1. **構文**: `node --check src/data.js` がエラー0
2. **差分規模**: `git diff src/data.js` で変更行が概ね121行前後(配列要素1行1発言なので)
3. **痕跡チェック**: `bold.ojousama` / `normal.ojousama` 配下で `ですわ` `ますわ` の出現が大幅に減っていること
4. **ゲーム内確認**: 大河内紗代子・富岡加奈子・岩小路志摩子で試合やイベントを発生させ、新しいセリフが表示されるか

## スコープ外(触らない)

- **強気×お嬢様の未記入 35件**(現行のまま残す)
- **ノーマル×お嬢様の未記入 160件**(現行のまま残す)
- その他すべての性格×属性の組み合わせ
- `src/data.js` 以外のファイル
- キャラパラメータ、ロジック、UI等

## 失敗時の切り戻し

スクリプトは全件の位置特定に1件でも失敗したら例外を投げてファイルを書かない(atomic)。もし何らかの理由で部分適用されてしまった場合:

```bash
git checkout src/data.js
```

で即座に復元可能。
