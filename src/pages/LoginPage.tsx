import { Link } from "react-router-dom";

import { AppHeader } from "../components/AppHeader";

export function LoginPage() {
  return (
    <>
      <AppHeader
        actions={
          <Link className="ghost-link" to="/projects">
            一覧へ戻る
          </Link>
        }
        title="ログイン"
      />

      <main className="page-shell auth-shell">
        <section className="login-card">
          <div className="login-copy">
            <h2>ログイン方法を選択</h2>
            <p>使う方法を選んでください。</p>
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
