import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner page-topbar">
          <div className="topbar-copy">
            <h1>ログイン</h1>
            <p className="page-subtitle">保存機能に備えた仮画面です。</p>
          </div>
          <Link className="ghost-link" to="/projects">
            一覧へ戻る
          </Link>
        </div>
      </header>

      <main className="page-shell auth-shell">
        <section className="login-card">
          <div className="login-copy">
            <h2>ログイン方法を選択</h2>
            <p>本実装前のため、ここでは見た目だけを用意しています。</p>
          </div>
          <div className="auth-actions">
            <button className="primary-button wide-button" type="button">
              メールでログイン
            </button>
            <button className="secondary-button wide-button" type="button">
              Google でログイン
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
