# 個性リバランス第2弾: 名勝負製造機 + 反骨心

## 1. 名勝負製造機 — MQ固定+3 → ランダム+1〜5

### 変更対象: `src/engine.js`

**変更箇所A: 試合MQボーナス（448行目付近）**
```
現行: if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')) mq += 3;
変更: if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')) mq += 1 + Engine.rng.int(rng, 0, 4);  // +1〜5ランダム
```

**変更箇所B: careerBestMQ（1475行目付近）**
→ そのまま（`careerBestMQ += 5` は変更なし）

### 変更対象: `src/data.js` TRAIT_DEFS（213行目付近）
```
現行: '名勝負製造機': {cat:'match', icon:'名', color:'#f1c40f', en:'Match Maker', desc:'試合品質にわずかなボーナス'},
変更: '名勝負製造機': {cat:'match', icon:'名', color:'#f1c40f', en:'Match Maker', desc:'試合がたまに大化けする（MQ+1〜5）'},
```

---

## 2. 反骨心 — A案シンプル化（trust変動×1.3全削除、交渉/引き留め補正も削除）

### 残す効果（2つだけ）
- trust≤30で成長×1.15（2373行目） → **残す**
- 移籍願望baseProb+0.20（11451行目） → **残す**

### 削除する効果

**trust変動×1.3 — 全6箇所削除:**

1. **9013行目付近** — 試合勝利時のtrust gainDelta
```
削除: if (Traits.has(fighter, '反骨心')) gainDelta *= 1.3;
```

2. **9047行目付近** — 試合敗北時のtrust lossDelta
```
削除: if (Traits.has(fighter, '反骨心')) lossDelta *= 1.3;
```

3. **9646行目付近** — ファンサービスイベント等のtrustDelta
```
削除: if (Traits.has(f, '反骨心')) trustDelta *= 1.3;
```

4. **9864行目付近** — applyTrust汎用関数①
```
削除: if (Traits.has(f, '反骨心')) adjusted *= 1.3;
```

5. **10242行目付近** — applyTrust汎用関数②
```
削除: if (Traits.has(f, '反骨心')) adjusted *= 1.3;
```

6. **10523行目付近** — 密着取材成功時のtrustDelta
```
削除: if (Traits.has(f, '反骨心')) trustDelta *= 1.3;
```
（10520行目のコメント `// Phase0修正: trust直接加算→applyCoeff+gainMult経由（反骨心×1.3も適用）` も修正。「反骨心×1.3も適用」部分を消す）

**交渉・引き留め補正 — 2箇所削除:**

7. **11614行目付近** — 交渉成功率
```
削除: if (Traits.has(f, '反骨心')) successRate -= 0.15;
```

8. **11648行目付近** — 引き留め率
```
削除: if (Traits.has(f, '反骨心')) retainRate -= 0.15;
```

### 変更しない（そのまま残す）
- 2373行: `if (Traits.has(char, '反骨心') && ... trust ... <= 30) bonus *= 1.15;` — 残す
- 8764行: Glimpse personality判定の配列に'反骨心'含む — 残す（UIフレーバー）
- 11293行: personality推定の'bold'判定 — 残す（UIフレーバー）
- 11451行: `if (Traits.has(f, '反骨心')) baseProb += 0.20;` — 残す

### TRAIT_DEFS説明文の更新
```
現行: '反骨心': {cat:'special', icon:'反', color:'#c0392b', en:'Rebellious', desc:'扱いにくいが逆境に強い。信頼低下時に成長UP'},
変更: '反骨心': {cat:'special', icon:'反', color:'#c0392b', en:'Rebellious', desc:'移籍願望が出やすいが、信頼が低いと成長する'},
```

---

## 検証
- auto-sim 10seeds × 10seasons で ALL CLEAR
- 名勝負製造機持ちの試合MQにばらつきがあることをログで確認
- 反骨心持ちのtrust推移が他の選手と同等であることを確認（×1.3による増幅がないこと）
