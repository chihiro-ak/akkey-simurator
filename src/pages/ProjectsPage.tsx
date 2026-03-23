import { Link } from "react-router-dom";

import { mockProjectSummaries } from "../features/projects/mockProjects";

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));

export function ProjectsPage() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner page-topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Projects</p>
            <h1>保存済みプロジェクト</h1>
          </div>
          <div className="topbar-actions compact">
            <Link className="ghost-link" to="/login">
              ログイン画面
            </Link>
            <Link className="primary-button" to="/editor/new">
              新規作成
            </Link>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <section className="hero-card projects-hero">
          <div className="hero-copy">
            <p className="eyebrow">Management</p>
            <h2>編集中の案と公開ページを同じ導線上に整理</h2>
            <p>まずはダミーデータで一覧・編集・公開プレビューを往復できるようにし、後から Supabase を差し込める構造へ寄せています。</p>
          </div>
          <div className="hero-side-card">
            <span className="field-label">現在の方針</span>
            <strong>UI とルーティングを先に固定</strong>
            <span>保存・共有・認証の土台だけを先に整え、既存の編集体験は壊しません。</span>
          </div>
        </section>

        <section className="projects-grid">
          <Link className="project-card project-card-create" to="/editor/new">
            <span className="project-thumb project-thumb-create">＋</span>
            <div className="project-card-body">
              <span className="field-label">New</span>
              <h3>新しいプロジェクトを作成</h3>
              <p>空の編集画面から、保存導線つきでスタートします。</p>
            </div>
          </Link>

          {mockProjectSummaries.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-thumb">
                {project.thumbnailUrl ? <img alt="" src={project.thumbnailUrl} /> : <span>準備中</span>}
              </div>
              <div className="project-card-body">
                <div className="project-card-header">
                  <span className={`status-pill ${project.isPublic ? "is-public" : ""}`}>{project.isPublic ? "公開中" : "下書き"}</span>
                  <span className="meta-note">{project.mode === "connected" ? "2連" : "単体"}</span>
                </div>
                <h3>{project.title}</h3>
                <p>更新日時: {formatUpdatedAt(project.updatedAt)}</p>
              </div>
              <div className="project-card-actions">
                <Link className="ghost-button" to={`/editor/${project.id}`}>
                  編集
                </Link>
                <Link className={`secondary-button ${project.isPublic ? "" : "is-disabled"}`} to={`/share/${project.shareSlug}`}>
                  公開ページ
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
