# 英語対応 Stage B P7 — データ表の値層(t()を一度も通らない54表)の設計 v0.1

作成: 2026-09-04(Fable)。P6-14の全数突合(specs/i18n-runtime-spec-v1.0.md §13-2 B)で見つかった「3台帳・固有名詞辞書のいずれにも載っておらず、消費点がt()/dictを持たない」54表・約1,445行を英語化する工程。表の全一覧はP6-14のworklogエントリ(docs/worklog.md)にある。

## 0. 位置づけ

- P3b(UI辞書)/P4(テンプレ層)/P5(セリフ層)/P6(配線穴・名前・レイアウト)は完了。EN自動走破は1季完走・`[i18n-miss]` 0
- しかし **miss 0 は完了指標ではない**(missは「t()を通ったが辞書に無い」ときしか出ない)。この層はt()を通らないので、EN走破の「JA exposure by screen」(screen-week 56 / shachoshitsu 55 / log 51 / show 39 / newspaper 33 …)として残る
- 完了指標は **(a) §13-2 Bの表が0になること (b) EN走破のJA露出が gameLogレガシー文字列(specs §8で対象外)を除いて各画面1桁になること** の2本立て

## 1. 表の4分類と行き先

| 分類 | 代表(行数) | 台帳 | 抽出 | 翻訳 |
|---|---|---|---|---|
| **A. 地の文プール**(状況描写・演出文) | SNAPSHOT_TEXTS 276 / NOTIF_EVENT_TEXTS 102 / LARGE_EVENT_TEXTS 86 / WEEKLY_STORY_TICKER 65 / ATMOSPHERE_TEXTS 33 / FAREWELL_KIND_TEXT 15 / LOCKER_AIR_TEXTS 14 / CAMP_FLAVOR_TEXTS 12 / PRE_WINDOW_TEXTS 9 / TEAM_SPIRIT_TEXTS 8 | template-ledger | `test/i18n-extract-templates.js` の `TARGET_TABLES` へ追加(既にdata.jsのトップレベル表を走査する仕組み) | Opus(黒田ではない無署名の地の文= en-kuroda-style の紙面本文/ en-tone-bible §4-6) |
| **B. プロフィール文** | CHAR_PROFILES 127 / ALL_COACHES flavor 125 / COACH_FLAVOR_DEFS 11 | template-ledger | 同上(ALL_COACHESはオブジェクト配列のflavorプロパティ→`extractArrayLiteralProp`型の切り出し) | Opus(選手紹介文=人物紹介の抑えた三人称。dialogue-tone-spec §5でP5末尾送りと明示されていたもの) |
| **C. ラベル・短い定義** | DECISION_DOCS 63 / TRAIT_DEFS 50 / MILESTONE_EVENTS 49 / COACH_ABILITY_CATALOG 13 / PROMO_EVENT_NAMES 12 / GLIMPSE_A_THRESHOLDS 11 / SPECIAL_EVENT_INTROのUI部分 13 / ほかラベル表20数個 | ui-ledger | `test/i18n-extract-ui.js` に **`DATA_TABLES`(明示リスト)モード**を追加: 指定表の文字列値を `source:'TABLE.path'` 付きで台帳化(保全マージ済み・kept扱いではなく走査対象として再現可能に) | Sonnet可(UI用語は既訳に揃える。Fableレビュー) |
| **D. 技名・スタイル語** | STYLE_TAG_MOVES 82 / 技名160種(`MOVES`) | names-ledger(固有名詞辞書)の拡張 | `test/i18n-build-names.js` にmoves節を追加 | **Opusドラフト→Keisuke裁定**(既存の英語圏プロレス技名がある技はそれを使う: German Suplex / Boston Crab / Frankensteiner 等。オリジナル技は意訳or音写を併記して裁定) |

## 2. 配線の規約(既存規約の再確認・変更なし)

- 表示点で `WM_I18N.t()` を1回(specs §6/§8)。Engineが文を組む箇所は `opts.dict` 経由(EngineはWM_I18Nを呼ばない)
- **PH置換・連結より前に dict を通す**(P5-2d/2h/2j/2l/2m/2nで7回踏んだ穴)。断片連結は `join` テンプレ化(§13-1)
- **永続値は変えない**。表示時に再生成できるものは再生成(§13-1)、乱数選出で再生成できないものは `xxxTpl`+`xxxVars` 併記(§12-1/§13-2 PPV_HYPE型)
- 名前は `pn()`/`pnSurname()`(§12)
- **関数の中に直書きした配列は禁止**(§10-2)。プールは必ずトップレベル`const`へ

## 3. バッチ計画

| バッチ | 中身 | 行数目安 | 主筆 |
|---|---|---|---|
| P7-1 | C ラベル表(DATA_TABLESモードの実装込み) | ≈300 | Sonnet(実装)+Fableレビュー |
| P7-2 | A 地の文プール前半(SNAPSHOT_TEXTS 276 + ATMOSPHERE 33 + LOCKER/CAMP/TEAM/PRE_WINDOW/FAREWELL 58) | ≈370 | Opus |
| P7-3 | A 後半(NOTIF_EVENT 102 + LARGE_EVENT 86 + WEEKLY_STORY_TICKER 65)+配線 | ≈250 | Opus |
| P7-4 | B プロフィール文(CHAR_PROFILES 127 + ALL_COACHES 125 + COACH_FLAVOR 11) | ≈260 | Opus |
| P7-5 | D 技名ドラフト(STYLE_TAG_MOVES 82 + MOVES 160)→Keisuke裁定→names-ledger | ≈240 | Opus→Keisuke |

各バッチの完了条件: 対象表が §13-2 Bから消える / build-dict 未訳0 / ja-golden完全一致 / npm test / ja走破digest不変 / EN走破PASS・**JA露出の画面別件数 before→after を報告**

## 4. Keisuke裁定が要るもの

- 技名160種の英語表記(P7-5のドラフト提出時)
- CHAR_PROFILES(選手紹介文)の英語の声: 抑えた三人称・現在形で統一する案(黒田署名ではない)

## 5. 検証の追加

- EN走破の「JA exposure」を**要素一覧モード**で出せるようにする(P6-13で追加予定)。各バッチはその一覧の差分で効果を示す
- `test/i18n-scan.js` の既存計測(翻訳対象の日本語 約47.6万字)と台帳合計(UI+テンプレ+セリフ+名前+本層)を突き合わせ、**未収載の日本語文字数**を毎バッチ報告する
