# 03_dev_rules.md

## 目的
このドキュメントは、実装時のフォーマット、静的解析、型、安全性、命名、テストの共通ルールを定義する。

## 必須チェック
実装完了前に少なくとも以下を通すこと。
- formatter
- linter
- typecheck
- build
- 必要なテスト

## Encoding
- UTF-8

## Formatter
- Prettier を唯一のコードフォーマッタとする
- 手動で整形ルールを増やしすぎず、Prettier に従う
- フォーマット差分だけの変更は、機能変更と分けられるなら分ける

## Linter
- ESLint の警告とエラーを確認する
- 未使用 import / 未使用変数を残さない
- `console.log` は検証後に不要なら削除する
- hook ルール違反を許容しない
- feature scope 外の一時回避コードを残さない

## TypeScript
- `any` は原則禁止
- やむを得ず使う場合は理由をコメントで残す
- `unknown` を優先する
- 型を雑に広げてエラーを消さない
- props / state / API response の型を明示する
- 型エラーを無視して完了扱いにしない

## Import rules
- import 順は自動整列ルールに従う
- 未使用 import を残さない
- 相対 import が深くなりすぎる場合は整理を検討する
- import のみの差分で可読性を下げない

## Naming
- コンポーネント名は PascalCase
- hooks は `useXxx`
- utility は役割がわかる名前にする
- state 名は意味ベースでつける
- `temp`, `data`, `item`, `value` のような曖昧名を避ける
- boolean は `is`, `has`, `can`, `should` で始める

## React / Next.js
- 1ファイルに責務を詰め込みすぎない
- page は画面構成中心、UI部品は component に分ける
- state は必要最小限にする
- derived state をむやみに持たない
- mock 準拠で実装し、勝手にUIを広げない

## UI implementation
- 既存コンポーネントを優先再利用する
- empty / error / success / loading を考慮する
- モバイル幅で見切れないこと
- overflow を放置しない
- spacing や text size を場当たりで増やしすぎない

## Testing
- 少なくとも typecheck と build は必須
- UI変更時は主要状態の表示確認を行う
- バグ修正時は再発防止の観点でテスト追加を検討する
- Playwright 等がある場合は、主要導線を1本は確認する

## Completion rule
次を満たして初めて完了扱いにする。
- feature spec の done criteria を満たす
- formatter / linter / typecheck / build が通る
- review が完了している
- 必要な UI 確認が終わっている