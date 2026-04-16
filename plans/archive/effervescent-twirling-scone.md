# キャラクターリサイクル — retiredIds永久除外問題の修正

## Context
98名固定キャラプールで`retiredIds`が永久ブラックリストとして機能しているため、FA年齢超過・現役引退したキャラが二度とゲームに登場しなくなる。長期プレイでキャラが枯渇し、特定キャラが30年以上登場しないという報告あり。

**修正方針**: FA年齢超過キャラはretiredIdsに入れず、即座にdormantPoolへ若返りリサイクル。現役引退キャラも一定期間後にdormantPoolへリサイクル。

## 変更箇所

### 1. FA年齢超過: retiredIds → dormantPoolリサイクル
**ファイル**: `src/management.js:9109-9123`

現行:
```js
// FA: 加齢 + 21歳超えで自動引退
agedOutFA → retiredIds + retiredFighters
```

修正:
```js
// FA: 加齢 + 21歳超えでdormantPoolにリサイクル（未デビュー=若返り再投入）
agedOutFA → dormantPoolに {id, age: 17+rand(0,2)} として追加
// retiredIdsには入れない、retiredFightersにも入れない
```

### 2. 現役引退キャラのリサイクル（シーズン末処理）
**ファイル**: `src/management.js:9270-9296`（dormantPool補充ロジック）

現行: `retiredIds`を除外して`ALL_CHARS`から補充 → retiredIdsが増えると候補が枯渇

修正: dormantPool補充時に`retiredIds`も候補に含める。ただし**直近引退（5シーズン以内）は除外**して不自然な即復帰を防ぐ。

具体的には:
- `collectOccupiedCharacterDefIds`の`retiredIds`除外行(154行)は維持（現在アクティブなプール間の重複防止用）
- dormantPool補充(9280-9292)と緊急補充(6250-6280)で、retiredIdsのうち**引退から5シーズン以上経過**したキャラを候補に戻す
- 候補に戻す際、retiredIdsからそのIDを削除

### 3. 引退シーズン記録の追加
retiredFightersの各エントリに`retiredSeason`を記録（リサイクル猶予期間の判定用）。

既存の引退パス全箇所で`s.season`を記録:
- `management.js:9061-9062`（シーズン末引退）
- `management.js:6766, 6789`（試合中怪我引退）
- `management.js:14678`（突然退団引退）
- `app.js:4472-4473`（ラストラン終了）

### 4. dormantPool年齢超過のクリーンアップ
**ファイル**: `src/management.js:9137-9144`

現行: dormantPool内キャラは加齢するが、21歳超過しても放置（使われないまま残る）

修正: 21歳超過エントリを年齢リセットして再投入（同じdormantPool内で若返り）

## 修正対象ファイル
- `src/management.js` — メインロジック全変更

## 検証
- `node test/auto-sim.js 100` — 不変条件チェック
- 長期シーズン（50+）でキャラ枯渇しないことを確認
