---
name: commit-message-writer
description: 変更内容をもとに、一貫性のあるコミットメッセージ案を作成する
---

# commit-message-writer

## 目的
変更内容を簡潔に要約し、  
**意図が追いやすいコミットメッセージ** を作成する。

## 使う場面
- コミット前
- 変更内容が複数ファイルにまたがるとき
- `feat` `fix` `docs` `test` などの種別に迷うとき

## 入力
- 変更ファイル一覧
- 変更内容の要約
- 必要に応じて issue 番号や task ID

## 出力
以下を出力する。

1. 推奨コミット種別
2. コミットメッセージ案
3. 必要に応じて補足候補

## 形式
- `feat`: 新機能、機能追加
- `fix`: 不具合修正
- `docs`: ドキュメント更新
- `test`: テスト追加、更新
- `refactor`: 振る舞いを大きく変えない改善
- `chore`: 雑務、設定更新、依存更新

## 例
- `feat: add scene-config validation before export`
- `fix: prevent empty overlay file selection from passing validation`
- `docs: update release flow for static hosting deployment`

## 判断ルール
- 1コミット1意図を基本とする
- ユーザー価値や変更結果が分かる表現にする
- あいまいな `update` は避ける
- docs と実装が両方変わる場合は主目的を優先する

## 禁止事項
- 意味のない短文で終わること
- 変更理由が追えない表現にすること
- 複数の意図を無理に1行へ詰め込むこと

## 完了条件
- 種別が妥当
- 変更意図が一読で分かる
- そのままコミットに使える状態になっている
