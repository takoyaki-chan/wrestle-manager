# ドラフト交渉 バグ修正記録

作成: 2026-04-06

---

## 修正2: 推定契約金の表示不整合

### 原因
- **ドラフト速報画面**: `Engine.scout.getSigningCost(c, orgPop)` を使用 → assessedValue に orgPop ベースの割引(最大20%)を適用
- **交渉画面の開始額**: `initNegState` で `candidate.assessedValue` をそのまま使用 → 割引なし
- **交渉画面の「推定相場」**: `Engine.scout.getSigningCost(cand, G.orgPop)` → 割引後の値を表示

結果: 速報の「推定契約金」< 交渉の「CURRENT BID」（R0時点）となり、プレイヤーに「交渉画面では高くなっている？」と映る

### 修正方針
- ドラフトは全団体共通のオークション。orgPop 割引はプレイヤーだけの優遇で不公平感がある
- **全箇所を `assessedValue`（割引前）で統一表示**
- 実際の支払い額は落札額（セリで決まる）であり、assessedValue は「相場目安」として表示
- 変更箇所: `ui-render.js` の `_renderDraftCandidateList` 3箇所 + `_renderDraftNegotiation` 1箇所

### 影響
- auto-sim には影響なし（表示のみの変更）
- ゲームバランスへの影響なし（支払い額はセリ結果で決まり、表示値は参考情報）
