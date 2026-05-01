# Phase A 実装 handoff — F08-A 直接対決 演出強化

> **対象**: Claude Code
> **計画書**: `docs/handoff-faction-confrontation-plan-v0.2.md`
> **spec patch**: `spec-patch-faction-system-phase3e.md`（適用先: `specs/faction-system-spec-v0.1.md`）
> **Phase 識別**: Phase 3e（v0.7 Phase 3d の次に並べる）
> **作成日**: 2026-05-01

---

## 0. 着手前の必読

### 0.1 リポジトリ最新化
```bash
git pull origin main
git status  # クリーンであることを確認
```

### 0.2 必読ファイル

実装に入る前に、必ず以下を **view** で読むこと（記憶や推測で進めない）:

1. `CLAUDE.md` — 設計原則・テンプレ禁止・数値哲学
2. `specs/faction-system-spec-v0.1.md` の §9.8（既存F08仕様）と §17 実装状況（v0.7/v0.8）
3. `src/factions.js` 全体構造（特に `_pendingF08Directive` / `applyMatchResult` / `isF08DirectiveMatch`）
4. `src/ui-common.js` の `showFactionF08Modal`（L8319〜）— レイアウト構造の参照元
5. `src/data-faction-dialogue.js` 全体 — セリフテーブル形式の参照元
6. `src/app.js` の `_runPreMatchFlavorForMatch` 周辺 — 試合前モーダルフックの差し込み箇所
7. `src/management.js` の `finalizeShow` 周辺（L880〜960付近、`isF08Match` を使っている箇所）
8. `docs/ui/01-foundations.md` の CSS 変数定義部分

### 0.3 設計原則の遵守確認

CLAUDE.md より、以下を意識して実装すること:

- **テンプレセリフ禁止**: 「お前を倒す」「絶対に負けない」のような汎用表現は出さない
- **数値の動きに説得力**: 派閥関係追加変動は試合結果から導かれる事実のみ
- **演出が浮かぶ**: モーダルの構造は計画書の ASCII モックアップ通り
- **派閥は物語装置**: 数値はモーダルに出さない
- **既存バランスを壊さない**: F02③ resolution との重複時は resolution 優先

---

## 1. 実装タスク一覧（実行順）

```
Step 1: spec patch 適用
Step 2: セリフテーブル4種を data-faction-dialogue.js に量産
Step 3: factions.js にデータ取得関数追加
Step 4: ui-common.js にモーダル2種 + ダークテーマCSS追加
Step 5: app.js / management.js にフック差し込み
Step 6: rivalry 50+ 宣戦布告との排他制御
Step 7: auto-sim 検証
Step 8: 実機検証ガイド作成
Step 9: 仕様書追記
Step 10: ローカルコミット
```

---

## 2. Step 1 — spec patch 適用

`/mnt/user-data/outputs/spec-patch-faction-system-phase3e.md` の指示に従い、`specs/faction-system-spec-v0.1.md` の **5箇所**に追記する:

1. §9.8 末尾に §9.8.1 を新設
2. §17 実装状況に Phase 3e 完了予定セクション追加
3. §12 RNGシード表に 0xFA83〜0xFA87 追加
4. §15 オープン項目に Phase 3e 関連を追加
5. §16 変更履歴に v0.9 を追加

---

## 3. Step 2 — セリフテーブル量産

### 3.1 ファイル追加箇所

`src/data-faction-dialogue.js` の末尾に追加。既存の `FACTION_F08_LEADER_LINES` の後ろ。

### 3.2 テーブル構造

各テーブルは以下の3階層:

```javascript
const FACTION_F08_PRE_MATCH_LINES_A = {
  [personality]: {
    [archetype]: {
      high: [...],   // hostility 80+
      mid: [...],    // 60-79
      low: [...],    // 40-59
    }
  }
};
```

`POST_MATCH_LOSER_LINES` のみ `hp_high` / `hp_mid` / `hp_low` に分岐する点に注意（HP残量別）。

