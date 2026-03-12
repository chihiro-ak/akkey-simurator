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
- ユーザーが明示した修正範囲を超えて変更しない。範囲外の改善、文言調整、リファクタは別途合意を取る
- empty / error / success / loading を意識する
- モバイル時の見切れや overflow を避ける
- デスクトップ時の余白の使い方も確認する
- spacing と text size を揃える
- 固定幅前提で UI を決め打ちしない
- ウィンドウ幅に応じてレイアウトが自動調整されるようにする
- 合意済みの runnable UI がある場合は、それをベースラインとして扱い、ユーザー合意なしに大きく変更しない

## Stitch ベースの UI ルール
- Stitch MCP のダウンロード結果は `docs/ui/stitch/<screen-set-name>/` に保存する
- Stitch の `screen.png` と `code.html` を見ながら UI を作る
- backlog 詳細化前に、Stitch ベースの runnable UI を 1 度作って確認する
- Stitch から作った UI は mobile と desktop の両方を確認する
- 幅を変えた時の主要ブロックの並び順まで確認する
- close 済み feature の後続実装では、runnable UI の主要ブロック構成と主要導線を維持する

## 実画面確認
- 実画面確認なしに「修正済み」と断定しない
- レスポンシブ変更時は少なくとも以下を確認する
  - 狭い幅
  - 中間幅
  - 広い幅
- DOM の計測値だけでなく、可能ならスクリーンショットか目視でも確認する
- 実画面確認でずれが出た場合は、先に原因を特定してから修正する
- `Playwright MCP` で確認する場合は、Chrome の既存セッション衝突を避けるため、実行前に Chrome をすべて閉じる

## Testing
- 少なくとも typecheck と build は必須
- UI 実装時は主要状態の表示確認を行う
- バグ修正時は再発確認の観点でテストや確認手順を残す
- Playwright 等がある場合は、主要導線を 1 本は確認する
- `Playwright MCP` を使う確認手順を書く場合も、Chrome をすべて閉じてから開始する前提を明記する
- 実装後は必ず `git diff` を確認し、feature scope に不要な文言変更、命名変更、スタイル変更、リファクタが差分に混ざっていないことを確認する

## Retrospective
- 同じ流れが繰り返し発生する場合は skill 化を検討する
- 今回のような「Stitch ダウンロード結果から minimal React prototype を作って確認する」流れは skill 化候補

## Completion rule
次を満たして完了とする。
- feature spec の done criteria を満たす
- formatter / linter / typecheck / build が通る
- review を通す
- 必要な UI 確認が終わっている
## UI Bugfix Verification Rule
- UI バグ修正は、コード変更だけで完了判定しない。
- 完了報告前に、必ずブラウザで対象画面を開き、対象状態を再現して確認する。
- 確認時の最低チェック:
  - 対象状態が再現できている
  - スクリーンショットで見た目を確認している
  - 必要なら DOM / computed style / 座標を実測している
- 透過 PNG、重ね合わせ、接続位置、ドラッグ位置、overflow は、見た目基準で確認する。
- UI 修正で Playwright MCP を使える場合は、原則として使って確認する。

## Diff Check Rule
- UI 修正後は完了報告前に必ず `git diff` を確認する。
- 次が差分に入っていたら、要求に必要かを再確認する。
  - 不要な文言変更
  - 文字化け
  - 命名変更
  - 無関係なスタイル変更
  - 不要リファクタ

## Coordinate And Anchor Rule
- 座標や接続位置を扱う UI は、実装前に基準点を明文化する。
- 例:
  - 穴位置 = 本体画像の上端輪郭
  - パーツ接続点 = パーツ画像の最下端不透明ピクセル
- 透過画像を使う場合は、要素矩形ではなく不透明ピクセル基準で扱う。
