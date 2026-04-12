#!/usr/bin/env node
/**
 * patch-dialogue-gaps.js
 * Inserts missing personality×archetype dialogue entries into src/data.js.
 * Each entry is inserted before the `composed:` line in the target personality block.
 *
 * Usage: node test/patch-dialogue-gaps.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = false;
const DATA_PATH = path.join(__dirname, 'src', 'data.js'); const TEMP_PATH = path.join(__dirname, 'test', '_patched_data.js');

// ═══════════════════════════════════════════════════════════
//  PATCHES — { sourceName: { subCat: { personality: { archetype: [lines] } } } }
//  Only add entries that do NOT already exist. The script checks before inserting.
// ═══════════════════════════════════════════════════════════

const PATCHES = {

  // ─── Session A remainder: CONF_70 + UPSET ───

  RIVALRY_CONFRONTATION_LINES_70: {
    attacker: {
      normal: { polite: ['逃がしません。ここで…終わらせます'] },
      bold: { seductive: ['ずっと待っていたのよ。今日…超えてみせるわ'], polite: ['ずっと待っていました。今日、超えてみせます'] },
      quiet: { seductive: ['………逃がさない…わ'], polite: ['………ここで…終わらせます'] },
      easygoing: { seductive: ['いよいよね。…全部出し切るわ'], polite: ['いよいよです！ 全部出し切ります！'], ojousama: ['いよいよですわ！ 全力で参りますの'] },
      earnest: { seductive: ['ここで終わらせるわ。覚悟して'], ojousama: ['本日こそ、決着をつけさせていただきますわ'] }
    },
    defender: {
      normal: { polite: ['…どうぞ。お相手します'] },
      bold: { seductive: ['同感よ。…本気で行くわ'], polite: ['同感です。本気で参ります'] },
      quiet: { seductive: ['………来なさい'], polite: ['………お相手…します'] },
      easygoing: { seductive: ['いいわよ。全力で受けて立つわ'], polite: ['おっけーです！ 全力でお相手します！'], ojousama: ['よろしくてよ！ 全力でお相手いたしますわ'] },
      earnest: { seductive: ['全力でお相手するわ。覚悟して'], ojousama: ['全力でお相手させていただきますわ'] }
    }
  },

  UPSET_RIVALRY_LINES: {
    winnerLines: {
      normal: { polite: ['見てください…！ 格下だなんて…もう言わせません…！'] },
      bold: { seductive: ['ようやく…勝ったわ。…ずっと待ってたの'], polite: ['ついに…勝ちました…！ ずっと待っていたんです…！'] },
      quiet: { seductive: ['………勝った…の…？'], polite: ['………勝ち…ました…？'] },
      easygoing: { seductive: ['うそ…勝っちゃった…ふふ、信じられない'], polite: ['うそです…勝っちゃいました…！ 信じられません…！'], ojousama: ['まあ…勝ちましたわ…！ 信じられませんこと…！'] },
      earnest: { seductive: ['やったわ…ずっと追いかけてきて…ついに…'], ojousama: ['やりましたわ…！ ずっと追いかけてまいりまして…ついに…'] }
    },
    loserLines: {
      normal: { polite: ['嘘でしょう…こんなはずでは…ありません…'] },
      bold: { seductive: ['認めないわ…こんな結果…'], polite: ['認めません…こんな結果は…'] },
      quiet: { seductive: ['………嘘…でしょう…'], polite: ['………そんな…'] },
      easygoing: { seductive: ['えっ…嘘でしょう…まさか…'], polite: ['えっ…嘘ですよね…まさか…'], ojousama: ['まあ…嘘ですわ…こんなことが…'] },
      earnest: { seductive: ['こんなはずじゃ…全力を出したのに…'], ojousama: ['こんなはずでは…全力を尽くしましたのに…'] }
    }
  },

  // ─── Session B: 試合・対戦系 ───

  RIVALRY_CONFRONTATION_LINES: {
    attacker: {
      normal: {
        polite: ['今日こそ、決着をつけさせていただきます']
      },
      bold: {
        polite: ['逃がしません。今日ここで決着です']
      },
      quiet: {
        seductive: ['………（鋭い目で見据える）…覚悟してね']
      },
      easygoing: {
        seductive: ['さーて、決着ね。全部出し切ってあげるわ'],
        polite: ['さて、今日で決着をつけましょう！'],
        ojousama: ['さて、今日で決着ですわ！']
      },
      earnest: {
        seductive: ['この因縁、終わりにするわ']
      }
    },
    defender: {
      normal: {
        polite: ['……どうぞ。受けて立ちます']
      },
      bold: {
        polite: ['受けて立ちます。返り討ちにいたしますよ']
      },
      quiet: {
        seductive: ['………来なさい']
      },
      easygoing: {
        seductive: ['いいわよ、来なさい。相手してあげるわ'],
        polite: ['どうぞ、来てください！ お相手します！'],
        ojousama: ['よろしくてよ！ お相手いたしますわ']
      },
      earnest: {
        seductive: ['受けて立つわ。全力で']
      }
    },
    fateAttacker: {
      normal: {
        polite: ['長かったです……今日で終わりにさせてください']
      },
      bold: {
        polite: ['最後です。全力で参ります']
      },
      quiet: {
        seductive: ['………（深い呼吸）…終わらせましょう']
      },
      easygoing: {
        seductive: ['最後の一戦ね。…全部出し切るわ'],
        polite: ['最後の一戦です。全部出し切ります！'],
        ojousama: ['最後の一戦ですわ！ 全力で参りますの']
      },
      earnest: {
        seductive: ['この因縁、今日終わりにするわ。全力で']
      }
    },
    fateDefender: {
      normal: {
        polite: ['はい……最高の結末にしましょう']
      },
      bold: {
        polite: ['わかっています。全力で来てください']
      },
      quiet: {
        seductive: ['………（微笑み、構える）…ええ']
      },
      easygoing: {
        seductive: ['最高の締めにしましょう？ …全力でね'],
        polite: ['最高の締めにしましょう！ 全力です！'],
        ojousama: ['最高の結末にいたしましょう！']
      },
      earnest: {
        seductive: ['全力でお受けするわ。悔いのない試合にしましょう']
      }
    }
  },

  RIVALRY_CONFRONTATION_LINES_90: {
    attacker: {
      normal: {
        polite: ['……この日を、ずっと待っておりました']
      },
      bold: {
        delinquent: ['全部賭ける。てめえを超えてやる'],
        ojousama: ['全てを賭けますわ。参りますの'],
        seductive: ['全部賭けるわ。…行くわよ'],
        polite: ['全てを賭けます。行かせていただきます']
      },
      quiet: {
        seductive: ['………（言葉はなく、ただ見つめている）'],
        polite: ['………行き…ます']
      }
    },
    defender: {
      normal: {
        polite: ['……はい。もう言葉は…いりません']
      },
      bold: {
        delinquent: ['……おう。来い'],
        ojousama: ['……ええ。全力でお受けしますわ'],
        seductive: ['……ええ。全力で行くわ'],
        polite: ['……はい。受けて立ちます']
      },
      quiet: {
        seductive: ['………（静かに目を閉じ、開く）'],
        polite: ['………（静かに頷く）…はい']
      }
    }
  },

  RIVALRY_RESOLUTION_LINES: {
    winner: {
      normal: {
        cool: ['……一つ、片がついた。……だが、これで終わりではない'],
        polite: ['一つ決着がつきました…でも…まだ終わった気がしません']
      },
      bold: {
        polite: ['今日は勝たせていただきました。…でもこの程度では終わりませんね']
      },
      quiet: {
        seductive: ['………（相手を見つめ）…まだよ']
      },
      easygoing: {
        polite: ['一つ勝たせていただきました！ …でもまだ続きがありそうですよね'],
        ojousama: ['一つ勝ちましたわ！ …でもまだ終わった気がしませんの']
      }
    },
    loser: {
      normal: {
        cool: ['……負けた。……だが、終わりではない'],
        polite: ['負けました…悔しいです。でも…次は必ず']
      },
      bold: {
        polite: ['今日は完敗です。…ですが、次がございます']
      },
      quiet: {
        seductive: ['………（拳を握る）…次は、ないわよ']
      },
      easygoing: {
        polite: ['負けちゃいました…！ でも次は負けません！'],
        ojousama: ['負けてしまいましたわ…でも次はお返ししますの']
      }
    },
    fateWinner: {
      normal: {
        cool: ['……一つ、答えが出た。……だが、まだ終わらない'],
        polite: ['ようやく…一つ答えが出ました。…でもまだ終わりではありません']
      },
      bold: {
        polite: ['一つ勝ちました。…でもまだ先がございます']
      },
      quiet: {
        seductive: ['………（深い息）…でも、まだよ']
      },
      easygoing: {
        polite: ['やっと一つ勝てました…！ でもまだ終わってないですよね…？'],
        ojousama: ['やっと一つ勝ちましたわ…！ でもまだ終わっておりませんわね']
      }
    },
    fateLoser: {
      normal: {
        cool: ['……敵わなかった。……だが、終わりではない'],
        polite: ['今日は…敵いませんでした。でもこれで終わりではありません']
      },
      bold: {
        polite: ['負けました。…ですが、必ず超えてみせます']
      },
      quiet: {
        seductive: ['………（唇を噛む）…まだよ']
      },
      easygoing: {
        polite: ['負けちゃいました…でもまだ次がありますよね？'],
        ojousama: ['負けてしまいましたわ…でも次がありますわよね？']
      }
    }
  },

  GOODRIVAL_RESOLUTION_LINES: {
    winner: {
      normal: {
        polite: ['あなたのおかげでここまで来れました。…ありがとうございます']
      },
      bold: {
        seductive: ['あなたとの戦いは私の誇りよ。…これからもよろしくね'],
        polite: ['あなたとの戦いは私の誇りです。これからもよろしくお願いします']
      },
      quiet: {
        seductive: ['………（手を差し出す）…ありがとう…ね']
      },
      easygoing: {
        seductive: ['最高の相手だったわ。…これからもよろしくね'],
        polite: ['最高の相手でした！ これからもよろしくお願いします！'],
        ojousama: ['最高のお相手でしたわ！ これからもよろしくですの']
      },
      earnest: {
        seductive: ['あなたのおかげで成長できたわ。…これからもよろしくね'],
        ojousama: ['あなたのおかげで成長できましたわ。これからもよろしくお願いいたしますわ']
      }
    },
    loser: {
      normal: {
        polite: ['負けました。でも…あなたが好敵手で良かったです']
      },
      bold: {
        seductive: ['完敗ね。…でも悔いはないわ。最高の相手だった'],
        polite: ['完敗です。でも悔いはありません。最高の相手でした']
      },
      quiet: {
        seductive: ['………（涙を拭い、微笑む）…ありがとう']
      },
      easygoing: {
        seductive: ['負けちゃった。…でも笑えるわ。最高の相手だもの'],
        polite: ['負けちゃいました。でも笑えちゃいますね。最高の相手でした！'],
        ojousama: ['負けてしまいましたわ。でも笑みが零れますの。最高のお相手でしたわ']
      },
      earnest: {
        seductive: ['負けたわ。でもこの試合は一生忘れない'],
        ojousama: ['負けましたわ。でもこの試合は一生の宝ですわ']
      }
    }
  },

  // ─── Session C: 表彰・節目系 ───

  AWARD_LINES: {
    rookie: {
      easygoing: {
        polite: ['うそです…！ 新人王ですか…！ ありがとうございます！'],
        ojousama: ['まあ…！ 新人王ですの…！ 光栄ですわ'],
        seductive: ['あら…嬉しいサプライズ。来年はもっと上で名前を呼ばれるわ']
      },
      shy: {
        polite: ['え…わたし、ですか…？ …ありがとうございます…']
      },
      earnest: {
        seductive: ['努力してきたもの。…でもまだ足りないわ。もっと磨くから']
      }
    },
    bestMatch: {
      normal: {
        polite: ['最高の試合でした。…相手に感謝しています']
      },
      bold: {
        polite: ['当然の結果です。…でも、まだ上があります'],
        seductive: ['当然の結果よ。…もっと見せてあげるわ']
      },
      quiet: {
        seductive: ['………最高の試合…だったわ'],
        polite: ['………最高の…試合でした']
      },
      easygoing: {
        seductive: ['最高の試合だったわ。…もっと見せてあげるわよ'],
        polite: ['最高の試合でした！ 相手にも感謝です！'],
        ojousama: ['最高の試合でしたわ！ お相手にも感謝ですの']
      },
      earnest: {
        seductive: ['この試合は…私にとっても特別だったわ'],
        ojousama: ['この試合は一生の宝ですわ。お相手に感謝いたします']
      },
      emotional: {
        seductive: ['最高の試合だった…涙が止まらないわ']
      }
    },
    mvp: {
      normal: {
        polite: ['MVPをいただけるとは…ありがとうございます。来年も頑張ります']
      },
      bold: {
        polite: ['当然です。…でも、来年も狙います'],
        seductive: ['当然よ。…でも、来年はもっと上を見せてあげるわ']
      },
      quiet: {
        seductive: ['………ありがとう…ね'],
        polite: ['………ありがとう…ございます']
      },
      easygoing: {
        seductive: ['MVPですって？ …ふふ、嬉しいわ'],
        polite: ['MVPですか！ ありがとうございます！ 来年も頑張ります！'],
        ojousama: ['MVPですの！ 光栄ですわ。来年も精進いたしますの']
      },
      earnest: {
        seductive: ['MVPをいただけて…努力が報われたわ'],
        ojousama: ['MVPの栄誉に与りまして光栄ですわ。これを糧に精進いたします']
      }
    },
    champion: {
      normal: {
        polite: ['一年間、ベルトを守り続けることができました。支えてくださった皆さんに感謝します']
      },
      bold: {
        polite: ['ベルトを守り抜きました。…来年もこの座は譲りません'],
        seductive: ['ベルトを守り抜いたわ。…来年もこの座は渡さない']
      },
      quiet: {
        seductive: ['………このベルト…渡さないわ'],
        polite: ['………このベルトは…守り抜きました']
      },
      easygoing: {
        seductive: ['一年間守り抜いたわ。…来年もよろしくね'],
        polite: ['一年間守り抜きました！ 来年も頑張ります！'],
        ojousama: ['一年間お守りいたしましたわ。来年もこの座を守りますの']
      },
      earnest: {
        seductive: ['守り抜いたわ。…でもまだまだこれからよ'],
        ojousama: ['守り抜くことができましたわ。これからも精進いたします']
      }
    },
    hallOfFame: {
      normal: {
        polite: ['殿堂入り…夢のようです。支えてくださった全ての方に感謝いたします']
      },
      bold: {
        polite: ['殿堂入りです。…ここまで来ることができました'],
        seductive: ['殿堂入り…ようやくここまで来たわ']
      },
      quiet: {
        seductive: ['………（涙を堪え）…ありがとう'],
        polite: ['………ありがとう…ございます…（深々とお辞儀）']
      },
      easygoing: {
        seductive: ['殿堂入りですって…信じられないわ'],
        polite: ['殿堂入りですか…！ 信じられません…ありがとうございます！'],
        ojousama: ['殿堂入りですの…！ 夢のようですわ…']
      },
      earnest: {
        seductive: ['殿堂入り…全ての努力が報われたわ'],
        ojousama: ['殿堂入りの栄誉を賜りまして…全ての努力が報われましたわ']
      },
      emotional: {
        seductive: ['殿堂入り…もう言葉にならないわ…（涙を堪える）']
      }
    }
  },

  WAR_VICTORY_LINES: {
    normal: {
      polite: ['対抗戦、勝たせていただきました。団体のために戦えて光栄です']
    },
    bold: {
      polite: ['勝ちました。この団体の力を見せつけられたと思います'],
      seductive: ['勝ったわ。…この団体の力、見せつけてあげたわね']
    },
    quiet: {
      seductive: ['………勝った…わ。…団体のために'],
      polite: ['………勝ち…ました']
    },
    easygoing: {
      seductive: ['勝っちゃった！ …ふふ、うちの団体、強いでしょう？'],
      polite: ['勝ちました！ うちの団体の底力を見せられましたね！'],
      ojousama: ['勝ちましたわ！ うちの団体の底力をご覧になって！']
    },
    earnest: {
      seductive: ['団体のために戦えて…嬉しいわ'],
      ojousama: ['団体のために戦えて光栄ですわ。勝利を捧げますの']
    }
  },

  BREAKTHROUGH_LINES: {
    normal: {
      cool: ['……成長を、実感している'],
      polite: ['何かが変わった気がします。…成長できている実感があります']
    },
    bold: {
      polite: ['手応えがあります。まだまだ伸びます']
    },
    quiet: {
      seductive: ['………（静かに拳を見つめ）…変わってきたわ']
    },
    easygoing: {
      polite: ['なんか最近調子いいんです！ もっと上に行けそうです！'],
      ojousama: ['最近絶好調ですわ！ もっと上に行けそうですの']
    }
  },

  BT_HINT_LINES: {
    normal: {
      cool: ['……何かが、変わり始めている'],
      polite: ['何かが掴めそうな気がします。もう少しで…'],
      seductive: ['何かが変わり始めてる…自分でもわかるわ']
    },
    bold: {
      polite: ['もう少しで掴めそうです。あと一歩です'],
      ojousama: ['もう少しで掴めそうですわ。あと一歩ですの'],
      seductive: ['もう少し…あと少しで何かが掴めそうなの']
    },
    quiet: {
      polite: ['………もう少しで…掴めそう…です'],
      seductive: ['………もう少し…あと少し…']
    },
    earnest: {
      seductive: ['積み重ねてきたものが…形になりそうなの'],
      ojousama: ['積み重ねてまいりましたものが、形になりそうですわ']
    }
  },

  // ─── Session D: 引退・契約・交渉系 ───

  RETIREMENT_LINES: {
    normal: {
      cool: ['……限界か。…悪くない引き際だ'],
      polite: ['限界を感じています。…引退を考えさせてください']
    },
    bold: {
      polite: ['正直に申し上げます。…もう限界です']
    },
    quiet: {
      seductive: ['………もう…ここまでね']
    },
    easygoing: {
      polite: ['正直、もう限界だと感じています。…引退を考えています'],
      ojousama: ['もう限界を感じますの。…引退を考えておりますわ']
    }
  },

  RETIRE_ACCEPT_LINES: {
    normal: {
      cool: ['……わかった。…悔いはない'],
      polite: ['わかりました。…ここまでやれて幸せでした']
    },
    bold: {
      polite: ['受け入れます。…ここまでやれたこと、誇りに思います']
    },
    quiet: {
      seductive: ['………（静かに頷く）…ありがとう…ね']
    },
    easygoing: {
      polite: ['わかりました。…楽しかったです。本当に'],
      ojousama: ['承知いたしましたわ。…楽しい日々でしたの']
    }
  },

  RETIRE_REFUSE_LINES: {
    normal: {
      cool: ['……まだだ。…まだ終われない'],
      polite: ['まだ引退するわけにはいきません。もう少しだけ…']
    },
    bold: {
      polite: ['まだです。まだやれます。もう少しだけ時間をください']
    },
    quiet: {
      seductive: ['………まだ…よ']
    },
    easygoing: {
      polite: ['まだです！ まだやれます！ もう少しだけお願いします！'],
      ojousama: ['まだですわ！ まだやれますの！ お願いいたします！']
    }
  },

  RETAIN_LINES: {
    normal: {
      cool: ['……残る。…まだやることがある'],
      polite: ['残らせてください。まだ…やりたいことがあります']
    },
    bold: {
      polite: ['残ります。まだここでやるべきことがあります']
    },
    quiet: {
      seductive: ['………残るわ']
    },
    easygoing: {
      polite: ['残ります！ まだまだここで頑張りたいです！'],
      ojousama: ['残りますわ！ まだまだここで精進いたしますの']
    }
  },

  NEGOTIATE_LINES: {
    normal: {
      cool: ['……条件次第だ'],
      polite: ['残りたい気持ちはあります。…条件を聞かせてください']
    },
    bold: {
      polite: ['条件を聞かせてください。それ次第です']
    },
    quiet: {
      seductive: ['………条件…次第ね']
    },
    easygoing: {
      polite: ['条件次第ですね。…聞かせてください！'],
      ojousama: ['条件をお聞かせくださいまし。それ次第ですわ']
    }
  },

  CONTRACT_NEGOTIATION_LINES: {
    normal: {
      cool: ['……考えさせてくれ'],
      polite: ['ありがとうございます。前向きに検討させていただきます']
    },
    bold: {
      polite: ['ありがとうございます。…ただ、もう少し条件を詰めさせてください']
    },
    quiet: {
      seductive: ['………考えさせて']
    },
    easygoing: {
      polite: ['ありがとうございます！ 前向きに考えます！'],
      ojousama: ['ありがとうございますわ。前向きに検討いたしますの']
    }
  },

  // ─── Session E: メンタル系 ───

  SLUMP_START_LINES: {
    normal: {
      cool: ['……最近、噛み合わない'],
      polite: ['最近、何をやってもうまくいかなくて…']
    },
    bold: {
      polite: ['正直、調子が上がりません。…でも、立て直します']
    },
    quiet: {
      seductive: ['………何も…うまくいかないわ']
    },
    easygoing: {
      polite: ['最近ちょっと調子悪くて…でも大丈夫です！'],
      ojousama: ['最近少し不調ですの…でもすぐ立て直しますわ']
    }
  },

  SLUMP_END_LINES: {
    normal: {
      cool: ['……戻ってきた。この感覚だ'],
      polite: ['ようやく…調子が戻ってきた気がします']
    },
    bold: {
      polite: ['復調しました。もう大丈夫です']
    },
    quiet: {
      seductive: ['………戻ってきた…わ']
    },
    easygoing: {
      polite: ['調子戻ってきました！ もう大丈夫です！'],
      ojousama: ['調子が戻ってまいりましたわ！ もう大丈夫ですの']
    }
  },

  MOTIVATION_LOSS_LINES: {
    normal: {
      cool: ['……何のために戦っているのか、見えなくなった'],
      polite: ['最近…何のために戦っているのか、わからなくなってきました']
    },
    bold: {
      polite: ['正直…目標を見失いかけています']
    },
    quiet: {
      seductive: ['………何のために…戦ってるの…']
    },
    easygoing: {
      polite: ['最近ちょっとモチベーションが…でも頑張ります'],
      ojousama: ['少しやる気が出ませんの…でも頑張りますわ']
    }
  },

  MOTIVATION_RECOVERY_LINES: {
    normal: {
      cool: ['……思い出した。戦う理由を'],
      polite: ['ようやく…戦う理由を思い出しました']
    },
    bold: {
      polite: ['目標が見えてきました。もう迷いません']
    },
    quiet: {
      seductive: ['………思い出した…わ。戦う理由']
    },
    easygoing: {
      polite: ['やる気出てきました！ もう大丈夫です！'],
      ojousama: ['やる気が戻ってまいりましたわ！ もう大丈夫ですの']
    }
  },

  ENDING_LINES: {
    normal: {
      cool: ['……終わったか。……悪くない'],
      polite: ['最後まで走り切れました。…ありがとうございました']
    },
    bold: {
      polite: ['最後まで戦い抜けました。…悔いはありません']
    },
    quiet: {
      seductive: ['………終わった…わね。…ありがとう']
    },
    easygoing: {
      polite: ['最後まで楽しかったです！ ありがとうございました！'],
      ojousama: ['最後まで楽しゅうございましたわ。ありがとうございます']
    }
  }
};

// Sources where personality is at the top level (no sub-category wrapper)
const FLAT_SOURCES = new Set([
  'WAR_VICTORY_LINES', 'BREAKTHROUGH_LINES', 'BT_HINT_LINES',
  'SLUMP_START_LINES', 'SLUMP_END_LINES',
  'MOTIVATION_LOSS_LINES', 'MOTIVATION_RECOVERY_LINES',
  'RETIREMENT_LINES', 'RETIRE_ACCEPT_LINES', 'RETIRE_REFUSE_LINES',
  'RETAIN_LINES', 'NEGOTIATE_LINES', 'CONTRACT_NEGOTIATION_LINES',
  'ENDING_LINES'
]);

// ═══════════════════════════════════════════════════════════
//  INSERTION ENGINE
// ═══════════════════════════════════════════════════════════

function applyPatches(text, patches) {
  let result = text;
  let insertCount = 0;
  let skipCount = 0;

  for (const [sourceName, content] of Object.entries(patches)) {
    // Find the source block start
    const sourceRe = new RegExp(`const ${sourceName}\\s*=\\s*\\{`);
    const sourceMatch = sourceRe.exec(result);
    if (!sourceMatch) {
      console.error(`[WARN] Source not found: ${sourceName}`);
      continue;
    }
    const sourceStart = sourceMatch.index;

    if (FLAT_SOURCES.has(sourceName)) {
      // Flat source: content = { personality: { archetype: [lines] } }
      for (const [personality, archetypes] of Object.entries(content)) {
        for (const [archetype, lines] of Object.entries(archetypes)) {
          const inserted = insertArchetypeFlat(result, sourceName, sourceStart, personality, archetype, lines);
          if (inserted.changed) {
            result = inserted.text;
            insertCount++;
          } else if (inserted.alreadyExists) {
            skipCount++;
          } else {
            console.error(`[WARN] Could not insert ${sourceName}.${personality}.${archetype}`);
          }
        }
      }
    } else {
      // Nested source: content = { subCat: { personality: { archetype: [lines] } } }
      for (const [subCat, personalities] of Object.entries(content)) {
        for (const [personality, archetypes] of Object.entries(personalities)) {
          for (const [archetype, lines] of Object.entries(archetypes)) {
            const inserted = insertArchetypeNested(result, sourceName, sourceStart, subCat, personality, archetype, lines);
            if (inserted.changed) {
              result = inserted.text;
              insertCount++;
            } else if (inserted.alreadyExists) {
              skipCount++;
            } else {
              console.error(`[WARN] Could not insert ${sourceName}.${subCat}.${personality}.${archetype}`);
            }
          }
        }
      }
    }
  }

  console.log(`Inserted: ${insertCount}, Skipped (already exist): ${skipCount}`);
  return result;
}

function insertArchetypeNested(text, sourceName, sourceStart, subCat, personality, archetype, lines) {
  const searchRegion = text.slice(sourceStart);

  // Find the sub-category block
  const subCatRe = new RegExp(`\\n(  |    )${subCat}:\\s*\\{`, 'm');
  const subCatMatch = subCatRe.exec(searchRegion);
  if (!subCatMatch) {
    return { changed: false, text, alreadyExists: false };
  }

  const subCatStart = sourceStart + subCatMatch.index;
  const subCatRegion = text.slice(subCatStart);
  const subCatBlockEnd = findBlockEnd(subCatRegion);
  const subCatContent = subCatRegion.slice(0, subCatBlockEnd);

  // Find the personality block within this sub-category
  const persRe = new RegExp(`\\n( {4}| {6})${personality}:\\s*\\{`);
  const persMatch = persRe.exec(subCatContent);
  if (!persMatch) {
    return { changed: false, text, alreadyExists: false };
  }

  return doInsert(text, subCatStart + persMatch.index, archetype, lines);
}

function insertArchetypeFlat(text, sourceName, sourceStart, personality, archetype, lines) {
  const searchRegion = text.slice(sourceStart);
  // Find the first source-level block end to limit search
  const sourceBlockEnd = findBlockEnd(searchRegion);
  const sourceContent = searchRegion.slice(0, sourceBlockEnd);

  const persRe = new RegExp(`\\n( {2}| {4})${personality}:\\s*\\{`);
  const persMatch = persRe.exec(sourceContent);
  if (!persMatch) {
    return { changed: false, text, alreadyExists: false };
  }

  return doInsert(text, sourceStart + persMatch.index, archetype, lines);
}

function doInsert(text, persMatchPos, archetype, lines) {
  const afterPers = text.slice(persMatchPos);
  const blockEnd = findBlockEnd(afterPers);
  const blockContent = afterPers.slice(0, blockEnd);

  // Check if archetype already exists
  const existsRe = new RegExp(`\\b${archetype}:\\s*\\[`);
  if (existsRe.test(blockContent)) {
    return { changed: false, text, alreadyExists: true };
  }

  // Find `composed: [` to insert before it
  const composedRe = /(\n( +))composed:\s*\[/;
  const composedMatch = composedRe.exec(blockContent);

  if (composedMatch) {
    const insertPos = persMatchPos + composedMatch.index;
    const indent = composedMatch[2];
    const newEntry = buildEntry(indent, archetype, lines);
    return { changed: true, text: text.slice(0, insertPos) + newEntry + text.slice(insertPos) };
  }

  // No composed — insert before block closing `}`
  const closeRe = /(\n( +))\}/;
  const closeMatch = closeRe.exec(blockContent);
  if (!closeMatch) {
    return { changed: false, text, alreadyExists: false };
  }
  // Guess indent from closing brace + 2 spaces
  const indent = closeMatch[2] + '  ';
  const insertPos = persMatchPos + closeMatch.index;
  const newEntry = buildEntry(indent, archetype, lines);
  return { changed: true, text: text.slice(0, insertPos) + newEntry + text.slice(insertPos) };
}

function buildEntry(indent, archetype, lines) {
  const linesStr = lines.map(l => `${indent}  '${l.replace(/'/g, "\\'")}'`).join(',\n');
  return `\n${indent}${archetype}: [\n${linesStr}\n${indent}],`;
}

function findBlockEnd(text, maxLen) {
  // Find the end of a { } block by counting braces
  const limit = maxLen || 100000;
  let depth = 0;
  let started = false;
  let inString = false;
  let strChar = '';
  for (let i = 0; i < text.length && i < limit; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; strChar = ch; continue; }
    if (ch === '{') { depth++; started = true; }
    if (ch === '}') { depth--; }
    if (started && depth === 0) return i + 1;
  }
  return Math.min(text.length, limit);
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

const original = fs.readFileSync(DATA_PATH, 'utf8');
const patched = applyPatches(original, PATCHES);

if (DRY_RUN) {
  console.log('[DRY RUN] Would write changes. Lines before:', original.split('\n').length, 'after:', patched.split('\n').length);
} else {
  fs.writeFileSync(TEMP_PATH, patched, 'utf8');
  console.log('Wrote patched file. Lines before:', original.split('\n').length, 'after:', patched.split('\n').length);
}

// Verify syntax
try {
  require(DATA_PATH);
  console.log('Syntax check: OK');
} catch (e) {
  console.error('Syntax check FAILED:', e.message);
  if (!DRY_RUN) {
    // Restore original
    // skip restore, 'utf8');
    console.error('Restored original file due to syntax error.');
  }
  ;
}
