# つながるアクキー Migration Plan v3

## 目的
- `codex/feat-single-akkey-mvp-stitch-ui` を新基盤として維持し、`main` にある「つながるアクキー」機能を必要なロジック・数式・概念だけ選択移植して、単体MVPを壊さずに connected 対応を成立させる。
- 主目標は「つながる見え」だけではなく、`main` の preview motion にできるだけ近い挙動を、現行基盤の UI / component 構成へ再配置すること。
- ユーザー向けの主語・UI説明・完成条件は、基本的に「2連」ではなく「つながるアクキー」を使う。

## 前提と非スコープ
- 新基盤は `codex/feat-single-akkey-mvp-stitch-ui`
- `main` からは必要なロジック・数式・概念だけ移植する
- 旧 `src/App.tsx` の丸戻しはしない
- 単体MVPの UI / レイアウト / 余白感 / 操作感をベースラインとして維持する
- 非スコープ:
  - 厚み拡張
  - 3連以上
  - 自由接続UI
  - 保存、共有、永続化、URL入稿
  - 個別金具選択の拡張
  - 旧UIの再現
- 厚みは今回の統合スコープから外し、将来の別テーマとして扱う

## 実装方針
- ユーザー向け名称は「つながるアクキー」を優先し、内部では `mode: "single" | "connected"` と `slot: "main" | "sub"` で扱う
- `activeSlot` を編集対象 state として持ち、`selectedPart` は金具選択 state として分離する
- hole は各 slot のローカル座標で保持し、selector / geometry layer でワールド座標へ変換する
- upload UI は単体と同じカードをそのまま2つ使い、connected 時だけ枚数を増やす
- ユーザー向けUIでは「上」「下」を強く出さず、自然に画像が増える体験を優先する

## motion 方針
- `main` の preview motion 実装を比較元として扱う
- 忠実再現対象:
  - 上側パーツの揺れ
  - 接続点を起点にした下側パーツの追従
  - 静止時の戻り方
  - チルトや回転の感じ
  - 揺れの減衰感
- DOM 構造や state shape は現行基盤に合わせて再実装するが、motion の見え方は `main` に寄せる

## MVP 完成条件
- `single` と `connected` を mode 切替で扱える
- `connected` 時に同じ見た目の画像アップロードカードを2つ表示できる
- 各パーツが別画像・別サイズを持てる
- 接続用 hole を扱える
- Editor で接続位置を調整できる
- Preview でつながる見えが確認できる
- Preview の物理挙動が `main` の動きにできるだけ近い
- single mode の見た目と挙動を壊していない
