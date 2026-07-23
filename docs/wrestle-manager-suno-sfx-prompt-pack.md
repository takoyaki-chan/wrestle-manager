# レッスルマネージャー Suno Sounds 統合効果音プロンプト集

作成日: 2026-07-23  
方針: 新規制作する音を50個のマスターCueへ集約し、共用、音高、音量、組合せで統一感を作る。既存の試合技SEはすべて維持し、生成対象へ含めない。うちエラー2 CueはSunoを使わずコード合成する。

上位計画: [音響全面再設計マスタープラン](./wrestle-manager-audio-redesign-master-plan.md)

## 1. 統合の考え方

- 出来事ごとに専用音を作らず、「決定」「上昇」「警告」「結合」「対立」など意味ごとに音を作る。
- 同じマスター音を再生速度、音高、音量、連打回数で変化させる。
- 重要演出は新しい音を増やすより、2つの既存Cueを順番に鳴らして格を上げる。
- プロンプトに秒数を書いても出力尺へ安定して反映されないため、秒数指定は入れない。
- Suno SoundsではOne Shotとして生成し、採用後に必要部分だけを切り出す。
- UI07とUI08のエラー音はSuno生成対象外。余計な警報、歪み、残響が出やすいためWeb Audioで固定する。
- UIと演出はNES/Famicom 2A03系。試合中の追加音は、身体やリングの実音をファミコン時代の低ビットサンプルへ圧縮した質感にする。メロディックな電子音にはしない。

## 2. 共用時の変化ルール

| 変化 | 実装例 | 使用例 |
|---|---|---|
| 通常 | 音高1.00、音量1.00 | 決定、通常配置 |
| 軽い結果 | 音高1.05、音量0.8 | 小成長、通常発見 |
| 重要結果 | 音高0.95、音量1.1、50ms後に再度鳴らす | 王座戦指定、希少発見 |
| 解除 | 音高0.88、短く再生 | 任命解除、カード解除 |
| 危機 | 音高0.85、音量1.15 | 資金危機、重傷 |
| 大成功 | 基本Cueの後にRS系ジングル | 王座移動、優勝 |

## 3. 全ゲーム箇所への共用割当

