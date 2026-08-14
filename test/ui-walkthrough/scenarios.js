'use strict';

// レア画面強制点火カタログ(バグ捜索体制③)のシナリオ定義。
// 設計: docs/rare-screen-ignition-catalog-design-v0.1.md
//
// 各シナリオの形:
//   fixture.seed      — headless進行のシード(fixtureファイル名にも入る)
//   fixture.until(G)  — この条件の週の頭で進行を止めてfixture化する
//   fixture.engineer(G) — 停止後の状態加工(省略可)。正規セーブとして成立する形だけを作る
//   fixture.assert(G) — fixtureとして成立している前提の検査。失敗文字列の配列を返す
//   walk              — 実UI走破の設定。seasonsは既定終了条件(開始季+seasonsの第1週)で使う
//   until(snapshot)   — 既定終了条件を差し替える場合のみ(snapshotはdetectors.summarizeSnapshotの形)
//   ignition[]        — 点火マーカー。required:trueが1つでも未観測ならIGNITION_MISFIRE
//   finalProbe        — 走破終了後にページで1回evaluateする式(文字列)。Gの事後状態検証用
//   finalAssert(probe) — finalProbeの結果を検査。失敗文字列の配列を返す

const overlayHit = (snapshot, token) =>
  (snapshot.overlays || []).some(entry => String(entry).includes(token));

module.exports = {
  tenchosen: {
    description: '天頂戦の通年点火: S4W41開始→W42ミニイベント→W43エントリー→W48開催(15試合)→優勝演出→初代統一王座戴冠→季末→S5W1',
    fixture: {
      seed: 42,
      until: G => G.season === 4 && G.week === 41 && !G.offSeason,
      engineer: null,
      assert: G => {
        const fails = [];
        if (!G.ppvUnlocked) fails.push('ppvUnlocked=false — 天頂戦がTV観戦モードになり点火対象の画面を通らない。別シードで生成し直すこと');
        if (G.season % 4 !== 0) fails.push(`season=${G.season} は天頂戦開催年(4の倍数)ではない`);
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 900 },
    ignition: [
      // 試合結果モーダル(.emr-layer.is-tenchosen)。走破ドライバは「全試合スキップ」を
      // 優先するため通常は出ない=optional(観戦経路を通ったときだけ光る)
      { name: 'tenchosen-match-result', required: false, match: s => overlayHit(s, 'is-tenchosen') },
      // 初代統一王座の戴冠式(task-89)。優勝発表(.tcwn-wrap全画面タップ面)の直後にしか
      // 出ないため、これが点けば優勝発表→戴冠の本流を通った証明になる
      { name: 'unified-coronation', required: true, match: s => overlayHit(s, 'unified-coronation-overlay') },
    ],
    // 注意: G.ppvTournament はシーズン跨ぎで整理されるため、走破終了時点(S5W1)の
    // 恒久的な証跡は統一王座(初代=天頂戦優勝者に授与)で見る
    finalProbe: `(() => ({
      season: (typeof G !== 'undefined' && G) ? G.season : null,
      unifiedChampionId: (typeof G !== 'undefined' && G.unifiedTitle) ? G.unifiedTitle.championId : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.unifiedChampionId == null) fails.push('統一王座(unifiedTitle.championId)が戴冠されていない=天頂戦が完走していない');
      return fails;
    },
  },

  gameover: {
    description: 'ゲームオーバー点火: 資金-1600でS1中盤から開始→危機突入バナー→即死判定→解散セレモニー→GAME OVER画面',
    fixture: {
      seed: 42,
      until: G => G.season === 1 && G.week === 5 && !G.offSeason,
      // 実プレイでも興行赤字等でtick前に資金が負になる状態は起こりうる。
      // -1600は「次のtickで危機突入→その次のtickで即死(-1500以下)」の2週コース
      engineer: G => ({ ...G, funds: -1600 }),
      assert: G => {
        const fails = [];
        if (G.funds > -1500) fails.push(`funds=${G.funds} では即死ライン(-1500)に届かない`);
        if (G.crisisActive) fails.push('crisisActive が既に立っている(突入バナーの点火を兼ねるため未突入で始めたい)');
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 80 },
    // 正経路: gameover→解散セレモニー(awardsOverlay流用の5スライド)→タイトル画面。
    // #gameoverOverlay は表彰式DOM欠落時のフォールバック専用(ui-common.js 15981)で正経路では出ない
    until: s => s.activeScreen === 'titleScreen' && s.state && s.state.weekPhase === 'gameover',
    ignition: [
      // 解散セレモニー(showGameOverCeremony)。年末表彰と同じawardsOverlayを使うため
      // weekPhase=gameover との合わせ技で判定する
      { name: 'gameover-ceremony', required: true, match: s => overlayHit(s, 'awardsOverlay') && s.state && s.state.weekPhase === 'gameover' },
      // セレモニー後にタイトルへ帰着する(進行が死んでいない)
      { name: 'gameover-back-to-title', required: true, match: s => s.activeScreen === 'titleScreen' && s.state && s.state.weekPhase === 'gameover' },
    ],
    finalProbe: `(() => ({
      weekPhase: (typeof G !== 'undefined' && G) ? G.weekPhase : null,
      reason: (typeof G !== 'undefined' && G) ? (G.gameOverReason || null) : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.weekPhase !== 'gameover') fails.push(`weekPhase=${probe && probe.weekPhase} — gameoverに到達していない`);
      return fails;
    },
  },
};
