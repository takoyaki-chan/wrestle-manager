# 興行準備画面リデザイン — ImageGen prompts

Reference image: current `興行準備` screen supplied by the user.

All three concepts preserve the current controls and information. Tag-match portraits are explicitly constrained to 72–76 px squares so they stay close to the 72 px standard single-match portraits.

## Concept A — Polished current design

```text
Use case: ui-mockup
Asset type: desktop game interface redesign mockup, 1200x940 landscape
Input images: Image 1 is the current Japanese wrestling management game "興行準備" screen and the authoritative reference for content, functions, character portraits, and dark visual identity.
Primary request: Create redesign concept A, a polished and cleaner evolution of the current screen. Keep every existing function and all three visible matches, but improve spacing, alignment, grouping, hierarchy, and readability. Most importantly, in the TAG MATCH card render all four character face portraits at approximately the same 72–76 px square size as the portraits in an ordinary non-main single match; do not make tag portraits tiny.
Layout: retain top status strip, fan voice list, MATCH CARD toolbar, main event, tag match, regular match, reorder controls, bottom "興行開催！（3試合）" and "← 戻る" actions. Put toolbar actions into a neat segmented control. Use one consistent match-card grid. Main event remains visually dominant but not oversized. Tag teams use two clean stacked wrestler rows on each side with large equal face icons and friendship/chemistry footer.
Style/medium: realistic shippable Japanese PC game UI mockup, not concept art, crisp 2D interface.
Color palette: near-black charcoal, warm ivory text, restrained championship gold, muted purple only for tag match, blue/red only for existing actions.
Typography: condensed sports display headings plus highly legible Japanese sans serif body copy.
Text (verbatim where prominent): "興行準備", "ファンの声", "MATCH CARD", "おすすめ", "OVR順", "集客力順", "全クリア", "MAIN EVENT", "カード魅力", "TAG MATCH", "20分1本勝負", "シングルに戻す", "興行開催！（3試合）", "← 戻る".
Constraints: preserve the existing anime character portrait identities from Image 1; preserve all functional controls and information types; keep tag portraits large and equal; practical 1200px desktop layout; no new navigation, no extra functionality, no logos, no watermark, no browser chrome.
Avoid: tiny text, miniature tag faces, excessive glow, oversized empty space, mobile layout, fantasy illustration.
```

## Concept B — Event operations board

```text
Use case: ui-mockup
Asset type: desktop game interface redesign mockup, 1200x940 landscape
Input images: Image 1 is the current Japanese wrestling management game "興行準備" screen and the authoritative reference for the functions, match data, character portraits, and overall dark game identity.
Primary request: Create redesign concept B, an organized "event operations board" version of the same screen. Do not add or remove functionality. Make the match list easier to scan by giving every match a clear fixed left rail for reorder controls and bout number, a broad center face-off area, and a compact match-metrics column. All four TAG MATCH face portraits must be large 72–76 px squares, approximately equal to ordinary non-main single-match face portraits.
Layout: top compact title/status bar; a single horizontal fan-voice notice panel; MATCH CARD header with grouped "おすすめ", "OVR順", "集客力順", "全クリア" controls and venue. Below, three full-width rows: MAIN EVENT highlighted in gold; TAG MATCH highlighted subtly in purple with two stacked wrestler entries per team and visible friendship/chemistry; regular match. Keep title-match checkbox, rivalry/MQ tags, all card appeal numbers, condition, OVR, drawing power, match rules, single conversion control, reorder arrows, and bottom execute/back actions.
Visual hierarchy: match number/reorder rail on far left; red-corner team left; card appeal and VS centered; blue-corner team right; no duplicated controls. Use thin dividers and aligned columns like a refined broadcast production rundown.
Style/medium: realistic shippable Japanese PC management game UI, crisp 2D interface, practical and dense but calm.
Color palette: graphite black and dark slate; warm ivory; muted gold for main event; restrained violet for tag match; small blue/red action accents.
Typography: readable Japanese sans serif with condensed Latin sports headings.
Text (verbatim where prominent): "興行準備", "ファンの声", "MATCH CARD", "おすすめ", "OVR順", "集客力順", "全クリア", "MAIN EVENT", "カード魅力", "TAG MATCH", "20分1本勝負", "シングルに戻す", "興行開催！（3試合）", "← 戻る".
Constraints: preserve the existing anime character portrait identities from Image 1; preserve all functional controls and information types; equal large tag portraits; clear 1200px desktop grid; no new functionality, no navigation sidebar, no logos, no watermark, no browser chrome.
Avoid: tiny tag faces, giant hero art, excessive gradients, neon cyberpunk, card overlap, excessive empty space, mobile layout.
```

## Concept C — Broadcast fight-card panels

```text
Use case: ui-mockup
Asset type: desktop game interface redesign mockup, 1200x940 landscape
Input images: Image 1 is the current Japanese wrestling management game "興行準備" screen and the authoritative reference for existing functions, information, character portraits, and game tone.
Primary request: Create redesign concept C, a refined "broadcast fight-card panels" version of the same screen. Preserve every function and all existing information, while reorganizing each match into a visually balanced red-corner panel, compact center matchup pod, and blue-corner panel. Use strong card rhythm, consistent spacing, and a clear match-order spine. In the TAG MATCH card, show four equal 72–76 px square face portraits, approximately the same size as standard single-match faces, arranged as two clearly grouped stacked teammate panels per side.
Layout: clean top header with "興行準備" and status metrics; compact fan voice ticker; MATCH CARD command bar with existing auto-fill and clear actions. Three vertical match cards with comfortable spacing: main event gold accent; tag match violet accent; normal match neutral. Each card keeps reorder arrows, wrestler names, OVR, condition, drawing power, card appeal, VS, rule, title checkbox where relevant, rivalry/freshness tags, friendship/tag experience, and tag-to-single action. Bottom execute and back buttons remain centered and prominent.
Style/medium: shippable premium Japanese wrestling management game UI, crisp 2D product mockup. Contemporary sports broadcast graphics combined with understated management-dashboard clarity.
Color palette: charcoal and deep blue-black surfaces, ivory typography, champagne gold main-event accents, subdued violet tag accents, subtle cool gray separators, restrained red/blue corner markers.
Typography: condensed uppercase sports headers with legible Japanese sans-serif data text.
Text (verbatim where prominent): "興行準備", "ファンの声", "MATCH CARD", "おすすめ", "OVR順", "集客力順", "全クリア", "MAIN EVENT", "カード魅力", "TAG MATCH", "20分1本勝負", "シングルに戻す", "興行開催！（3試合）", "← 戻る".
Constraints: preserve existing anime character portrait identities from Image 1; no functional additions or removals; all tag portraits large and equal; maintain visible reorder affordances; practical 1200px desktop layout; no logos, no watermark, no browser chrome.
Avoid: small tag icons, data hidden behind hover, giant character art, flashy neon, excessive glow, cluttered gradients, mobile layout, unrelated decoration.
```
