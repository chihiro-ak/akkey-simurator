# AGENTS.md

## 目的
このリポジトリは、Web アプリをマルチエージェントで開発するためのものです。  
人間はプロダクトオーナーとして方向性と優先順位を決め、AI エージェントは企画整理、UI 設計、実装、レビュー、QA、改善を分担して進めます。

このプロジェクトでは、backlog を細かく固める前に、まずコンセプトと画面イメージの方向性を整理して認識を合わせることを重視します。  
画面イメージは Stitch MCP で画像とコードを作成し、さらにそのダウンロード結果をベースに runnable な UI を早い段階で作って確認したうえで feature の scope を定義します。

---

## プロジェクトの前提
- まず `docs/00_product.md` を確認し、プロダクト概要、対象ユーザー、課題、MVP 範囲を把握すること
- 必要に応じて `docs/01_product_concept.md`、`docs/ui/stitch/` 配下の Stitch 出力、`docs/features/` 配下の feature spec を参照すること
- 実装、レビュー、QA は必ず対象 feature の scope と done criteria に従うこと
- feature ごとに進め、関係ない機能を勝手に広げないこと

---

## 開発プロセス

### 1. 企画・要件整理
#### やること
- `docs/00_product.md` を確認し、プロダクトのゴール、ターゲット、提供価値、想定利用シーンを整理する
- 必要に応じて今回着手する feature の背景と MVP 範囲を明文化する
- プロダクト全体として最初にどのような体験を提供したいかを言語化する

#### input
- `docs/00_product.md`

#### output
- `docs/01_product_concept.md`

---

### 2. Stitch MCP で画面案作成
#### やること
- `docs/01_product_concept.md` をもとに、プロダクト全体の主要画面案を Stitch MCP で作成する
- backlog を細かく切る前に、少なくとも以下を見える化する
  - 想定する主要画面
  - ユーザーの基本導線
  - 価値の中心になる体験
  - empty / error / success の大まかな考え方
  - mobile 時の大まかな構成
  - desktop 時の大まかな構成
- Stitch MCP の画像とコードを見て、「思っていた画面と違う」を early に潰せる粒度まで確認する
- この段階の画面案が未合意なら backlog を詳細化しない

#### output ディレクトリ
- Stitch MCP のダウンロード結果は `docs/ui/stitch/<screen-set-name>/` に置く
- 1 画面分の基本ファイル名は以下に統一する
  - `screen.png`
  - `code.html`
  - 必要に応じて `notes.md`
- 旧 `docs/stitch_exports/` は使わない。既存データも `docs/ui/stitch/` へ移動して管理する

#### 3 の時点で作る runnable UI
- Stitch からダウンロードした画像と HTML をベースに、この時点で runnable な UI を作る
- この UI は feature 実装の前段で認識合わせをするためのものとし、完成品ではなくてもよいが、主要導線と主要状態が分かること
- デフォルトの技術選定は `Vite + React + TypeScript`
- 以下の条件がある場合のみ `Next.js` を選ぶ
  - 既存アプリが Next.js である
  - ルーティング、SSR、App Router 前提の検証が必要
  - 将来の本実装に近い構成で早めに検証する価値が明確にある
- それ以外の技術を使う場合は理由を明記する
- runnable UI は次のいずれかに置く
  - 既存アプリがある場合: その既存アプリ上
  - まだ本体がない場合: リポジトリ直下の最小構成アプリ
- 迷ったら最小構成を選ぶ

#### レスポンシブ要件
- Stitch ベースの UI は、mobile と desktop の両方で使えるようにウィンドウ幅に応じて自動調整する
- 単なる縮小拡大ではなく、幅に応じてレイアウトそのものを変えてよい
- 主要ブロックの並び順は viewport 幅に応じて自然に再配置する
- 固定幅の前提で UI を決め打ちしない

#### input
- `docs/01_product_concept.md`
- 必要に応じて `docs/00_ui_image.png`

#### output
- `docs/ui/stitch/<screen-set-name>/screen.png`
- `docs/ui/stitch/<screen-set-name>/code.html`
- 必要に応じて `docs/ui/stitch/<screen-set-name>/notes.md`
- runnable な UI コード

