# 呼び名(セリフで相手を呼ぶときの名前) 仕様 v1.0

**ファイル**: `specs/call-name-spec-v1.0.md`
**最終更新**: 2026-09-26
**実装状況**: 実装完了(2026-09-25〜26)。Keisuke 実機確認待ち(docs/実機確認バックログ.md)
**裁定**: 2026-09-25 Keisuke「セリフで相手を呼ぶときの呼び名」、K-14(タッグ勝利セリフ)
**関連**: `specs/i18n-runtime-spec-v1.0.md`(名前辞書 pn/pnSurname)、`specs/relationship-system-spec-v2.0.md`(bond)、`specs/battle-presentation-spec-v1.0.md` §5(タッグ決着画面)

---

## 1. 規則

1. セリフの中で他の人物を呼ぶ・名指しするとき、**フルネームを入れない**。基本は**名字**(例: 阿武隈先輩)。
2. 話し手から相手への絆(bond・方向あり `G.relationships['話し手id>相手id']`)が **85 以上**(`Engine.relationships.getBondBand` の devoted と同じ閾値)なら**下の名前**(例: 塔子先輩)。
3. 一度下の名前に切り替えたら、その方向の絆が **50 未満**に冷えるまで名字に戻さない(85 前後で往復させない)。
   判定 = 「絆 ≥ 85」または「記録あり かつ 絆 ≥ 50」。
4. 話し手が選手との絆を持たない人(コーチ・記者・スタッフ・ファン)は**常に名字**。
5. 敬称(さん・先輩・様・選手…)はセリフに書いてあるものをそのまま使う。呼び名は名前の部分だけ。
6. 地の文・新聞・見出し・ログ・UI のラベル(話者名の表示など)は**フルネームのまま**(この仕様の対象外)。
7. 関係値が無い方向は名字。ただし記録のある方向で関係値ごと消えた場合(引退の片付けで関係値が削除された相手など)は、絆が冷えたわけではないので記録どおり下の名前。
8. 自分自身を指すときは名字(下の名前へ切り替えない)。

## 2. 名前の部品

- 名前は `ALL_CHARS`(固定キャスト127名)から引く。引退・休眠・FA・他団体でも同じ。
- 名字 = `ALL_CHARS[].surname`(127名で重複なし)。
- 下の名前 = フルネームから導く(`Engine.relationships._deriveGivenName`)。名前台帳 `i18n/names-ledger.json` の `characters[].jaGiven` と一致すること(テストで突合)。
  - 名字が先頭: 残り(空白入りの「清川 怜」→ 怜)
  - 名字が末尾で中黒区切り: 先頭の語(レオナ・O・シュタインフェルト → レオナ、リナ・モーガン → リナ)
  - 区切りの無いリングネーム(クラッシャー毒島): 下の名前なし → 絆に関わらず常に「毒島」
- ALL_CHARS に無い人物(コーチ「鬼塚 剛志」など): オブジェクトの `surname`、無ければ空白の前を名字とし、選手 id を持たない(= 選手の関係値を引かない)。

## 3. 状態

- `G.givenNameCalls = { '話し手id>相手id': true }`(関係値に相乗りしない別の表。関係値を作り直す処理で消えないように)。
- 更新は `Engine.relationships.updateGivenNameCalls(state)`(純関数・返却値で更新・入力は書き換えない)。tickWeek の**入口**(興行など tickWeek の外で 85 に届いた方向を週内の減衰の前に拾う)と**末尾**(週の関係値の変化が出揃った後)で呼ぶ。
  - 絆 ≥ 85 の方向を記録する(下の名前を持たない相手は記録しない)。
  - 絆 < 50 の方向、下の名前を持たない相手の記録を消す。関係値が無い方向の記録は残す(規則7)。
  - 変化が無ければ同じ state を返す。旧セーブ(表が無い)は、記録が1件できるまで表を作らない。壊れた型は空の表に直す。
- 乱数・絆・その他の数値には一切触れない(テストで、記録の更新を止めた tickWeek と givenNameCalls 以外が一致することを確認)。
- `validateGameState`: 表がオブジェクトであること、キーが '数字>数字' で自分自身でないこと、両者が ALL_CHARS の選手であること、値が true であること。絆の値は見ない(季末処理などで週の途中に動いても誤検知しないため)。

## 4. 関数

