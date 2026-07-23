# レッスルマネージャー Suno短文プロンプト集

上位計画: [音響全面再設計マスタープラン](./wrestle-manager-audio-redesign-master-plan.md)  
制作計画: [レッスルマネージャー 音楽制作計画](./wrestle-manager-audio-production-plan.md)
効果音: [Suno Sounds 効果音プロンプト集](./wrestle-manager-suno-sfx-prompt-pack.md)

## 共通設定

### BGM

- Create: `Music`
- Model: `v5.5`
- Custom: ON
- Instrumental: ON
- Lyrics: 空欄
- Duration: 各曲の指定秒数
- 生成後、最も自然な 8 または 16 小節を WAV から切り出してループ化する

### ジングル

- Create: `Sounds`
- Type: `One Shot`
- Instrumental の音楽ジングルとして生成する

### BGM用 Exclude（Pro/Premierの Music → Custom → Advanced Options）

無料プランでは表示されない。Sounds の One Shot ではこの欄を前提にせず、必要な禁止事項をプロンプト本文へ直接入れる。

```text
vocals, singing, chanting, choir, spoken word, modern synths, realistic instruments, SNES samples, EDM, rock band, fade-out
```

音色が現代的になった場合だけ、各プロンプト末尾に次を追加する。

```text
Strict four-channel NES 2A03 sound only, no modern layers.
```

---

## A. コア・経営画面

### WM-C01 タイトル・オープニング — 55秒 / Music

```text
Instrumental NES/Famicom 2A03 title theme, grand royal opening, memorable heroic motif, wrestling ambition and management strategy, noble and exciting, seamless loop.
```

### 旧WM-C02 メインメニュー（独立枠廃止）

このIDで生成済みの候補は、WM-C03 通常経営の候補として比較する。新規生成には使わない。

```text
Instrumental NES/Famicom 2A03 menu theme, confident and inviting, steady pulse melody, anticipation before building a wrestling empire, relaxed seamless loop.
```

### WM-S00 メインメニュー — 50秒 / Music

WM-C02名で生成済みのメインメニュー候補だけを、この用途の候補へ合流する。WM-C01オープニングの既存曲・候補は通常経営へ混ぜない。

```text
Instrumental NES/Famicom 2A03 management loop, bright strategic mood, simple memorable melody, steady triangle bass, focused and pleasant for repeated listening.
```

### WM-C04 選手一覧 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 roster-screen loop, clean analytical pulse melody, light forward motion, discovering wrestler strengths and potential, compact and unobtrusive.
```

### WM-C05 育成 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 training loop, upbeat determined rhythm, rising progress motif, disciplined repetition and visible growth, energetic but not battle music.
```

### WM-C06 スカウト — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 scouting loop, curious searching melody, clipped triangle bass, hidden talent and discovery, lightly suspenseful and optimistic.
```

### WM-C07 契約交渉 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 negotiation loop, cool minor tension, ticking pulse rhythm, money and deadline pressure, clever restrained melody, clean seamless reset.
```

---

## B. 団体状況

### WM-S01 好調時 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 success loop, bright major key, confident rising motif, a wrestling promotion gaining momentum, lightly triumphant without becoming a fanfare.
```

### WM-S02 資金難 — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 financial-crisis loop, anxious minor pulse, ticking noise rhythm, shrinking time and difficult calculations, urgent but controlled.
```

### WM-S03 不穏 — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 ominous loop, cold minor harmony, sparse pulse motif, heartbeat-like triangle bass, faction conflict and approaching betrayal.
```

### WM-S04 負傷 — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 emergency injury loop, abrupt alarm-like opening, urgent staccato pulse, rapid heartbeat triangle bass, immediate shock and medical crisis, tense and serious, no mystery, no vocals.
```

### WM-S05 団体危機 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 organization-crisis loop, urgent minor ostinato, unstable rising melody, collapse feels near but recovery remains possible, tense seamless reset.
```

---

## C. 通常興行の試合前

### WM-M01 通常試合前 — 30秒 / Music

```text
Instrumental NES/Famicom 2A03 pre-battle loop, 128 BPM, driving pulse lead, tense triangle bass, crisp noise drums, two wrestlers facing off seconds before the bell, speed and weight in balance.
```

### WM-M03 因縁戦 — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 pre-battle loop, 124 BPM, hostile minor melody, relentless bass, sharp noise drums, bitter rivals staring down before violent revenge.
```

### WM-M04 王座戦 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 championship pre-battle loop, 120 BPM, noble minor fanfare, driving bass and drums, enormous stakes and imminent combat.
```

---

## D. 季節の特別興行・試合前

共通方針: 試合中より一段低い熱量。82～104 BPM、低～中密度、未解決の和声と間で「ゴングを待つ緊張」を作る。その奥に、通常興行とは違う季節祭典の華やぎと観客の期待を薄く加える。高速ドラム、陽気なカーニバル、戦闘のクライマックスは避ける。

### WM-SP01 春A — 30秒 / Music

```text
Instrumental NES/Famicom 2A03 spring-festival pre-match loop, 96 BPM, cool major-minor ambiguity, measured pulse, small rising motif and bright ceremonial blips, fresh challengers under festive banners, restrained tension, no frantic drums.
```

### WM-SP02 春B — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 spring special-event pre-match loop, 90 BPM, suspended minor harmony, alternating youthful square-wave phrases, cautious triangle bass and a subtle opening-day fanfare fragment, held breath before a major clash, controlled and unresolved.
```

### WM-SP03 夏A — 30秒 / Music

