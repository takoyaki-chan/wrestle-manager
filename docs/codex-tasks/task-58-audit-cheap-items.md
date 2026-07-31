# タスク58: 二度押し監査「未確定」のうち、判断の要らないものだけ潰す

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task58`
(ブランチ `fix/audit-cheap-items`)。**新たに worktree・ブランチを作らない。**
**main の作業ツリー(`C:\Users\nkmrk\Downloads\wrestle-manager`)には絶対に触らない**
— Keisuke がそのファイルを直接ブラウザで開いてプレイ中。
**コミットはしない**(変更を残すだけ)。push・配布禁止。

**変更してよいファイル**: `src/app.js` / `src/ui-common.js` / `src/ui-render.js`(該当箇所のみ)、
`test/` 新規、`docs/worklog.md` 先頭。
**変更禁止**: 上記以外。`src/data.js` / `src/management.js` には触らない。

出典: `docs/ui/two-click-audit-v0.1.md` の「残り(未確認・低優先)」。
Keisuke 裁定(2026-07-31): **判断の要らない安いものだけ今潰す。** 残りは触るときに一緒に。

---

## 対象(この5件だけ。増やさない)

### 1. `App.skipAllMatches` の到達不能コード

`src/app.js` の `skipAllMatches` 内、`if (sp.results.some(r => r === null))` ブロックと
その中の **`if (false) { ... }`**。上のループが全indexを埋めるので到達しない。直しかけの跡。

- **消してよいのは `if (false)` の中身だけではない。** その外側のガードも
  「本当に到達しないか」を自分で確かめてから判断する。到達し得るなら**残す**
- 確かめた結果を報告に書く(どのループがどの index を必ず埋めるか)

### 2. `App.stlAdvance` に `'watching'` の分岐が無い

`src/app.js` の `stlAdvance`。`'table'` / `'finalReady'` / `'finalResult'` は見ているが
`else` が無く、それ以外の phase で呼ばれると**無言で何もしない**。

- 想定外の phase で来たら、**無言で落とさず**エラー音+`console.warn` を出して
  現在の phase を残す。ゲームを進行不能にはしない
- 既存の分岐の挙動は変えない

### 3. `showTravelScene` に時限の保険が無い

`src/ui-common.js` の `showTravelScene`。`anim.onfinish = finish` だけに頼っており、
`.animate` が例外を投げた `catch` 側にしか `setTimeout(finish, dur)` が無い。
Web Animations が `onfinish` を発火しない状況(タブ非表示など)で待ちが解けない。

- **正常系にも時限の保険を付ける**(`mockup-baseline-v0.1.md` §5-D 鉄則1)。
  二重発火しないようフラグとセットで書くこと
- クリックで飛ばせる既存の逃げ道は残す

### 4. `renderTenchosenPreEvent` がキューを詰まらせ得る

`src/ui-common.js` の `renderTenchosenPreEvent` 冒頭
`const tp = G.tenchosenPreEvent; if (!tp) return;`。
キューから取り出された時点で `tp` が無いと、**オーバーレイも開かず
`_drainPopupQueue()` も呼ばない**ため、後ろに積まれたポップアップが止まる。

- データが無くて描けないなら、**必ずキューを流してから**戻る

### 5. 動的オーバーレイの close がキューを流さない

`.war-victory-overlay` と `.db-hof-detail-overlay` は `overlay.remove()` で閉じるが、
`_drainPopupQueue()` を呼ばず、`_POPUP_OVERLAY_IDS` の MutationObserver の
監視対象にも入っていない(IDではなくクラスで、生成も DOMContentLoaded 後)。

- 閉じる経路で `_drainPopupQueue()` を呼ぶ。**閉じ方が複数あるなら全部**
- `.cerem-overlay` も同じ形なら合わせて見る(こちらは詰まる経路を見つけられていない。
  同じ扱いにするか、しない理由を報告に書く)

## やらないこと

- `confirmSigning` のロスター上限時の誤表示 → **今回は対象外**(表示の設計判断が要る)
- `App.handleFactionEvent` の未追跡13分岐 → **今回は対象外**(調査であって修正ではない)

## 不変条件

1. **既存の正常系の挙動を変えない**。今回はどれも「異常時に詰まらない/黙らない」ための追加
2. 待ちを足すなら**必ず二重発火防止フラグとセット**(§5-D 鉄則1)
3. GameState への書き込みを増やさない
4. 新規16進カラーを増やさない
5. `node test/run-all.js` 全PASS(170/170 + 新規)

## テスト

`test/audit-cheap-items-test.js`(新規):
- `stlAdvance` に想定外 phase の分岐があること
- `showTravelScene` の正常系に時限の保険と二重発火防止があること
- `renderTenchosenPreEvent` の早期 return がキューを流すこと
- 動的オーバーレイの close が `_drainPopupQueue` を呼ぶこと
- (1を消した場合)到達不能コードが残っていないこと

## 完了報告

1. 5件それぞれ、**直したか / 直さなかったか**と理由
2. 1について「本当に到達しないか」をどう確かめたか
3. 3の時限は何秒にしたか、その根拠
4. 不変条件1〜5の確認結果
5. 迷った点は**実装せずに質問として残す**

`docs/worklog.md` 先頭に詳細ログ。