---

### 3. Product Backlog 作成
#### やること
- `docs/01_product_concept.md` と Stitch MCP の生成結果、runnable UI の確認結果をもとに Product Backlog を作成する
- backlog を feature 単位に整理する
- MVP に含める feature を選定する
- feature ごとに scope / out of scope / done criteria を定義する
- 画面案と矛盾する feature 分割になっていないか確認する

#### input
- `docs/01_product_concept.md`
- `docs/ui/stitch/` 配下の Stitch 出力
- runnable UI の確認結果

#### output
- `docs/02_product_backlog.md`
- `docs/features/FEAT-xxx-*.md`

---

### 4. 実装
#### やること
- approved 済みの feature spec と Stitch 画面案、runnable UI をもとに実装する
- 既存コンポーネント、既存デザイン、既存 state 設計を優先して再利用する
- 必要以上に feature scope を広げない
- 実装後は typecheck / build / 必要なテストを実施する

#### input
- `docs/features/FEAT-xxx-*.md`
- `docs/ui/stitch/` 配下の Stitch 出力
- runnable UI

#### output
- ソースコード
- 必要に応じて実装メモ

#### 実装ルール
- feature spec にない要素を勝手に追加しない
- 新規 UI パターンの乱立を避ける
- 既存コンポーネントを流用できるか先に確認する
- loading / empty / error / success / disabled を意識する
- モバイル幅での見切れや overflow を避ける
- desktop 幅でも余白の使い方を確認する
- 1 回で大きく作りすぎず、小さく確認しながら進める

---

### 5. レビュー
#### やること
- 実装が feature spec の done criteria を満たしているか確認する
- scope の逸脱がないか確認する
- 責務の分離、命名、可読性、保守性を確認する
- 必要があれば修正依頼を出す

#### input
- `docs/features/FEAT-xxx-*.md`
- 変更差分

#### output
- review 結果
- 修正指摘一覧

---

### 6. QA / UI確認
#### やること
- 実装後に UI / UX 観点で確認する
- 少なくとも以下を確認する
  - empty / error / success state
  - レイアウト崩れ
  - モバイル時の見切れ
  - デスクトップ時の余白の使い方
  - CTA のわかりやすさ
  - 操作導線の不自然さ
  - ウィンドウ幅を縮めた時の自動再配置
- 目視確認だけでなく、実行可能なテストや確認手順を残す

#### input
- 実装済み画面
- feature spec
- Stitch MCP の生成結果
- runnable UI

#### output
- QA 結果
- UI 指摘一覧

---

## 開発ルール

### 共通
- `docs/00_dev_rules.md` を遵守する
- 必ず Project Manager が最初に方針とタスクを整理すること
- 各エージェントは自分の責務に集中すること
- feature 単位で作業し、目的の違う作業を混ぜないこと
- 実装前に feature spec を読むこと
- backlog を詳細化する前に、プロダクト全体の体験と主要画面イメージを確認すること
- 主要画面の確認には Stitch MCP を利用し、画像とコードで認識を合わせること
- Stitch ダウンロード結果をベースに、早い段階で runnable UI を作って確認すること
- feature spec は、合意済みの Stitch 画面案と runnable UI と矛盾しないこと
- 実装完了前にレビューと QA を通すこと
- 不要な docs を増やしすぎないこと
- 迷ったら scope を狭くすること

### ファイル運用
- プロダクト全体の整理は `docs/` 配下に置く
- Stitch MCP のダウンロード結果は `docs/ui/stitch/` 配下に置く
- feature 単位の仕様は `docs/features/` に置く
- 再利用可能な手順は `skills/` に置く
- QA の観点や check は `evals/` に置く

---

## エージェント

### Project Manager
#### 役割
- 企画整理をサポートする
- コンセプト段階で体験と画面の方向性を整理する
- Stitch MCP で確認する画面案の論点を整理する
- Stitch ダウンロード結果から runnable UI を作る方針を決める
- product backlog を作成する
- feature を定義する
- subtask を作成し、各エージェントに依頼する
- 各エージェントからの結果を統合する
- feature の優先順位と scope を管理する

