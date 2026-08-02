# 興行準備 C配置 — 多条件表示の反復プロンプト

Built-in ImageGen was used with `show-prep-redesign-c-broadcast-panels.png` as the layout reference.

## Shared constraints

```text
Use case: ui-mockup
Asset type: iterative desktop game UI mockup, 1200x940 landscape
Preserve concept C's red-corner / narrow center score pod / blue-corner composition, character identities, reorder controls, card hierarchy, and large equal tag-match portraits.
Keep the narrow center pod limited to bout label, カード魅力, score, VS, rule, and a compact condition count where applicable.
Stress-test the design with ten simultaneous items: 拮抗+7, 因縁+15, タイトル+20, 期待+5, 他団体挑戦+8, 善悪+4, 派閥抗争, 初対戦 動員×1.10, ファン期待, ラストマッチ.
No condition may overlap portraits, names, scores, or reorder controls. No logos, watermark, browser chrome, or mobile layout.
```

## A — Full-width condition rail

```text
Add an always-visible CARD CONDITIONS footer rail to each match card. It spans the complete card width below both fighter panels and the score pod, reserves its own height, and wraps roughly ten compact semantic chips into two aligned rows. Do not put modifier chips in the center pod. Cards with fewer conditions use a single compact row.
```

## B — Categorized two-lane ledger

```text
Add a dedicated full-width lower tray with two independently wrapping lanes. 加点内訳 contains the six numeric card-appeal additions. 試合条件 contains the four state/attribute tags. Use quiet lane backgrounds, thin separators, and aligned compact entries so the score calculation and match attributes are visually distinct.
```

## C — Collapsible per-card drawer

```text
Add a bottom bar per card reading 条件・加点 10件 ▲ when open and 条件・加点 2件 ▼ when closed. Show MAIN EVENT open with all ten items in a full-width panel below the portraits, separated into 加点内訳 and 試合条件. Show TAG MATCH and the normal match closed as slim count bars. No modal or hover-only information.
```

## D — Shared selected-card inspector

```text
Place one shared condition inspector directly below the MATCH CARD command bar. Its header reads 選択中：MAIN EVENT and CARD CONDITIONS 10. Show the ten items in two labeled rows, 加点内訳 and 試合条件. Individual match cards remain compact and show only 条件 10件 or 条件 2件 in the center pod; the selected match uses a subtle outline. No repeated tall trays inside cards.
```