### 3.3 量産規模

| テーブル | 6性格 × 6アーキタイプ × 3帯 | 1セルあたり最低パターン数 |
|---------|------------------------|----------------------|
| `FACTION_F08_PRE_MATCH_LINES_A` | normal が必須、他は normal フォールバック可 | 2-3 |
| `FACTION_F08_PRE_MATCH_LINES_B` | 同上 | 2-3 |
| `FACTION_F08_POST_MATCH_WINNER_LINES` | 同上 | 2-3 |
| `FACTION_F08_POST_MATCH_LOSER_LINES` | 同上 (HP帯分岐) | 2-3 |

**最低限の必須カバー範囲**:
- 性格 6種すべて × アーキタイプ `normal` だけは全パターン埋める（フォールバック先）
- アーキタイプ `ojousama` / `delinquent` / `cool` は性格 `bold` / `earnest` / `quiet` / `emotional` でカバー（既存 F08 と同じ濃度）
- アーキタイプ `polite` / `seductive` は normal フォールバックでも可（既存 F08 と同じ）

### 3.4 セリフ作成のガイドライン（CLAUDE.md準拠）

**禁止表現**:
- 「お前を倒す」
- 「絶対に負けない」
- 「やってやる」
- 「行くぞ！」
- 「くそっ……負けた……」
- これらと同等の汎用テンプレすべて

**推奨**:
- キャラの一人称を活かす（私 / あたし / うち / わたくし / 俺）
- 語尾を性格×アーキタイプで使い分ける
- 比喩・口癖・癖のある表現を1人1つ持たせる
- 「派閥対立」の文脈を反映する（個人ではなく集団としての敵対）

### 3.5 セリフ叩き台（必ずこれをベースに拡張すること、流用OK）