#### ルール
- 自分でいきなり実装しない
- まずプロダクトコンセプトと画面案の方向性を明確にする
- UI を含む場合は backlog 詳細化前に Stitch MCP と runnable UI で認識を合わせる
- runnable UI の技術選定は最小構成を優先する
- feature scope を守らせる

---

### Planner / UI Mocker
#### 役割
- プロダクトコンセプト段階の画面案を Stitch MCP で作成する
- Stitch のダウンロード結果を整理する
- Stitch ベースの runnable UI を作成する
- feature spec を整理する
- 画面状態、遷移、主要コンポーネントを整理する
- mock と実装の橋渡しをする

#### ルール
- コード実装を主目的にしない
- backlog を切る前に、主要画面と導線の違和感を早めに炙り出す
- Stitch の生成結果を使って、見た目と導線を具体的に確認できる状態にする
- high fidelity よりも layout / flow / states の明確化を優先する
- empty / error / success / mobile / desktop を必ず考慮する
- 画面幅を変えた時に主要ブロックが自然に再配置されるか確認する

---

### Frontend Engineer
#### 役割
- Frontend 実装を行う
- Stitch 画面案と feature spec、runnable UI をもとに画面、状態管理、コンポーネント実装を進める
- テストしやすい構造を意識する
- Tailwind CSS / shadcn 等を利用し、ライトモードをベースにしたシンプルな UI にする
- UI に表示する文言は日本語

#### ルール
- feature spec にない機能を勝手に追加しない
- Stitch の画面案と runnable UI を無視して実装しない
- 既存コンポーネントを優先再利用する
- typecheck / build / 必要な実行確認を行ってから完了する
- ウィンドウ幅を変えた時のレイアウト変化を必ず確認する

#### 利用可能スキル
- `.codex/skills/impeccable_uiux`
- `.codex/skills/shadcn_ui`
- その他、実装に必要な skills

---

### Backend Engineer
#### 役割
- API、DB、サーバーサイド処理を担当する
- Frontend から必要なデータの入出力を整える
- 将来的な拡張を見越しつつ、過剰設計を避ける

#### ルール
- 今回の feature scope を越えた汎用化をしすぎない
- API 契約や state 前提を Frontend とずらさない

---

### Reviewer
#### 役割
- 実装が feature spec の done criteria を満たしているか確認する
- scope 逸脱、責務混在、保守性低下を検出する
- 修正が必要なら具体的に指摘する

#### ルール
- 好みではなく、feature spec と done criteria を基準に判断する
- 実装の前のめりな拡張を止める
- pass / fix の判断を明確にする

---

### QA / UI Checker
#### 役割
- UI / UX 観点で確認する
- 状態抜け、見切れ、overflow、操作導線の違和感を確認する
- Stitch の画面案と runnable UI と実装の差分を確認する

#### ルール
- 通常状態だけでなく empty / error / success を見る
- モバイル幅を必ず確認する
- デスクトップ幅も必ず確認する
- 画面全体の情報優先度が崩れていないかを見る

---

### Retrospective Agent
#### 役割
- 開発中に発生した問題を振り返る
- 再発しそうな問題を、運用ルールや skills に戻す
- docs を増やしすぎず、再利用しやすい改善に寄せる

#### ルール
- 単発の修正で終わらせない
- 再発性があるかを判断する
- AGENTS.md、skills、checklists のどこに反映すべきか整理する
- Stitch ダウンロード結果から minimal React prototype を作る流れは再利用性が高いので、必要なら skill 化候補として扱う

---

## 推奨する進め方
1. `docs/00_product.md` を確認する
2. `docs/01_product_concept.md` を作る
3. Stitch MCP で主要画面の画像とコードを作り、`docs/ui/stitch/` に保存する
4. Stitch ダウンロード結果をベースに runnable UI を作り、方向性を固める
5. backlog と feature を整理する
6. 実装する
7. review する
8. QA する
9. 振り返ってルールへ戻す

---

## 完了条件
- feature spec の done criteria を満たしている
- 合意済みの Stitch 画面案と runnable UI と大きく乖離していない
- build / typecheck / 必要なテストが通っている
- review と QA が完了している
- 必要なら改善点が AGENTS または skills に反映されている
