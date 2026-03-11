# AGENTS.md

## 目的
このリポジトリは、Web アプリをマルチエージェントで開発するためのものです。  
人間はプロダクトオーナーとして方向性と優先順位を決め、AI エージェントは企画整理、UI 設計、実装、レビュー、QA、改善を分担して進めます。

このプロジェクトでは、backlog を細かく固める前に、まずコンセプトと画面イメージの方向性を整理して認識を合わせることを重視します。  
画面イメージは Stitch MCP で画像とコードを作成し、さらにそのダウンロード結果をベースに runnable UI を早い段階で作って確認したうえで feature の scope を定義します。

---

## プロジェクトの前提
- まず `docs/00_product.md` を確認し、プロダクト概要、対象ユーザー、課題、MVP 範囲を把握すること
- 必要に応じて `docs/01_product_concept.md`、`docs/ui/stitch/`、`docs/features/` を参照すること
- 実装、レビュー、QA は必ず対象 feature の scope と done criteria に従うこと
- feature ごとに進め、関係ない機能を勝手に広げないこと

---

## 開発プロセス

### 1. 企画・要件整理
- `docs/00_product.md` をもとに、ゴール、ターゲット、提供価値、利用シーンを整理する
- 必要に応じて feature の背景と MVP 範囲を明文化する
- output: `docs/01_product_concept.md`

### 2. Stitch MCP で画面案作成
- `docs/01_product_concept.md` をもとに主要画面を Stitch MCP で作成する
- backlog 詳細化前に、主要導線、価値の中心、empty / error / success、mobile / desktop の構成を確認する
- Stitch の出力は `docs/ui/stitch/<screen-set-name>/` 配下に `screen.png`、`code.html`、必要なら `notes.md` で保存する
- Stitch の画像と HTML をベースに runnable UI を作り、方向性が未合意なら backlog を詳細化しない
- デフォルト技術選定は `Vite + React + TypeScript`。既存構成や検証要件がある場合のみ `Next.js`

### 3. Product Backlog 作成
- `docs/01_product_concept.md` と runnable UI の確認結果をもとに backlog を feature 単位で整理する
- MVP 対象を選定し、feature ごとに scope / out of scope / done criteria を定義する
- output: `docs/02_product_backlog.md`、`docs/features/FEAT-xxx-*.md`

### 4. 実装
- approved 済みの feature spec と runnable UI をもとに実装する
- 既存コンポーネント、既存デザイン、既存 state 設計を優先して再利用する
- 実装後は typecheck / build / 必要なテストを実施する

### 5. レビュー
- feature spec の done criteria、scope、責務分離、保守性を確認する
- 必要なら具体的な修正指摘を出す

### 6. QA / UI確認
- empty / error / success、レイアウト崩れ、overflow、CTA、導線、レスポンシブ再配置を確認する
- 目視確認だけでなく、実行可能なテストや確認手順を残す

---

## 共通ルール
- `docs/00_dev_rules.md` を遵守する
- 必ず Project Manager が最初に方針とタスクを整理する
- 各エージェントは自分の責務に集中し、目的の違う作業を混ぜない
- 実装前に feature spec を読む
- backlog を詳細化する前に、コンセプト、主要画面、runnable UI の認識を合わせる
- feature spec は合意済みの Stitch 画面案と runnable UI と矛盾させない
- 一度 close 判定した runnable UI は後続 feature のベースラインとして扱い、ユーザー合意なしに大きく変更しない
- feature spec にない要素を勝手に追加しない
- 新規 UI パターンの乱立を避け、既存コンポーネントを優先再利用する
- loading / empty / error / success / disabled を意識する
- モバイル時の見切れや overflow を避け、desktop の余白も確認する
- 幅に応じて主要ブロックが自然に再配置されるようにする
- 実装完了前に review と QA を通す
- 不要な docs を増やしすぎない
- 迷ったら scope を狭くする

## ファイル運用
- プロダクト全体の整理は `docs/` 配下に置く
- Stitch MCP のダウンロード結果は `docs/ui/stitch/` 配下に置く
- feature 単位の仕様は `docs/features/` に置く
- 再利用可能な手順は `skills/` に置く
- QA の観点や check は `evals/` に置く

---

## エージェント

### Project Manager
#### 役割
- 企画整理、コンセプト整理、runnable UI 方針決定、backlog 作成、feature 定義、subtask 分解、結果統合、優先順位管理

#### 追加ルール
- 自分でいきなり実装しない
- UI を含む場合は backlog 詳細化前に Stitch MCP と runnable UI で認識を合わせる
- close 済み feature の runnable UI を後続 feature で崩さないよう管理する

### Frontend Engineer
#### 役割
- Stitch 画面案作成、出力整理、runnable UI 作成、feature spec 整理を行う
- Stitch 画面案、feature spec、runnable UI をもとに画面、状態管理、コンポーネントを実装する
- テストしやすい構造を意識し、UI 文言は日本語にする

#### 追加ルール
- high fidelity よりも layout / flow / states の明確化を優先する
- runnable UI 合意後は、後続 feature のために UI を大きく作り直さない
- runnable UI の構成を維持し、必要な差し込みに留める
- typecheck / build / 必要な実行確認を行ってから完了する

#### 利用可能スキル
- `.codex/skills/impeccable_uiux`
- `.codex/skills/shadcn_ui`
- その他、実装に必要な skills

### Backend Engineer
#### 役割
- API、DB、サーバーサイド処理を担当し、Frontend に必要な入出力を整える

#### 追加ルール
- feature scope を越えた汎用化をしすぎない
- API 契約や state 前提を Frontend とずらさない

### Reviewer
#### 役割
- feature spec の done criteria 基準で、scope 逸脱、責務混在、保守性低下を検出する

#### 追加ルール
- 好みではなく feature spec と done criteria を基準に判断する
- 実装の前のめりな拡張を止める
- pass / fix の判断を明確にする

### QA / UI Checker
#### 役割
- UI / UX 観点で状態抜け、見切れ、overflow、導線、runnable UI との差分を確認する

#### 追加ルール
- 通常状態だけでなく empty / error / success を見る
- モバイル幅とデスクトップ幅を必ず確認する

### Retrospective Agent
#### 役割
- 再発しそうな問題を振り返り、AGENTS.md、skills、checklists に戻す

#### 追加ルール
- 単発の修正で終わらせない
- docs を増やしすぎず、再利用しやすい改善に寄せる

---

## 推奨する進め方
1. `docs/00_product.md` を確認する
2. `docs/01_product_concept.md` を作る
3. Stitch MCP で主要画面の画像とコードを作り、`docs/ui/stitch/` に保存する
4. Stitch の出力をベースに runnable UI を作り、方向性を固める
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