```javascript
// 試合前 リーダー A 側（hostility 80+）
const FACTION_F08_PRE_MATCH_LINES_A = {
  bold: {
    normal: {
      high: [
        "あんたんとこの組、今夜で終わりだ。覚悟しときな",
        "あたしの背中にいる連中のためにも、今日は退かない",
        "あんた一人潰せば、組ごと崩れるってことだろ？　だったら遠慮しねえ",
      ],
      mid: [
        "今日は決着つけにきた。話はリングの上で",
      ],
      low: [
        "……来なよ。最後まで付き合ってやる",
      ],
    },
    delinquent: {
      high: [
        "今夜、あんたの組は終わる。覚悟しときな",
        "ヘラヘラしてられんのも今のうちだぜ",
      ],
      mid: [
        "黙って来な。話すことなんかねえだろ",
      ],
    },
  },
  earnest: {
    normal: {
      high: [
        "あなたたちのやり方は……許せない。今日で決着をつける",
        "私、あなたを倒さないと、後ろのみんなに顔向けできない",
      ],
      mid: [
        "今日は、絶対に引きません",
      ],
      low: [
        "リングの上で、答えを出しましょう",
      ],
    },
  },
  quiet: {
    normal: {
      high: [
        "……話すことは、もうない",
        "……行こう。リングが待ってる",
      ],
      mid: [
        "……来なよ",
      ],
    },
    cool: {
      high: [
        "……話すことは、もうない",
        "……決着、つけよう",
      ],
    },
  },
  // emotional, easygoing も同様に量産
  // ojousama アーキタイプ:
  emotional: {
    ojousama: {
      high: [
        "ええ、わたくしも引きませんわ。これは戦争です",
        "あなたの組の方々が、わたくしの妹分にしたこと――今夜、お返ししますわ",
      ],
      mid: [
        "わたくし、本気でいきますわよ",
      ],
    },
  },
  // ... 残りを埋める
};

// 試合前 リーダー B 側（A と対称的に、応戦の構図）
const FACTION_F08_PRE_MATCH_LINES_B = {
  bold: {
    normal: {
      high: [
        "上等だ。やってもらおうじゃねえか",
        "受けて立つ。あたしんとこの組も、舐められっぱなしじゃ終われねえ",
      ],
      mid: [
        "いいだろう。来な",
      ],
    },
  },
  // ... 同様に量産
};

// 試合後 勝者セリフ（敗者派閥への一撃）
const FACTION_F08_POST_MATCH_WINNER_LINES = {
  bold: {
    normal: {
      high: [
        "これがあんたの組の限界か？　次は誰だ",
        "見たかよ。これが格の違いってやつだ",
        "もう二度と、あたしらに楯突くんじゃねえぞ",
      ],
      mid: [
        "……今日は、あたしの勝ちだ",
      ],
    },
    delinquent: {
      high: [
        "口ほどにもねえな、あんたの組",
        "次の番、誰だよ？　全員かかってこい",
      ],
    },
  },
  earnest: {
    normal: {
      high: [
        "……あなたの組のやり方が、間違ってたって、これで証明された",
        "私、勝ちました。みんなのために",
      ],
      mid: [
        "ありがとう……みんな、見ててくれて",
      ],
    },
  },
  // ...
};

// 試合後 敗者セリフ（HP帯分岐）
const FACTION_F08_POST_MATCH_LOSER_LINES = {
  bold: {
    normal: {
      hp_high: [
        "……次は、こうはいかねえ。覚えとけよ",
        "今日のとこは……あたしの負けだ。だが、組は潰れねえ",
      ],
      hp_mid: [
        "……くそっ……まだ、終わりじゃ……",
        "……次、絶対に……",
      ],
      hp_low: [
        "……っ……",
        "（呻き声）",
      ],
    },
    delinquent: {
      hp_high: [
        "チッ……負けた。今日のとこはな",
      ],
      hp_mid: [
        "……うるせえ……",
      ],
    },
  },
  quiet: {
    normal: {
      hp_high: [
        "……負けた、けど……組は、潰れない",
      ],
      hp_mid: [
        "……っ……",
      ],
      hp_low: [
        "（沈黙）",
      ],
    },
  },
  // ... 残りを埋める
};
```

### 3.6 export

末尾に既存パターン通り `if (typeof window !== 'undefined') { window.FACTION_F08_PRE_MATCH_LINES_A = FACTION_F08_PRE_MATCH_LINES_A; ... }` を追加。

---

## 4. Step 3 — factions.js にデータ取得関数追加

### 4.1 関数追加箇所

`src/factions.js` の `getFactionLine` の近く（L2325付近）に2関数追加:

### 4.2 `getF08PreMatchData(state, matchSlot)`

入力: state + showCard 上の matchSlot（`{left, right, _f08Locked}` を含むオブジェクト）

出力:
```javascript
{
  factionA: { id, name, leaderId, leaderName, leaderOvr, portrait },
  factionB: { id, name, leaderId, leaderName, leaderOvr, portrait },
  hostilityAvg: number,        // 両方向平均
  hostilityBand: 'high'|'mid'|'low',
  lineA: string,               // 抽選済みセリフ
  lineB: string,
  narration: string,           // 「○○組と△△組――その夜、両派閥のリーダーが直接拳を交える」
}
```

セリフ抽選には RNG `0xFA83` (A) / `0xFA84` (B) を使う:
```javascript
const rngA = Engine.rng.derive(state.rngSeed, state.season, state.week, 0xFA83);
```

### 4.3 `getF08AftermathData(state, matchResult)`

入力: state + 試合結果オブジェクト（`{winnerId, loserId, winnerHpPct, loserHpPct, ...}`）

出力:
```javascript
{
  winner: { id, name, factionName, portrait, faction },
  loser: { id, name, factionName, portrait, faction, hpBand: 'hp_high'|'hp_mid'|'hp_low' },
  winnerLine: string,
  loserLine: string,
  narrationOpen: string,       // 「決着。○○組が△△組を下した――しかし、戦いは終わらない」
  narrationClose: string,      // 「敗者派閥は、深い傷を負って夜の闇に消えていった」など派閥状態に応じて
}
```

