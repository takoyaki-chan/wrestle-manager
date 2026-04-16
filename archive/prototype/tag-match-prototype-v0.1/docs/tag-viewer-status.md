# タッグマッチビューア — 実装ステータス
最終更新: 2026-03-25

## 完了済み

### レイアウト
- [x] 3カラムグリッド（1fr / 1.1fr / 1fr — WM本体準拠）
- [x] トップバー（TEAM A名 / TEAM B名）
- [x] 中央カラム: HUD(ターン/フェーズ/連携) → バトルログ(下から積み上げスクロール) → カレントムーブ
- [x] カレントムーブの下端がプレイヤーカードの下端と一致
- [x] NEXT TURNボタンがカレントムーブ直下（グリッドrow 2 center）
- [x] HPバーを各プレイヤーカード内に配置（名前の下、パラメータの上）
- [x] HPバー方向: A=RTL(左向き)、B=LTR(右向き) — 全バー統一
- [x] エプロンカードにステータスバー追加

### 画像
- [x] リーガルマン: stand画像（向かい合い配置、A側scaleX(-1)）
- [x] エプロン: upper画像（100×140px枠、125%拡大で見切れ表示）
- [x] 勝利画面: upper画像 × 2人
- [x] HPゾーン/エプロン: face画像
- [x] スキャンライン + ビネット + モニターフレーム角 + brightness/contrast フィルター
- [x] 画像パス: `../wrestle-manager/image/` （直接開き・サーバー両対応）
- [x] portrait-map.js インライン化

### サウンド（WM本体SE_MIX完全準拠）
- [x] 技カテゴリ→SE直結マッピング（strike/throw/submission/aerial/ground/rollup）
- [x] ダメージ量によるvolume ratio: clamp(dmg/20, 0.3, 1.5)
- [x] 統合タイムライン（executeTurnTimeline）で音・エフェクト・テキスト同期
- [x] フェーズtempo準拠のタイミング（Opening:2000, Mid:2000, End:2500, Climax:3000ms）
- [x] 大技: charge→t(0.45)→hitSE、カウンター: counterSE(×0.5)→t(0.4)→技音(×1.3)
- [x] 試合開始ゴング音
- [x] ファンファーレは勝利画面の名前表示時に再生

### 演出エフェクト
- [x] ダメージ数字ポップ（通常=赤、大技=金、カウンター=シアン）
- [x] ディフェンダーリアクション（HP帯別セリフ: high/mid/low）
- [x] ダメージレベル別シェイク（light/med/hard）+ フラッシュ
- [x] HP危険グロー（HP≤25%で赤い脈動）
- [x] カウンターフラッシュ
- [x] ビッグムーブ名スプラッシュ（MOVE ZONE内）
- [x] ゴールドオーラ（モメンタム逆転時）
- [x] フラッシュオーバーレイ（ホットタグ/ダブルチーム/決着）

### タッチ交代
- [x] 縮小→拡大アニメーション（リーガル先、エプロン後）
- [x] タッチバナー（🔄 / 🔥 ホットタグ）
- [x] 枠グローハイライト
- [x] 大技+タッチ同ターン → 800ms遅延で分離表示
- [x] タッチターンではSE無音

### 決着演出
- [x] フィニッシュオーバーレイ（暗転 + クリック進行）
- [x] フォール: ワンッ！→1ーーーっ！→ツー！→2ーーーーっ！→3！→3ーーーーっ！！！
- [x] ギブアップ: 極まったーっ！→タップ！タップ！→決着！
- [x] カウント間隔: WM本体準拠 800→1000ms
- [x] カウント3後に余韻（1.5秒）→ 勝利画面
- [x] キックアウト: 1→2→返したーっ！！ + フラッシュ + SE

### 勝利画面
- [x] 段階的フェードイン（WM本体タイムライン準拠）
- [x] 勝者ポートレート（upper × 2）
- [x] WINNER ラベル + 金グラデ名前
- [x] 敗者チーム（face × 2 + 名前）
- [x] MQ / TURNS / SEGS 表示
- [x] CLOSEボタン

### 実況（CMT）
- [x] フェーズ別攻撃実況（Opening/Mid/End/Climax/big 計19パターン）
- [x] ダメージ量別実況（light/medium/heavy 各3パターン、ダメージ値表示）
- [x] ミス/カウンター/状況実況（kickout/guEscape/gritBuff等）
- [x] 決着タイプ別実況（finFall/finGU/finTKO/rollOK）

### 操作
- [x] NEXT TURN（クリック連打防止: フェーズtempo準拠のロック時間）
- [x] AUTO再生（2500ms / 1500ms / 800ms — WM本体AUTO_DELAY準拠）
- [x] スライダー（任意ターンジャンプ）
- [x] キーボード: →/Space=次, ←=前, P=自動, N=新試合

### エンジン拡張
- [x] turnLogにactionオブジェクト追加（type/atkId/defId/move/moveCat/dmg/isBig/defHpRatio/personality/archetype）

---

## 未実装 / 今後の課題

### 高優先度
- [ ] ダメージ台詞/ボイスカットイン（personality×archetype別、DAMAGE_SERIF_LINES/DAMAGE_VOICE_LINES）
- [ ] 攻撃者カットイン（ビッグムーブ時のpersonality別セリフ、CUTIN_LINES.bigmove）
- [ ] 勝利セリフ（勝者のpersonality別コメント）
- [ ] WM本体バトルエンジンの音タイミングの更なる精密化（特にカウンター時の大技カウンターシーケンス）

### 中優先度
- [ ] グリットインジケーター表示（⚡ 闘志 残Xターン）
- [ ] グリット発動時の金ボーダー表現
- [ ] 丸め込みの専用演出シーケンス
- [ ] TKO決着の専用演出（ベル×3）
- [ ] 時間切れHP判定の演出

### 低優先度
- [ ] BGM対応（bgm_battle_v1.mp3のループ再生）
- [ ] 音量設定UI
- [ ] レスポンシブ対応（モバイル画面）
- [ ] 試合カード選択UI（手動チーム編成）
- [ ] WM本体への統合準備（iframe連携、postMessage API）

---

## 技術メモ
- **ファイル構成**: match-viewer.html 1ファイル完結（CSS/JSインライン）
- **依存**: wm-data.js, wm-engine.js, tag-data.js, tag-engine.js
- **画像パス**: `../wrestle-manager/image/` （portrait-map.jsのマッピング使用）
- **音声パス**: `../wrestle-manager/bgm/`
- **サーバー**: `serve ..` で Downloads/ をルートに（launch.json: tag-proto）
- **フェーズtempo**: `t(p) = tempo * p` （WM本体 battle-engine.html line 1901-1902）
