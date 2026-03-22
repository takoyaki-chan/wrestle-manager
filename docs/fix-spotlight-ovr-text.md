# 注目選手コメント OVR連動修正

## 問題

「インパルス 注目選手」セクションで、OVR 97の選手に「OVRは発展途上」、OVR 89の選手に「育てば手がつけられなくなる」と表示される。
`KURODA_SPOTLIGHT.star` のテキストがOVRを一切見ずに書かれているため。

**具体例:**
- 高槻千歳（OVR 97 / 人気 71）→「OVRは発展途上だが、カリスマ性は数字に出ている」← **大嘘**
- 阿武隈塔子（OVR 89 / 人気 72）→「育てば手がつけられなくなる」← **もう十分育ってる**

## 原因

1. `spotData` に `ovr` が含まれていない（`{ name, orgName, ovrGain, pop }` のみ）
2. `KURODA_SPOTLIGHT.star` のテキストが全パターン「発展途上」「育てば〜」前提で書かれている
3. カテゴリラベルが一律「スター候補」（OVR 97でも「候補」扱い）

## 変更対象

| ファイル | 変更内容 |
|---------|---------|
| `src/ui-render.js` | `spotData` に `ovr` 追加、カテゴリラベルのOVR連動 |
| `src/kuroda-text.js` | `KURODA_SPOTLIGHT.star` のテキストをOVR帯分岐に書き換え |

---

## 修正1: spotData に ovr を追加

`src/ui-render.js` L4453付近:

```javascript
// 現状
const spotData = { name: p.name, orgName: rivalOrgName, ovrGain: p.ovrGain || 0, pop: p.pop || Math.round(p.popularity || 0) };

// 修正
const spotData = { name: p.name, orgName: rivalOrgName, ovrGain: p.ovrGain || 0, pop: p.pop || Math.round(p.popularity || 0), ovr: Engine.util.ov(p) };
```

---

## 修正2: カテゴリラベルのOVR連動

`src/ui-render.js` L4447付近:

```javascript
// 現状
const categoryLabels = { growth: '要警戒', star: 'スター候補', youngThreat: '若手脅威' };

// 修正: star の場合はOVRに応じてラベルを変える
function getCategoryLabel(category, ovr) {
  if (category === 'star') {
    if (ovr >= 90) return 'エース級';
    if (ovr >= 75) return '主力級';
    return '人気先行';
  }
  return { growth: '要警戒', youngThreat: '若手脅威' }[category] || '';
}
```

L4465のラベル表示箇所:
```javascript
// 現状
${categoryLabels[p.category] || ''}

// 修正
${getCategoryLabel(p.category, pOvr)}
```

---

## 修正3: KURODA_SPOTLIGHT.star テキストのOVR帯分岐

`src/kuroda-text.js` の `KURODA_SPOTLIGHT.star` を以下に置換:

```javascript
star: [
  // パターン1
  d => d.ovr >= 90
    ? `${d.orgName}の看板、${d.name}。OVR ${d.ovr}に人気${d.pop}——実力と集客力を兼ね備えた正真正銘のエースだ`
    : d.ovr >= 75
    ? `${d.name}、人気${d.pop}。中堅以上の実力に加えてこの集客力。厄介な存在だ`
    : `${d.name}は人気${d.pop}。OVRはまだ発展途上だが、ファンを呼べるのは才能の証だ`,

  // パターン2
  d => d.ovr >= 90
    ? `${d.name}——OVR ${d.ovr}、人気${d.pop}。こちらのエースと真正面からぶつかれる数少ない相手だ`
    : d.ovr >= 75
    ? `${d.name}、OVR ${d.ovr}で人気${d.pop}。実力と人気のバランスが良く、どのカードにも組み込める`
    : `${d.name}は人気${d.pop}。まだ実力は追いついていないが、集客面では無視できない`,

  // パターン3
  d => d.ovr >= 90
    ? `対策なしで${d.name}に当たれば、興行ごと持っていかれる。OVR ${d.ovr}に人気${d.pop}は反則だ`
    : d.ovr >= 75
    ? `${d.name}の人気${d.pop}は脅威だ。実力もそれなりにある。舐めてかかると痛い目を見る`
    : `${d.name}の人気${d.pop}は侮れない。今のうちに成長を止めたいところだが`,

  // パターン4
  d => d.ovr >= 90
    ? `${d.orgName}の人気看板であり実力のエース。${d.name}はどちらの意味でも団体の顔だ`
    : d.ovr >= 75
    ? `${d.orgName}の集客の要は${d.name}。OVR ${d.ovr}と伸びしろもある。要注意だ`
    : `${d.orgName}の人気看板は${d.name}。OVRは発展途上だが、カリスマ性は数字に出ている`,
],
```

### OVR帯の基準

| OVR | 扱い | テキストのトーン |
|-----|------|----------------|
| 90以上 | エース級 | 完成された脅威。対策必須 |
| 75〜89 | 主力級 | 実力＋人気の両方がある。油断禁物 |
| 74以下 | 発展途上 | 人気は先行しているが実力はこれから |

※ 75, 90 の閾値根拠:
- 90: ゲーム内でエース級とみなされるライン（S-rank rebalance基準）
- 75: 中堅として一人前のライン（主力カードに組み込める水準）

---

## 修正4: growth / youngThreat テキストも念のため確認

### growth（要警戒）
現状テキストは `ovrGain` ベースで書かれており、OVR絶対値は使っていない。
今季の成長量が3以上の選手にのみ付くカテゴリなので、テキストとしては問題なし。**変更不要。**

### youngThreat（若手脅威）
デビュー2シーズン以内の選手に付く。「まだ荒削り」「伸びしろの塊」等のテキスト。
若手なので基本的にOVRが低い前提は妥当。ただし稀にOVR 80超の若手が出る可能性はある。

→ 念のため `d.ovr` を使えるようにしておくが、テキスト自体は現状維持でOK。
将来的に違和感が出たら別途対応。

---

## 検証

- 100シーズンauto-sim（10 seeds × 10 seasons）でエラーなし確認
- OVR 90以上の star カテゴリ選手 → ラベル「エース級」、テキストに「発展途上」が出ないこと
- OVR 75〜89の star カテゴリ選手 → ラベル「主力級」
- OVR 74以下の star カテゴリ選手 → ラベル「人気先行」、テキストに「発展途上」が出てOK
- growth / youngThreat のテキストが従来通り正常に表示されること