| 場面 | 使用Cue |
|---|---|
| タイトル開始、通常決定 | UI01 |
| 戻る、解除、閉じる | UI02、必要時UI05 |
| タブ、並替、フィルター、ヘルプ見出し | UI03 |
| ON/OFF、王座戦以外の設定 | UI04を音高違いで共用 |
| モーダル、選手カード、詳細画面 | UI05 |
| 通常通知、期限通知 | UI06、注意時UI07 |
| 入力不足、配置不可、資金不足 | UI07、重大時UI08 |
| 保存、読込、インポート、エクスポート | UI06の通常通知を共用 |
| 新聞、年代記、帳簿 | UI09 |
| 練習、宣伝、休養、集中特訓 | MG01を音高違いで共用 |
| 週送り、新週、シーズン移行 | 処理中は既存のcode synth `tick`、切替時UI09、完了時UI06を共用 |
| 収入、スポンサー収入、賞金 | MG03 |
| 支出、設備、コーチ費、契約金 | MG04 |
| 成長、人気、順位、好調 | MG05 |
| 低下、衰え、人気減、順位低下 | MG06 |
| 資金難、契約期限、軽傷・重傷 | MG07を音量違いで共用 |
| 負傷復帰、調子回復、選手復帰 | MG08 |
| コーチ任命、派閥加入、関係成立 | HR01 |
| コーチ解除、派閥離脱、契約終了 | HR02 |
| スカウト、データ検索、候補探索 | HR03 |
| 候補発見、能力公開、ドラフト候補公開 | HR04 |
| 契約提示、入札、移籍回答 | HR05 |
| 契約成立、更新、雇用、スポンサー成立 | HR06 |
| 交渉決裂、競り負け、拒否 | HR07 |
| 加入、退団、移籍、レンタル帰還 | HR08を正逆方向で共用 |
| 興行準備に入る | SH01のみ。常時鳴る観客ベース音は置かない |
| 会場変更 | SH02 |
| 選手配置 | SH03 |
| 選手解除 | SH04 |
| 入替、試合順変更 | SH05 |
| タッグ統合、チーム成立 | SH06 |
| 王座戦、因縁戦、固定カード指定 | SH07 |
| 自動編成、全カード完成 | SH08 |
| 興行開始、興行全体の開幕 | SH09 |
| ドラフト開幕 | EV06の重要公開音を共用 |
| 対戦カード・選手名表示 | UI05のパネル音を共用 |
| VS表示 | EV03の因縁・対峙音を共用 |
| 王者・ベルト表示 | SH07の特別条件指定音を共用 |
| 打撃、投げ、関節、空中技、グラウンド、丸め込み | 既存のhitStrike、hitThrow、hitSub、hitAerial、hitGround、hitRollupを維持 |
| 空振り、カウンター | 既存のmissWhiff、counterSEを維持 |
| 大技予告、着弾、フィニッシャー | 既存のbigmoveCharge、bigmoveImpact、finImpactを維持 |
| キックアウト、脱出、緊張演出 | 既存のkickoutSE、guEscapeSE、heartbeatSEを維持 |
| タッチ、ホットタグ、合体技、誤爆、裏切り | 既存のtouchSE、hotTagSE、doubleTeamSE、friendlyFireSE、betrayalSEを維持 |
| 開始・終了ゴング | 既存のgongStart、gong、bellx3を維持 |
| レフェリーカウント | 新規BTA01。現在の合成countと比較し、良い方を採用 |
| タップアウト | 新規BTA02を追加。TKOは既存bellx3＋finImpactを維持 |
| 大技、カウンター、ホットタグ | 既存技SEにCR03またはCR06を必要時だけ重ねる。最大歓声はCR03を音量違いで重ねる |
| 通常歓声、大歓声 | CR03を共用。最大歓声は音量を上げ、80msずらして2回重ねる |
| ブーイング | CR05 |
| 驚き、ニアフォール | CR06を短縮／通常再生 |
| 通常勝利、敗北、番狂わせ | RS01、RS02、RS03 |
| 王座防衛、王座移動、優勝、殿堂入り | RS04 |
| 満員、記録、順位上昇、実績 | RS05 |
| 不入り、興行失敗、順位低下 | RS06 |
| 好意、絆上昇、和解 | EV01 |
| 悪化、絆低下、不穏な結果 | EV02 |
| 因縁発生、挑戦状、対峙 | EV03 |
| 裏切り、派閥分裂・解散 | EV04 |
| 派閥結成、世代交代、復帰発表 | EV05 |
| 新聞スクープ、年代記新章、重要発表 | EV06 |
| 引退 | EV02を弱く鳴らした後に引退BGM |
| 追悼 | 原則無音で追悼BGMのみ |

