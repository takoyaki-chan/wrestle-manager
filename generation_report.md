# 女子プロレス技イラスト生成レポート

出力先: `assets/moves/`  
仕様: raw はクロマキーグリーン背景の不透明 PNG、master は外周につながる緑のみをアルファ化した 1024×1024 PNG。

| # | 技名 | raw | master | 判定 | 問題メモ | needs_manual_review |
|---:|---|---|---|---|---|---|
| 01 | ラリアット | 01_lariat_raw.png | 01_lariat_master.png | 再生成 | 腕全体を横一線に伸ばし、開いた手で首〜上胸へ当てる構図に差し替え。 | なし |
| 02 | エルボースマッシュ | 02_elbow_smash_raw.png | 02_elbow_smash_master.png | 初回合格 | 曲げた肘による至近打撃。 | なし |
| 03 | 逆水平チョップ | 03_chop_raw.png | 03_chop_master.png | 初回合格 | 開いた手で胸を打つ構図。 | なし |
| 04 | キック | 04_kick_raw.png | 04_kick_master.png | 初回合格 | 立ちミドルキック。 | なし |
| 05 | ニーリフト | 05_knee_lift_raw.png | 05_knee_lift_master.png | 再生成 | 受け手が膝へ向けて90度前屈する構図に差し替え。 | なし |
| 06 | ドロップキック | 06_dropkick_raw.png | 06_dropkick_master.png | 初回合格 | 空中で両足が胴に当たる構図。 | なし |
| 07 | ボディスラム | 07_body_slam_raw.png | 07_body_slam_master.png | 再生成 | 片腕の振り下ろしから、受け手が背面を下にして飛ぶ放り投げ構図に差し替え。 | なし |
| 08 | ヒップトス | 08_hip_toss_raw.png | 08_hip_toss_master.png | 再生成 | 腰を支点にして腕を引き、前方へ投げる腰投げ構図に差し替え。 | なし |
| 09 | DDT | 09_ddt_raw.png | 09_ddt_master.png | 再生成 | 脇に頭を抱え、受け手の頭部を下にした倒れ込み構図に差し替え。 | なし |
| 10 | ネックブリーカー | 10_neckbreaker_raw.png | 10_neckbreaker_master.png | 初回合格 | 頭部を脇に挟まない首・背中への横落とし。 | なし |
| 11 | ブレーンバスター | 11_brainbuster_raw.png | 11_brainbuster_master.png | 初回合格 | クラシックな垂直リフト。 | なし |
| 12 | バックドロップ | 12_backdrop_raw.png | 12_backdrop_master.png | 再生成 | 背後から後方へ反り投げる瞬間に差し替え。 | なし |
| 13 | ジャーマンスープレックス | 13_german_suplex_raw.png | 13_german_suplex_master.png | 再生成 | 背後の腰ロックと後方ブリッジ、受け手が腕を開いた逆さの座位形を強調して差し替え。 | なし |
| 14 | フロントスープレックス | 14_front_suplex_raw.png | 14_front_suplex_master.png | 初回合格 | 正面クラッチでの反り投げ。 | なし |
| 15 | サイドスープレックス | 15_side_suplex_raw.png | 15_side_suplex_master.png | 再生成 | 半身ずらした抱え上げから、両者が前方へ跳躍する投げ直前の構図に差し替え。 | なし |
| 16 | パワーボム | 16_powerbomb_raw.png | 16_powerbomb_master.png | 再生成失敗 | 今回の伝統的パワーボム再出力も安全判定で停止。既存版を保持。 | **あり** |
| 17 | パイルドライバー | 17_piledriver_raw.png | 17_piledriver_master.png | 再生成 | 初回は衣装色が仕様外だったため白系に修正。 | なし |
| 18 | スパインバスター | 18_spinebuster_raw.png | 18_spinebuster_master.png | 初回合格 | 低〜中高度の背面叩き付け。 | なし |
| 19 | フェイスバスター | 19_facebuster_raw.png | 19_facebuster_master.png | 再生成 | 攻め手が受け手の上背に覆いかぶさる顔面落下構図に差し替え。 | なし |
| 20 | ファイヤーマンズキャリー | 20_firemans_carry_raw.png | 20_firemans_carry_master.png | 初回合格 | 肩担ぎの途中姿勢。 | なし |
| 21 | アームロック | 21_arm_lock_raw.png | 21_arm_lock_master.png | 初回合格 | 立ち関節技。 | なし |
| 22 | 腕ひしぎ逆十字 | 22_cross_armbar_raw.png | 22_cross_armbar_master.png | 再生成 | 一本の腕を両脚で挟み、両手で引き伸ばす構図に差し替え。 | なし |
| 23 | STF | 23_stf_raw.png | 23_stf_master.png | 初回合格 | 首と脚の両方を制御。 | なし |
| 24 | フルネルソン | 24_full_nelson_raw.png | 24_full_nelson_master.png | 再生成 | 背後から両腕を通し、両手を首の後ろでロックする構図に差し替え。 | なし |
| 25 | 逆エビ固め | 25_boston_crab_raw.png | 25_boston_crab_master.png | 再生成 | うつ伏せの両脚を後方へ引き上げて背を反らせる構図に差し替え。 | なし |
| 26 | 足4の字固め | 26_figure_four_raw.png | 26_figure_four_master.png | 再生成 | 受け手の両脚を4字に交差させる構図に差し替え。 | なし |
| 27 | アンクルホールド | 27_ankle_hold_raw.png | 27_ankle_hold_master.png | 初回合格 | 足首を両手で取る構図。 | なし |
| 28 | スリーパーホールド | 28_sleeper_hold_raw.png | 28_sleeper_hold_master.png | 初回合格 | 背後から首を締める。 | なし |
| 29 | サイドヘッドロック | 29_side_headlock_raw.png | 29_side_headlock_master.png | 初回合格 | 脇に頭を抱える立ち技。 | なし |
| 30 | ボディシザース | 30_body_scissors_raw.png | 30_body_scissors_master.png | 再生成失敗 | 胴体を両脚で一周させる再生成が安全判定で停止。既存版を保持。 | **あり** |
