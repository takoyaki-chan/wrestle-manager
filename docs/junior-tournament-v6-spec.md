# ジュニアトーナメント V6 実装指標

V3（原本）→ V5（中間）→ V6（現行モック）の全変更まとめ。
WM本体への実装時の参照資料。

---

## 1. レイアウト

| 項目 | V3 | V6 |
|---|---|---|
| コンテナ幅 | 920px | **1280px** |

---

## 2. 画像パス

`fI(f, type)` ヘルパー関数でサブフォルダを解決。

```
face → image/{f.fc}          （例: image/face_001.png）
upper → image/upper/{f.up}   （例: image/upper/upper_001.webp）
stand → image/stand/{f.st}   （例: image/stand/stand_001.webp）
```

---

## 3. トーナメント表（ブラケット）

| 項目 | V3 | V6 |
|---|---|---|
| アイコン形状 | border-radius:50%（丸） | **border-radius:4px（角丸四角）** |
| アイコンサイズ | 32〜36px | **48px** |
| 選手枠 | min-width未指定 | **min-width:200px, padding:7px 10px, font:13px** |
| OVR表示 | 10px, 薄い色 | **11px, ゴールド(var(--gd)), font-weight:600, 背景バッジ(rgba金10%)** |
| 勝者セリフ吹き出し | V5で削除 | **V6で復元** ※次ラウンド確定時に前ラウンド吹き出しを非表示 |

---

## 4. 召集画面（SUMMON）

| 項目 | V3 | V6 |
|---|---|---|
| レイアウト | 丸＋リング演出 | **カード型パネル（380px幅）** |
| 画像 | upper画像 | **face画像の大きめアイコン（100×100px, border-radius:6px, ゴールドボーダー）** |
| グラデーションオーバーレイ | あり | **なし** |

---

## 5. 対戦カード（フォーカスカード）

| 項目 | V3 | V6 |
|---|---|---|
| 構成 | 丸アバター＋VS | **stand画像の向かい合わせ** |
| 画像タイプ | face | **stand** |
| 向き | — | **左側: scaleX(-1)で反転（内向き）、右側: そのまま** |
| 配置 | — | **justify-content:space-between + padding:0 30px** |
| セリフ位置 | 下部 | **キャラ画像の真上（ラベル→名前→セリフ→stand画像の順）** |
| 最大幅 | — | **500px (margin:20px auto)** |
| stand高さ | — | **180px** |

---

## 6. 勝者画面（試合結果）

| 項目 | V6 |
|---|---|
| 画像 | **upper画像（180px高, object-fit:contain）** |
| セリフ | **画像の真上に配置** |

---

## 7. チャンピオン画面

| 項目 | V3 | V6 |
|---|---|---|
| 最大幅 | — | **420px** |
| 画像タイプ | stand | **upper** |
| 画像サイズ | 160×200 | **200×200px** |
| 画像スタイル | contain | **object-fit:cover, object-position:center 15%, border-radius:8px, ゴールドボーダー** |
| 構成 | — | **トロフィー → 画像 → CHAMPION → 名前 → 団体 → セリフ** |
| セリフ | 固定テキスト | **（未定：性格×属性別チャンピオンセリフを後日作成予定）** |

---

## 8. FSデータ構造（V6）

```js
{
  id,
  nm,        // 名前
  org,       // 所属団体
  ovr,       // OVR値
  fc,        // face_xxx.png
  up,        // upper_xxx.webp
  st,        // stand_xxx.webp
  mine,      // boolean（プレイヤー所属か）
  summon     // 召集時セリフ
}
```

---

## 9. 共通UIルール適用

- **アイコン形状**: border-radius:4px（角丸四角形）— WM共通仕様
- **セリフ/吹き出し**: #f0f0f0背景 + 黒文字、中央寄せ、話者名は上部に小さく色付き — WM共通仕様

---

## 10. PENDING（未実装・後日対応）

1. **チャンピオンセリフ**: 性格（お気楽/強気/寡黙/真面目/内気/感情的/ノーマル）× 属性（デフォルト/ヤンキー/蠱惑/お嬢様/丁寧/クール）の組み合わせ別セリフ。dialogue-rewrite-master_4.xlsx の `JUNIOR_TOURNAMENT_LINES > champion` カテゴリに既存データあり。HTMLデモ用に8キャラ固定セリフを別途作成するか、既存DIAシステムから引くかは要検討。
2. **召集カード画像の最終確認**: face画像100×100pxアイコン表示の見栄え確認待ち。