## 4. 共通UI 9 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-UI01 | 決定 | `Very short crisp NES/Famicom confirm blip, two clean ascending square-wave notes, satisfying and neutral, dry isolated one-shot, no music, no voice.` |
| WM-SE-UI02 | 取消・戻る | `Very short NES/Famicom cancel blip, two soft descending square-wave notes, clean and unobtrusive, dry isolated one-shot, no music, no voice.` |
| WM-SE-UI03 | 移動・タブ・並替 | `Tiny 8-bit interface-move sound, quick horizontal square-wave sweep and soft click, crisp and light, dry isolated one-shot, no music.` |
| WM-SE-UI04 | トグル | `Tiny NES toggle sound, tight click followed by one clear square-wave ping, neutral enough for pitch-shifted on and off versions, dry isolated one-shot.` |
| WM-SE-UI05 | 開く・閉じる | `Short retro 8-bit panel-open sound, compact digital unfold with a soft final click, suitable for reversed close version, dry isolated one-shot, no music.` |
| WM-SE-UI06 | 通常通知 | `Short friendly NES notification chime, three small clear square-wave pings, informative not celebratory, dry isolated one-shot, no voice.` |
| WM-SE-UI07 | 警告・軽いエラー | **Suno生成対象外。** Web Audioで160Hzのsquareを60ms×2回、80ms間隔、低音量、残響なし。現在の`error()`を基準にする。 |
| WM-SE-UI08 | 重大エラー | **Suno生成対象外。** Web Audioで130Hzのsquareを90ms、その後90Hzを140ms、最後に短いnoise click。全長300ms以内、残響なし。 |
| WM-SE-UI09 | 紙・帳簿・年代記 | `Soft natural page turn of one thick paper sheet, gentle airy paper rustle, warm and subtle, no click, no snap, no scratch, no digital sound, no music, close dry one-shot.` |

## 5. 週進行・経営 7 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-MG01 | 方針選択 | `Short NES management-choice sound, three orderly rhythmic square-wave taps, focused and pleasant, dry isolated one-shot, no music.` |
| WM-SE-MG03 | 収入 | `Short cheerful retro income sound, compact cluster of bright 8-bit coin pings, rewarding but not a fanfare, dry isolated one-shot.` |
| WM-SE-MG04 | 支出 | `Short restrained retro expense sound, two coin pings dropping into a muted low stamp, clear and neutral, dry isolated one-shot.` |
| WM-SE-MG05 | 上昇・成長 | `Very short rewarding NES progress-up sound, two rising square-wave notes and a tiny sparkle, suitable for pitch variations, dry isolated one-shot.` |
| WM-SE-MG06 | 低下・衰え | `Short subdued NES progress-down sound, three clipped notes stepping downward, disappointed but not comedic, dry isolated one-shot.` |
| WM-SE-MG07 | 危機・負傷 | `Short urgent NES danger alert, abrupt low impact followed by three clipped warning beeps, serious and scalable for stronger crisis versions, no voice.` |
| WM-SE-MG08 | 回復・復帰 | `NES recovery sound effect, cautious opening resolving into a warm rising square-wave phrase, hopeful, compact and clean, no vocals.` |

## 6. 人事・契約 8 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-HR01 | 接続・任命 | `Short satisfying 8-bit connection sound, two separate pings joining into one stable chord, dry isolated one-shot, no music.` |
| WM-SE-HR02 | 解除・離脱 | `Short 8-bit disconnection sound, one joined chord separating into two soft downward pings, dry isolated one-shot, no music.` |
| WM-SE-HR03 | 探索 | `Short retro 8-bit search pulse, radar-like square-wave sweep with two curious ticks, dry isolated one-shot, no music.` |
| WM-SE-HR04 | 発見・公開 | `Short NES reveal sound, quick hidden-card flip and clear discovery ping, suitable for doubled rare-reveal version, dry isolated one-shot.` |
| WM-SE-HR05 | 提示・入札 | `Short 8-bit offer-submit sound, digital chip click, paper slide and firm confirm ping, dry isolated one-shot, no music.` |
| WM-SE-HR06 | 成立・押印 | `Compact NES agreement sound effect, digital signature scratch, strong stamp and short rising flourish, professional and rewarding, no vocals.` |
| WM-SE-HR07 | 拒否・決裂 | `Ultra-short NES/Famicom negotiation rejection sound effect, one low square-wave thud immediately followed by two descending blips, abrupt hard stop, no tail, no sequence, no music, no buzzer, no voice.` |
| WM-SE-HR08 | 到着・出発 | `Short 8-bit travel transition, distant digital sweep arriving into a confident ping, suitable for reversed departure version, dry isolated one-shot.` |