`hpBand` の判定:
- `hp_high`: loserHpPct >= 0.66
- `hp_mid`: loserHpPct >= 0.34
- `hp_low`: それ以下

### 4.4 派閥関係追加変動関数 `applyF08PostMatchExtraEffects`

入力: state + matchResult + isF02ResolutionFiring（F02③が同時発火するなら true）

`isF02ResolutionFiring === true` の場合は何もせず state を返す（F02③優先）。

それ以外で以下を適用:
- 敗者派閥末端メンバー（リーダー・幹部以外）の trust に -2 〜 -4 ロール
- 敗者派閥リーダー → 勝者派閥リーダー の rivalry に +8 〜 +12 ロール
- 勝者派閥メンバー → 勝者リーダー の bond に +2 〜 +4 ロール

RNG: `0xFA87`

`_applyTrustToMembers` / `_applyRivalryDirected` / `_applyBondDirected` の既存ヘルパーを流用。

---

## 5. Step 4 — ui-common.js にモーダル + CSS

### 5.1 CSS追加箇所

`src/index.html` の `:root` に以下のCSS変数を追加:

```css
:root {
  /* ...既存... */
  --accent-arena-bg-from: #1a0a0a;
  --accent-arena-bg-to:   #2d0d0d;
  --accent-arena-frame-loser: rgba(180,40,40,0.4);
}
```

`docs/ui/01-foundations.md §1-8` のCSSトークン表にも同じものを追記。

### 5.2 モーダル CSS クラス追加

`src/index.html` または別CSSファイル（ui-common.js冒頭で定義しても可）に:

```css
.fevt-overlay-arena {
  /* fevt-overlay-office と同じ構造、配色のみダーク */
  background: linear-gradient(135deg, var(--accent-arena-bg-from), var(--accent-arena-bg-to));
}
.fevt-arena-card {
  /* fevt-report-card と同じ構造、配色のみダーク */
}
.fevt-arena-card.f08-pre {
  /* 試合前: 緊張のグラデ */
}
.fevt-arena-card.f08-post {
  /* 試合後: 暗赤フレーム */
  border: 2px solid var(--accent-arena-frame-loser);
}
```

### 5.3 `showFactionF08PreMatchModal` 実装

既存 `showFactionF08Modal`（L8319）の構造を**コピーして改変**:

- popup queue 排他チェック（`_isPopupActive`）は維持
- 社長判断 UI（`fevt-decision-tray` 部分）を**削除**
- 「試合へ進む →」単一ボタンに置き換え
- ボタン押下時は `_shownF08PreMatchIds` に matchId を追加してから閉じる
- BGM/SFX:
  ```javascript
  if (typeof Engine.audio !== 'undefined') {
    Engine.audio.playBgm('bgm_tension_v1.mp3', { volume: 0.20, loop: true });
    setTimeout(() => Engine.audio.playSfx('f07_gong_v1.mp3', { volume: 0.18 }), 150);
  }
  ```

### 5.4 `showFactionF08AftermathModal` 実装

同様に既存F08モーダルをコピーして改変:

- レイアウト: 勝者を中央大、敗者を右下に小さく
- 「閉じる」単一ボタン
- BGM/SFX:
  - 開幕は沈黙
  - 30秒後に低い心拍音（任意、Phase A スコープ外でも可）
  - 結びに `f06_fin_chime_v1.mp3` 1打

### 5.5 window export

末尾に追加:
```javascript
window.showFactionF08PreMatchModal = showFactionF08PreMatchModal;
window.showFactionF08AftermathModal = showFactionF08AftermathModal;
```

---

## 6. Step 5 — フック差し込み

### 6.1 試合前フック（`src/app.js`）

