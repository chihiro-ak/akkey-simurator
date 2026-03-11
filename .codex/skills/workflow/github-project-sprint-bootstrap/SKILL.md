---
name: github-project-sprint-bootstrap
description: GitHub Projects と develop ブランチを使うスクラム運用を初期化または更新する。使う場面: 新規リポジトリで backlog / retrospective Project を作るとき、Sprint 開始時に board view・Sprint field・初期 backlog を整えるとき、GitHub 運用ルールを AGENTS.md に反映するとき。
---

# github-project-sprint-bootstrap

## 目的
GitHub 上のスクラム運用を、毎回手作業でばらばらに作らず同じ手順で立ち上げる。

## 入力
- 対象リポジトリ
- 現在の issue / backlog 候補
- 開始する Sprint
- 既存の `AGENTS.md`

## 手順
1. `git` と `gh` の接続状態を確認する。
2. `develop` が無ければ `main` から作成して push する。
3. GitHub Projects を 2 つ作る。
   - `xxx Backlog`
   - `xxx Retrospective`
4. 両 Project を対象リポジトリへリンクする。
5. field を整備する。
   - Backlog: `Sprint`, `Priority`, `Type`
   - Retrospective: `Sprint`, `Category`, `Notes`
   - Retrospective の `Status` は以下に更新する。
     - `Agenda`
     - `What went well`
     - `What can be improved`
     - `Action items`
6. user-owned Project の board view を GitHub REST API で作成する。
   - `POST https://api.github.com/users/{username}/projectsV2/{project_number}/views`
   - body 例: `{"name":"Backlog Board","layout":"board"}`
7. Retrospective Project には標準 view を作る。
   - `Retrospective` (`board`)
   - `Categorize feedback` (`table`, filter: `status:"What went well","What can be improved"`)
   - `Action items` (`table`, filter: `status:"Action items"`)
8. backlog 候補を issue 化して Backlog Project に追加する。
9. 現 Sprint の issue には `Sprint` field を設定する。
10. Retrospective Project には最低限の draft item を作る。
   - `Sprint N - What went well`
   - `Sprint N - Improve`
   - `Sprint N - Action`
11. Retrospective の draft item に `Status` と `Category` を設定する。
    - 良かった点: `What went well`
    - 改善点: `What can be improved`
    - アクション: `Action items`
12. retrospective では「1内容 = 1アイテム」にする。
    - 1つの item に複数の良かった点や改善点を詰め込まない
    - タイトルは generic な `Sprint N - What went well` ではなく、内容そのものを短く書く
13. ルール変更があれば `AGENTS.md` を更新する。

## 判断ルール
- Sprint に入れる項目は `Sprint` field を必ず設定する。
- board view を作るだけでなく、対象リポジトリとのリンクも確認する。
- backlog は Sprint 内項目だけでなく、見えている次 Sprint 候補も登録する。
- retrospective は Backlog と別の専用形式で管理し、通常の `Todo / In Progress / Done` を流用しない。
- 文字化け回避を優先し、retrospective の status / filter / item title には原則 ASCII を使う。
- 運用ルールを追加したら skill と `AGENTS.md` を一緒に更新する。

## 完了条件
- `develop` が存在する
- Backlog / Retrospective の両 Project が存在する
- 両 Project に board view がある
- Retrospective Project に `Retrospective / Categorize feedback / Action items` view がある
- current Sprint の項目が field 付きで管理されている
- `AGENTS.md` に運用ルールが反映されている