| 関数 | 層 | 役割 |
|---|---|---|
| `Engine.relationships.callName(state, speakerId, target)` | Engine | `{ form: 'surname'|'given', ja, full, surname, given, id }`。target は選手 id / 選手オブジェクト / フルネーム / コーチ。相手不明は null |
| `Engine.relationships.callNameParts(target)` | Engine | 名前の部品(名字・下の名前・フルネーム・id) |
| `Engine.relationships.updateGivenNameCalls(state)` | Engine | 週次の記録更新(§3) |
| `Engine.relationships.speechOnlyPlaceholders(tpl)` | Engine | テンプレ(JA原文)の「」の内側にだけ現れるプレースホルダ名の集合 |
| `callNameText(speaker, target, fallback, state)` | UI(ui-common.js) | 表示言語の呼び名。JA は `callName().ja`、EN は `WM_I18N.pnGiven(full)`(下の名前)/`pnSurname(full)`(名字)。speaker は選手 id かオブジェクト、コーチ等は null |
| `tagMatchCallNames(teamA, teamB, state)` | UI(ui-common.js) | タッグ観戦画面へ渡す `{ '話し手id:相手id': 呼び名 }`(両チームの4方向) |
| `WM_I18N.pnGiven(fullJa)` | i18n | 下の名前(EN)。辞書に無ければ pnSurname へ fail-open。生成元は names-ledger の `enGiven` → `lang-en-names.js` の `addGivenNames` |

- **英語の注意**: t() のパラメータ自動変換(名前辞書)はフルネームと名字のキーしか持たない。**日本語の下の名前を t() に渡すと英語画面に日本語が出る**。呼び名は表示側で表示言語の値にしてから渡す(`callNameText`)。Engine 側で JA の名字を dict(=t) に渡す場合は、名字キーが名前辞書にあるので英語の名字になる(`Engine.eventSystem.pickText` の「」内)。
- 英語の敬称は付けない(-san 等なし)。下の名前はミドルイニシャルを含めない(Leona O. Steinfeld → Leona)。

## 5. 適用箇所(セリフの中で他の人物の名前を埋める箇所)

| 画面・経路 | 表(プレースホルダ) | 話し手 → 相手 |
|---|---|---|
| 関係性フラグのポップアップ(`_flagFormatLine`) | FLAG_DIALOGUE `{name2}`(M-1 は `{name}`=離脱者) | 当事者 → 相手(M-12: 残留者 → 出戻り者、M-13: 師匠⇄弟子) |
| 垣間見え R3 別れのモーダル(`_snapshotLine`) | SNAPSHOT_TEXTS.R3.modal `{name2}` | 残る選手 → 去る選手 |
| 道場のコーチの吹き出し | COACH_VOICE_REPORT_LINES `{name}` / HEAT_STATE_COACH_LINES `{name}` | コーチ → 選手(名字) |
| 大会後のコーチ総括 | COACH_WRAPUP_MENTION_LINES `{n1}{n2}` | コーチ → 選手(名字) |
| 派閥の取次(F07・Common-1/3/5) | F07_LINES.coachReport `{leaderName}{targetName}` ほか / COMMON1 `{aName}{bName}` / COMMON5 `{leaderName}` / 加入 `{name}` | 取次(コーチ=名字/古参選手=絆) → 選手 |
| 取次(選択型イベント・団体戦直訴・統一王座挑戦・対立の敗者・F07 社長室へ) | UI 辞書の `{name}` | 取次 → 選手 |
| 契約交渉 | CONTRACT_NEGOTIATION_LINES.rivalry.has_rival `{rivalName}` | 交渉中の選手 → ライバル(`_contractNegForDisplay` が表示用の写しに `rivalCallName` を足す。保存値 `rivalName` はフルネームのまま) |
| 通知(コーチの報告・ファンの声) | NOTIF_EVENT_TEXTS の「」内の `{name}` | コーチ・ファン → 選手(名字。地の文・見出しの地の部分はフルネーム) |
| タッグ決着画面の勝者セリフ(K-14) | TAG_MATCH_WIN_LINES `{partner}` | 決め手の勝者 → パートナー(`matchInfo.callNames`) |

## 6. 対象外

- 地の文・ナレーション: FACTION_TRANSITION_LINES `{leader}`、GLIMPSE_B GL-12、SEASON_REVIEW_LINES、F07 resultTarget、スナップショットの scene・スタッフ報告、LOCKER_AIR/RELATION_EVENT/CAMP_FLAVOR、派閥の observation-note(`{name}が自然と寄り添っているようです。` 等)、B2 対立の報告文(LARGE_EVENT_TEXTS の地の文を取次の吹き出しに表示している)。
- 新聞・見出し・記事(黒田)・実況(TAG_MATCH_COMMENTARY_WIN_LINES 等)・ログ(週のログに残る垣間見えの本人の声を含む)。
- UI のラベル(話者名・肖像下の名前)。
- 敗者のタッグセリフ TAG_MATCH_LOSS_LINES(表示する場所が無い)。

## 7. テスト

- `test/call-name-test.js`: 判定・84↔86 の往復・例外4名・旧セーブ・tickWeek で記録以外不変・validateGameState・通知の「」・英語の名字/下の名前(127名で日本語を含まない)。
- `test/call-name-dialogue-guard-test.js`: 実エンジン+実 i18n(ja/en)で FLAG_DIALOGUE 全行・R3・契約交渉・取次を埋め、話し手≠相手のときフルネームが入らないこと。切り出せない表示点はソースで確認。
- `test/tag-win-lines-callname-test.js`: K-14 の表の形・抽選(名前入り=約20%)・英語・呼び名の表・配線。