## 7. 興行準備・試合前演出 9 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-SH01 | 会場へ入る | `Short retro wrestling venue-entry cue, distant crowd swell behind a crisp 8-bit arena-door reveal, no speech, clean short ending.` |
| WM-SE-SH02 | 会場決定 | `Short NES venue-select sound, quick room-size sweep ending in a firm booking ping, satisfying dry isolated one-shot, no music.` |
| WM-SE-SH03 | カード配置 | `Short satisfying NES wrestler-card placement, firm digital card snap followed by a confident low-high ping, dry isolated one-shot.` |
| WM-SE-SH04 | カード解除 | `Short NES wrestler-card removal, light card lift and soft descending blip, clean and unobtrusive, dry isolated one-shot.` |
| WM-SE-SH05 | 入替・並替 | `Short 8-bit card-reorder sound, two fast crossing digital sweeps ending in a locked-position click, dry isolated one-shot.` |
| WM-SE-SH06 | 統合・タッグ化 | `Short NES merge sound, two separate square-wave pings rushing together into one strong combined impact, dry isolated one-shot.` |
| WM-SE-SH07 | 特別条件指定 | `Prestigious compact 8-bit special-match cue, bright belt-like shimmer above a weighty confirm hit, tense and important, clean ending.` |
| WM-SE-SH08 | 編成・カード完成 | `Compact NES match-card-complete sound effect, sequential card clicks aligning into a proud arena chord, rewarding, no vocals.` |
| WM-SE-SH09 | 興行開始 | `Short NES/Famicom wrestling-event opening sound effect, bright ascending square-wave sweep like arena lights turning on, restrained crowd anticipation and one clean final pulse, no bell, no gong, no combat impact, no victory fanfare, no voice.` |

## 8. 試合・リング 新規追加2 Cue

### 既存のまま維持する音

| 分類 | 既存実装 |
|---|---|
| 技の基本6分類 | hitStrike、hitThrow、hitSub、hitAerial、hitGround、hitRollup |
| 攻防演出 | missWhiff、counterSE、cutinSlide、lockIn |
| 大技・決着 | bigmoveCharge、bigmoveImpact、kickoutSE、guEscapeSE、heartbeatSE、finImpact |
| 試合開始 | ready、fightStart、gongStart |
| タッグ専用 | touchSE、hotTagSE、doubleTeamSE、friendlyFireSE、betrayalSE |
| その他 | count、gong、bellx3、phaseChg、victoryFanfare |

これらは新規生成も差し替えも行わない。ゲーム内で不足が明確になった場合だけ再検討する。

### 明確に足りない追加音

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-BTA01 | レフェリーの実音カウント | `NES/Famicom-era low-bit sampled wrestling sound effect, one sharp referee hand slap on the ring canvas, physical and punchy, short dry one-shot, no melodic beep, no crowd, no voice, no music.` |
| WM-SE-BTA02 | タップアウトの手叩き | `Exactly three separate hand slaps on a wrestling ring canvas: TAP, TAP, TAP. Evenly spaced, each hit clearly distinct, physical, urgent and dry, no extra taps, no crowd, no voice, no music.` |

ロープ反動、コーナー衝突、場外落下は、現在の試合データに専用発火イベントがないため生成しない。将来、技メタデータにこれらの区分を追加した時点で制作する。

## 9. 観客反応 3 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-CR03 | 通常歓声 | `Short medium wrestling crowd cheer, compact nonverbal excitement and applause, natural quick decay, isolated reaction, no speech, no music.` |
| WM-SE-CR05 | ブーイング | `Short wrestling crowd boo reaction, unified nonverbal disapproval, forceful but clean, no intelligible words, no music.` |
| WM-SE-CR06 | 驚き・ニアフォール | `Wrestling crowd shock swell, sudden collective gasp rising toward a near-fall and cutting off cleanly, no speech, no music.` |

