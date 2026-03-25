# ダメージセリフ/ボイス HP残量ベース発動ルール修正

## 背景

ダメージセリフ（長文、性格×口調）とダメージボイス（短い悲鳴、口調のみ）の使い分けが正しくない。
HP残量が低い（＝限界に近い）のにセリフ（言葉）が出てしまい、選手の消耗感が伝わらない。
フェーズ（時間経過）ではなく**HP残量（選手の消耗度）**を基準にする。

## 確定ルール

**前提**: クリティカルヒット（dmg≥15）時のみ判定が走る。
**基準**: 被弾後のHP残量割合（`def.hp / def.mhp`）で分岐。

| HP残量 | ダメージセリフ（showDamageSpeech） | ダメージボイス（showDamageVoice） | 演出意図 |
|---|---|---|---|
| 66%超 | 40% | なし | まだ余裕がある。言い返せる |
| 34〜66% | 15% | 50% | 効いてきた。たまに意地でセリフが出るが、主に悲鳴 |
| 33%以下 | **0%** | 60% | 限界。言葉にならない。悲鳴だけ |

**ビッグムーブ演出も同じルールに従う**。
**defenderReactionのHP帯（high/mid/low）と同じ閾値**（>0.66 / >0.33 / ≤0.33）。

## 修正箇所

### 共通ヘルパー関数を追加（showDamageSpeech/showDamageVoice定義の近くに）

```js
// ダメージセリフ/ボイス: HP残量ベース発動判定
// クリティカルヒット（dmg>=15）時に呼び出す
function tryDamageCutin(side, charData, hpRatio) {
  const r = Math.random();
  if (hpRatio > 0.66) {
    // 余裕あり: セリフ40%
    if (r < 0.40) showDamageSpeech(side, charData);
  } else if (hpRatio > 0.33) {
    // 効いてきた: セリフ15%, ボイス50%
    if (r < 0.15) showDamageSpeech(side, charData);
    else if (r < 0.65) showDamageVoice(side, charData);
  } else {
    // 限界: ボイス60%のみ
    if (r < 0.60) showDamageVoice(side, charData);
  }
}
```

### 修正1: ビッグムーブ演出内（2095-2096行目付近）

**修正前:**
```js
// ダメージセリフカットイン（終盤・クライマックスのみ）
if(ph.name==='End'||ph.name==='Climax')showDamageSpeech(ds,def);
```

**修正後:**
```js
// ダメージセリフ/ボイス: HP残量ベース発動（ビッグムーブもクリティカル扱い）
tryDamageCutin(ds, def, def.hp / def.mhp);
```

### 修正2: 通常ヒット演出内（2179-2183行目付近）

**修正前:**
```js
// ダメージセリフ/ボイス: End/Climaxのクリティカルヒット時
if((ph.name==='End'||ph.name==='Climax')&&isCrit){
  if(Math.random()<0.28){showDamageSpeech(ds,def);}
  else if(ph.name==='Climax'){showDamageVoice(ds,def);}
}
```

**修正後:**
```js
// ダメージセリフ/ボイス: HP残量ベース発動（クリティカルヒット時のみ）
if(isCrit) tryDamageCutin(ds, def, def.hp / def.mhp);
```

## CLAUDE.md に追記

`## UI共通ルール` セクション内に以下を追記:

```markdown
### ダメージセリフ/ボイスの発動ルール
クリティカルヒット（dmg≥15）時のみ発動判定。**HP残量**で使い分ける:
- HP 66%超: セリフ40%（まだ言葉にできる）
- HP 34〜66%: セリフ15% / ボイス50%（効いてきた、主に悲鳴）
- HP 33%以下: ボイス60%のみ（限界、言葉にならない）
ビッグムーブも同じルール。HP33%以下でダメージセリフ（長文）は絶対に出さない。
基準はフェーズ（時間）ではなくHP残量（消耗度）。defenderReactionのHP帯と同じ閾値。
```

## 変更ファイル

- `src/battle-engine.html` — tryDamageCutin関数追加 + 2箇所修正
- `CLAUDE.md` — ルール追記

## 検証

修正後、auto-sim 100シーズン（10 seeds × 10 seasons）を実行し ALL CLEAR を確認すること。
ダメージセリフ/ボイスはUI演出のみで試合結果に影響しないため、数値バランスへの影響はない。
