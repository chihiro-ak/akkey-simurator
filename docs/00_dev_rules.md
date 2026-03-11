# 00_dev_rules.md

## 目的
このドキュメントは、実装時の共通ルールを定義するものです。  
最小構成、検証容易性、可読性、保守性を優先し、feature scope を守って進めます。

## 必須チェック
実装完了前に最低限以下を確認すること。
- formatter
- linter
- typecheck
- build
- 必要な実行確認
  - React / Vite / Next.js など UI 実装を含む場合は `npm run dev` 等で実画面を確認する
- 必要なテスト

## Encoding
- UTF-8

## Formatter
- Prettier を第一候補とする
- 手で整形し続けず、整形ツールがあるならそれに従う

## Linter
- ESLint のエラーを解消する
- 未使用 import / 未使用変数を残さない
- `console.log` は検証後に不要なら消す
- hook のルール違反を残さない
- feature scope を越えたコードを混ぜない

## TypeScript
- `any` は原則禁止
- 迷ったら `unknown` を使い、呼び出し側で絞り込む
- props / state / API response の型を明示する
- 型エラーを放置して UI だけ先に進めない

## React / Next.js / Vite
- 1 ファイルに責務を詰め込みすぎない
- page は画面構成に集中し、ロジックは必要に応じて component や hook に分ける
- state は必要最小限にする
- derived state をむやみに持たない
- mock は早期検証のために使ってよいが、本実装へ持ち込むかは意識する
- 画面検証だけが目的なら、まず `Vite + React + TypeScript` を優先する
- `Next.js` は既存構成やルーティング / SSR 前提がある時だけ選ぶ

## UI implementation
- 既存コンポーネントを優先再利用する
- empty / error / success / loading を意識する
- モバイル時の見切れや overflow を避ける
- デスクトップ時の余白の使い方も確認する
- spacing と text size を揃える
- 固定幅前提で UI を決め打ちしない
- ウィンドウ幅に応じてレイアウトが自動調整されるようにする

## Stitch ベースの UI ルール
- Stitch MCP のダウンロード結果は `docs/ui/stitch/<screen-set-name>/` に保存する
- Stitch の `screen.png` と `code.html` を見ながら UI を作る
- backlog 詳細化前に、Stitch ベースの runnable UI を 1 度作って確認する
- Stitch から作った UI は mobile と desktop の両方を確認する
- 幅を変えた時の主要ブロックの並び順まで確認する

## 実画面確認
- 実画面確認なしに「修正済み」と断定しない
- レスポンシブ変更時は少なくとも以下を確認する
  - 狭い幅
  - 中間幅
  - 広い幅
- DOM の計測値だけでなく、可能ならスクリーンショットか目視でも確認する
- 実画面確認でずれが出た場合は、先に原因を特定してから修正する

## Testing
- 少なくとも typecheck と build は必須
- UI 実装時は主要状態の表示確認を行う
- バグ修正時は再発確認の観点でテストや確認手順を残す
- Playwright 等がある場合は、主要導線を 1 本は確認する

## Retrospective
- 同じ流れが繰り返し発生する場合は skill 化を検討する
- 今回のような「Stitch ダウンロード結果から minimal React prototype を作って確認する」流れは skill 化候補

## Completion rule
次を満たして完了とする。
- feature spec の done criteria を満たす
- formatter / linter / typecheck / build が通る
- review を通す
- 必要な UI 確認が終わっている
