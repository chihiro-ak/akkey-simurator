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
            <h1>マイプロジェクト</h1>
            <p className="page-subtitle">保存したアクキー案をここから開けます。</p>
          </div>
          <div className="topbar-actions compact">
            <Link className="ghost-link" to="/login">
              ログイン
            </Link>
            <Link className="primary-button" to="/editor/new">
              新規作成
            </Link>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <section className="section-heading">
          <div>
            <h2>保存済みの一覧</h2>
            <p>続きから開けます。</p>
          </div>
        </section>

        <section className="projects-grid projects-grid-dense">
          <Link className="project-card project-card-create" to="/editor/new">
            <span className="project-thumb project-thumb-create">＋</span>
            <div className="project-card-body">
              <h3>新しく作成</h3>
              <p>空の編集画面を開きます。</p>
            </div>
          </Link>

          {mockProjectSummaries.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-thumb">
                {project.thumbnailUrl ? <img alt="" src={project.thumbnailUrl} /> : <span>準備中</span>}
              </div>
              <div className="project-card-body">
                <div className="project-card-header">
                  <span className={`status-pill ${project.isPublic ? "is-public" : ""}`}>{project.isPublic ? "公開中" : "非公開"}</span>
                  <span className="meta-note">{project.mode === "connected" ? "つながるアクキー" : "単体"}</span>
                </div>
                <h3>{project.title}</h3>
                <p>最終更新: {formatUpdatedAt(project.updatedAt)}</p>
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