`_runPreMatchFlavorForMatch(matchIdx)` 関数の冒頭に F08 試合前モーダル発火ロジックを追加:

```javascript
function _runPreMatchFlavorForMatch(matchIdx) {
  const m = G.showCard[matchIdx];
  if (!m) return;
  
  // F08 試合前モーダル発火
  if (m._f08Locked && Engine.factions) {
    const matchId = `${G.season}-${G.week}-${matchIdx}`;
    const shown = G._shownF08PreMatchIds || [];
    if (!shown.includes(matchId)) {
      const data = Engine.factions.getF08PreMatchData(G, m);
      if (data) {
        showFactionF08PreMatchModal(data, G, () => {
          G._shownF08PreMatchIds = [...shown, matchId];
          // 既存の他フレーバー（rivalry等）はスキップして試合へ
          App._proceedToMatch(matchIdx);
        });
        return;
      }
    }
  }
  
  // 既存の rivalry confrontation / 初顔合わせ等の処理を続行
  // （F08 の方が優先なので、F08 が出た場合は他はスキップ）
  // ... 既存処理 ...
}
```

### 6.2 試合後フック（`src/management.js`）

`finalizeShow` 内、各試合の結果を確定する箇所（L880〜960付近、`isF08Match: !!context.isF08Match` を使っている箇所の直後）に:

```javascript
// F08 試合後モーダル発火 + 派閥関係追加変動
if (context.isF08Match && winner !== null && winner !== 'draw') {
  const isF02Resolution = /* F02③ resolution が同時発火するかチェック */;
  
  // 派閥関係追加変動（F02③優先）
  G = Engine.factions.applyF08PostMatchExtraEffects(G, matchResult, isF02Resolution);
  
  // モーダル発火（pendingShowQueue or 同等の演出キューに積む）
  const matchId = `${G.season}-${G.week}-${matchIdx}`;
  const shown = G._shownF08PostMatchIds || [];
  if (!shown.includes(matchId)) {
    const data = Engine.factions.getF08AftermathData(G, matchResult);
    if (data) {
      G._pendingF08Aftermath = G._pendingF08Aftermath || [];
      G._pendingF08Aftermath.push({ matchId, data });
      G._shownF08PostMatchIds = [...shown, matchId];
    }
  }
}
```

`_pendingF08Aftermath` キューの消化は app.js 側で showSummary や次画面遷移前に処理する。

### 6.3 transient フィールド追加（auto-sim 互換）

`test/auto-sim.js` の `TRANSIENT_KEYS` に以下を追加:
- `_shownF08PreMatchIds`
- `_shownF08PostMatchIds`
- `_pendingF08Aftermath`

---

## 7. Step 6 — rivalry 50+ 宣戦布告との排他制御

`src/app.js` の rivalry 宣戦布告ポップアップ検出箇所（L4710付近、`rivalry50+ ペアの宣戦布告ポップアップを検出` コメント部分）で、F08 ロックされた試合は除外する:

```javascript
// rivalry50+ ペアの宣戦布告ポップアップを検出（F08ロック試合は除外）
G.showCard.forEach((m, idx) => {
  if (m._f08Locked) return;  // F08優先、rivalry宣戦布告はスキップ
  // ... 既存ロジック ...
});
```

---

## 8. Step 7 — auto-sim 検証

### 8.1 実行

```bash
node test/auto-sim.js --seasons=100 --seeds=5 2>&1 | tail -30
```

### 8.2 確認項目

- 違反0、エラー0
- F08 イベント発火回数（既存と変わらないこと）
- `_pendingF08Aftermath` などの transient が正しくクリアされていること
- セーブ→ロード後に `_shownF08PreMatchIds` 等が消えていること

### 8.3 失敗時

エラーログを抽出し、失敗の原因を特定。Step 1〜6 のいずれかに戻って修正。

---

## 9. Step 8 — 実機検証ガイド

完了報告に以下のチェックリストを含める:

