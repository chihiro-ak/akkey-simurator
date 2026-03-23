import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner page-topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Welcome Back</p>
            <h1>アクキーシミュレーター</h1>
          </div>
          <Link className="ghost-link" to="/projects">
            ダミー一覧へ進む
          </Link>
        </div>
      </header>

      <main className="page-shell auth-shell">
        <section className="hero-card auth-card">
          <div className="hero-copy">
            <p className="eyebrow">Login</p>
            <h2>保存・公開の準備をここから</h2>
            <p>
              認証自体はまだ仮実装ですが、メールログインと Google ログインを置ける余白を先に整えています。
              今の編集 UI と同じ、やわらかなアトリエ調のトーンで揃えています。
            </p>
          </div>

          <div className="auth-actions">
            <button className="primary-button wide-button" type="button">
              メールでログイン
            </button>
            <button className="secondary-button wide-button" type="button">
              Google でログイン
            </button>
            <div className="inline-note-card">
              <strong>仮状態のメモ</strong>
              <span>本接続前でも導線確認ができるよう、この画面から `/projects` へ進めます。</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