## 10. 結果ジングル 6 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-RS01 | 通常勝利 | `Instrumental NES/Famicom wrestling victory jingle, compact heroic square-wave fanfare, triangle bass and crisp finish, clean ending, no vocals.` |
| WM-SE-RS02 | 敗北 | `Instrumental NES/Famicom defeat sting, restrained falling minor phrase and low triangle finish, serious not comedic, clean ending, no vocals.` |
| WM-SE-RS03 | 番狂わせ | `NES/Famicom upset jingle, shocking dissonant opening instantly turning into an unexpected bright victory flourish, clean ending, no vocals.` |
| WM-SE-RS04 | 王座・優勝・最高栄誉 | `NES/Famicom grand-honor fanfare, solemn opening, royal square-wave melody and historic final chord, majestic clean ending, no vocals.` |
| WM-SE-RS05 | 達成・上昇 | `Polished NES/Famicom achievement jingle, sparkling reveal rising into a warm confident chord, clean ending, no vocals.` |
| WM-SE-RS06 | 失敗・下降 | `NES/Famicom poor-result sting, sparse empty notes and a muted downward finish, disappointed but not comedic, no vocals.` |

## 11. 物語イベント 6 Cue

| ID | マスター用途 | Suno Soundsプロンプト |
|---|---|---|
| WM-SE-EV01 | 好転・絆・和解 | `Warm compact NES event cue, two separate square-wave notes resolving together into a gentle consonant chord, clean ending, no vocals.` |
| WM-SE-EV02 | 悪化・別離 | `Subdued compact NES event cue, one warm chord splitting into two distant descending notes, restrained and serious, clean ending.` |
| WM-SE-EV03 | 因縁・対峙 | `Compact NES confrontation sound, two opposing square-wave pulses colliding in dissonance and stopping unresolved, dramatic, no vocals.` |
| WM-SE-EV04 | 裏切り・崩壊 | `Compact NES betrayal sound, brief silence, sharp broken impact and a stable motif collapsing into dissonance, clean ending, no vocals.` |
| WM-SE-EV05 | 結成・継承・復帰発表 | `Compact NES new-era sound, several distinct notes gathering into a strong rising chord, hopeful and important, clean ending, no vocals.` |
| WM-SE-EV06 | スクープ・重要公開 | `Compact NES major-reveal sound, sharp page snap, flashing square-wave blips and one dramatic discovery hit, clean ending, no vocals.` |

## 12. 生成順序

### 第1陣: 手触りの核 18 Cue（Suno生成16＋コード合成2）

- UI01～UI09
- SH03～SH09
- BTA01、BTA02

### 第2陣: 経営と人事 15 Cue

- MG01、MG03～MG08
- HR01～HR08

### 第3陣: 観客反応 3 Cue

- CR03、CR05、CR06

### 第4陣: 結果と物語 14 Cue

- RS01～RS06
- EV01～EV06
- SH01、SH02

新規制作は合計50 Cue。Sunoで生成するのは48 Cue、UI07とUI08はコード合成する。既存の試合技SEはこの件数に含めず、すべて維持する。時間経過は既存tick、UI09、UI06の組合せで表現する。プロンプト内の秒数ではなく、生成後の切り出しで最終尺を決める。

## 13. 採用・編集ルール

- 各Cueは4候補生成し、最大2候補だけ残す。
- UI音は同じ矩形波の輪郭、同じ残響量に揃える。
- 音高差分で済むものは別ファイルを作らない。
- 重要演出は `基本SE → 50～150ms → 結果ジングル` の組合せで表現する。
- 同一Cueは250ms以内に再発音しない。カウントと打撃だけ例外にする。
- 追悼はSEを足さず、無音から専用BGMへ入る。
- 現在の既存音が新候補より良い場合は、既存音をそのCueの採用品として残す。

## 14. 生成記録

| Cue ID | 日本語用途名 | Suno URL/ID | 生成日 | 候補 | 採用 | 編集範囲 | 共用先 |
|---|---|---|---|---|---|---|---|
| WM-SE-UI01 | 決定 |  |  |  |  |  |  |
