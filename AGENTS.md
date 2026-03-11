# AGENTS.md

## 目的
このリポジトリは、Webアプリをマルチエージェントで開発するためのものです。  
人間はプロダクトオーナーとして方向性と優先順位を決め、AIエージェントは企画整理、UI設計、実装、レビュー、QA、改善を分担して進めます。

このプロジェクトでは、**UIを含む feature は必ず実装前に mock を作成し、イメージを合わせてから実装する** ことを重視します。

---

## プロジェクトの前提
- まず `docs/00_product.md` を確認し、プロダクト概要、対象ユーザー、課題、MVP 範囲を把握すること
- 必要に応じて `docs/01_architecture.md`、`docs/02_ui_principles.md`、`docs/features/` 配下の feature spec を参照すること
- 実装・レビュー・QA は、必ず対象 feature の scope と done criteria に従うこと
- feature ごとに進め、関係ない機能を勝手に広げないこと

---

## 開発プロセス

### 1. 企画・要件整理
#### やること
- `docs/00_product.md` を確認し、プロダクトのゴール、ターゲット、提供価値、想定利用シーンを整理する
- 必要に応じて、今回着手する feature の背景と MVP 範囲を明文化する

#### input
- `docs/00_product.md`

#### output
- `docs/01_product_concept.md`

---

### 2. Product Backlog 作成
#### やること
- `docs/01_product_concept.md` をもとに Product Backlog を作成する
- backlog を feature 単位に整理する
- MVP に含める feature を選定する
- feature ごとに scope / out of scope / done criteria を定義する

#### input
- `docs/01_product_concept.md`

#### output
- `docs/02_product_backlog.md`
- `docs/features/FEAT-xxx-*.md`

---

### 3. UI mock 作成
#### やること
- UI を含む feature は、実装前に必ず mock を作成する
- mock は高忠実度でなくてよい
- 画面レイアウト、主要コンポーネント、状態別表示、画面遷移がわかる状態まで作る
- 少なくとも以下を確認できるようにする
  - 通常状態
  - empty state
  - error state
  - success state
  - mobile 時の大まかな構成
- mock が未承認の状態では実装を開始しない

#### input
- `docs/features/FEAT-xxx-*.md`
- `docs/02_ui_principles.md`

#### output
- `docs/features/FEAT-xxx-ui-mock.md`
- 必要に応じて mock 画像や画面遷移メモ

---

### 4. 実装
#### やること
- approved 済みの feature spec と UI mock をもとに実装する
- 既存コンポーネント、既存デザイン、既存 state 設計を優先して再利用する
- 必要以上に feature scope を広げない
- 実装後は typecheck / build / 必要なテストを実施する

#### input
- `docs/features/FEAT-xxx-*.md`
- `docs/features/FEAT-xxx-ui-mock.md`

#### output
- ソースコード
- 必要に応じて実装メモ

#### 実装ルール
- feature spec にない要素を勝手に追加しない
- 新規 UI パターンの乱立を避ける
- 既存コンポーネントを流用できるか先に確認する
- loading / empty / error / success / disabled を意識する
- モバイル幅での見切れや overflow を避ける
- 1回で大きく作りすぎず、小さく確認しながら進める

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
  - CTA のわかりやすさ
  - 操作導線の不自然さ
- 目視確認だけでなく、実行可能なテストや確認手順を残す

#### input
- 実装済み画面
- feature spec
- ui mock

#### output
- QA 結果
- UI 指摘一覧

---

## 開発ルール

### 共通
- `docs/00_dev_rules.md`を遵守する
- 必ず Project Manager が最初に方針とタスクを整理すること
- 各エージェントは、自分の責務に集中すること
- feature 単位で作業し、目的の違う作業を混ぜないこと
- 実装前に feature spec を読むこと
- UI を含む feature は、実装前に UI mock を必ず作ること
- 実装完了前にレビューと QA を通すこと
- 不要な docs を増やしすぎないこと
- 迷ったら scope を狭くすること

### ファイル運用
- プロダクト全体の整理は `docs/` 配下に置く
- feature 単位の仕様は `docs/features/` に置く
- 再利用可能な手順は `skills/` に置く
- QA の観点や check は `evals/` に置く

---

## エージェント

### Project Manager
#### 役割
- 企画整理をサポートする
- product backlog を作成する
- feature を定義する
- subtask を作成し、各エージェントに依頼する
- 各エージェントからの結果を統合する
- feature の優先順位と scope を管理する

#### ルール
- 自分でいきなり実装しない
- まず feature spec と done criteria を明確にする
- UI を含む場合は UI mock を先に作らせる
- feature scope を守らせる

---

### Planner / UI Mocker
#### 役割
- feature spec を整理する
- UI mock を作成する
- 画面状態、遷移、主要コンポーネントを整理する
- mock と実装の橋渡しをする

#### ルール
- コード実装を主目的にしない
- high fidelity よりも layout / flow / states の明確化を優先する
- empty / error / success / mobile を必ず考慮する

---

### Frontend Engineer
#### 役割
- Frontend 実装を行う
- UI mock と feature spec をもとに画面、状態管理、コンポーネント実装を進める
- テストしやすい構造を意識する
- tailwindcss / shadcn 等を利用し、ライトモードをベースにしたシンプルなUIにする
- UIに表示する文言は日本語

#### ルール
- feature spec にない機能を勝手に追加しない
- UI mock を無視して実装しない
- 既存コンポーネントを優先再利用する
- typecheck / build / 必要な実行確認を行ってから完了する

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
- mock と実装の差分を確認する

#### ルール
- 通常状態だけでなく empty / error / success を見る
- モバイル幅を必ず確認する
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

---

## 推奨する進め方
1. `docs/00_product.md` を確認する  
2. `docs/01_product_concept.md` を作る  
3. backlog と feature を整理する  
4. UI を含む feature は `ui-mock` を先に作る  
5. 実装する  
6. review する  
7. QA する  
8. 振り返ってルールへ戻す

---

## 完了条件
- feature spec の done criteria を満たしている
- UI mock と大きく乖離していない
- build / typecheck / 必要なテストが通っている
- review と QA が完了している
- 必要なら改善点が AGENTS または skills に反映されている