- [ ] F08-A モーダル（社長判断A）→ 興行週へ進む
- [ ] 興行当日、F08 ロック試合がフォーカスされた瞬間、F08 試合前モーダル発火
- [ ] 試合前モーダル: 両リーダーセリフ表示、ダークテーマ、BGM `bgm_tension_v1.mp3` + ゴング1打
- [ ] 「試合へ進む →」で試合開始、試合中の演出は通常通り
- [ ] 試合終了後、F08 試合後モーダル発火
- [ ] 試合後モーダル: 勝者セリフ + 敗者セリフ（HP帯分岐）+ ナレーション結び + チャイム1打
- [ ] 「閉じる」で次試合 or 興行サマリへ進む
- [ ] 同じ試合で2回目以降は試合前後モーダルが再表示されない
- [ ] rivalry 50+ ペアが F08 ロック試合だった場合、rivalry 宣戦布告がスキップされ F08 試合前モーダルが優先される
- [ ] F02③ resolution と同時発火時、F02③ モーダルのみ表示され、F08 試合後モーダルはスキップ（または F02③ 後に出る形式）

---

## 10. Step 9 — 仕様書追記

Step 1 で適用した spec patch がすべて反映されていることを確認:

- `specs/faction-system-spec-v0.1.md` の §9.8.1 / §17 / §12 / §15 / §16 が更新されている
- 変更履歴 v0.9 のエントリが追加されている

---

## 11. Step 10 — ローカルコミット

```bash
git add -A
git status  # 変更ファイルを確認
git commit -m "Phase 3e: F08-A 直接対決 試合前後モーダル新設

- showFactionF08PreMatchModal / showFactionF08AftermathModal 新設
- セリフテーブル4種（性格×アーキタイプ × hostility帯/HP帯分岐）
- 試合結果による派閥関係追加変動（敗者末端 trust / リーダー間 rivalry / 勝者団結 bond）
- ダークテーマ用 fevt-overlay-arena CSS新規
- rivalry 50+ 宣戦布告との排他制御
- RNG 0xFA83-0xFA87 追加
- auto-sim 5シード × 100シーズン ALL CLEAR"
```

**push しない**（CLAUDE.md規約: Cloudflare Pages 自動デプロイの都合で push は Keisuke 判断）。

---

## 12. やらないこと（重要）

- ❌ 末端メンバー試合での演出（リーダー幹部級限定）
- ❌ 試合中のBGM・進行・演出変更
- ❌ プレイヤー判断UIの追加（既存F08モーダルA/B/Cで完結）
- ❌ 数値表示（hostility/momentum 変動量はモーダルに出さない）
- ❌ テンプレセリフ
- ❌ F09・抗争ポイント制への先回り実装（Phase A スコープ外）
- ❌ 派閥画面リデザインへの先回り実装（Phase A' スコープ外）
- ❌ 既存 F08モーダル本体の改変
- ❌ `Engine.factions.applyMatchResult` 既存ロジックの変更

---

## 13. 完了基準

以下がすべて満たされたら Phase 3e 完了:

- ✅ Step 1〜10 すべて完了
- ✅ auto-sim 100シーズン × 5シード ALL CLEAR
- ✅ 実機検証チェックリスト全項目 OK（Keisuke 確認）
- ✅ ローカルコミット完了
- ✅ 仕様書 v0.9 反映完了
- ✅ Keisuke の体感確認: 「血みどろ感が出てきた」と判断

---

## 14. 完了報告フォーマット

Keisuke への完了報告には以下を含めること:

1. 実装したファイル一覧と変更行数
2. auto-sim 結果（シーズン数 / シード数 / 違反数）
3. **実機確認してほしい操作の具体的列挙**（§9 の検証チェックリスト全項目）
4. 既知の制約・未対応事項（あれば）
5. 次フェーズ（Phase A' 派閥画面リデザイン Mockup）への引き継ぎ事項