```text
Instrumental NES/Famicom 2A03 summer-festival pre-match loop, 102 BPM, dry minor harmony, oppressive heat, pulsing triangle bass, sparse festival-noise ticks and heat-haze arpeggios, excited crowd anticipation beneath mounting pressure, no battle climax.
```

### WM-SP04 夏B — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 summer-night festival championship loop, 86 BPM, humid atmosphere, lantern-like arpeggio glints, ceremonial pentatonic fragments, slow heavy pulse and long rests, dangerous title-fight anticipation with restrained pageantry.
```

### WM-SP05 秋A — 30秒 / Music

```text
Instrumental NES/Famicom 2A03 autumn-festival pre-match loop, 94 BPM, warm dark minor mode, clipped tactical motif, steady measured bass and brief ceremonial flourishes, veteran wrestlers studying each other before an expectant special-event crowd.
```

### WM-SP06 秋B — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 autumn grand-event pre-match loop, 88 BPM, dark golden modal harmony, low ostinato, unresolved noble melody and stately pageant accents, pride and old grudges under quiet pressure, dignified and threatening.
```

### WM-SP07 冬A — 30秒 / Music

```text
Instrumental NES/Famicom 2A03 winter-festival pre-match loop, 82 BPM, icy modal minor, wide rests, isolated square-wave notes, slow heartbeat triangle bass and distant ceremonial chimes, a hushed crowd sharing cold anticipation before the bell.
```

### WM-SP08 冬B — 35秒 / Music

```text
Instrumental NES/Famicom 2A03 year-end grand-festival pre-match loop, 96 BPM, severe heroic minor theme, slow rising cadence, restrained noise drum, warning blips and sparse triumphal fanfare fragments, a packed crowd awaiting the decisive bell, monumental finality held back.
```

---

## E. 大会・大型興行

### WM-E03 最終戦 — 45秒 / Music

```text
Instrumental NES/Famicom 2A03 final-match loop, 128 BPM, severe heroic theme, relentless bass, rising counterline, a long tournament reaching its decisive battle.
```

### WM-E04 PPV — 50秒 / Music

```text
Instrumental NES/Famicom 2A03 PPV event loop, 122 BPM, bold broadcast fanfare, glamorous pulse melody, championship pressure and packed-arena spectacle.
```

### WM-E05 天頂戦 — 50秒 / Music

```text
Instrumental NES/Famicom 2A03 grand-summit tournament loop, 116 BPM, solemn ceremonial fanfare motif above relentless battle drums, once-in-four-years championship gravity, sixteen challengers climbing toward the zenith, towering and sacred, seamless loop.
```

---

## F. 試合・大会結果ジングル — 廃止（2026-07-23、SE側 WM-SE-RS01～RS06 へ一本化。生成済みJ名義候補はRS枠で比較）

---

## G. ドラマ・人物イベント

### WM-D01 裏切り — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 betrayal loop, dissonant minor pulse, broken rhythm and dark bass, trust collapsing into anger, tense and dramatic.
```

### WM-D02 復帰 — 45秒 / Music

```text
Instrumental NES/Famicom 2A03 comeback loop, nostalgic opening motif growing into determined major-minor momentum, a beloved wrestler returning to fight again.
```

### WM-D03 引退 — 50秒 / Music

```text
Instrumental NES/Famicom 2A03 retirement loop, slow dignified melody, bittersweet major harmony, memories of battles and a final respectful arena farewell.
```

### WM-D04 世代交代 — 50秒 / Music

```text
Instrumental NES/Famicom 2A03 generational-change loop, old noble motif answered by a brighter rising theme, farewell and new ambition existing together.
```

---

## H. 歴史・セレモニー

### WM-H01 年代記 — 55秒 / Music

```text
Instrumental NES/Famicom 2A03 chronicle loop, reflective heroic melody, changing eras and remembered rivalries, dignified history with a warm seamless return.
```

### WM-H02 殿堂入り — 55秒 / Music

```text
Instrumental NES/Famicom 2A03 hall-of-fame ceremony loop, stately royal fanfare, warm noble melody, gratitude and lasting wrestling legacy.
```

### WM-H04 エンディング — 55秒 / Music

```text
Instrumental grand symphonic RPG ending performed only with NES/Famicom 2A03 sounds, royal overture, broad heroic melody, pulse-wave brass and strings, triangle timpani, monumental, emotional, seamless loop, not pop.
```

---

## I. 将来機能

### WM-F01 敵地遠征 — 45秒 / Music

```text
Instrumental NES/Famicom 2A03 expedition loop, adventurous minor-major melody, unfamiliar arena and distant challenge, determined travel energy without cultural clichés.
```

### WM-F02 ドラフト — 45秒 / Music

```text
Instrumental NES/Famicom 2A03 draft loop, tense selection pulse, ticking noise rhythm, rival bids and career-changing choices, strategic and urgent.
```

### WM-F03 TV放送 — 40秒 / Music

```text
Instrumental NES/Famicom 2A03 television-broadcast loop, bright urgent fanfare, fast pulse hook, live wrestling spectacle and polished retro broadcast energy.
```

### WM-F04 レジェンド戦 — 45秒 / Music

```text
Instrumental NES/Famicom 2A03 legend-match pre-battle loop, ancient noble motif transformed into a fierce modern battle theme, history and imminent combat.
```

---

## 生成・採用記録

採用作業では、最低限次を記録する。

| ID | Suno URL/ID | 生成日 | 候補番号 | 採用 | 切り出し範囲 | 備考 |
|---|---|---|---|---|---|---|
| WM-C01 |  |  |  |  |  |  |

有料契約中に生成したことを確認できるよう、生成日と Suno の曲 ID を必ず残す。
