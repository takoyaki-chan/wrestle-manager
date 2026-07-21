# 🏟️ WRESTLE MANAGER

**女子プロレス団体経営シミュレーション**

新興の女子プロレス団体のオーナーとなり、選手のスカウト・育成・興行開催を通じて団体ランキング1位を目指すブラウザゲームです。

## 🎮 遊び方

### ブラウザでプレイ（推奨）

👉 **[GitHub Pagesでプレイ](https://takoyaki-chan.github.io/wrestle-manager/src/index.html)**

### ローカルでプレイ

1. [ZIPをダウンロード](https://github.com/takoyaki-chan/wrestle-manager/archive/refs/heads/main.zip)してください
2. 解凍後、`src/index.html` をブラウザで開いてください
3. インターネット接続不要（フォント読み込みのみオンライン推奨）

## ✨ ゲーム概要

- **120名以上のキャラクター** — 全員に固有の顔グラフィック・性格・セリフ付き
- **戦略的な団体経営** — 選手育成・会場選択・興行編成を自分で判断
- **人気システム** — 逓減カーブ＋5種の下落要素でリアルな浮き沈み
- **3つのライバル団体** — S級・A級・B級のAI団体と競争
- **対抗戦** — 5対5の団体対抗戦で一気にランキング変動
- **引き抜き交渉** — 4週間の交渉期間＋3段階プランの駆け引き
- **ビジュアル観戦モード** — 試合をリアルタイムで観戦可能
- **セーブ機能** — 3スロット＋エクスポート/インポート対応

## 🗂️ ファイル構成

```
src/           ゲーム本体（HTML + JavaScript）
  index.html     メイン画面・CSS
  data.js        キャラ120名・技160種・全データ定数
  engine.js      ゲームロジック
  app.js         アプリ統合・セーブ・BGM
  ui-common.js   UI共通処理
  ui-render.js   画面描画
  victory-lines.js  勝利セリフ
  battle-engine.html ビジュアル観戦
image/         顔画像（107枚）
portrait-map.js 顔画像マッピング
docs/          設計ドキュメント
specs/         仕様書
```

## 🔧 動作環境

- モダンブラウザ（Chrome / Firefox / Edge / Safari 最新版）
- スマートフォン対応（レスポンシブデザイン）
- サーバー不要 — ローカルファイルとして動作

## 📄 バージョン

v1.20 — 2026年7月

## ©️ クレジット

- 企画・ゲームデザイン・開発: たこやき ([@takoyaki-chan](https://github.com/takoyaki-chan))
- キャラクターイラスト: AI生成（ComfyUI + Illustrious）＋ Photoshop加工
