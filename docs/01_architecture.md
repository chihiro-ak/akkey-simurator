# 01_architecture.md

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Main pages
- トップページ
- シミュレーション画面

## Main features
- 画像アップロード
- 穴位置調整
- 金具選択
- プレビュー表示

## State overview
- idle
- image_uploaded
- editing_hole_position
- selecting_hardware
- preview_ready
- error

## Notes
- 初期はローカル状態中心でよい
- まずは単体アクキーのみ対応
- 物理演算は簡易表現に留める